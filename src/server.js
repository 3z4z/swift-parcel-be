const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

// socket integration
const http = require("http");
const { Server } = require("socket.io");

const app = express();
dotenv.config();

// server create for socket
const server = http.createServer(app);

// socket setup
const io = new Server(server, {
  cors: {
    origin: [process.env.SITE_DOMAIN, "http://localhost:5173"],
    credentials: true,
  },
});

// client connection
io.on("connection", (socket) => {
  console.log("Client connected", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

app.set("io", io);

app.use(
  cors({
    origin: [process.env.SITE_DOMAIN, "http://localhost:5173"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

const { connectDB } = require("./configs/db");
const userRoute = require("./routes/users.route");
const parcelRoute = require("./routes/parcels.route");
const trackingRoute = require("./routes/trackings.route");

const port = process.env.PORT || 3000;

async function startServer() {
  const collections = await connectDB();
  app.locals.usersCollection = collections.usersCollection;
  app.locals.trackingsCollection = collections.trackingsCollection;

  app.get("/", async (_, res) => {
    res.send("Server is running");
  });

  app.use("/users", userRoute(collections));
  app.use("/parcels", parcelRoute(collections));
  app.use("/trackings", trackingRoute(collections));

  server.listen(port, () => {
    console.log(`Server + Socket.IO running at http://localhost:${port}`);
  });
}

startServer().catch(console.dir);
