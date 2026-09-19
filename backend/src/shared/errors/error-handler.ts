import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "./app-error";

export const errorHandler = async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
  request.log.error(error);

  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      success: false,
      message: error.message,
      code: error.code,
    });
  }

  if (error.code === "P2002") {
    const target = (error as any).meta?.target;
    if (target?.includes("email")) {
      return reply.code(409).send({
        success: false,
        message: "Email already exists",
      });
    }
    if (target?.includes("userName")) {
      return reply.code(409).send({
        success: false,
        message: "Username already exists",
      });
    }
    return reply.code(409).send({
      success: false,
      message: "Resource already exists",
    });
  }

  if (error.code === "P2025") {
    return reply.code(404).send({
      success: false,
      message: "Resource not found",
    });
  }

  return reply.code(500).send({
    success: false,
    message: "Internal server error",
  });
};