const express = require("express");
const { body, validationResult } = require("express-validator");
const { addMember } = require("../controllers/memberController");
const { auth, isOwner } = require("../middleware/authMiddleware");
const router = express.Router();


router.post(
  "/addmember",
  [
    body("name").notEmpty(),
    body("phoneNo").notEmpty(),
    body("feesAmount").notEmpty(),
    body("nextDueDate").notEmpty(),
    body("address").notEmpty(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
  auth,
  isOwner,
  addMember
);

module.exports = router;
