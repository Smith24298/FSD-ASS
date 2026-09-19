import { FastifyInstance } from "fastify";
import {
  authenticateUser,
  checkRole,
  validate,
  validateParams,
  validateQuery,
} from "../../shared/middleware/auth.middleware";
import {
  createVendorSchema,
  updateVendorSchema,
  updateVendorStatusSchema,
  vendorParamsSchema,
  vendorQuerySchema,
} from "./vendor.schema";
import {
  createVendorController,
  getVendorController,
  listVendorsController,
  updateVendorController,
  updateVendorStatusController,
} from "./vendor.controller";

export default async function vendorRoutes(app: FastifyInstance) {
  app.get("/vendors", {
    preHandler: [
      authenticateUser,
      checkRole("OFFICR", "ADMIN", "MANAGER"),
      validateQuery(vendorQuerySchema),
    ],
    handler: listVendorsController,
  });

  app.get("/vendors/:id", {
    preHandler: [
      authenticateUser,
      validateParams(vendorParamsSchema),
    ],
    handler: getVendorController,
  });

  app.post("/vendors", {
    preHandler: [
      authenticateUser,
      checkRole("ADMIN", "OFFICR"),
      validate(createVendorSchema),
    ],
    handler: createVendorController,
  });

  app.patch("/vendors/:id", {
    preHandler: [
      authenticateUser,
      validateParams(vendorParamsSchema),
      validate(updateVendorSchema),
    ],
    handler: updateVendorController,
  });

  app.patch("/vendors/:id/status", {
    preHandler: [
      authenticateUser,
      checkRole("ADMIN", "OFFICR"),
      validateParams(vendorParamsSchema),
      validate(updateVendorStatusSchema),
    ],
    handler: updateVendorStatusController,
  });
}
