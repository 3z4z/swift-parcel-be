const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db, usersCollection, parcelsCollection, trackingsCollection;

const connectDB = async () => {
  try {
    await client.connect();
    console.log("Successfully connected to DB!");
    db = client.db("swiftParcelDB");
    usersCollection = db.collection("users");
    parcelsCollection = db.collection("parcels");
    trackingsCollection = db.collection("trackings");
    return {
      usersCollection,
      parcelsCollection,
      trackingsCollection,
      ObjectId,
    };
  } catch {
    console.log("MongoDb connection failed!");
    process.exit(1);
  }
};

module.exports = { connectDB, ObjectId };
