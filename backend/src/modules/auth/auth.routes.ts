import { FastifyInstance } from "fastify";
import { registerSchema, loginSchema } from "./auth.schema";
import { validate } from "../../shared/middleware/auth.middleware";
import { registerController, loginController } from "./auth.controller";

export default async function authRoutes(app: FastifyInstance) {
  app.post("/register", {
    preHandler: [validate(registerSchema)],
    handler: registerController,
  });

  app.post("/login", {
    preHandler: [validate(loginSchema)],
    handler: loginController,
  });
}