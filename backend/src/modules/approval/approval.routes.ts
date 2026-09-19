import { FastifyInstance } from "fastify";
import { FastifyReply, FastifyRequest } from "fastify";
import { approvalService } from "./approval.service";
import {
  approveDecisionSchema,
  rejectDecisionSchema,
  createApprovalSchema,
  approvalParamsSchema,
  approvalQuerySchema,
  ApproveDecisionInput,
  RejectDecisionInput,
  CreateApprovalInput,
  ApprovalParams,
  ApprovalQuery,
} from "./approval.schema";
import {
  authenticateUser,
  checkRole,
  getCurrentUser,
  validate,
  validateParams,
  validateQuery,
} from "../../shared/middleware/auth.middleware";

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

export const createApprovalController = async (
  req: FastifyRequest<{ Body: CreateApprovalInput }>,
  reply: FastifyReply
) => {
  try {
    const data = await approvalService.create(getCurrentUser(req), req.body);
    return reply.code(201).send({ success: true, message: "Approval request created", data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const listApprovalsController = async (
  req: FastifyRequest<{ Querystring: ApprovalQuery }>,
  reply: FastifyReply
) => {
  try {
    const result = await approvalService.list(getCurrentUser(req), req.query);
    return reply.code(200).send({ success: true, message: "Approval requests retrieved", ...result });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const getApprovalController = async (
  req: FastifyRequest<{ Params: ApprovalParams }>,
  reply: FastifyReply
) => {
  try {
    const data = await approvalService.get(getCurrentUser(req), req.params.id);
    return reply.code(200).send({ success: true, message: "Approval request retrieved", data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const approveApprovalController = async (
  req: FastifyRequest<{ Params: ApprovalParams; Body: ApproveDecisionInput }>,
  reply: FastifyReply
) => {
  try {
    const data = await approvalService.approve(getCurrentUser(req), req.params.id, req.body);
    return reply.code(200).send({ success: true, message: "Approval request approved", data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const rejectApprovalController = async (
  req: FastifyRequest<{ Params: ApprovalParams; Body: RejectDecisionInput }>,
  reply: FastifyReply
) => {
  try {
    const data = await approvalService.reject(getCurrentUser(req), req.params.id, req.body);
    return reply.code(200).send({ success: true, message: "Approval request rejected", data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export default async function approvalRoutes(app: FastifyInstance) {
  app.post("/approvals", {
    preHandler: [
      authenticateUser,
      checkRole("OFFICR", "ADMIN"),
      validate(createApprovalSchema),
    ],
    handler: createApprovalController,
  });

  app.get("/approvals", {
    preHandler: [
      authenticateUser,
      checkRole("MANAGER", "ADMIN", "OFFICR"),
      validateQuery(approvalQuerySchema),
    ],
    handler: listApprovalsController,
  });

  app.get("/approvals/:id", {
    preHandler: [
      authenticateUser,
      checkRole("MANAGER", "ADMIN", "OFFICR"),
      validateParams(approvalParamsSchema),
    ],
    handler: getApprovalController,
  });

  app.post("/approvals/:id/approve", {
    preHandler: [
      authenticateUser,
      checkRole("MANAGER", "ADMIN"),
      validateParams(approvalParamsSchema),
      validate(approveDecisionSchema),
    ],
    handler: approveApprovalController,
  });

  app.post("/approvals/:id/reject", {
    preHandler: [
      authenticateUser,
      checkRole("MANAGER", "ADMIN"),
      validateParams(approvalParamsSchema),
      validate(rejectDecisionSchema),
    ],
    handler: rejectApprovalController,
  });
}