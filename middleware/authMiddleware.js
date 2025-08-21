const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.auth = async (req, res, next) => {
  try {
    const token =
      req.cookies.token ||
      req.body.token ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing, login first",
      });
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong in auth middleware",
    });
  }
};

exports.isOwner = (req, res, next) => {
  if (req.user.role !== "owner") {
    return res.status(403).json({
      success: false,
      message: "Access Denied: Gym owners only",
    });
  }
  next();
};
