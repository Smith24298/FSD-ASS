import { FastifyReply, FastifyRequest } from "fastify";
import { userService } from "./user.service";
import { CreateUserInput, UpdateUserInput, UserParams, UserQuery } from "./user.schema";

export const createUserController = async (
  req: FastifyRequest<{ Body: CreateUserInput }>,
  reply: FastifyReply
) => {
  try {
    const user = await userService.createUser(req.body);

    return reply.code(201).send({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
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

export const getUsersController = async (
  req: FastifyRequest<{ Querystring: UserQuery }>,
  reply: FastifyReply
) => {
  try {
    const result = await userService.getUsers(req.query);

    return reply.code(200).send({
      success: true,
      message: "Users retrieved successfully",
      ...result,
    });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Failed to retrieve users",
    });
  }
};

export const getUserController = async (
  req: FastifyRequest<{ Params: UserParams }>,
  reply: FastifyReply
) => {
  try {
    const user = await userService.getUserById(req.params.id);

    if (!user) {
      return reply.code(404).send({
        success: false,
        message: "User not found",
      });
    }

    return reply.code(200).send({
      success: true,
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Failed to retrieve user",
    });
  }
};

export const updateUserController = async (
  req: FastifyRequest<{ Params: UserParams; Body: UpdateUserInput }>,
  reply: FastifyReply
) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);

    if (!user) {
      return reply.code(404).send({
        success: false,
        message: "User not found",
      });
    }

    return reply.code(200).send({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
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
        message: "User with this email or username already exists",
      });
    }

    req.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Failed to update user",
    });
  }
};

export const deleteUserController = async (
  req: FastifyRequest<{ Params: UserParams }>,
  reply: FastifyReply
) => {
  try {
    const deleted = await userService.deleteUser(req.params.id);

    if (!deleted) {
      return reply.code(404).send({
        success: false,
        message: "User not found",
      });
    }

    return reply.code(200).send({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Failed to delete user",
    });
  }
};