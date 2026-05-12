import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { maskPhone } from '../../shared/pii';
import { deleteGhostUser } from './telegram-demo.handler';


/**
 * Периодически чистит "ghost" аккаунты — пользователей с phone вида tg_{telegramId}.
 *
 * Ghost-аккаунты создаются когда кто-то заходит через TMA без шаринга номера.
 * Они становятся дублями когда тот же человек потом делится контактом в боте
 * (создаётся реальный аккаунт с настоящим номером).
 *
 * Стратегия очистки:
 *  1. Orphan-ghost: phone=tg_X, telegramId=null → реальный аккаунт уже слинкован, ghost брошен
 *  2. Duplicate-ghost: phone=tg_X, telegramId=Y И другой user с telegramId=Y существует
 *
 * В обоих случаях ghost без заказов удаляется. С заказами — логируем, не трогаем.
 */
@Injectable()
export class GhostCleanupService {
  private readonly logger = new Logger(GhostCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupGhosts(): Promise<void> {
    this.logger.log('Ghost cleanup: started');

    // Все ghost-аккаунты (phone начинается с tg_)
    const ghosts = await this.prisma.user.findMany({
      where: { phone: { startsWith: 'tg_' } },
      include: {
        buyer: {
          include: {
            orders: { take: 1, select: { id: true } },
          },
        },
      },
    });

    if (ghosts.length === 0) {
      this.logger.log('Ghost cleanup: no ghosts found');
      return;
    }

    this.logger.log(`Ghost cleanup: found ${ghosts.length} ghost(s)`);

    let deleted = 0;
    let skipped = 0;

    for (const ghost of ghosts) {
      try {
        const hasOrders = (ghost.buyer?.orders?.length ?? 0) > 0;

        if (hasOrders) {
          // Не удаляем ghost с заказами — данные ценные, нужна ручная проверка
          this.logger.warn(`Ghost userId=${ghost.id} phone=${maskPhone(ghost.phone)} has orders — skipping`);
          skipped++;
          continue;
        }

        // Если у ghost есть telegramId — проверяем есть ли реальный аккаунт с тем же telegramId
        if (ghost.telegramId !== null) {
          const realAccount = await this.prisma.user.findFirst({
            where: {
              telegramId: ghost.telegramId,
              id: { not: ghost.id },
              phone: { not: { startsWith: 'tg_' } },
            },
          });

          if (!realAccount) {
            // Нет реального аккаунта с этим telegramId — ghost возможно ещё нужен
            // (человек зашёл через TMA но ещё не делился номером)
            // Оставляем если ghost создан менее 30 дней назад
            const ageMs = Date.now() - ghost.createdAt.getTime();
            const thirtyDays = 30 * 24 * 60 * 60 * 1000;
            if (ageMs < thirtyDays) {
              skipped++;
              continue;
            }
            // Старый ghost без реального аккаунта — удаляем
          }
        }

        // Удаляем ghost по цепочке в транзакции
        await this.prisma.$transaction(async (tx) => {
          await deleteGhostUser(tx, ghost.id, ghost.buyer?.id ?? null);
        });

        this.logger.log(`Ghost cleanup: deleted userId=${ghost.id} phone=${maskPhone(ghost.phone)}`);
        deleted++;
      } catch (err) {
        this.logger.error(`Ghost cleanup: failed for userId=${ghost.id}: ${err}`);
      }
    }

    this.logger.log(`Ghost cleanup: done — deleted=${deleted}, skipped=${skipped}`);
  }
}
