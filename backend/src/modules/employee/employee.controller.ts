import { FastifyReply, FastifyRequest } from "fastify";
import { employeeService } from "./employee.service";
import { CreateEmployeeInput, UpdateEmployeeInput, EmployeeStatusInput, EmployeeParams, EmployeeQuery } from "./employee.schema";
import { getCurrentUser } from "../../shared/middleware/auth.middleware";

export const createEmployeeController = async (
  req: FastifyRequest<{ Body: CreateEmployeeInput }>,
  reply: FastifyReply
) => {
  try {
    const currentUser = getCurrentUser(req);
    const employee = await employeeService.createEmployee(currentUser.id, currentUser.organizationId, req.body);

    return reply.code(201).send({
      success: true,
      message: "Employee created successfully",
      data: employee,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "USER_NOT_FOUND") {
        return reply.code(404).send({
          success: false,
          message: "User not found",
        });
      }
      if (error.message === "EMPLOYEE_WRONG_ORGANIZATION") {
        return reply.code(403).send({
          success: false,
          message: "Cannot assign user from another organization as employee",
        });
      }
      if (error.message === "EMPLOYEE_ALREADY_ASSIGNED") {
        return reply.code(409).send({
          success: false,
          message: "User is already assigned as an employee",
        });
      }
    }

    req.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Failed to create employee",
    });
  }
};

export const getEmployeesController = async (
  req: FastifyRequest<{ Querystring: EmployeeQuery }>,
  reply: FastifyReply
) => {
  try {
    const adminId = (req.user as any).userId;
    const result = await employeeService.getEmployees(adminId, req.query);

    return reply.code(200).send({
      success: true,
      message: "Employees retrieved successfully",
      ...result,
    });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Failed to retrieve employees",
    });
  }
};

export const getEmployeeController = async (
  req: FastifyRequest<{ Params: EmployeeParams }>,
  reply: FastifyReply
) => {
  try {
    const adminId = (req.user as any).userId;
    const employee = await employeeService.getEmployeeById(adminId, req.params.id);

    if (!employee) {
      return reply.code(404).send({
        success: false,
        message: "Employee not found",
      });
    }

    return reply.code(200).send({
      success: true,
      message: "Employee retrieved successfully",
      data: employee,
    });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Failed to retrieve employee",
    });
  }
};

export const updateEmployeeController = async (
  req: FastifyRequest<{ Params: EmployeeParams; Body: UpdateEmployeeInput }>,
  reply: FastifyReply
) => {
  try {
    const adminId = (req.user as any).userId;
    const employee = await employeeService.updateEmployee(adminId, req.params.id, req.body);

    if (!employee) {
      return reply.code(404).send({
        success: false,
        message: "Employee not found",
      });
    }

    return reply.code(200).send({
      success: true,
      message: "Employee updated successfully",
      data: employee,
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      const target = (error as any).meta?.target;
      if (target?.includes("email")) {
        return reply.code(409).send({
          success: false,
          message: "Email already exists",
        });
      }
      if (target?.includes("userName")) {
        return reply.code(409).send({
          success: false,
          message: "Username already exists",
        });
      }
      return reply.code(409).send({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    req.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Failed to update employee",
    });
  }
};

export const updateEmployeeStatusController = async (
  req: FastifyRequest<{ Params: EmployeeParams; Body: EmployeeStatusInput }>,
  reply: FastifyReply
) => {
  try {
    const adminId = (req.user as any).userId;
    const employee = await employeeService.updateEmployeeStatus(adminId, req.params.id, req.body);

    if (!employee) {
      return reply.code(404).send({
        success: false,
        message: "Employee not found",
      });
    }

    return reply.code(200).send({
      success: true,
      message: `Employee ${req.body.isActive ? "activated" : "deactivated"} successfully`,
      data: employee,
    });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Failed to update employee status",
    });
  }
};

export const deleteEmployeeController = async (
  req: FastifyRequest<{ Params: EmployeeParams }>,
  reply: FastifyReply
) => {
  try {
    const adminId = (req.user as any).userId;
    const deleted = await employeeService.deleteEmployee(adminId, req.params.id);

    if (!deleted) {
      return reply.code(404).send({
        success: false,
        message: "Employee not found",
      });
    }

    return reply.code(200).send({
      success: true,
      message: "Employee relationship deleted successfully",
    });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Failed to delete employee",
    });
  }
};