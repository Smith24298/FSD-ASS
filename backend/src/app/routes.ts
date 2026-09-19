import { FastifyInstance } from "fastify";
import authRoutes from "../modules/auth/auth.routes";
import userRoutes from "../modules/user/user.routes";
import employeeRoutes from "../modules/employee/employee.routes";
import rfqRoutes from "../modules/rfq/rfq.routes";
import quotationRoutes from "../modules/quotation/quotation.routes";
import approvalRoutes from "../modules/approval/approval.routes";
import notificationRoutes from "../modules/notification/notification.routes";
import vendorRoutes from "../modules/vendor/vendor.routes";
import purchaseOrderRoutes from "../modules/purchase-order/purchase-order.routes";
import invoiceRoutes from "../modules/invoice/invoice.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";
import reportsRoutes from "../modules/reports/reports.routes";

export async function registerRoutes(app: FastifyInstance) {
  app.register(authRoutes, {
    prefix: "/api/auth",
  });

  app.register(userRoutes, {
    prefix: "/api",
  });

  app.register(employeeRoutes, {
    prefix: "/api",
  });

  app.register(rfqRoutes, {
    prefix: "/api",
  });

  app.register(quotationRoutes, {
    prefix: "/api",
  });

  app.register(approvalRoutes, {
    prefix: "/api",
  });

  app.register(notificationRoutes, {
    prefix: "/api",
  });

  app.register(vendorRoutes, {
    prefix: "/api",
  });

  app.register(purchaseOrderRoutes, {
    prefix: "/api",
  });

  app.register(invoiceRoutes, {
    prefix: "/api",
  });

  app.register(dashboardRoutes, {
    prefix: "/api",
  });

  app.register(reportsRoutes, {
    prefix: "/api",
  });
}