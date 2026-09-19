import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedLayout } from "./components/Layout";

// Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Vendors from "./pages/Vendors";
import VendorDetail from "./pages/VendorDetail";
import RFQs from "./pages/RFQs";
import RFQCreate from "./pages/RFQCreate";
import RFQDetail from "./pages/RFQDetail";
import QuotationCompare from "./pages/QuotationCompare";
import Quotations from "./pages/Quotations";
import QuotationSubmit from "./pages/QuotationSubmit";
import QuotationDetail from "./pages/QuotationDetail";
import Approvals from "./pages/Approvals";
import ApprovalDetail from "./pages/ApprovalDetail";
import PurchaseOrders from "./pages/PurchaseOrders";
import PurchaseOrderDetail from "./pages/PurchaseOrderDetail";
import Invoices from "./pages/Invoices";
import InvoiceDetail from "./pages/InvoiceDetail";
import ActivityTimeline from "./pages/ActivityTimeline";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected ERP Layout */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Vendor Management */}
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/vendors/:id" element={<VendorDetail />} />

            {/* RFQ Management */}
            <Route path="/rfqs" element={<RFQs />} />
            <Route path="/rfqs/create" element={<RFQCreate />} />
            <Route path="/rfqs/:id" element={<RFQDetail />} />
            <Route path="/rfqs/:rfqId/compare" element={<QuotationCompare />} />

            {/* Quotations */}
            <Route path="/quotations" element={<Quotations />} />
            <Route path="/rfqs/:rfqId/quote" element={<QuotationSubmit />} />
            <Route
              path="/quotations/submit/:rfqId"
              element={<QuotationSubmit />}
            />
            <Route path="/quotations/:id" element={<QuotationDetail />} />

            {/* Approvals */}
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/approvals/:id" element={<ApprovalDetail />} />

            {/* Purchase Orders */}
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route
              path="/purchase-orders/:id"
              element={<PurchaseOrderDetail />}
            />

            {/* Invoices */}
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />

            {/* Timeline & Audit Log */}
            <Route path="/activity" element={<ActivityTimeline />} />

            {/* Analytics & Reports */}
            <Route path="/reports" element={<Reports />} />

            {/* Notifications */}
            <Route path="/notifications" element={<Notifications />} />

            {/* Fallback */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
