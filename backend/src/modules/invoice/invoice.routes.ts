import { FastifyInstance } from "fastify";
import {
  authenticateUser,
  checkRole,
  validate,
  validateParams,
  validateQuery,
} from "../../shared/middleware/auth.middleware";
import {
  createInvoiceSchema,
  invoiceParamsSchema,
  invoiceQuerySchema,
  sendEmailSchema,
  updateInvoiceStatusSchema,
} from "./invoice.schema";
import {
  createInvoiceController,
  downloadInvoicePdfController,
  getInvoiceController,
  listInvoicesController,
  sendInvoiceEmailController,
  updateInvoiceStatusController,
} from "./invoice.controller";

export default async function invoiceRoutes(app: FastifyInstance) {
  app.post("/invoices", {
    preHandler: [
      authenticateUser,
      checkRole("OFFICR", "ADMIN"),
      validate(createInvoiceSchema),
    ],
    handler: createInvoiceController,
  });

  app.get("/invoices", {
    preHandler: [
      authenticateUser,
      validateQuery(invoiceQuerySchema),
    ],
    handler: listInvoicesController,
  });

  app.get("/invoices/:id", {
    preHandler: [
      authenticateUser,
      validateParams(invoiceParamsSchema),
    ],
    handler: getInvoiceController,
  });

  app.patch("/invoices/:id/status", {
    preHandler: [
      authenticateUser,
      checkRole("OFFICR", "ADMIN", "MANAGER"),
      validateParams(invoiceParamsSchema),
      validate(updateInvoiceStatusSchema),
    ],
    handler: updateInvoiceStatusController,
  });

  app.get("/invoices/:id/pdf", {
    preHandler: [
      authenticateUser,
      validateParams(invoiceParamsSchema),
    ],
    handler: downloadInvoicePdfController,
  });

  app.post("/invoices/:id/email", {
    preHandler: [
      authenticateUser,
      checkRole("OFFICR", "ADMIN", "MANAGER"),
      validateParams(invoiceParamsSchema),
      validate(sendEmailSchema),
    ],
    handler: sendInvoiceEmailController,
  });
}
