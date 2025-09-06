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
const { auth, isOwner } = require("../middleware/authMiddleware");

const router = express.Router();

// Validation middleware
const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map((v) => v.run(req)));
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(400).json({ success: false, errors: errors.array() });
};

// ===== EXISTING ROUTES =====

// Get All Members
router.get("/allmembers", auth, isOwner, getAllMembers);

// Add Member
router.post(
  "/addmember",
  auth,
  isOwner,
  validate([
    body("name").notEmpty(),
    body("phoneNo").notEmpty(),
    body("feesAmount").notEmpty(),
    body("nextDueDate").notEmpty(),
    body("address").notEmpty(),
  ]),
  addMember
);

// Edit Member
router.get("/getmember/:phoneNo", auth, isOwner, getMemberByPhone);
router.patch("/editmember/:phoneNo", auth, isOwner, editMember);

// Search Member
router.get("/search/:query", auth, isOwner, searchMember);

// Get All Member Names (for debugging)
router.get("/debug/names", auth, isOwner, getAllMemberNames);

// ===== DUE MEMBERS ROUTES =====
// IMPORTANT: Static routes must come BEFORE dynamic parameter routes

// Add logging middleware for due members routes
// For /duemembers
router.use("/duemembers", (req, res, next) => {
  console.log("🌐 Due members route middleware HIT (/duemembers)");
  next();
});

// For /due-members
router.use("/due-members", (req, res, next) => {
  console.log("🌐 Due members route middleware HIT (/due-members)");
  next();
});
// Get All Due Members - Multiple endpoints for compatibility
router.get(
  "/duemembers",
  auth,
  isOwner,
  (req, res, next) => {
    console.log("🎯 Due members route handler reached (duemembers)");
    console.log("✅ Auth middleware passed");
    console.log("✅ Owner middleware passed");
    next();
  },
  getAllDueMembers
);

// Alternative endpoint for due members (matches frontend expectation)
router.get("/due-members", auth, isOwner, getAllDueMembers);

// Send reminders to all due members (bulk operation)
router.post("/send-all-reminders", auth, isOwner, sendAllMemberReminders);

// ===== DYNAMIC PARAMETER ROUTES =====
// These must come AFTER all static routes to avoid conflicts

// Send reminder to specific member
router.post("/:memberId/send-reminder", auth, isOwner, sendMemberReminder);

// Mark member as paid
router.patch("/:memberId/mark-paid", auth, isOwner, markMemberFeePaid);

// Get member details
router.get("/:memberId/details", auth, isOwner, getMemberDetails);

// Delete Member (commented out as per your original)
// router.delete("/deletemember/:phoneNo", auth, isOwner, deleteMember);

module.exports = router;
