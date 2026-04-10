import { Controller, Get, Patch, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';
import { UpdateSellerProfileUseCase } from './use-cases/update-seller-profile.use-case';
import { ApplySellerUseCase } from './use-cases/apply-seller.use-case';
import { SellersRepository } from './repositories/sellers.repository';
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';

@Controller('seller')
@UseGuards(JwtAuthGuard)
export class SellersController {
  constructor(
    private readonly updateProfile: UpdateSellerProfileUseCase,
    private readonly applySeller: ApplySellerUseCase,
    private readonly sellersRepo: SellersRepository,
  ) {}

  // POST /api/v1/seller/apply — BUYER становится SELLER (onboarding)
  // Доступно для любого аутентифицированного пользователя (BUYER)
  @Post('apply')
  @HttpCode(HttpStatus.OK)
  async apply(@CurrentUser() user: JwtPayload) {
    return this.applySeller.execute(user.sub);
  }

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles('SELLER')
  async getMe(@CurrentUser() user: JwtPayload) {
    const seller = await this.sellersRepo.findByUserId(user.sub);
    if (!seller) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Seller not found', HttpStatus.NOT_FOUND);
    }
    return seller;
  }

  @Patch('me')
  @UseGuards(RolesGuard)
  @Roles('SELLER')
  async updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateSellerProfileDto,
  ) {
    return this.updateProfile.execute(user.sub, dto);
  }
}
