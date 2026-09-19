import { z } from "zod";

export const createUserSchema = z.object({
  email: z.email(),
  userName: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-z0-9_.]+$/,
      "Username can only contain lowercase letters, numbers, _ and .",
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain a special character"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["ADMIN", "VENDOR", "OFFICR", "MANAGER"]),
});

export const updateUserSchema = z.object({
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
  name: z.string().min(1, "Name is required").optional(),
  role: z.enum(["ADMIN", "VENDOR", "OFFICR", "MANAGER"]).optional(),
  isActive: z.boolean().optional(),
});

export const userParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  role: z.enum(["ADMIN", "VENDOR", "OFFICR", "MANAGER"]).optional(),
  isActive: z.coerce.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserParams = z.infer<typeof userParamsSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;