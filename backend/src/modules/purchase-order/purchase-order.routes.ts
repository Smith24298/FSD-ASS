import { FastifyInstance } from "fastify";
import {
  authenticateUser,
  checkRole,
  validate,
  validateParams,
  validateQuery,
} from "../../shared/middleware/auth.middleware";
import {
  createPurchaseOrderSchema,
  poParamsSchema,
  poQuerySchema,
  updatePoStatusSchema,
} from "./purchase-order.schema";
import {
  createPurchaseOrderController,
  getPurchaseOrderController,
  listPurchaseOrdersController,
  updatePoStatusController,
} from "./purchase-order.controller";

export default async function purchaseOrderRoutes(app: FastifyInstance) {
  app.post("/purchase-orders", {
    preHandler: [
      authenticateUser,
      checkRole("OFFICR", "ADMIN"),
      validate(createPurchaseOrderSchema),
    ],
    handler: createPurchaseOrderController,
  });

  app.get("/purchase-orders", {
    preHandler: [
      authenticateUser,
      validateQuery(poQuerySchema),
    ],
    handler: listPurchaseOrdersController,
  });

  app.get("/purchase-orders/:id", {
    preHandler: [
      authenticateUser,
      validateParams(poParamsSchema),
    ],
    handler: getPurchaseOrderController,
  });

  app.patch("/purchase-orders/:id/status", {
    preHandler: [
      authenticateUser,
      validateParams(poParamsSchema),
      validate(updatePoStatusSchema),
    ],
    handler: updatePoStatusController,
  });
}
