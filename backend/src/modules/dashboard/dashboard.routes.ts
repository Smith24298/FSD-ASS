import { FastifyInstance } from "fastify";
import { authenticateUser } from "../../shared/middleware/auth.middleware";
import { getDashboardStatsController } from "./dashboard.controller";

export default async function dashboardRoutes(app: FastifyInstance) {
  app.get("/dashboard/stats", {
    preHandler: [authenticateUser],
    handler: getDashboardStatsController,
  });
}
