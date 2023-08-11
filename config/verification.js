const jwt = require("jsonwebtoken");
const isAuthenticated = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json("Unauthorized Request");
  }

  const token = req.headers["authorization"].split(" ")[1];

  if (!token) {
    return res.status(401).json("No token provided.");
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decoded);
    req.user = decoded.id;
    next();
  } catch (err) {
    res.status(400).json("Invalid token.");
  }
};

module.exports = { isAuthenticated };
