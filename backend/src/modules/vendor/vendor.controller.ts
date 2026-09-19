import { FastifyReply, FastifyRequest } from "fastify";
import { vendorService } from "./vendor.service";
import {
  CreateVendorInput,
  UpdateVendorInput,
  UpdateVendorStatusInput,
  VendorParams,
  VendorQuery,
} from "./vendor.schema";
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

export const listVendorsController = async (
  req: FastifyRequest<{ Querystring: VendorQuery }>,
  reply: FastifyReply
) => {
  try {
    const result = await vendorService.list(getCurrentUser(req), req.query);
    return reply.code(200).send({ success: true, message: "Vendors retrieved", ...result });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const getVendorController = async (
  req: FastifyRequest<{ Params: VendorParams }>,
  reply: FastifyReply
) => {
  try {
    const data = await vendorService.getById(getCurrentUser(req), req.params.id);
    return reply.code(200).send({ success: true, message: "Vendor details retrieved", data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const createVendorController = async (
  req: FastifyRequest<{ Body: CreateVendorInput }>,
  reply: FastifyReply
) => {
  try {
    const data = await vendorService.create(getCurrentUser(req), req.body);
    return reply.code(201).send({ success: true, message: "Vendor created successfully", data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const updateVendorController = async (
  req: FastifyRequest<{ Params: VendorParams; Body: UpdateVendorInput }>,
  reply: FastifyReply
) => {
  try {
    const data = await vendorService.update(getCurrentUser(req), req.params.id, req.body);
    return reply.code(200).send({ success: true, message: "Vendor updated successfully", data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};

export const updateVendorStatusController = async (
  req: FastifyRequest<{ Params: VendorParams; Body: UpdateVendorStatusInput }>,
  reply: FastifyReply
) => {
  try {
    const data = await vendorService.updateStatus(getCurrentUser(req), req.params.id, req.body);
    return reply.code(200).send({ success: true, message: "Vendor status updated", data });
  } catch (error) {
    req.log.error(error);
    return handleError(error, reply);
  }
};
