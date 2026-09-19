import { FastifyInstance } from "fastify";
import { authenticateUser, checkRole } from "../../shared/middleware/auth.middleware.js";
import { getAnalyticsController, exportCsvController } from "./reports.controller.js";

export default async function reportsRoutes(app: FastifyInstance) {
  app.get(
    "/reports/analytics",
    { preHandler: [authenticateUser, checkRole("ADMIN", "OFFICR", "MANAGER")] },
    getAnalyticsController
  );

  app.get(
    "/reports/export",
    { preHandler: [authenticateUser, checkRole("ADMIN", "OFFICR")] },
    exportCsvController
  );
}
