/** Driver availability status. */
export enum DriverStatus {
  OFFLINE = 'OFFLINE',
  ONLINE = 'ONLINE',
  BUSY = 'BUSY', // Currently on a ride
}

/** Driver document verification status. */
export enum DocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

/** Types of driver documents required for onboarding. */
export enum DocumentType {
  DRIVING_LICENSE = 'DRIVING_LICENSE',
  VEHICLE_REGISTRATION = 'VEHICLE_REGISTRATION',
  INSURANCE = 'INSURANCE',
  AADHAAR = 'AADHAAR',
  PAN = 'PAN',
  PROFILE_PHOTO = 'PROFILE_PHOTO',
}
