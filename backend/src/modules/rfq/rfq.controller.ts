import { FastifyReply, FastifyRequest } from "fastify";
import fs from "node:fs";
import { rfqService } from "./rfq.service";
import { quotationService } from "../quotation/quotation.service";
import {
  AddVendorBody,
  AddVendorParams,
  AttachmentParams,
  AwardRfqInput,
  CancelRfqInput,
  CreateRfqInput,
  DeclineRfqInput,
  RfqParams,
  RfqQuery,
  UpdateRfqInput,
} from "./rfq.schema";
import { getCurrentUser } from "../../shared/middleware/auth.middleware";

const handleError = (error: any, reply: FastifyReply) => {
  if (error?.isOperational) {
    return reply.code(error.statusCode).send({
      success: false,
      message: error.message,
      code: error.code,
    });
  }
  return reply.code(500).send({ success: false, message: "Internal server error" });
};

export const createRfqController = async (
  req: FastifyRequest<{ Body: CreateRfqInput }>,
  reply: FastifyReply
) => {
  try {
    const data = await rfqService.create(getCurrentUser(req), req.body, req.body.publish ?? false);
    return reply.code(201).send({ success: true, message: "RFQ created", data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const listRfqsController = async (
  req: FastifyRequest<{ Querystring: RfqQuery }>,
  reply: FastifyReply
) => {
  try {
    const result = await rfqService.list(getCurrentUser(req), req.query);
    return reply.code(200).send({ success: true, message: "RFQs retrieved", ...result });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const getRfqController = async (
  req: FastifyRequest<{ Params: RfqParams }>,
  reply: FastifyReply
) => {
  try {
    const data = await rfqService.getDetail(getCurrentUser(req), req.params.id);
    return reply.code(200).send({ success: true, message: "RFQ retrieved", data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const updateRfqController = async (
  req: FastifyRequest<{ Params: RfqParams; Body: UpdateRfqInput }>,
  reply: FastifyReply
) => {
  try {
    const data = await rfqService.update(getCurrentUser(req), req.params.id, req.body);
    return reply.code(200).send({ success: true, message: "RFQ updated", data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const publishRfqController = async (
  req: FastifyRequest<{ Params: RfqParams }>,
  reply: FastifyReply
) => {
  try {
    const data = await rfqService.publish(getCurrentUser(req), req.params.id);
    return reply.code(200).send({ success: true, message: "RFQ published", data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const closeRfqController = async (
  req: FastifyRequest<{ Params: RfqParams }>,
  reply: FastifyReply
) => {
  try {
    const data = await rfqService.close(getCurrentUser(req), req.params.id);
    return reply.code(200).send({ success: true, message: "RFQ closed", data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const reviewRfqController = async (
  req: FastifyRequest<{ Params: RfqParams }>,
  reply: FastifyReply
) => {
  try {
    const data = await rfqService.review(getCurrentUser(req), req.params.id);
    return reply.code(200).send({ success: true, message: "RFQ moved to review", data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const cancelRfqController = async (
  req: FastifyRequest<{ Params: RfqParams; Body: CancelRfqInput }>,
  reply: FastifyReply
) => {
  try {
    const data = await rfqService.cancel(getCurrentUser(req), req.params.id, req.body.reason);
    return reply.code(200).send({ success: true, message: "RFQ cancelled", data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const declineRfqController = async (
  req: FastifyRequest<{ Params: RfqParams; Body: DeclineRfqInput }>,
  reply: FastifyReply
) => {
  try {
    await rfqService.decline(getCurrentUser(req), req.params.id, req.body.reason);
    return reply.code(200).send({ success: true, message: "Invitation declined" });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const addVendorController = async (
  req: FastifyRequest<{ Params: RfqParams; Body: AddVendorBody }>,
  reply: FastifyReply
) => {
  try {
    const data = await rfqService.addVendor(getCurrentUser(req), req.params.id, req.body.vendorId);
    return reply.code(200).send({ success: true, message: "Vendor invited", data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const removeVendorController = async (
  req: FastifyRequest<{ Params: AddVendorParams }>,
  reply: FastifyReply
) => {
  try {
    const data = await rfqService.removeVendor(getCurrentUser(req), req.params.id, req.params.vendorId);
    return reply.code(200).send({ success: true, message: "Vendor removed", data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const uploadAttachmentController = async (
  req: FastifyRequest<{ Params: RfqParams }>,
  reply: FastifyReply
) => {
  try {
    const file = await req.file();
    if (!file) {
      return reply.code(400).send({ success: false, message: "No file uploaded" });
    }
    const buffer = await file.toBuffer();
    const data = await rfqService.uploadAttachment(getCurrentUser(req), req.params.id, {
      buffer,
      filename: file.filename,
      mimeType: file.mimetype,
    });
    return reply.code(201).send({ success: true, message: "Attachment uploaded", data });
  } catch (error: any) {
    req.log.error(error);
    if (error?.code === "FST_REQ_FILE_TOO_LARGE") {
      return reply.code(400).send({ success: false, message: "File is too large", code: "FILE_TOO_LARGE" });
    }
    return handleError(error, reply);
  }
};

export const deleteAttachmentController = async (
  req: FastifyRequest<{ Params: AttachmentParams }>,
  reply: FastifyReply
) => {
  try {
    await rfqService.deleteAttachment(getCurrentUser(req), req.params.id, req.params.attachmentId);
    return reply.code(200).send({ success: true, message: "Attachment removed" });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const downloadAttachmentController = async (
  req: FastifyRequest<{ Params: AttachmentParams }>,
  reply: FastifyReply
) => {
  try {
    const attachment = await rfqService.getAttachment(
      getCurrentUser(req),
      req.params.id,
      req.params.attachmentId
    );
    const safeName = attachment.filename.replace(/[\r\n"\\]/g, "_");
    const disposition = `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(
      attachment.filename
    )}`;
    return reply
      .type(attachment.mimeType)
      .header("Content-Disposition", disposition)
      .send(fs.createReadStream(attachment.path));
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const shortlistQuotationController = async (
  req: FastifyRequest<{ Params: { id: number; quotationId: number } }>,
  reply: FastifyReply
) => {
  try {
    const data = await quotationService.shortlist(
      getCurrentUser(req),
      req.params.id,
      req.params.quotationId
    );
    return reply.code(200).send({ success: true, message: "Quotation shortlisted", data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const compareQuotationsController = async (
  req: FastifyRequest<{ Params: RfqParams }>,
  reply: FastifyReply
) => {
  try {
    const data = await quotationService.compare(getCurrentUser(req), req.params.id);
    return reply.code(200).send({ success: true, message: "Quotations compared", data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const listRfqQuotationsController = async (
  req: FastifyRequest<{ Params: RfqParams; Querystring: any }>,
  reply: FastifyReply
) => {
  try {
    const result = await quotationService.list(getCurrentUser(req), {
      rfqId: req.params.id,
      ...(req.query as any),
    } as any);
    return reply.code(200).send({ success: true, message: "Quotations retrieved", ...result });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const awardRfqController = async (
  req: FastifyRequest<{ Params: RfqParams; Body: AwardRfqInput }>,
  reply: FastifyReply
) => {
  try {
    const data = await rfqService.award(getCurrentUser(req), req.params.id, req.body.quotationId);
    return reply.code(200).send({ success: true, message: "RFQ awarded", data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const getRfqActivityController = async (
  req: FastifyRequest<{ Params: RfqParams }>,
  reply: FastifyReply
) => {
  try {
    const data = await rfqService.getActivity(getCurrentUser(req), req.params.id);
    return reply.code(200).send({ success: true, message: "Activity retrieved", data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};