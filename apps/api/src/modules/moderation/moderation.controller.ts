import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ModerationActionType, ModerationCaseStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MfaEnforcedGuard } from '../../common/guards/mfa-enforced.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { GetModerationQueueUseCase } from './use-cases/get-moderation-queue.use-case';
import { GetCaseDetailUseCase } from './use-cases/get-case-detail.use-case';
import { TakeActionUseCase } from './use-cases/take-action.use-case';
import { AssignCaseUseCase } from './use-cases/assign-case.use-case';
import { TakeActionDto } from './dto/take-action.dto';
import { ListCasesDto } from './dto/list-cases.dto';
import { ModerationRepository } from './repositories/moderation.repository';

@ApiTags('moderation')
@ApiBearerAuth('jwt')
@Controller('admin/moderation')
@UseGuards(JwtAuthGuard, RolesGuard, MfaEnforcedGuard)
@Roles('ADMIN')
export class ModerationController {
  constructor(
    private readonly getModerationQueueUseCase: GetModerationQueueUseCase,
    private readonly getCaseDetailUseCase: GetCaseDetailUseCase,
    private readonly takeActionUseCase: TakeActionUseCase,
    private readonly assignCaseUseCase: AssignCaseUseCase,
    private readonly moderationRepo: ModerationRepository,
  ) {}

  /**
   * GET /admin/moderation
   * List all cases with optional filters.
   */
  @Get()
  async listCases(@Query() query: ListCasesDto) {
    return this.moderationRepo.findAllCases({
      status: query.status,
      entityType: query.entityType,
      page: query.page,
      limit: query.limit,
    });
  }

  /**
   * GET /admin/moderation/queue
   * Pending (open) cases only, for the review queue.
   */
  @Get('queue')
  async getQueue(@Query() query: ListCasesDto) {
    return this.getModerationQueueUseCase.execute({
      page: query.page,
      limit: query.limit,
    });
  }

  /**
   * GET /admin/moderation/:id
   * Case detail with full action history.
   */
  @Get(':id')
  async getCaseDetail(@Param('id') id: string) {
    return this.getCaseDetailUseCase.execute(id);
  }

  /**
   * POST /admin/moderation/:id/action
   * Take a moderation action (APPROVE, REJECT, REQUEST_CHANGES, ESCALATE).
   */
  @Post(':id/action')
  @HttpCode(HttpStatus.OK)
  async takeAction(
    @Param('id') id: string,
    @Body() dto: TakeActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.takeActionUseCase.execute(id, user.sub, dto);
  }

  /**
   * PATCH /admin/moderation/:id/assign
   * Assign the case to the current admin.
   */
  @Patch(':id/assign')
  async assignCase(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.assignCaseUseCase.execute(id, user.sub);
  }

  /**
   * PATCH /admin/moderation/:id/close
   * Explicitly close an OPEN case without APPROVE/REJECT.
   * INV-A01: writes audit log.
   */
  @Patch(':id/close')
  async closeCase(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const modCase = await this.moderationRepo.findCaseById(id);
    if (!modCase) {
      return { success: false, error: 'Case not found' };
    }
    await this.moderationRepo.updateCaseStatus(id, ModerationCaseStatus.CLOSED);
    await this.moderationRepo.addAction({
      caseId: id,
      entityType: modCase.entityType,
      entityId: modCase.entityId,
      adminUserId: user.sub,
      actionType: ModerationActionType.CLOSE,
      comment: 'Case closed manually by admin',
    });
    await this.moderationRepo.writeAuditLog({
      actorUserId: user.sub,
      actorType: 'admin',
      entityType: 'ModerationCase',
      entityId: id,
      action: 'MODERATION_CASE_CLOSED',
      payload: { previousStatus: modCase.status },
    });
    return { success: true };
  }

  /**
   * PATCH /admin/moderation/:id/reopen
   * Reopen a closed case back to OPEN status.
   * INV-A01: writes audit log.
   */
  @Patch(':id/reopen')
  async reopenCase(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const modCase = await this.moderationRepo.findCaseById(id);
    if (!modCase) {
      return { success: false, error: 'Case not found' };
    }
    await this.moderationRepo.updateCaseStatus(id, ModerationCaseStatus.OPEN);
    await this.moderationRepo.addAction({
      caseId: id,
      entityType: modCase.entityType,
      entityId: modCase.entityId,
      adminUserId: user.sub,
      actionType: ModerationActionType.REOPEN,
      comment: 'Case reopened by admin',
    });
    await this.moderationRepo.writeAuditLog({
      actorUserId: user.sub,
      actorType: 'admin',
      entityType: 'ModerationCase',
      entityId: id,
      action: 'MODERATION_CASE_REOPENED',
      payload: { previousStatus: modCase.status },
    });
    return { success: true };
  }
}
