const logTracking = async (
  req,
  orderId,
  trackingId,
  deliveryStatus,
  details,
  location
) => {
  try {
    const trackingsCollection = req.app.locals.trackingsCollection;
    const log = {
      orderId,
      trackingId,
      deliveryStatus,
      details: details || deliveryStatus.split("_").join(" "),
      createdAt: new Date(),
      location: location ? location : {},
    };
    const result = await trackingsCollection.insertOne(log);
    return result;
  } catch (err) {
    console.log(err);
  }
};

module.exports = logTracking;
