import { IsEnum, IsLatitude, IsLongitude, IsNotEmpty, IsString } from 'class-validator';
import { PaymentMethod, VehicleType } from '@yatra-seva/shared-types';

export class CreateRideDto {
  @IsNotEmpty()
  @IsLatitude({ message: 'pickupLatitude must be a valid latitude' })
  pickupLatitude!: number;

  @IsNotEmpty()
  @IsLongitude({ message: 'pickupLongitude must be a valid longitude' })
  pickupLongitude!: number;

  @IsNotEmpty()
  @IsString()
  pickupAddress!: string;

  @IsNotEmpty()
  @IsLatitude({ message: 'dropLatitude must be a valid latitude' })
  dropLatitude!: number;

  @IsNotEmpty()
  @IsLongitude({ message: 'dropLongitude must be a valid longitude' })
  dropLongitude!: number;

  @IsNotEmpty()
  @IsString()
  dropAddress!: string;

  @IsNotEmpty()
  @IsEnum(VehicleType, { message: 'vehicleType must be BIKE, AUTO, or CAB' })
  vehicleType!: VehicleType;

  @IsNotEmpty()
  @IsEnum(PaymentMethod, { message: 'paymentMethod must be CASH or UPI' })
  paymentMethod!: PaymentMethod;
}
