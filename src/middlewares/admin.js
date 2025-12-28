const verifyAdmin = async (req, res, next) => {
  const allowedRoles = ["admin", "super admin"];
  const usersCollection = req.app.locals.usersCollection;
  const email = req.auth_email;
  const query = { email };
  const user = await usersCollection.findOne(query);
  if (!user || !allowedRoles.includes((user?.role || "").toLowerCase())) {
    return res.status(403).send({ message: "forbidden access" });
  }
  next();
};

module.exports = verifyAdmin;
