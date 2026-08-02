import { IsOptional, IsString, IsIn } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListSellersDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @IsIn(['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'])
  verificationStatus?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
