import { FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import {
  authenticateUser,
  checkRole,
  validate,
  validateParams,
  validateQuery,
} from "../../shared/middleware/auth.middleware";
import {
  addVendorBodySchema,
  addVendorParamsSchema,
  attachmentParamsSchema,
  awardRfqSchema,
  cancelRfqSchema,
  createRfqSchema,
  declineRfqSchema,
  updateRfqSchema,
  rfqParamsSchema,
  rfqQuerySchema,
  shortlistParamsSchema,
} from "./rfq.schema";
import {
  addVendorController,
  awardRfqController,
  cancelRfqController,
  closeRfqController,
  compareQuotationsController,
  createRfqController,
  declineRfqController,
  deleteAttachmentController,
  downloadAttachmentController,
  getRfqController,
  getRfqActivityController,
  listRfqQuotationsController,
  listRfqsController,
  publishRfqController,
  removeVendorController,
  reviewRfqController,
  shortlistQuotationController,
  updateRfqController,
  uploadAttachmentController,
} from "./rfq.controller";
import { MAX_ATTACHMENT_SIZE } from "../../infrastructure/storage/storage";

export default async function rfqRoutes(app: FastifyInstance) {
  await app.register(multipart, {
    limits: { fileSize: MAX_ATTACHMENT_SIZE, files: 1 },
  });

  app.post("/rfqs", {
    preHandler: [
      authenticateUser,
      checkRole("OFFICR", "ADMIN"),
      validate(createRfqSchema),
    ],
    handler: createRfqController,
  });

  app.get("/rfqs", {
    preHandler: [
      authenticateUser,
      validateQuery(rfqQuerySchema),
    ],
    handler: listRfqsController,
  });

  app.get("/rfqs/:id", {
    preHandler: [
      authenticateUser,
      validateParams(rfqParamsSchema),
    ],
    handler: getRfqController,
  });

  app.get("/rfqs/:id/compare", {
    preHandler: [
      authenticateUser,
      checkRole("OFFICR", "ADMIN", "MANAGER"),
      validateParams(rfqParamsSchema),
    ],
    handler: compareQuotationsController,
  });

  app.get("/rfqs/:id/quotations", {
    preHandler: [
      authenticateUser,
      checkRole("OFFICR", "ADMIN", "MANAGER"),
      validateParams(rfqParamsSchema),
    ],
    handler: listRfqQuotationsController,
  });

  app.patch("/rfqs/:id", {
    preHandler: [
      authenticateUser,
      checkRole("OFFICR", "ADMIN"),
      validateParams(rfqParamsSchema),
      validate(updateRfqSchema),
    ],
    handler: updateRfqController,
  });

  app.post("/rfqs/:id/publish", {
    preHandler: [
      authenticateUser,
      checkRole("OFFICR", "ADMIN"),
      validateParams(rfqParamsSchema),
    ],
    handler: publishRfqController,
  });

  app.post("/rfqs/:id/close", {
    preHandler: [
      authenticateUser,
      checkRole("OFFICR", "ADMIN"),
      validateParams(rfqParamsSchema),
    ],
    handler: closeRfqController,
  });

  app.post("/rfqs/:id/review", {
    preHandler: [
      authenticateUser,
      checkRole("OFFICR", "ADMIN"),
      validateParams(rfqParamsSchema),
    ],
    handler: reviewRfqController,
  });

  app.post("/rfqs/:id/cancel", {
    preHandler: [
      authenticateUser,
      checkRole("OFFICR", "ADMIN"),
      validateParams(rfqParamsSchema),
      validate(cancelRfqSchema),
    ],
    handler: cancelRfqController,
  });

  app.post("/rfqs/:id/decline", {
    preHandler: [
      authenticateUser,
      checkRole("VENDOR"),
      validateParams(rfqParamsSchema),
      validate(declineRfqSchema),
    ],
    handler: declineRfqController,
  });

  app.post("/rfqs/:id/vendors", {
    preHandler: [
      authenticateUser,
      checkRole("OFFICR", "ADMIN"),
      validateParams(rfqParamsSchema),
      validate(addVendorBodySchema),
    ],
    handler: addVendorController,
  });

  app.delete("/rfqs/:id/vendors/:vendorId", {
    preHandler: [
      authenticateUser,
      checkRole("OFFICR", "ADMIN"),
      validateParams(addVendorParamsSchema),
    ],
    handler: removeVendorController,
  });

  app.post("/rfqs/:id/attachments", {
    preHandler: [
      authenticateUser,
      checkRole("OFFICR", "ADMIN"),
      validateParams(rfqParamsSchema),
    ],
    handler: uploadAttachmentController,
  });

  app.delete("/rfqs/:id/attachments/:attachmentId", {
    preHandler: [
      authenticateUser,
      checkRole("OFFICR", "ADMIN"),
      validateParams(attachmentParamsSchema),
    ],
    handler: deleteAttachmentController,
  });

  app.get("/rfqs/:id/attachments/:attachmentId", {
    preHandler: [
      authenticateUser,
      validateParams(attachmentParamsSchema),
    ],
    handler: downloadAttachmentController,
  });

  app.post("/rfqs/:id/shortlist/:quotationId", {
    preHandler: [
      authenticateUser,
      checkRole("OFFICR", "ADMIN"),
      validateParams(shortlistParamsSchema),
    ],
    handler: shortlistQuotationController,
  });

  app.post("/rfqs/:id/award", {
    preHandler: [
      authenticateUser,
      checkRole("OFFICR", "ADMIN"),
      validateParams(rfqParamsSchema),
      validate(awardRfqSchema),
    ],
    handler: awardRfqController,
  });

  app.get("/rfqs/:id/activity", {
    preHandler: [
      authenticateUser,
      validateParams(rfqParamsSchema),
    ],
    handler: getRfqActivityController,
  });
}