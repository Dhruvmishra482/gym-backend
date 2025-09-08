const express = require("express");
const app = express();
const database = require("./config/db");
const cookieParser = require('cookie-parser');
const cors = require("cors");
require("dotenv").config();

// Route imports
const authRoutes = require("./routes/authRoutes");
const memberRoutes = require("./routes/memberRoutes");
const ownerRoutes = require("./routes/ownerProfileRoutes");
const contactRoutes = require("./routes/dashboardRoutes");
// Route imports - NEW: Payment routes
const paymentRoutes = require("./routes/paymentRoutes");

// Initialize reminder scheduler
require("./utils/reminderScheduler");

// Connect to database
database.connect();

// Middleware setup
app.use(express.json());
app.use(cookieParser());

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      // process.env.FRONT_END_URL
    ],
    credentials: true,
  })
);



// Route setup
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/member", memberRoutes);
app.use("/api/v1/owner", ownerRoutes);
app.use("/api/v1", contactRoutes);
app.use("/api/v1/payment", paymentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Contact form: http://localhost:${PORT}/api/v1/contact`);
  console.log("All routes loaded successfully");
});

module.exports = app;