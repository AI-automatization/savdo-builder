import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { TrackEventDto } from './dto/track-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { TrackEventUseCase } from './use-cases/track-event.use-case';
import { QueryEventsUseCase } from './use-cases/query-events.use-case';
import { GetSellerSummaryUseCase } from './use-cases/get-seller-summary.use-case';
import { GetSellerAnalyticsUseCase } from './use-cases/get-seller-analytics.use-case';

/**
 * OptionalJwtAuthGuard — lets unauthenticated requests through.
 * If a valid JWT is present it is verified and req.user is populated;
 * if absent or invalid the request continues with req.user = undefined.
 */
class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(_err: Error, user: TUser): TUser {
    return user;
  }
}

@Controller()
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(
    private readonly trackEventUseCase: TrackEventUseCase,
    private readonly queryEventsUseCase: QueryEventsUseCase,
    private readonly getSellerSummaryUseCase: GetSellerSummaryUseCase,
    private readonly getSellerAnalyticsUseCase: GetSellerAnalyticsUseCase,
  ) {}

  // ─── POST /api/v1/analytics/track ─────────────────────────────────────────
  // Accepts both authenticated (buyer/seller/admin) and guest requests.

  @Post('analytics/track')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async track(
    @CurrentUser() user: JwtPayload | undefined,
    @Body() dto: TrackEventDto,
  ): Promise<void> {
    await this.trackEventUseCase.execute({ dto, user });
  }

  // ─── GET /api/v1/analytics/seller/summary ─────────────────────────────────

  @Get('analytics/seller/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async getSellerSummary(@CurrentUser() user: JwtPayload) {
    return this.getSellerSummaryUseCase.execute(user);
  }

  // ─── GET /api/v1/seller/metrics — alias for analytics/seller/summary ──────

  @Get('seller/metrics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async getSellerMetrics(@CurrentUser() user: JwtPayload) {
    return this.getSellerSummaryUseCase.execute(user);
  }

  // ─── GET /api/v1/seller/analytics?from=&to= ───────────────────────────────
  // FEAT-006: detailed seller dashboard — revenue, orders by status, top
  // products и daily breakdown за период (макс 90 дней). Default = последние 30.

  @Get('seller/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async getSellerAnalytics(
    @CurrentUser() user: JwtPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.getSellerAnalyticsUseCase.execute(user, { from, to });
  }

  // ─── GET /api/v1/admin/analytics/events ───────────────────────────────────

  @Get('admin/analytics/events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async queryEvents(@Query() dto: QueryEventsDto) {
    return this.queryEventsUseCase.execute(dto);
  }
}
