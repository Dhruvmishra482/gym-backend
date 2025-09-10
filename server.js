// const express = require("express");
// const app = express();
// const database = require("./config/db");
// const cookieParser = require('cookie-parser');
// const cors = require("cors");
// require("dotenv").config();

// // Route imports
// const authRoutes = require("./routes/authRoutes");
// const memberRoutes = require("./routes/memberRoutes");
// const ownerRoutes = require("./routes/ownerProfileRoutes");
// const contactRoutes = require("./routes/dashboardRoutes");
// // Route imports - NEW: Payment routes
// const paymentRoutes = require("./routes/paymentRoutes");

// // Initialize reminder scheduler
// require("./utils/reminderScheduler");

// // Connect to database
// database.connect();

// // Middleware setup
// app.use(express.json());
// app.use(cookieParser());

// // CORS configuration
// app.use(
//   cors({
//     origin: [
//       "http://localhost:5173",
//       // process.env.FRONT_END_URL
//     ],
//     credentials: true,
//   })
// );



// // Route setup
// app.use("/api/v1/auth", authRoutes);
// app.use("/api/v1/member", memberRoutes);
// app.use("/api/v1/owner", ownerRoutes);
// app.use("/api/v1/payment", paymentRoutes);
// app.use("/api/v1", contactRoutes);



// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
//   console.log(`Health check: http://localhost:${PORT}/health`);
//   console.log(`Contact form: http://localhost:${PORT}/api/v1/contact`);
//   console.log("All routes loaded successfully");
// });

// module.exports = app;

const express = require("express");
const app = express();
const database = require("./config/db");
const cookieParser = require('cookie-parser');
const cors = require("cors");
require("dotenv").config();

console.log("🚀 [DEBUG] Server: Starting server initialization...");

// Route imports with debug
console.log("📂 [DEBUG] Server: Loading route files...");

let authRoutes, memberRoutes, ownerRoutes, contactRoutes, paymentRoutes;

try {
  authRoutes = require("./routes/authRoutes");
  console.log("✅ [DEBUG] Server: authRoutes loaded successfully");
} catch (error) {
  console.error("❌ [DEBUG] Server: Failed to load authRoutes:", error.message);
}

try {
  memberRoutes = require("./routes/memberRoutes");
  console.log("✅ [DEBUG] Server: memberRoutes loaded successfully");
} catch (error) {
  console.error("❌ [DEBUG] Server: Failed to load memberRoutes:", error.message);
}

try {
  ownerRoutes = require("./routes/ownerProfileRoutes");
  console.log("✅ [DEBUG] Server: ownerRoutes loaded successfully");
} catch (error) {
  console.error("❌ [DEBUG] Server: Failed to load ownerRoutes:", error.message);
}

try {
  contactRoutes = require("./routes/dashboardRoutes");
  console.log("✅ [DEBUG] Server: contactRoutes loaded successfully");
} catch (error) {
  console.error("❌ [DEBUG] Server: Failed to load contactRoutes:", error.message);
}

// Payment routes - with detailed debug
console.log("💳 [DEBUG] Server: Loading payment routes...");
try {
  paymentRoutes = require("./routes/paymentRoutes");
  console.log("✅ [DEBUG] Server: paymentRoutes loaded successfully");
  console.log("🔍 [DEBUG] Server: paymentRoutes type:", typeof paymentRoutes);
  console.log("🔍 [DEBUG] Server: paymentRoutes constructor:", paymentRoutes.constructor.name);
  
  // Check if it's a proper Express router
  if (paymentRoutes && typeof paymentRoutes.use === 'function') {
    console.log("✅ [DEBUG] Server: paymentRoutes appears to be a valid Express router");
  } else {
    console.error("❌ [DEBUG] Server: paymentRoutes is not a valid Express router");
  }
} catch (error) {
  console.error("❌ [DEBUG] Server: Failed to load paymentRoutes:", error.message);
  console.error("❌ [DEBUG] Server: Full error:", error);
}

// Initialize reminder scheduler
console.log("⏰ [DEBUG] Server: Initializing reminder scheduler...");
try {
  require("./utils/reminderScheduler");
  console.log("✅ [DEBUG] Server: Reminder scheduler initialized");
} catch (error) {
  console.error("❌ [DEBUG] Server: Failed to initialize reminder scheduler:", error.message);
}

