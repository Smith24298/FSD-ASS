import Fastify from "fastify";
import { registerRoutes } from "./routes";
import { errorHandler } from "../shared/errors/error-handler";
import { startRfqScheduler } from "../infrastructure/scheduler/rfq-scheduler";

export async function createApp() {
  const app = Fastify({
    logger: true,
  });

  app.setErrorHandler(errorHandler);

  await registerRoutes(app);

  startRfqScheduler(app);

  return app;
}