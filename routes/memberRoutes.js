// const express = require("express");
// const { body, validationResult } = require("express-validator");
// const {
//   getAllMembers,
//   addMember,
//   editMember,
//   getMemberByPhone,
//   searchMember,
//   getAllMemberNames,
//   getAllDueMembers,
//   sendMemberReminder,
//   markMemberFeePaid,
//   getMemberDetails,
//   sendAllMemberReminders,
// } = require("../controllers/memberController");
// const { auth, isOwner } = require("../middleware/authMiddleware");

// const router = express.Router();

// // Validation middleware
// const validate = (validations) => async (req, res, next) => {
//   await Promise.all(validations.map((v) => v.run(req)));
//   const errors = validationResult(req);
//   if (errors.isEmpty()) return next();
//   return res.status(400).json({ success: false, errors: errors.array() });
// };

// // ===== EXISTING ROUTES =====

// // Get All Members
// router.get("/allmembers", auth, isOwner, getAllMembers);

// // Add Member
// router.post(
//   "/addmember",
//   auth,
//   isOwner,
//   validate([
//     body("name").notEmpty(),
//     body("phoneNo").notEmpty(),
//     body("feesAmount").notEmpty(),
//     body("nextDueDate").notEmpty(),
//     body("address").notEmpty(),
//   ]),
//   addMember
// );

// // Edit Member
// router.get("/getmember/:phoneNo", auth, isOwner, getMemberByPhone);
// router.patch("/editmember/:phoneNo", auth, isOwner, editMember);

// // Search Member
// router.get("/search/:query", auth, isOwner, searchMember);

// // Get All Member Names (for debugging)
// router.get("/debug/names", auth, isOwner, getAllMemberNames);

// // ===== DUE MEMBERS ROUTES =====
// // IMPORTANT: Static routes must come BEFORE dynamic parameter routes

// // Add logging middleware for due members routes
// // For /duemembers
// router.use("/duemembers", (req, res, next) => {
//   console.log("🌐 Due members route middleware HIT (/duemembers)");
//   next();
// });

// // For /due-members
// router.use("/due-members", (req, res, next) => {
//   console.log("🌐 Due members route middleware HIT (/due-members)");
//   next();
// });
// // Get All Due Members - Multiple endpoints for compatibility
// router.get(
//   "/duemembers",
//   auth,
//   isOwner,
//   (req, res, next) => {
//     console.log("🎯 Due members route handler reached (duemembers)");
//     console.log("✅ Auth middleware passed");
//     console.log("✅ Owner middleware passed");
//     next();
//   },
//   getAllDueMembers
// );

// // Alternative endpoint for due members (matches frontend expectation)
// router.get("/due-members", auth, isOwner, getAllDueMembers);

// // Send reminders to all due members (bulk operation)
// router.post("/send-all-reminders", auth, isOwner, sendAllMemberReminders);

// // ===== DYNAMIC PARAMETER ROUTES =====
// // These must come AFTER all static routes to avoid conflicts

// // Send reminder to specific member
// router.post("/:memberId/send-reminder", auth, isOwner, sendMemberReminder);

// // Mark member as paid
// router.patch("/:memberId/mark-paid", auth, isOwner, markMemberFeePaid);

// // Get member details
// router.get("/:memberId/details", auth, isOwner, getMemberDetails);

// // Delete Member (commented out as per your original)
// // router.delete("/deletemember/:phoneNo", auth, isOwner, deleteMember);

// module.exports = router;
const express = require("express");
const { body, validationResult } = require("express-validator");
const {
  getAllMembers,
  addMember,
  editMember,
  getMemberByPhone,
  searchMember,
  getAllMemberNames,
  getAllDueMembers,
  sendMemberReminder,
  markMemberFeePaid,
  getMemberDetails,
  sendAllMemberReminders,
} = require("../controllers/memberController");

// Import existing auth middleware
const { auth, isOwner } = require("../middleware/authMiddleware");
// Import NEW subscription middleware
const { isSubscribed, checkSubscriptionExpiry } = require("../middleware/subscriptionMiddleware");

const router = express.Router();

// Validation middleware (unchanged)
const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map((v) => v.run(req)));
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(400).json({ success: false, errors: errors.array() });
};

// ===== SUBSCRIPTION-PROTECTED ROUTES =====

