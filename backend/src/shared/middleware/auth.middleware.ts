import { FastifyRequest, FastifyReply } from "fastify";
import { ZodType } from "zod";
import { verifyToken } from "../../infrastructure/auth/jwt";
import { JWTPayload } from "jose";
import { SafeUser, Role } from "../types/index.js";

declare module "fastify" {
  interface FastifyRequest {
    user: JWTPayload;
  }
}

interface AuthClaims {
  userId?: number;
  organizationId?: number;
  email?: string;
  userName?: string;
  name?: string;
  role?: Role;
}

export const getCurrentUser = (request: FastifyRequest): SafeUser => {
  const claims = request.user as unknown as AuthClaims;
  return {
    id: claims.userId ?? 0,
    organizationId: claims.organizationId ?? 0,
    email: claims.email ?? "",
    userName: claims.userName ?? "",
    name: claims.name ?? claims.userName ?? "",
    role: claims.role ?? "VENDOR",
    isActive: true,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
};

export const validate = (schema: ZodType) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      return reply.code(400).send({
        message: "Validation failed",
        errors: result.error.issues,
      });
    }

    request.body = result.data;
  };
};

export const authenticateUser = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return reply.code(401).send({
        message: "Authorization header is missing",
      });
    }
    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      return reply.code(401).send({
        message: "Invalid authorization format",
      });
    }
    const { payload } = await verifyToken(token);
    request.user = payload;
  } catch (error) {
    return reply.code(401).send({
      message: "Invalid or expired token",
    });
  }
};

export const checkRole = (...allowedRoles: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userRole = (request.user as any)?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return reply.code(403).send({
        message: "Forbidden: Insufficient permissions",
      });
    }
  };
};

export const validateParams = (schema: ZodType) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const result = schema.safeParse(request.params);

    if (!result.success) {
      return reply.code(400).send({
        message: "Validation failed",
        errors: result.error.issues,
      });
    }

    request.params = result.data;
  };
};

export const validateQuery = (schema: ZodType) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const result = schema.safeParse(request.query);

    if (!result.success) {
      return reply.code(400).send({
        message: "Validation failed",
        errors: result.error.issues,
      });
    }

    request.query = result.data;
  };
};
