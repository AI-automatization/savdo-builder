import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { RequestUploadDto } from './dto/request-upload.dto';
import { RequestUploadUseCase } from './use-cases/request-upload.use-case';
import { ConfirmUploadUseCase } from './use-cases/confirm-upload.use-case';
import { DeleteMediaUseCase } from './use-cases/delete-media.use-case';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(
    private readonly requestUpload: RequestUploadUseCase,
    private readonly confirmUpload: ConfirmUploadUseCase,
    private readonly deleteMedia: DeleteMediaUseCase,
  ) {}

  @Post('upload-url')
  async getUploadUrl(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RequestUploadDto,
  ) {
    return this.requestUpload.execute(user.sub, dto);
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmFile(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.confirmUpload.execute(id, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFile(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    await this.deleteMedia.execute(id, user.sub);
  }
}
