const {
  BASE_RATES,
  PAYMENT_FEES,
  EXTRA_WEIGHT_COST,
  EXTRA_WEIGHT_LIMIT,
} = require("./costRates");

const calculateCost = (parcel) => {
  const {
    productType,
    deliveryType,
    paymentType,
    pickupDistrict,
    recipientDistrict,
    parcelWeight,
  } = parcel;
  let deliveryLocation = "same";
  if (pickupDistrict === recipientDistrict) {
    deliveryLocation = "same";
  } else {
    deliveryLocation = "outside";
  }
  const baseRate = BASE_RATES[productType][deliveryType][deliveryLocation];
  const paymentFee = PAYMENT_FEES[deliveryType][paymentType];
  const weightCharge =
    parcelWeight >= EXTRA_WEIGHT_LIMIT
      ? EXTRA_WEIGHT_COST * (parcelWeight - EXTRA_WEIGHT_LIMIT)
      : 0;
  const finalCost = baseRate + paymentFee + weightCharge;
  return finalCost;
};

module.exports = calculateCost;
