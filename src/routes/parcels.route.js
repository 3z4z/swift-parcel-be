const express = require("express");
const calculateCost = require("../utils/calculateCost");
const verifyAuthToken = require("../middlewares/auth");
const generateTrackingId = require("../utils/tracking");
const logTracking = require("../utils/logTracking");
const verifyAdmin = require("../middlewares/admin");
const sendEmail = require("../utils/sendEmail");

const parcelRoute = ({ parcelsCollection, ObjectId }) => {
  const router = express.Router();

  router.get("/", verifyAuthToken, async (req, res) => {
    const { email, riderEmail } = req.query;
    const query = {};
    if (email) {
      query.senderEmail = email;
    }
    if (riderEmail) {
      query.$or = [
        { "pickupRider.riderEmail": riderEmail },
        { "deliveryRider.riderEmail": riderEmail },
      ];
    }
    const result = await parcelsCollection.find(query).toArray();
    res.send(result);
  });
  router.post("/cost-calculation", verifyAuthToken, (req, res) => {
    const parcelInfo = req.body;
    const cost = calculateCost(parcelInfo);
    return res.send(cost);
  });
  router.post("/", verifyAuthToken, async (req, res) => {
    try {
      const parcelInfo = req.body;
      const serverCalculatedCost = await calculateCost(parcelInfo);
      const newBooking = {
        ...parcelInfo,
        trackingId: generateTrackingId(parcelInfo.paymentType),
        parcelCost: serverCalculatedCost,
        createdAt: new Date(),
      };
      const result = await parcelsCollection.insertOne(newBooking);
      logTracking(
        req,
        result.insertedId.toString(),
        newBooking.trackingId,
        parcelInfo.deliveryStatus,
        "Parcel has been booked",
        parcelInfo?.location
      );
      return res.status(201).send({ message: "Booking added successfully!" });
    } catch {
      return res.status(500).send({ message: "Something went wrong!" });
    }
  });
  router.get("/:id", verifyAuthToken, async (req, res) => {
    const result = await parcelsCollection.findOne({
      _id: new ObjectId(req.params.id),
    });
    return res.send(result);
  });
  router.patch("/:id", verifyAuthToken, async (req, res) => {
    const io = req.app.get("io");
    const {
      senderEmail,
      parcelMovementStatus,
      trackingId,
      details,
      location,
      pickupRider,
      deliveryRider,
    } = req.body;
    console.log("pickupRider", pickupRider, deliveryRider);
    const updateDoc = {
      $set: {
        parcelMovementStatus,
        ...(pickupRider && { pickupRider }),
        ...(deliveryRider && { deliveryRider }),
      },
    };
    const result = await parcelsCollection.updateOne(
      {
        _id: new ObjectId(req.params.id),
      },
      updateDoc
    );
    logTracking(
      req,
      req.params.id.toString(),
      trackingId,
      parcelMovementStatus,
      details,
      location
    );
    io.to(senderEmail).emit("parcel-update", {
      trackingId,
      details,
      timestamp: new Date(),
    });
    if (parcelMovementStatus === "picked") {
      sendEmail({
        to: senderEmail,
        subject: `Your parcel has been picked`,
        html: `Parcel has been picked up by ${pickupRider.riderName}. Tracking ID: ${trackingId}`,
      });
    }
    if (parcelMovementStatus === "delivered") {
      sendEmail({
        to: senderEmail,
        subject: `Your parcel has been delivered.`,
        html: `Parcel has been delivered by ${deliveryRider.riderName}. Tracking ID: ${trackingId}`,
      });
    }
    return res.send(result);
  });
  router.patch(
    "/:id/cancel",
    verifyAuthToken,
    verifyAdmin,
    async (req, res) => {
      const io = req.app.get("io");
      const { senderEmail, trackingId, location } = req.body;
      const updateDoc = {
        $set: {
          cancelled: true,
          parcelMovementStatus: "cancelled",
        },
      };
      const result = await parcelsCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        updateDoc
      );
      logTracking(
        req,
        req.params.id.toString(),
        trackingId,
        "cancelled",
        "Order has been cancelled by an Admin",
        location
      );

      io.to(senderEmail).emit("order-cancel", {
        trackingId,
        details: "Order has been cancelled by an Admin",
        timestamp: new Date(),
      });
      res.send(result);
    }
  );
  return router;
};

module.exports = parcelRoute;
