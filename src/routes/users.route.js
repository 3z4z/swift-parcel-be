const express = require("express");
const verifyAuthToken = require("../middlewares/auth");
const verifyAdmin = require("../middlewares/admin");
const admin = require("firebase-admin");

const userRoute = ({ usersCollection, ObjectId }) => {
  const router = express.Router();

  // cookie generate
  router.post("/login", async (req, res) => {
    const expiresIn = 5 * 24 * 60 * 60 * 1000;
    try {
      const { idToken } = req.body;
      if (!idToken)
        return res.status(400).send({ message: "Token is required" });
      const sessionCookie = await admin
        .auth()
        .createSessionCookie(idToken, { expiresIn });
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const email = decodedToken.email;
      res.cookie("access-token", sessionCookie, {
        httpOnly: true,
        maxAge: expiresIn,

        // --- Local ---
        secure: false,
        sameSite: "lax",

        // --- Prod ---
        // sameSite: 'none',
        // secure: true,
      });
      res.send({ message: "Log in successful!", email });
    } catch (err) {
      console.log(err);
      res.status(401).send({ message: "Invalid token!" });
    }
  });

  // clear session token
  router.post("/logout", async (_, res) => {
    res.clearCookie("access-token");
    res.send({ message: "Successfully logged out!" });
  });

  router.post("/", async (req, res) => {
    const userInfo = req.body;
    const isExistedUser = await usersCollection.findOne({
      email: userInfo.email,
    });
    if (isExistedUser) return res.send({ message: "User already exists!" });
    const newUser = {
      ...userInfo,
      status: "pending",
      role: userInfo?.role || "user",
      createdAt: new Date(),
    };
    const result = await usersCollection.insertOne(newUser);
    res.send(result);
  });

  router.get("/", verifyAuthToken, verifyAdmin, async (req, res) => {
    const { role } = req.query;
    const query = {};
    if (role) {
      query.role = role;
    }
    const result = await usersCollection.find(query).toArray();
    return res.send(result);
  });

  router.get("/:email/role", async (req, res) => {
    const { email } = req.params;
    const user = await usersCollection.findOne({ email: email });
    if (!user) {
      return res.status(404).send({ role: "user" });
    }
    return res.send(user.role);
  });

  router.get("/:email/status", async (req, res) => {
    const { email } = req.params;
    const user = await usersCollection.findOne({ email: email });
    if (!user) {
      return;
    }
    return res.send(user.status);
  });

  router.patch("/:id", async (req, res) => {
    try {
      const { status } = req.body;
      await usersCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        {
          $set: {
            status,
          },
        }
      );
      return res.send({ message: `User ${status}!` });
    } catch {
      res.status(500).send({ message: "Network error" });
    }
  });

  return router;
};

module.exports = userRoute;
