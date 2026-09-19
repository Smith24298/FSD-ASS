import { z } from "zod";

export const createEmployeeSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
});

export const updateEmployeeSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.email().optional(),
  userName: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-z0-9_.]+$/,
      "Username can only contain lowercase letters, numbers, _ and .",
    )
    .optional(),
  role: z.enum(["ADMIN", "VENDOR", "OFFICR", "MANAGER"]).optional(),
});

export const employeeStatusSchema = z.object({
  isActive: z.boolean(),
});

export const employeeParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const employeeQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type EmployeeStatusInput = z.infer<typeof employeeStatusSchema>;
export type EmployeeParams = z.infer<typeof employeeParamsSchema>;
export type EmployeeQuery = z.infer<typeof employeeQuerySchema>;