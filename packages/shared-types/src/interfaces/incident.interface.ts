export interface CreateIncidentDto {
  rideId: string;
  category: 'SAFETY' | 'DRIVER_BEHAVIOR' | 'RIDER_BEHAVIOR' | 'VEHICLE' | 'PAYMENT' | 'ACCIDENT' | 'OTHER';
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

export interface UpdateIncidentStatusDto {
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
}

export interface UpdateIncidentSeverityDto {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface IncidentVo {
  id: string;
  rideId: string;
  reportedByUserId: string;
  category: string;
  severity: string;
  description: string;
  status: string;
  resolvedAt?: string | null;
  resolvedByUserId?: string | null;
  createdAt: string;
  updatedAt: string;
}
