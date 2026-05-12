/**
 * Тесты для `AdminCreateSellerUseCase`.
 * Privilege escalation surface — admin создаёт seller-профиль для user'а
 * + апгрейдит User.role=SELLER + auto-verified. Любой баг даёт seller
 * status без onboarding.
 */
import { AdminCreateSellerUseCase } from './admin-create-seller.use-case';
import { PrismaService } from '../../../database/prisma.service';

describe('AdminCreateSellerUseCase', () => {
  let useCase: AdminCreateSellerUseCase;
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
    seller: { create: jest.Mock };
    $transaction: jest.Mock;
  };

  const USER = { id: 'u-1', phone: '+998900000000', role: 'BUYER', seller: null };
  const VALID_INPUT = {
    userId: 'u-1',
    fullName: 'Test Seller',
    sellerType: 'individual' as const,
    telegramUsername: 'test_user',
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(USER),
        update: jest.fn().mockResolvedValue({ ...USER, role: 'SELLER' }),
      },
      seller: {
        create: jest.fn().mockResolvedValue({
          id: 'seller-1',
          userId: 'u-1',
          fullName: 'Test Seller',
          verificationStatus: 'VERIFIED',
        }),
      },
      $transaction: jest.fn().mockImplementation(async (cb) => cb(prisma)),
    };
    useCase = new AdminCreateSellerUseCase(prisma as unknown as PrismaService);
  });

  describe('preconditions', () => {
    it('БРОСАЕТ 404 если user не найден', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(useCase.execute(VALID_INPUT)).rejects.toThrow(/User not found/);
    });

    it('БРОСАЕТ CONFLICT если seller-профиль уже есть', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...USER, seller: { id: 'existing' } });
      await expect(useCase.execute(VALID_INPUT)).rejects.toThrow(/already has a seller profile/);
    });
  });

  describe('happy path — admin-created seller', () => {
    it('создаёт seller с verificationStatus=VERIFIED (admin bypass)', async () => {
      await useCase.execute(VALID_INPUT);
      expect(prisma.seller.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'u-1',
            fullName: 'Test Seller',
            sellerType: 'individual',
            telegramUsername: 'test_user',
            verificationStatus: 'VERIFIED',
          }),
        }),
      );
    });

    it('апгрейдит User.role до SELLER в той же транзакции', async () => {
      await useCase.execute(VALID_INPUT);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u-1' },
        data: { role: 'SELLER' },
      });
    });

    it('атомарно (через $transaction) — оба апдейта или ни одного', async () => {
      await useCase.execute(VALID_INPUT);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('include user в результате (для downstream использования)', async () => {
      await useCase.execute(VALID_INPUT);
      expect(prisma.seller.create).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { user: true },
        }),
      );
    });
  });

  describe('sellerType вариации', () => {
    it('individual работает', async () => {
      await useCase.execute({ ...VALID_INPUT, sellerType: 'individual' });
      expect(prisma.seller.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sellerType: 'individual' }),
        }),
      );
    });

    it('business работает', async () => {
      await useCase.execute({ ...VALID_INPUT, sellerType: 'business' });
      expect(prisma.seller.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sellerType: 'business' }),
        }),
      );
    });
  });
});
