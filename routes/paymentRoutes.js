const express = require("express");
const { body, validationResult } = require("express-validator");
const {
  initiatePayment,
  verifyPayment,
  getSubscriptionPlans,
  getSubscriptionStatus,
  webhookHandler
} = require("../controllers/paymentController");

// Import middleware
const { auth } = require("../middleware/authMiddleware");
const { checkSubscriptionExpiry } = require("../middleware/subscriptionMiddleware");

const router = express.Router();

// Public routes (no auth required)

// Get all subscription plans
router.get("/plans", getSubscriptionPlans);

// Webhook endpoint for Razorpay (should be public, no auth)
router.post("/webhook", webhookHandler);

// Protected routes (auth required)

// Get user's current subscription status
router.get("/status", auth, checkSubscriptionExpiry, getSubscriptionStatus);

// Initiate payment process
router.post(
  "/initiate",
  [
    // Validation middleware
    body("plan")
      .notEmpty()
      .withMessage("Subscription plan is required")
      .isIn(["BASIC"]) // Currently only BASIC available
      .withMessage("Invalid subscription plan. Currently only BASIC plan is available"),
    body("billing")
      .optional()
      .isIn(["monthly", "yearly"])
      .withMessage("Invalid billing cycle. Must be 'monthly' or 'yearly'")
  ],
  // Validation error handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }
    next();
  },
  // Auth middleware (ensures user is logged in)
  auth,
  // Check and update subscription expiry
  checkSubscriptionExpiry,
  // Controller function
  initiatePayment
);

// Verify payment after successful payment
router.post(
  "/verify",
  [
    // Validation middleware
    body("razorpay_payment_id")
      .notEmpty()
      .withMessage("Payment ID is required"),
    body("razorpay_order_id")
      .notEmpty()
      .withMessage("Order ID is required"),
    body("razorpay_signature")
      .notEmpty()
      .withMessage("Payment signature is required")
  ],
  // Validation error handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
        errors: errors.array()
      });
    }
    next();
  },
  // Auth middleware
  auth,
  // Controller function
  verifyPayment
);

module.exports = router;