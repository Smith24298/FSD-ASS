import { FastifyRequest, FastifyReply } from "fastify";
import { reportsService } from "./reports.service.js";
import { getCurrentUser } from "../../shared/middleware/auth.middleware.js";

export async function getAnalyticsController(req: FastifyRequest, reply: FastifyReply) {
  const user = getCurrentUser(req);
  const data = await reportsService.getAnalytics(user);
  return reply.status(200).send({ success: true, data });
}

export async function exportCsvController(req: FastifyRequest, reply: FastifyReply) {
  const user = getCurrentUser(req);
  const csv = await reportsService.exportCsv(user);
  return reply
    .status(200)
    .header("Content-Type", "text/csv")
    .header("Content-Disposition", "attachment; filename=\"procurement-report.csv\"")
    .send(csv);
}
