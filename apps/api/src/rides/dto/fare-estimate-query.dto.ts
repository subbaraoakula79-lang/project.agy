import { IsLatitude, IsLongitude, IsNotEmpty } from 'class-validator';

export class FareEstimateQueryDto {
  @IsNotEmpty()
  @IsLatitude()
  pickupLatitude!: number;

  @IsNotEmpty()
  @IsLongitude()
  pickupLongitude!: number;

  @IsNotEmpty()
  @IsLatitude()
  dropLatitude!: number;

  @IsNotEmpty()
  @IsLongitude()
  dropLongitude!: number;
}
