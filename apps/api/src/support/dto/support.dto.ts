import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSupportTicketDto {
  @IsOptional()
  @IsString()
  rideId?: string;

  @IsNotEmpty()
  @IsEnum(['PAYMENT', 'DRIVER', 'RIDER', 'RIDE', 'SAFETY', 'OTHER'])
  category!: 'PAYMENT' | 'DRIVER' | 'RIDER' | 'RIDE' | 'SAFETY' | 'OTHER';

  @IsNotEmpty()
  @IsString()
  subject!: string;

  @IsNotEmpty()
  @IsString()
  description!: string;

  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export class UpdateSupportTicketStatusDto {
  @IsNotEmpty()
  @IsEnum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
  status!: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
}
