const express = require("express");
const verifyAuthToken = require("../middlewares/auth");

const trackingRoute = ({ trackingsCollection, ObjectId }) => {
  const router = express.Router();
  router.get("/", verifyAuthToken, async (req, res) => {
    const { trackingId } = req.query;
    const query = {};
    if (trackingId) {
      query.trackingId = trackingId;
    }
    const result = await trackingsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    res.send(result);
  });
  router.get("/last-location", verifyAuthToken, async (req, res) => {
    const { trackingId } = req.query;
    const query = {};
    if (trackingId) {
      query.trackingId = trackingId;
    }
    const result = await trackingsCollection
      .find(query)
      .limit(1)
      .sort({ createdAt: -1 })
      .toArray();
    res.send(result);
  });
  return router;
};

module.exports = trackingRoute;
