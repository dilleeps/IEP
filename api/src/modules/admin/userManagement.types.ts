// Admin user management types

export interface CreateUserDto {
  email: string;
  password: string;
  displayName: string;
  role: string;
  status?: 'active' | 'pending' | 'inactive';
}

export interface UpdateUserDto {
  displayName?: string;
  email?: string;
  role?: string;
  status?: 'active' | 'pending' | 'inactive' | 'suspended';
}

export interface ApproveRequestDto {
  requestIds: string[];
}

export interface RejectRequestDto {
  requestIds: string[];
  reason?: string;
}

export interface BulkUserImportDto {
  users: Array<{
    email: string;
    displayName: string;
    role: string;
    password: string; // Required - no auto-generation
  }>;
}

export interface UserResponse {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrationRequestResponse {
  id: string;
  email: string;
  displayName: string;
  role: string;
  reason?: string;
  status: string;
  createdAt: string;
}

export interface UserStatsResponse {
  total: number;
  byRole: Record<string, number>;
  byStatus: Record<string, number>;
  pendingRequests: number;
}
