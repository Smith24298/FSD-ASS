import { z } from "zod";

const registerUserSchema = z.object({
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

  name: z.string(),
});

const profileSchema = z.object({
  mobileNumber: z.string().length(10, "Mobile number must be 10 digits"),
  companyName: z.string(),
  gstNumber: z.string(),
  address: z.string(),
});

export const registerSchema = z.discriminatedUnion("role", [
  // ADMIN → profile required
  z.object({
    role: z.literal("ADMIN"),
    user: registerUserSchema,
    profile: profileSchema,
  }),

  // VENDOR → profile required
  z.object({
    role: z.literal("VENDOR"),
    user: registerUserSchema,
    profile: profileSchema,
  }),

  // OFFICR → profile not allowed
  z.object({
    role: z.literal("OFFICR"),
    user: registerUserSchema,
    profile: z.never().optional(),
  }),

  // MANAGER → profile not allowed
  z.object({
    role: z.literal("MANAGER"),
    user: registerUserSchema,
    profile: z.never().optional(),
  }),
]);

export const loginSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain a special character"),
});

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
