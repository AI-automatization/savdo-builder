import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';
import { UpdateSellerProfileUseCase } from './use-cases/update-seller-profile.use-case';
import { SellersRepository } from './repositories/sellers.repository';
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';
import { HttpStatus } from '@nestjs/common';

@Controller('seller')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER')
export class SellersController {
  constructor(
    private readonly updateProfile: UpdateSellerProfileUseCase,
    private readonly sellersRepo: SellersRepository,
  ) {}

  @Get('me')
  async getMe(@CurrentUser() user: JwtPayload) {
    const seller = await this.sellersRepo.findByUserId(user.sub);
    if (!seller) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Seller not found', HttpStatus.NOT_FOUND);
    }
    return seller;
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateSellerProfileDto,
  ) {
    return this.updateProfile.execute(user.sub, dto);
  }
}
