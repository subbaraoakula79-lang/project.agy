export interface CreateSupportTicketDto {
  rideId?: string;
  category: 'PAYMENT' | 'DRIVER' | 'RIDER' | 'RIDE' | 'SAFETY' | 'OTHER';
  subject: string;
  description: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface UpdateSupportTicketStatusDto {
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
}

export interface SupportTicketVo {
  id: string;
  createdByUserId: string;
  rideId?: string | null;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  resolvedAt?: string | null;
  resolvedByUserId?: string | null;
  createdAt: string;
  updatedAt: string;
}
