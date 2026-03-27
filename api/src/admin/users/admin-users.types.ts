// src/modules/admin/users/admin-users.types.ts

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  role: 'PARENT' | 'ADVOCATE' | 'TEACHER_THERAPIST' | 'COUNSELOR' | 'SUPPORT' | 'ADMIN';
  status?: 'active' | 'inactive' | 'pending';
  sendWelcomeEmail?: boolean;
}

export interface DirectRegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'ADVOCATE' | 'TEACHER_THERAPIST';
  sendWelcomeEmail?: boolean;
}

export interface RegisterRoleDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  sendWelcomeEmail?: boolean;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  role?: 'PARENT' | 'ADVOCATE' | 'TEACHER_THERAPIST' | 'COUNSELOR' | 'SUPPORT' | 'ADMIN';
  status?: 'active' | 'inactive' | 'pending' | 'suspended';
  subscriptionPlanSlug?: string;
}

export interface AdminUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  emailVerified: boolean;
  subscriptionPlanSlug?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminUserListResponse {
  users: AdminUserResponse[];
  total: number;
}

export interface UserStatsResponse {
  total: number;
  byRole: Record<string, number>;
  byStatus: Record<string, number>;
  newThisMonth: number;
}
