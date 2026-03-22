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

  // ─── GET /api/v1/admin/analytics/events ───────────────────────────────────

  @Get('admin/analytics/events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async queryEvents(@Query() dto: QueryEventsDto) {
    return this.queryEventsUseCase.execute(dto);
  }
}
