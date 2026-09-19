import { FastifyReply, FastifyRequest } from "fastify";
import { quotationService } from "./quotation.service";
import {
  QuotationParams,
  QuotationQuery,
  QuotationSubmitInput,
  QuotationUpdateInput,
} from "./quotation.schema";
import { getCurrentUser } from "../../shared/middleware/auth.middleware";

export const submitQuotationController = async (
  req: FastifyRequest<{ Body: QuotationSubmitInput }>,
  reply: FastifyReply
) => {
  try {
    const data = await quotationService.submit(getCurrentUser(req), req.body);
    const msg = req.body.isDraft ? "Quotation saved as draft" : "Quotation submitted";
    return reply.code(201).send({ success: true, message: msg, data });
  } catch (error: any) {
    req.log.error(error);
    return reply.code(error.statusCode ?? 500).send({
      success: false,
      message: error.isOperational ? error.message : "Failed to submit quotation",
      code: error.code,
    });
  }
};

export const updateQuotationController = async (
  req: FastifyRequest<{ Params: QuotationParams; Body: QuotationUpdateInput }>,
  reply: FastifyReply
) => {
  try {
    const data = await quotationService.update(getCurrentUser(req), req.params.id, req.body);
    return reply.code(200).send({ success: true, message: "Quotation updated", data });
  } catch (error: any) {
    req.log.error(error);
    return reply.code(error.statusCode ?? 500).send({
      success: false,
      message: error.isOperational ? error.message : "Failed to update quotation",
      code: error.code,
    });
  }
};

export const submitDraftQuotationController = async (
  req: FastifyRequest<{ Params: QuotationParams }>,
  reply: FastifyReply
) => {
  try {
    const data = await quotationService.submitDraft(getCurrentUser(req), req.params.id);
    return reply.code(200).send({ success: true, message: "Quotation submitted successfully", data });
  } catch (error: any) {
    req.log.error(error);
    return reply.code(error.statusCode ?? 500).send({
      success: false,
      message: error.isOperational ? error.message : "Failed to submit quotation",
      code: error.code,
    });
  }
};

export const listQuotationsController = async (
  req: FastifyRequest<{ Querystring: QuotationQuery }>,
  reply: FastifyReply
) => {
  try {
    const result = await quotationService.list(getCurrentUser(req), req.query);
    return reply.code(200).send({ success: true, message: "Quotations retrieved", ...result });
  } catch (error: any) {
    req.log.error(error);
    return reply.code(error.statusCode ?? 500).send({
      success: false,
      message: error.isOperational ? error.message : "Failed to retrieve quotations",
      code: error.code,
    });
  }
};

export const getQuotationController = async (
  req: FastifyRequest<{ Params: QuotationParams }>,
  reply: FastifyReply
) => {
  try {
    const data = await quotationService.get(getCurrentUser(req), req.params.id);
    return reply.code(200).send({ success: true, message: "Quotation retrieved", data });
  } catch (error: any) {
    req.log.error(error);
    return reply.code(error.statusCode ?? 500).send({
      success: false,
      message: error.isOperational ? error.message : "Failed to retrieve quotation",
      code: error.code,
    });
  }
};