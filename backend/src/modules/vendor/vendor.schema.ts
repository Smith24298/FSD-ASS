import { z } from "zod";

export const vendorStatusEnum = z.enum(["ACTIVE", "INACTIVE", "PENDING", "SUSPENDED"]);

export const createVendorSchema = z.object({
  name: z.string().min(1, "Contact person name is required"),
  companyName: z.string().min(1, "Company name is required"),
  email: z.string().email("Valid email is required"),
  userName: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-z0-9_.]+$/, "Username can only contain lowercase letters, numbers, _ and .")
    .optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
  mobileNumber: z.string().min(8, "Valid mobile number is required"),
  gstNumber: z.string().min(5, "GST number is required"),
  address: z.string().min(1, "Address is required"),
  category: z.string().min(1, "Category is required"),
  vendorCode: z.string().optional(),
  status: vendorStatusEnum.optional().default("ACTIVE"),
});

export const updateVendorSchema = z.object({
  name: z.string().min(1).optional(),
  companyName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  mobileNumber: z.string().min(8).optional(),
  gstNumber: z.string().min(5).optional(),
  address: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  vendorCode: z.string().optional(),
  status: vendorStatusEnum.optional(),
});

export const updateVendorStatusSchema = z.object({
  status: vendorStatusEnum,
});

export const vendorParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const vendorQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  category: z.string().optional(),
  status: vendorStatusEnum.optional(),
  sortBy: z.enum(["name", "companyName", "createdAt", "vendorCode", "category"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
export type UpdateVendorStatusInput = z.infer<typeof updateVendorStatusSchema>;
export type VendorParams = z.infer<typeof vendorParamsSchema>;
export type VendorQuery = z.infer<typeof vendorQuerySchema>;
