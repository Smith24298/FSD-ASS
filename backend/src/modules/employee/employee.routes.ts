import { FastifyInstance } from "fastify";
import { authenticateUser, checkRole, validate, validateParams, validateQuery } from "../../shared/middleware/auth.middleware";
import { createEmployeeSchema, updateEmployeeSchema, employeeStatusSchema, employeeParamsSchema, employeeQuerySchema } from "./employee.schema";
import {
  createEmployeeController,
  getEmployeesController,
  getEmployeeController,
  updateEmployeeController,
  updateEmployeeStatusController,
  deleteEmployeeController,
} from "./employee.controller";

export default async function employeeRoutes(app: FastifyInstance) {
  app.post("/employees", {
    preHandler: [
      authenticateUser,
      checkRole("ADMIN"),
      validate(createEmployeeSchema),
    ],
    handler: createEmployeeController,
  });

  app.get("/employees", {
    preHandler: [
      authenticateUser,
      checkRole("ADMIN"),
      validateQuery(employeeQuerySchema),
    ],
    handler: getEmployeesController,
  });

  app.get("/employees/:id", {
    preHandler: [
      authenticateUser,
      checkRole("ADMIN"),
      validateParams(employeeParamsSchema),
    ],
    handler: getEmployeeController,
  });

  app.patch("/employees/:id", {
    preHandler: [
      authenticateUser,
      checkRole("ADMIN"),
      validateParams(employeeParamsSchema),
      validate(updateEmployeeSchema),
    ],
    handler: updateEmployeeController,
  });

  app.patch("/employees/:id/status", {
    preHandler: [
      authenticateUser,
      checkRole("ADMIN"),
      validateParams(employeeParamsSchema),
      validate(employeeStatusSchema),
    ],
    handler: updateEmployeeStatusController,
  });

  app.delete("/employees/:id", {
    preHandler: [
      authenticateUser,
      checkRole("ADMIN"),
      validateParams(employeeParamsSchema),
    ],
    handler: deleteEmployeeController,
  });
}