import type { PaginatedResponse, SafeUser } from "../../shared/types/index.js";

export type {
  Role,
  SafeUser,
  EmployeeWithUser,
  PaginatedResponse,
} from "../../shared/types/index.js";
export { toEmployeeResponse } from "../../shared/types/index.js";

export interface EmployeeResponse {
  id: number;
  adminId: number;
  employeeId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  employee: SafeUser;
}

export type PaginatedEmployeeResponse = PaginatedResponse<EmployeeResponse>;