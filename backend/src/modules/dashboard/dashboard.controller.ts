import { FastifyReply, FastifyRequest } from "fastify";
import { dashboardService } from "./dashboard.service";
import { getCurrentUser } from "../../shared/middleware/auth.middleware";

export const getDashboardStatsController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const data = await dashboardService.getStats(getCurrentUser(req));
    return reply.code(200).send({ success: true, message: "Dashboard stats retrieved", data });
  } catch (error: any) {
    req.log.error(error);
    return reply.code(500).send({ success: false, message: "Internal server error" });
  }
};
