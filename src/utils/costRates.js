const BASE_RATES = {
  parcel: {
    ["normal-delivery"]: {
      same: 60,
      outside: 110,
    },
    ["hub-delivery"]: {
      same: 40,
      outside: 80,
    },
    ["urgent-delivery"]: {
      same: 120,
      outside: 200,
    },
  },
  fragile: {
    ["normal-delivery"]: {
      same: 100,
      outside: 150,
    },
    ["hub-delivery"]: {
      same: 60,
      outside: 110,
    },
    ["urgent-delivery"]: {
      same: 150,
      outside: 250,
    },
  },
};

const PAYMENT_FEES = {
  ["hub-delivery"]: {
    cod: 30,
    prepaid: 20,
  },
  ["normal-delivery"]: {
    cod: 60,
    prepaid: 35,
  },
  ["urgent-delivery"]: {
    cod: 80,
    prepaid: 50,
  },
};

const EXTRA_WEIGHT_COST = 30;
const EXTRA_WEIGHT_LIMIT = 3;

module.exports = {
  BASE_RATES,
  EXTRA_WEIGHT_COST,
  PAYMENT_FEES,
  EXTRA_WEIGHT_LIMIT,
};
