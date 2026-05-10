import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { MergeCartDto } from './dto/merge-cart.dto';
import { GetCartUseCase } from './use-cases/get-cart.use-case';
import { AddToCartUseCase } from './use-cases/add-to-cart.use-case';
import { UpdateCartItemUseCase } from './use-cases/update-cart-item.use-case';
import { RemoveFromCartUseCase } from './use-cases/remove-from-cart.use-case';
import { ClearCartUseCase } from './use-cases/clear-cart.use-case';
import { MergeGuestCartUseCase } from './use-cases/merge-guest-cart.use-case';
import { CartRepository, CartWithItems } from './repositories/cart.repository';
import { BuyerRepository } from './repositories/buyer.repository';
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';

/**
 * OptionalJwtAuthGuard — allows unauthenticated requests through.
 * If a valid JWT is present it will be verified and req.user populated;
 * if absent or invalid the request proceeds with req.user = undefined.
 */
class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(_err: Error, user: TUser): TUser {
    return user;
  }
}

@ApiTags('buyer')
@ApiBearerAuth('jwt')
@Controller('cart')
export class CartController {
  private readonly logger = new Logger(CartController.name);

  constructor(
    private readonly getCartUseCase: GetCartUseCase,
    private readonly addToCartUseCase: AddToCartUseCase,
    private readonly updateCartItemUseCase: UpdateCartItemUseCase,
    private readonly removeFromCartUseCase: RemoveFromCartUseCase,
    private readonly clearCartUseCase: ClearCartUseCase,
    private readonly mergeGuestCartUseCase: MergeGuestCartUseCase,
    private readonly cartRepo: CartRepository,
    private readonly buyerRepo: BuyerRepository,
  ) {}

  // ─── GET /api/v1/cart ─────────────────────────────────────────────────────

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getCart(
    @CurrentUser() user: JwtPayload | undefined,
    @Headers('x-session-token') sessionToken: string | undefined,
  ) {
    const identity = await this.resolveIdentity(user, sessionToken);
    return this.getCartUseCase.execute(identity);
  }

  // ─── POST /api/v1/cart/items ──────────────────────────────────────────────

  @Post('items')
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 60 } }) // anti-spam: anonymous может звать
  @HttpCode(HttpStatus.CREATED)
  async addItem(
    @CurrentUser() user: JwtPayload | undefined,
    @Headers('x-session-token') sessionToken: string | undefined,
    @Body() dto: AddToCartDto,
  ) {
    const identity = await this.resolveIdentity(user, sessionToken);
    return this.addToCartUseCase.execute({
      ...dto,
      ...identity,
    });
  }

  // ─── PATCH /api/v1/cart/items/:itemId ─────────────────────────────────────

  @Patch('items/:itemId')
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async updateItem(
    @CurrentUser() user: JwtPayload | undefined,
    @Headers('x-session-token') sessionToken: string | undefined,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    const identity = await this.resolveIdentity(user, sessionToken);
    const cart = await this.resolveCart(identity);

    if (!cart) {
      throw new DomainException(
        ErrorCode.CART_NOT_FOUND,
        'No active cart found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.updateCartItemUseCase.execute({
      itemId,
      cartId: cart.id,
      quantity: dto.quantity,
    });
  }

  // ─── DELETE /api/v1/cart/items/:itemId ────────────────────────────────────

  @Delete('items/:itemId')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeItem(
    @CurrentUser() user: JwtPayload | undefined,
    @Headers('x-session-token') sessionToken: string | undefined,
    @Param('itemId') itemId: string,
  ) {
    const identity = await this.resolveIdentity(user, sessionToken);
    const cart = await this.resolveCart(identity);

    if (!cart) {
      throw new DomainException(
        ErrorCode.CART_NOT_FOUND,
        'No active cart found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.removeFromCartUseCase.execute({ itemId, cartId: cart.id });
  }

  // ─── DELETE /api/v1/cart ──────────────────────────────────────────────────

  @Delete()
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearCart(
    @CurrentUser() user: JwtPayload | undefined,
    @Headers('x-session-token') sessionToken: string | undefined,
  ) {
    const identity = await this.resolveIdentity(user, sessionToken);
    await this.clearCartUseCase.execute(identity);
  }

  // ─── POST /api/v1/cart/merge ──────────────────────────────────────────────

  @Post('merge')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async mergeGuestCart(
    @CurrentUser() user: JwtPayload,
    @Body() dto: MergeCartDto,
  ) {
    const buyer = await this.buyerRepo.findByUserId(user.sub);
    if (!buyer) {
      throw new DomainException(
        ErrorCode.UNAUTHORIZED,
        'Buyer profile not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.mergeGuestCartUseCase.execute({
      sessionKey: dto.sessionKey,
      buyerId: buyer.id,
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private async resolveIdentity(
    user: JwtPayload | undefined,
    sessionToken: string | undefined,
  ): Promise<{ buyerId?: string; sessionKey?: string }> {
    if (user?.sub) {
      const buyer = await this.buyerRepo.findByUserId(user.sub);
      if (buyer) {
        return { buyerId: buyer.id };
      }
    }

    if (sessionToken) {
      return { sessionKey: sessionToken };
    }

    // Neither auth nor session token — operations that require identity will fail
    return {};
  }

  private async resolveCart(
    identity: { buyerId?: string; sessionKey?: string },
  ): Promise<CartWithItems | null> {
    if (identity.buyerId) {
      return this.cartRepo.findByBuyerId(identity.buyerId);
    }
    if (identity.sessionKey) {
      return this.cartRepo.findBySessionKey(identity.sessionKey);
    }
    return null;
  }
}
