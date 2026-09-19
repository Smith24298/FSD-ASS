import { FastifyReply, FastifyRequest } from "fastify";
import { purchaseOrderService } from "./purchase-order.service";
import {
  CreatePurchaseOrderInput,
  PurchaseOrderParams,
  PurchaseOrderQuery,
  UpdatePoStatusInput,
} from "./purchase-order.schema";
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

export const createPurchaseOrderController = async (
  req: FastifyRequest<{ Body: CreatePurchaseOrderInput }>,
  reply: FastifyReply
) => {
  try {
    const data = await purchaseOrderService.createFromQuotation(getCurrentUser(req), req.body);
    return reply.code(201).send({ success: true, message: "Purchase Order created successfully", data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const listPurchaseOrdersController = async (
  req: FastifyRequest<{ Querystring: PurchaseOrderQuery }>,
  reply: FastifyReply
) => {
  try {
    const result = await purchaseOrderService.list(getCurrentUser(req), req.query);
    return reply.code(200).send({ success: true, message: "Purchase Orders retrieved", ...result });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const getPurchaseOrderController = async (
  req: FastifyRequest<{ Params: PurchaseOrderParams }>,
  reply: FastifyReply
) => {
  try {
    const data = await purchaseOrderService.getById(getCurrentUser(req), req.params.id);
    return reply.code(200).send({ success: true, message: "Purchase Order retrieved", data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const updatePoStatusController = async (
  req: FastifyRequest<{ Params: PurchaseOrderParams; Body: UpdatePoStatusInput }>,
  reply: FastifyReply
) => {
  try {
    const data = await purchaseOrderService.updateStatus(getCurrentUser(req), req.params.id, req.body);
    return reply.code(200).send({ success: true, message: "Purchase Order status updated", data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};
