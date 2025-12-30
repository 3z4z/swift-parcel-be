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
  router.get("/analytics", verifyAuthToken, verifyAdmin, async (_, res) => {
    const result = await parcelsCollection
      .aggregate([
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  {
                    case: { $eq: ["$parcelMovementStatus", "pending"] },
                    then: "pending",
                  },
                  {
                    case: {
                      $in: [
                        "$parcelMovementStatus",
                        [
                          "assigned",
                          "picked",
                          "to-central",
                          "assigned-to-deliver",
                          "going-to-receiver",
                        ],
                      ],
                    },
                    then: "assigned",
                  },
                  {
                    case: { $eq: ["$parcelMovementStatus", "delivered"] },
                    then: "delivered",
                  },
                  {
                    case: { $eq: ["$parcelMovementStatus", "cancelled"] },
                    then: "cancelled",
                  },
                ],
                default: "others",
              },
            },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();
    res.send(result);
  });
  router.get("/analytics/cod", verifyAuthToken, verifyAdmin, async (_, res) => {
    const result = await parcelsCollection
      .aggregate([
        {
          $match: {
            parcelMovementStatus: "delivered",
            paymentStatus: "cod",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$parcelCost" },
          },
        },
      ])
      .toArray();
    res.send(result);
  });
  router.get("/analytics/daily-orders", verifyAuthToken, async (_, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 6);

    const result = await parcelsCollection
      .aggregate([
        {
          $match: {
            createdAt: { $gte: lastWeek, $lte: new Date() },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();
    const finalResult = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(lastWeek);
      d.setDate(lastWeek.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const found = result.find((r) => r._id === key);
      finalResult.unshift({
        date: key,
        count: found ? found.count : 0,
      });
    }

    res.send(finalResult);
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
  router.get("/analytics/:email", verifyAuthToken, async (req, res) => {
    const { email } = req.params;
    const result = await parcelsCollection
      .aggregate([
        {
          $match: { senderEmail: email },
        },
        {
          $group: {
            _id: null,
            pending: {
              $sum: {
                $cond: [{ $eq: ["$parcelMovementStatus", "pending"] }, 1, 0],
              },
            },
            delivered: {
              $sum: {
                $cond: [{ $eq: ["$parcelMovementStatus", "delivered"] }, 1, 0],
              },
            },
            cancelled: {
              $sum: {
                $cond: [{ $eq: ["$parcelMovementStatus", "cancelled"] }, 1, 0],
              },
            },
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            pending: 1,
            delivered: 1,
            cancelled: 1,
            total: 1,
          },
        },
      ])
      .toArray();
    res.send(result[0] || { pending: 0, delivered: 0, cancelled: 0, total: 0 });
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
