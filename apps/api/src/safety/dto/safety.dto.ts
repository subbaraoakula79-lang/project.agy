import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TriggerSosDto {
  @IsNotEmpty()
  @IsString()
  rideId!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class ResolveSosDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ShareTripDto {
  @IsNotEmpty()
  @IsString()
  rideId!: string;
}
