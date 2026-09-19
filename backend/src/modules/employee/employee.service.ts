import { employeeRepository } from "./employee.repository";
import { userRepository } from "../user/user.repository";
import { CreateEmployeeInput, UpdateEmployeeInput, EmployeeStatusInput, EmployeeQuery } from "./employee.schema";
import { EmployeeResponse, PaginatedEmployeeResponse, toEmployeeResponse } from "./employee.types";

export class EmployeeService {
  async createEmployee(adminId: number, adminOrganizationId: number, data: CreateEmployeeInput): Promise<EmployeeResponse> {
    const { employeeId } = data;

    const employeeUser = await userRepository.findById(employeeId);

    if (!employeeUser) {
      throw new Error("USER_NOT_FOUND");
    }

    if (employeeUser.organizationId !== adminOrganizationId) {
      throw new Error("EMPLOYEE_WRONG_ORGANIZATION");
    }

    const existingEmployee = await employeeRepository.findByEmployeeId(employeeId);

    if (existingEmployee) {
      throw new Error("EMPLOYEE_ALREADY_ASSIGNED");
    }

    const employee = await employeeRepository.create(adminId, employeeId);

    return toEmployeeResponse(employee);
  }

  async getEmployees(adminId: number, query: EmployeeQuery): Promise<PaginatedEmployeeResponse> {
    const { page, limit, search, isActive } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      adminId,
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.employee = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { userName: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const [employees, total] = await Promise.all([
      employeeRepository.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      employeeRepository.count({ where }),
    ]);

    return {
      data: employees.map((e) => toEmployeeResponse(e)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEmployeeById(adminId: number, id: number): Promise<EmployeeResponse | null> {
    const employee = await employeeRepository.findById(adminId, id);

    if (!employee) {
      return null;
    }

    return toEmployeeResponse(employee);
  }

  async updateEmployee(adminId: number, id: number, data: UpdateEmployeeInput): Promise<EmployeeResponse | null> {
    const employee = await employeeRepository.findById(adminId, id);

    if (!employee) {
      return null;
    }

    const updatedUser = await employeeRepository.updateEmployeeUser(employee.employeeId, data);

    if (!updatedUser) {
      return null;
    }

    return {
      id: employee.id,
      adminId: employee.adminId,
      employeeId: employee.employeeId,
      isActive: employee.isActive ?? true,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
      employee: updatedUser,
    };
  }

  async updateEmployeeStatus(adminId: number, id: number, data: EmployeeStatusInput): Promise<EmployeeResponse | null> {
    const employee = await employeeRepository.findById(adminId, id);

    if (!employee) {
      return null;
    }

    const updatedEmployee = await employeeRepository.updateStatus(id, data.isActive);

    if (!updatedEmployee) {
      return null;
    }

    return toEmployeeResponse(updatedEmployee);
  }

  async deleteEmployee(adminId: number, id: number): Promise<boolean> {
    const employee = await employeeRepository.findById(adminId, id);

    if (!employee) {
      return false;
    }

    return employeeRepository.delete(id);
  }
}

export const employeeService = new EmployeeService();