// Connect to database
console.log("💾 [DEBUG] Server: Connecting to database...");
database.connect();

// Middleware setup
console.log("🔧 [DEBUG] Server: Setting up middleware...");
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

console.log("✅ [DEBUG] Server: Middleware setup complete");

// Route setup with detailed debug
console.log("🛣️ [DEBUG] Server: Setting up routes...");

// Debug route to test server
app.get("/debug/server", (req, res) => {
  console.log("🎯 [DEBUG] Server: Debug route hit!");
  res.json({
    message: "Server debug endpoint working!",
    timestamp: new Date().toISOString(),
    loadedRoutes: {
      authRoutes: typeof authRoutes,
      memberRoutes: typeof memberRoutes,
      ownerRoutes: typeof ownerRoutes,
      contactRoutes: typeof contactRoutes,
      paymentRoutes: typeof paymentRoutes
    }
  });
});

if (authRoutes) {
  app.use("/api/v1/auth", authRoutes);
  console.log("✅ [DEBUG] Server: /api/v1/auth routes mounted");
} else {
  console.error("❌ [DEBUG] Server: Skipping auth routes - not loaded");
}

if (memberRoutes) {
  app.use("/api/v1/member", memberRoutes);
  console.log("✅ [DEBUG] Server: /api/v1/member routes mounted");
} else {
  console.error("❌ [DEBUG] Server: Skipping member routes - not loaded");
}

if (ownerRoutes) {
  app.use("/api/v1/owner", ownerRoutes);
  console.log("✅ [DEBUG] Server: /api/v1/owner routes mounted");
} else {
  console.error("❌ [DEBUG] Server: Skipping owner routes - not loaded");
}

// Payment routes - with extra debug
if (paymentRoutes) {
  console.log("💳 [DEBUG] Server: Mounting payment routes at /api/v1/payment...");
  app.use("/api/v1/payment", paymentRoutes);
  console.log("✅ [DEBUG] Server: /api/v1/payment routes mounted successfully");
} else {
  console.error("❌ [DEBUG] Server: Skipping payment routes - not loaded properly");
}

if (contactRoutes) {
  app.use("/api/v1", contactRoutes);
  console.log("✅ [DEBUG] Server: /api/v1 (contact) routes mounted");
} else {
  console.error("❌ [DEBUG] Server: Skipping contact routes - not loaded");
}

// Debug: List all registered routes
console.log("📋 [DEBUG] Server: Attempting to list all registered routes...");
try {
  const listRoutes = (stack, prefix = '') => {
    stack.forEach((layer) => {
      if (layer.route) {
        // Regular route
        const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
        console.log(`    ${methods} ${prefix}${layer.route.path}`);
      } else if (layer.name === 'router' && layer.handle.stack) {
        // Router middleware
        const routerPrefix = layer.regexp.source
          .replace(/^\^\\?/, '')
          .replace(/\$.*/, '')
          .replace(/\\\//g, '/');
        console.log(`  Router: ${routerPrefix}`);
        listRoutes(layer.handle.stack, routerPrefix);
      }
    });
  };

  console.log("📋 [DEBUG] Server: Registered routes:");
  listRoutes(app._router.stack);
} catch (error) {
  console.error("❌ [DEBUG] Server: Failed to list routes:", error.message);
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("🎉 [DEBUG] Server: Server startup complete!");
  console.log(`🌐 [DEBUG] Server: Server running on port ${PORT}`);
  console.log(`🔍 [DEBUG] Server: Health check: http://localhost:${PORT}/health`);
  console.log(`📞 [DEBUG] Server: Contact form: http://localhost:${PORT}/api/v1/contact`);
  console.log(`🐛 [DEBUG] Server: Debug endpoint: http://localhost:${PORT}/debug/server`);
  console.log(`💳 [DEBUG] Server: Payment debug: http://localhost:${PORT}/api/v1/payment/debug`);
  console.log("✅ [DEBUG] Server: All routes loaded successfully");
});

module.exports = app;