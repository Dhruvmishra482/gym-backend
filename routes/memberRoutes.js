const express = require("express");
const { body,validationResult } = require("express-validator");
const { getAllMembers,addMember,editMember,deleteMember,getMemberByPhone } = require("../controllers/memberController");
const { auth,isOwner } = require("../middleware/authMiddleware");

const router = express.Router();

// Validation middleware
const validate = (validations) => async (req,res,next) =>
{
  await Promise.all(validations.map((v) => v.run(req)));
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(400).json({ success: false,errors: errors.array() });
};

// Get All Members
router.get("/allmembers",auth,isOwner,getAllMembers);

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
router.get("/getmember/:phoneNo",auth,isOwner,getMemberByPhone);

// Delete Member
// router.delete("/deletemember/:phoneNo", auth, isOwner, deleteMember);

module.exports = router;
