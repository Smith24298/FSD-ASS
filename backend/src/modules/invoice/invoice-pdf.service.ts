import PDFDocument from "pdfkit";

export interface InvoicePdfData {
  invoiceNumber: string;
  issueDate: Date;
  dueDate?: Date | null;
  status: string;
  poNumber: string;
  rfqNumber?: string | null;
  vendor: {
    name: string;
    email: string;
    companyName?: string | null;
    gstNumber?: string | null;
    address?: string | null;
    mobileNumber?: string | null;
  };
  items: Array<{
    name: string;
    description?: string | null;
    quantity: number;
    unit?: string | null;
    unitPrice: string;
    tax: string;
    subtotal: string;
    total: string;
  }>;
  subtotal: string;
  tax: string;
  total: string;
  notes?: string | null;
}

export function generateInvoicePdfBuffer(data: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const buffers: Buffer[] = [];

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err) => reject(err));

    // Header
    doc.fillColor("#1E3A8A").fontSize(22).font("Helvetica-Bold").text("VendorBridge ERP", 40, 40);
    doc.fillColor("#4B5563").fontSize(10).font("Helvetica").text("Procurement & Vendor Management ERP System", 40, 68);
    doc.text("Email: procurement@vendorbridge.local | Web: www.vendorbridge.local", 40, 82);

    // Invoice Meta Right-aligned
    doc.fillColor("#1E3A8A").fontSize(18).font("Helvetica-Bold").text("INVOICE", 400, 40, { align: "right" });
    doc.fillColor("#374151").fontSize(10).font("Helvetica");
    doc.text(`Invoice #: ${data.invoiceNumber}`, 400, 65, { align: "right" });
    doc.text(`Date: ${new Date(data.issueDate).toLocaleDateString()}`, 400, 79, { align: "right" });
    if (data.dueDate) {
      doc.text(`Due Date: ${new Date(data.dueDate).toLocaleDateString()}`, 400, 93, { align: "right" });
    }
    doc.text(`Status: ${data.status}`, 400, 107, { align: "right" });

    doc.moveTo(40, 130).lineTo(555, 130).strokeColor("#E5E7EB").stroke();

    // Bill To & Order Info Columns
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#1E3A8A").text("VENDOR / PAYEE DETAILS", 40, 145);
    doc.font("Helvetica").fontSize(9).fillColor("#374151");
    let y = 160;
    if (data.vendor.companyName) {
      doc.font("Helvetica-Bold").text(data.vendor.companyName, 40, y);
      doc.font("Helvetica");
      y += 14;
    }
    doc.text(`Contact: ${data.vendor.name}`, 40, y);
    y += 14;
    doc.text(`Email: ${data.vendor.email}`, 40, y);
    y += 14;
    if (data.vendor.mobileNumber) {
      doc.text(`Phone: ${data.vendor.mobileNumber}`, 40, y);
      y += 14;
    }
    if (data.vendor.gstNumber) {
      doc.text(`GSTIN: ${data.vendor.gstNumber}`, 40, y);
      y += 14;
    }
    if (data.vendor.address) {
      doc.text(`Address: ${data.vendor.address}`, 40, y, { width: 220 });
    }

    doc.fontSize(11).font("Helvetica-Bold").fillColor("#1E3A8A").text("ORDER DETAILS", 320, 145);
    doc.font("Helvetica").fontSize(9).fillColor("#374151");
    doc.text(`Purchase Order: ${data.poNumber}`, 320, 160);
    if (data.rfqNumber) {
      doc.text(`RFQ Reference: ${data.rfqNumber}`, 320, 174);
    }

    // Items Table
    const tableTop = 245;
    doc.rect(40, tableTop, 515, 22).fillColor("#F3F4F6").fill();
    doc.fillColor("#1F2937").font("Helvetica-Bold").fontSize(9);
    doc.text("#", 45, tableTop + 6, { width: 20 });
    doc.text("Item Description", 70, tableTop + 6, { width: 190 });
    doc.text("Qty", 265, tableTop + 6, { width: 40, align: "right" });
    doc.text("Unit Price", 310, tableTop + 6, { width: 65, align: "right" });
    doc.text("Tax", 380, tableTop + 6, { width: 55, align: "right" });
    doc.text("Total", 440, tableTop + 6, { width: 110, align: "right" });

    let currentY = tableTop + 26;
    doc.font("Helvetica").fontSize(9).fillColor("#374151");

    data.items.forEach((item, index) => {
      if (currentY > 700) {
        doc.addPage();
        currentY = 40;
      }

      const itemDesc = item.description ? `${item.name}\n${item.description}` : item.name;
      doc.text(String(index + 1), 45, currentY, { width: 20 });
      doc.text(itemDesc, 70, currentY, { width: 190 });
      doc.text(`${item.quantity} ${item.unit ?? ""}`, 265, currentY, { width: 40, align: "right" });
      doc.text(`₹${Number(item.unitPrice).toFixed(2)}`, 310, currentY, { width: 65, align: "right" });
      doc.text(`₹${Number(item.tax).toFixed(2)}`, 380, currentY, { width: 55, align: "right" });
      doc.text(`₹${Number(item.total).toFixed(2)}`, 440, currentY, { width: 110, align: "right" });

      currentY += 28;
      doc.moveTo(40, currentY - 6).lineTo(555, currentY - 6).strokeColor("#F3F4F6").stroke();
    });

    // Summary block
    const summaryY = Math.max(currentY + 15, 600);
    doc.moveTo(340, summaryY).lineTo(555, summaryY).strokeColor("#D1D5DB").stroke();

    doc.font("Helvetica").fontSize(9).fillColor("#4B5563");
    doc.text("Subtotal:", 340, summaryY + 8);
    doc.text(`₹${Number(data.subtotal).toFixed(2)}`, 440, summaryY + 8, { width: 110, align: "right" });

    doc.text("Total Tax (GST):", 340, summaryY + 24);
    doc.text(`₹${Number(data.tax).toFixed(2)}`, 440, summaryY + 24, { width: 110, align: "right" });

    doc.moveTo(340, summaryY + 40).lineTo(555, summaryY + 40).strokeColor("#D1D5DB").stroke();

    doc.font("Helvetica-Bold").fontSize(12).fillColor("#1E3A8A");
    doc.text("Grand Total:", 340, summaryY + 48);
    doc.text(`₹${Number(data.total).toFixed(2)}`, 440, summaryY + 48, { width: 110, align: "right" });

    if (data.notes) {
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#374151").text("Notes / Remarks:", 40, summaryY + 10);
      doc.font("Helvetica").fontSize(8).fillColor("#6B7280").text(data.notes, 40, summaryY + 25, { width: 280 });
    }

    // Footer
    doc.fontSize(8).fillColor("#9CA3AF").text(
      "Thank you for your business. This is a computer-generated procurement invoice.",
      40,
      760,
      { align: "center", width: 515 }
    );

    doc.end();
  });
}
