import { FastifyInstance } from "fastify";
import { rfqService } from "../../modules/rfq/rfq.service";

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Periodically enforces RFQ quotation deadlines and emits approaching-deadline
 * reminders. Deadline state is also enforced lazily on request, so this job is
 * a convenience rather than the sole source of correctness. It is safe to run
 * alongside multiple instances because both operations are idempotent
 * (reminders are de-duplicated by type + link in the notification repository).
 */
export function startRfqScheduler(
  app: FastifyInstance,
  intervalMs: number = DEFAULT_INTERVAL_MS
) {
  let running = false;

  const tick = async () => {
    if (running) {
      return;
    }
    running = true;
    try {
      await rfqService.runDeadlineProcessing();
      await rfqService.notifyUpcomingDeadlines();
    } catch (error) {
      app.log.error(error, "RFQ deadline scheduler tick failed");
    } finally {
      running = false;
    }
  };

  const timer = setInterval(() => {
    void tick();
  }, intervalMs);

  if (typeof timer.unref === "function") {
    timer.unref();
  }

  app.addHook("onClose", async () => {
    clearInterval(timer);
  });

  return timer;
}