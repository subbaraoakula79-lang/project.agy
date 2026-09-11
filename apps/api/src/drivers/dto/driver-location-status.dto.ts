import { ApiProperty } from '@nestjs/swagger';

export type LocationFreshness = 'FRESH' | 'STALE' | 'UNAVAILABLE';

export class DriverLocationStatusDto {
  @ApiProperty({ example: 'driver-profile-uuid' })
  driverProfileId!: string;

  @ApiProperty({ example: 16.9558, nullable: true })
  latitude!: number | null;

  @ApiProperty({ example: 82.2386, nullable: true })
  longitude!: number | null;

  @ApiProperty({ example: 5.2, nullable: true })
  accuracy!: number | null;

  @ApiProperty({ example: 180.5, nullable: true })
  heading!: number | null;

  @ApiProperty({ example: 8.5, nullable: true })
  speed!: number | null;

  @ApiProperty({ example: 'FRESH', enum: ['FRESH', 'STALE', 'UNAVAILABLE'] })
  freshness!: LocationFreshness;

  @ApiProperty({ example: '2026-09-11T05:30:00.000Z', nullable: true })
  recordedAt!: string | null;

  @ApiProperty({ example: '2026-09-11T05:30:01.000Z' })
  receivedAt!: string;
}
