import { FastifyInstance } from "fastify";
import {
  authenticateUser,
  checkRole,
  validate,
  validateParams,
  validateQuery,
} from "../../shared/middleware/auth.middleware";
import {
  quotationParamsSchema,
  quotationQuerySchema,
  submitQuotationSchema,
  updateQuotationSchema,
} from "./quotation.schema";
import {
  getQuotationController,
  listQuotationsController,
  submitDraftQuotationController,
  submitQuotationController,
  updateQuotationController,
} from "./quotation.controller";

export default async function quotationRoutes(app: FastifyInstance) {
  app.post("/quotations", {
    preHandler: [
      authenticateUser,
      checkRole("VENDOR"),
      validate(submitQuotationSchema),
    ],
    handler: submitQuotationController,
  });

  app.get("/quotations", {
    preHandler: [
      authenticateUser,
      validateQuery(quotationQuerySchema),
    ],
    handler: listQuotationsController,
  });

  app.get("/quotations/:id", {
    preHandler: [
      authenticateUser,
      validateParams(quotationParamsSchema),
    ],
    handler: getQuotationController,
  });

  app.patch("/quotations/:id", {
    preHandler: [
      authenticateUser,
      checkRole("VENDOR"),
      validateParams(quotationParamsSchema),
      validate(updateQuotationSchema),
    ],
    handler: updateQuotationController,
  });

  app.post("/quotations/:id/submit", {
    preHandler: [
      authenticateUser,
      checkRole("VENDOR"),
      validateParams(quotationParamsSchema),
    ],
    handler: submitDraftQuotationController,
  });
}