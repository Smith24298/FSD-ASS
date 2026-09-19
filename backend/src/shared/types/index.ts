export type Role = "ADMIN" | "VENDOR" | "OFFICR" | "MANAGER";

export interface SafeUser {
  id: number;
  email: string;
  userName: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithRelations extends SafeUser {
  profile?: {
    id: number;
    gstNumber: string;
    address: string;
    companyName: string;
    mobileNumber: string;
    createdAt: Date;
    updateAt: Date;
  } | null;
  employeesCreated?: Array<{
    id: number;
    adminId: number;
    employeeId: number;
    createdAt: Date;
    updatedAt: Date;
    employee?: SafeUser;
  }>;
  employeeRecord?: {
    id: number;
    adminId: number;
    employeeId: number;
    createdAt: Date;
    updatedAt: Date;
    admin?: SafeUser;
  } | null;
}

export interface EmployeeWithUser {
  id: number;
  adminId: number;
  employeeId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  employee: SafeUser;
  admin?: SafeUser;
}

export interface EmployeeResponse {
  id: number;
  adminId: number;
  employeeId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  employee: SafeUser;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function toSafeUser(
  user: { passwordHash: string } & SafeUser,
): SafeUser {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export function toEmployeeResponse(
  employee: EmployeeWithUser,
): EmployeeResponse {
  return {
    id: employee.id,
    adminId: employee.adminId,
    employeeId: employee.employeeId,
    isActive: employee.isActive ?? true,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
    employee: employee.employee,
  };
}

export interface JWTPayload {
  userId: number;
  email: string;
  userName: string;
  role?: Role;
}

export interface RegisterResponse {
  user: SafeUser;
  profile?: {
    id: number;
    gstNumber: string;
    address: string;
    companyName: string;
    mobileNumber: string;
    createdAt: Date;
    updatedAt?: Date;
    updateAt?: Date;
  } | null;
}

export interface LoginResponse {
  token: string;
  email: string;
  user: SafeUser;
}
