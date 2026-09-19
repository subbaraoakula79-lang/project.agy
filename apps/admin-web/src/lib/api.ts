const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('yatra_admin_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('yatra_admin_token', token);
      } else {
        localStorage.removeItem('yatra_admin_token');
      }
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('yatra_admin_token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}/api/v1${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = data?.message || data?.error || `HTTP error ${response.status}`;
        throw new Error(Array.isArray(message) ? message.join(', ') : message);
      }

      return data;
    } catch (err: any) {
      console.error(`[API Error] ${endpoint}:`, err);
      throw err;
    }
  }

  // Auth
  async login(email: string, password: string) {
    const res = await this.request<{
      success: boolean;
      data: {
        accessToken: string;
        refreshToken: string;
        user: { id: string; email: string; firstName: string; lastName: string; role: string };
      };
    }>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.data?.accessToken) {
      this.setToken(res.data.accessToken);
    }
    return res.data;
  }

  logout() {
    this.setToken(null);
  }

  // Dashboard
  async getDashboardStats() {
    const res = await this.request<{ success: boolean; data: any }>('/admin/dashboard/stats');
    return res.data;
  }

  // Drivers
  async listDrivers(params: {
    page?: number;
    limit?: number;
    search?: string;
    verificationStatus?: string;
    status?: string;
    vehicleType?: string;
  } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.search) query.set('search', params.search);
    if (params.verificationStatus) query.set('verificationStatus', params.verificationStatus);
    if (params.status) query.set('status', params.status);
    if (params.vehicleType) query.set('vehicleType', params.vehicleType);

    return this.request<{
      success: boolean;
      data: any[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>(`/admin/drivers?${query.toString()}`);
  }

  async getDriver(id: string) {
    const res = await this.request<{ success: boolean; data: any }>(`/admin/drivers/${id}`);
    return res.data;
  }

  async approveDriver(id: string) {
    return this.request<{ success: boolean; message: string; data: any }>(
      `/admin/drivers/${id}/approve`,
      { method: 'POST' },
    );
  }

  async rejectDriver(id: string, reason: string) {
    return this.request<{ success: boolean; message: string; data: any }>(
      `/admin/drivers/${id}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      },
    );
  }

  async suspendDriver(id: string, reason: string) {
    return this.request<{ success: boolean; message: string; data: any }>(
      `/admin/drivers/${id}/suspend`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      },
    );
  }

  async reactivateDriver(id: string) {
    return this.request<{ success: boolean; message: string; data: any }>(
      `/admin/drivers/${id}/reactivate`,
      { method: 'POST' },
    );
  }

  async approveDocument(driverId: string, docId: string) {
    return this.request<{ success: boolean; message: string; data: any }>(
      `/admin/drivers/${driverId}/documents/${docId}/approve`,
      { method: 'POST' },
    );
  }

  async rejectDocument(driverId: string, docId: string, reason: string) {
    return this.request<{ success: boolean; message: string; data: any }>(
      `/admin/drivers/${driverId}/documents/${docId}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      },
    );
  }

  // Vehicles
  async listVehicles(params: {
    page?: number;
    limit?: number;
    vehicleType?: string;
    driverProfileId?: string;
    search?: string;
  } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.vehicleType) query.set('vehicleType', params.vehicleType);
    if (params.driverProfileId) query.set('driverProfileId', params.driverProfileId);
    if (params.search) query.set('search', params.search);

    return this.request<{
      success: boolean;
      data: any[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>(`/admin/vehicles?${query.toString()}`);
  }

  async updateVehicle(id: string, data: { isActive?: boolean }) {
    return this.request<{ success: boolean; message: string; data: any }>(
      `/admin/vehicles/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    );
  }

  // Rides
  async listRides(params: {
    page?: number;
    limit?: number;
    status?: string;
    vehicleType?: string;
    search?: string;
  } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.status) query.set('status', params.status);
    if (params.vehicleType) query.set('vehicleType', params.vehicleType);
    if (params.search) query.set('search', params.search);

    return this.request<{
      success: boolean;
      data: any[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>(`/admin/rides?${query.toString()}`);
  }

  async getRide(id: string) {
    const res = await this.request<{ success: boolean; data: any }>(`/admin/rides/${id}`);
    return res.data;
  }

  async cancelRide(id: string, reason: string) {
    return this.request<{ success: boolean; message: string; data: any }>(
      `/admin/rides/${id}/cancel`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      },
    );
  }

  // Cities
  async listCities(params: { page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    return this.request<{
      success: boolean;
      cities: any[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/admin/cities?${query.toString()}`);
  }

  async updateCity(id: string, data: { isActive?: boolean }) {
    return this.request<{ success: boolean; message: string; data: any }>(
      `/admin/cities/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    );
  }

  // Pricing
  async listPricing(params: { cityId?: string; vehicleTypeId?: string } = {}) {
    const query = new URLSearchParams();
    if (params.cityId) query.set('cityId', params.cityId);
    if (params.vehicleTypeId) query.set('vehicleTypeId', params.vehicleTypeId);

    const qs = query.toString();
    return this.request<{
      success: boolean;
      pricingConfigs: any[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/admin/pricing${qs ? `?${qs}` : ''}`);
  }

  async updatePricing(
    id: string,
    data: {
      baseFare?: number;
      perKmRate?: number;
      perMinRate?: number;
      minimumFare?: number;
      isActive?: boolean;
    },
  ) {
    return this.request<{ success: boolean; message: string; data: any }>(
      `/admin/pricing/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    );
  }

  // Audit Logs
  async listAuditLogs(params: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
    adminUserId?: string;
  } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.action) query.set('action', params.action);
    if (params.entityType) query.set('entityType', params.entityType);
    if (params.adminUserId) query.set('adminUserId', params.adminUserId);

    return this.request<{
      success: boolean;
      data: any[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>(`/admin/audit-logs?${query.toString()}`);
  }

  // Generic helpers
  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export const api = new ApiClient();
