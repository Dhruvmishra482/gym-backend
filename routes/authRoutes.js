
const express = require("express");
const { body, validationResult } = require("express-validator");
const { signUp, login } = require("../controllers/authController");
const router = express.Router();

router.post(
  "/signup",
  [
    body("firstName").notEmpty(),
    body("lastName").notEmpty(),
    body("mobileNumber").notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
    body("confirmPassword").custom((value, { req }) => value === req.body.password),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
  signUp
);

router.post(
  "/login",
  [
    body("email").isEmail(),
    body("password").notEmpty()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
  login
);

router.get("/logout", logout);


module.exports = router;
