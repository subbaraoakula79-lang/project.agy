import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateIncidentDto {
  @IsNotEmpty()
  @IsString()
  rideId!: string;

  @IsNotEmpty()
  @IsEnum([
    'SAFETY',
    'DRIVER_BEHAVIOR',
    'RIDER_BEHAVIOR',
    'VEHICLE',
    'PAYMENT',
    'ACCIDENT',
    'OTHER',
  ])
  category!:
    | 'SAFETY'
    | 'DRIVER_BEHAVIOR'
    | 'RIDER_BEHAVIOR'
    | 'VEHICLE'
    | 'PAYMENT'
    | 'ACCIDENT'
    | 'OTHER';

  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @IsNotEmpty()
  @IsString()
  description!: string;
}

export class UpdateIncidentStatusDto {
  @IsNotEmpty()
  @IsEnum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'])
  status!: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
}

export class UpdateIncidentSeverityDto {
  @IsNotEmpty()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  severity!: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
