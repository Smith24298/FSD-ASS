import { FastifyReply, FastifyRequest } from "fastify";
import { authService } from "./auth.service";
import { RegisterBody, LoginBody } from "./auth.schema";
import { RegisterResponse, LoginResponse } from "./auth.types";

export const registerController = async (
  req: FastifyRequest<{ Body: RegisterBody }>,
  reply: FastifyReply
) => {
  try {
    const result = await authService.register(req.body);

    return reply.code(201).send({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      return reply.code(409).send({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    req.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Failed to create user",
    });
  }
};

export const loginController = async (
  req: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply
) => {
  try {
    const result = await authService.login(req.body);

    return reply.code(200).send({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
      return reply.code(401).send({
        success: false,
        message: "Invalid credentials",
      });
    }

    req.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Internal server error",
    });
  }
};