import { FastifyInstance } from "fastify";
import { authenticateUser, checkRole, validate, validateParams, validateQuery } from "../../shared/middleware/auth.middleware";
import { createUserSchema, updateUserSchema, userParamsSchema, userQuerySchema } from "./user.schema";
import {
  createUserController,
  getUsersController,
  getUserController,
  updateUserController,
  deleteUserController,
} from "./user.controller";

export default async function userRoutes(app: FastifyInstance) {
  app.post("/users", {
    preHandler: [
      authenticateUser,
      checkRole("ADMIN"),
      validate(createUserSchema),
    ],
    handler: createUserController,
  });

  app.get("/users", {
    preHandler: [
      authenticateUser,
      checkRole("ADMIN"),
      validateQuery(userQuerySchema),
    ],
    handler: getUsersController,
  });

  app.get("/users/:id", {
    preHandler: [
      authenticateUser,
      checkRole("ADMIN"),
      validateParams(userParamsSchema),
    ],
    handler: getUserController,
  });

  app.patch("/users/:id", {
    preHandler: [
      authenticateUser,
      checkRole("ADMIN"),
      validateParams(userParamsSchema),
      validate(updateUserSchema),
    ],
    handler: updateUserController,
  });

  app.delete("/users/:id", {
    preHandler: [
      authenticateUser,
      checkRole("ADMIN"),
      validateParams(userParamsSchema),
    ],
    handler: deleteUserController,
  });
}