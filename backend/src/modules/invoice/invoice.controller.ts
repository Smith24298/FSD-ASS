import { FastifyReply, FastifyRequest } from "fastify";
import { invoiceService } from "./invoice.service";
import {
  CreateInvoiceInput,
  InvoiceParams,
  InvoiceQuery,
  SendEmailInput,
  UpdateInvoiceStatusInput,
} from "./invoice.schema";
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

export const createInvoiceController = async (
  req: FastifyRequest<{ Body: CreateInvoiceInput }>,
  reply: FastifyReply
) => {
  try {
    const data = await invoiceService.createFromPurchaseOrder(getCurrentUser(req), req.body);
    return reply.code(201).send({ success: true, message: "Invoice generated successfully", data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const listInvoicesController = async (
  req: FastifyRequest<{ Querystring: InvoiceQuery }>,
  reply: FastifyReply
) => {
  try {
    const result = await invoiceService.list(getCurrentUser(req), req.query);
    return reply.code(200).send({ success: true, message: "Invoices retrieved", ...result });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const getInvoiceController = async (
  req: FastifyRequest<{ Params: InvoiceParams }>,
  reply: FastifyReply
) => {
  try {
    const data = await invoiceService.getById(getCurrentUser(req), req.params.id);
    return reply.code(200).send({ success: true, message: "Invoice retrieved", data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const updateInvoiceStatusController = async (
  req: FastifyRequest<{ Params: InvoiceParams; Body: UpdateInvoiceStatusInput }>,
  reply: FastifyReply
) => {
  try {
    const data = await invoiceService.updateStatus(getCurrentUser(req), req.params.id, req.body);
    return reply.code(200).send({ success: true, message: "Invoice status updated", data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const downloadInvoicePdfController = async (
  req: FastifyRequest<{ Params: InvoiceParams }>,
  reply: FastifyReply
) => {
  try {
    const { buffer, filename } = await invoiceService.generatePdf(getCurrentUser(req), req.params.id);
    return reply
      .type("application/pdf")
      .header("Content-Disposition", `inline; filename="${filename}"`)
      .send(buffer);
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const sendInvoiceEmailController = async (
  req: FastifyRequest<{ Params: InvoiceParams; Body: SendEmailInput }>,
  reply: FastifyReply
) => {
  try {
    const data = await invoiceService.sendEmail(getCurrentUser(req), req.params.id, req.body);
    return reply.code(200).send({ success: true, message: data.message, data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};