// Get All Members - Requires active subscription
router.get("/allmembers", 
  auth, 
  isOwner, 
  checkSubscriptionExpiry, // Check if subscription expired
  isSubscribed,            // Require active subscription
  getAllMembers
);

// Add Member - Core feature, requires subscription
router.post(
  "/addmember",
  auth,
  isOwner,
  checkSubscriptionExpiry,
  isSubscribed, // Must have active subscription to add members
  validate([
    body("name").notEmpty(),
    body("phoneNo").notEmpty(),
    body("feesAmount").notEmpty(),
    body("nextDueDate").notEmpty(),
    body("address").notEmpty(),
  ]),
  addMember
);

// Edit Member - Requires subscription
router.get("/getmember/:phoneNo", 
  auth, 
  isOwner, 
  checkSubscriptionExpiry,
  isSubscribed,
  getMemberByPhone
);

router.patch("/editmember/:phoneNo", 
  auth, 
  isOwner, 
  checkSubscriptionExpiry,
  isSubscribed,
  editMember
);

// Search Member - Premium feature, requires subscription
router.get("/search/:query", 
  auth, 
  isOwner, 
  checkSubscriptionExpiry,
  isSubscribed,
  searchMember
);

// Get All Member Names - Debug route, keep protected
router.get("/debug/names", 
  auth, 
  isOwner, 
  checkSubscriptionExpiry,
  isSubscribed,
  getAllMemberNames
);

// ===== DUE MEMBERS ROUTES - SUBSCRIPTION PROTECTED =====

// Add logging middleware for due members routes (unchanged)
router.use("/duemembers", (req, res, next) => {
  console.log("🌐 Due members route middleware HIT (/duemembers)");
  next();
});

router.use("/due-members", (req, res, next) => {
  console.log("🌐 Due members route middleware HIT (/due-members)");
  next();
});

// Get All Due Members - Core feature requiring subscription
router.get(
  "/duemembers",
  auth,
  isOwner,
  checkSubscriptionExpiry,
  isSubscribed, // Require subscription for due members feature
  (req, res, next) => {
    console.log("🎯 Due members route handler reached (duemembers)");
    console.log("✅ Auth middleware passed");
    console.log("✅ Owner middleware passed");
    console.log("✅ Subscription middleware passed");
    next();
  },
  getAllDueMembers
);

// Alternative endpoint for due members
router.get("/due-members", 
  auth, 
  isOwner, 
  checkSubscriptionExpiry,
  isSubscribed,
  getAllDueMembers
);

// Send reminders to all due members - Premium feature
router.post("/send-all-reminders", 
  auth, 
  isOwner, 
  checkSubscriptionExpiry,
  isSubscribed, // WhatsApp reminders require subscription
  sendAllMemberReminders
);

// ===== DYNAMIC PARAMETER ROUTES - SUBSCRIPTION PROTECTED =====

// Send reminder to specific member - Premium feature
router.post("/:memberId/send-reminder", 
  auth, 
  isOwner, 
  checkSubscriptionExpiry,
  isSubscribed,
  sendMemberReminder
);

// Mark member as paid - Core feature
router.patch("/:memberId/mark-paid", 
  auth, 
  isOwner, 
  checkSubscriptionExpiry,
  isSubscribed,
  markMemberFeePaid
);

// Get member details - Requires subscription
router.get("/:memberId/details", 
  auth, 
  isOwner, 
  checkSubscriptionExpiry,
  isSubscribed,
  getMemberDetails
);

// ===== FREE PREVIEW ROUTES (No subscription required) =====

// Preview route - shows what features are available with subscription
router.get("/preview/features", 
  auth, 
  isOwner,
  (req, res) => {
    const { subscriptionPlan } = req.user;
    
    if (subscriptionPlan === "NONE") {
      return res.json({
        success: true,
        message: "Subscription required to access member management features",
        needsSubscription: true,
        availableFeatures: [
          "Manage up to 150 members",
          "AI-powered member insights",
          "Smart payment reminders (WhatsApp)",
          "Member dashboard with profiles",
          "Basic analytics reports",
          "Due notifications to owner",
          "24/7 chat & email support"
        ],
        currentPlan: "NONE",
        upgradeUrl: "/pricing"
      });
    } else {
      return res.json({
        success: true,
        message: `Welcome to ${subscriptionPlan} plan!`,
        currentPlan: subscriptionPlan,
        hasAccess: true
      });
    }
  }
);

module.exports = router;