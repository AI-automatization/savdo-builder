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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { GetModerationQueueUseCase } from './use-cases/get-moderation-queue.use-case';
import { GetCaseDetailUseCase } from './use-cases/get-case-detail.use-case';
import { TakeActionUseCase } from './use-cases/take-action.use-case';
import { AssignCaseUseCase } from './use-cases/assign-case.use-case';
import { TakeActionDto } from './dto/take-action.dto';
import { ListCasesDto } from './dto/list-cases.dto';
import { ModerationRepository } from './repositories/moderation.repository';

@Controller('admin/moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
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
}
