const express = require("express");
const PDFDocument = require("pdfkit");
const getDateRange = require("../utils/getDateRage");
const path = require("path");
const verifyAuthToken = require("../middlewares/auth");
const verifyAdmin = require("../middlewares/admin");

const exportsRoute = ({ parcelsCollection }) => {
  const router = express.Router();
  router.get("/csv", verifyAuthToken, verifyAdmin, async (req, res) => {
    const { filter } = req.query;
    const { start, end } = getDateRange(filter);

    const parcels = await parcelsCollection
      .find({
        createdAt: { $gte: start, $lte: end },
      })
      .toArray();

    const header = "\uFEFFtrackingId,status,cod Amount,sender,receiver,date\n";
    const rows = parcels
      .map(
        (p) =>
          `${p.trackingId},${p.parcelMovementStatus},${p.parcelCost},${p.senderName},${p.recipientName},${p.createdAt}`
      )
      .join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=SwiftParcel_order_report_${filter}.csv`
    );
    res.send(header + rows);
  });
  router.get("/pdf", verifyAuthToken, verifyAdmin, async (req, res) => {
    const { filter } = req.query;
    const { start, end } = getDateRange(filter);

    const parcels = await parcelsCollection
      .find({
        createdAt: { $gte: start, $lte: end },
      })
      .toArray();

    const doc = new PDFDocument({ margin: 30 });
    doc.registerFont(
      "TiroBangla",
      path.resolve(__dirname, "../fonts/tiro-bangla-reg.ttf")
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=SwiftParcel_order_report_${filter}.pdf`
    );
    doc.pipe(res);
    doc
      .font("TiroBangla")
      .fontSize(14)
      .text(`Parcel Report (${filter})`, { underline: true });
    doc.moveDown();

    parcels.forEach((p, i) => {
      doc
        .fontSize(10)
        .text(
          `${i + 1}. Tracking ID: ${p.trackingId} | Status: ${
            p.parcelMovementStatus
          } | Sender: ${p.senderName} | Receiver: ${p.recipientName}`
        );
      doc.moveDown(0.5);
    });
    doc.end();
  });
  return router;
};

module.exports = exportsRoute;
