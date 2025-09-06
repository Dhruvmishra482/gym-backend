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

// // Logging middleware
// app.use((req, res, next) => {
//   console.log("Request:", req.method, req.originalUrl);
//   next();
// });

// Route setup
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/member", memberRoutes);
app.use("/api/v1/owner", ownerRoutes);
app.use("/api/v1", contactRoutes);

// // Health check endpoint
// app.get("/health", (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: "Server is running",
//     timestamp: new Date().toISOString(),
//     endpoints: {
//       auth: "/api/v1/auth",
//       members: "/api/v1/member",
//       owner: "/api/v1/owner",
//       contact: "/api/v1/contact"
//     }
//   });
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error("Error occurred:", err);
//   res.status(500).json({
//     success: false,
//     message: "Internal server error",
//     error: process.env.NODE_ENV === 'development' ? err.message : undefined
//   });
// });

// // 404 handler for undefined routes
// app.use("*", (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: `Route ${req.originalUrl} not found`
//   });
// });

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Contact form: http://localhost:${PORT}/api/v1/contact`);
  console.log("All routes loaded successfully");
});

module.exports = app;