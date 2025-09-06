
const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { submitContactForm } = require("../controllers/dashboardController");

// Validation middleware
const contactValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2-100 characters"),
    
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
    
  body("phone")
    .optional()
    .trim()
    .isMobilePhone('any')
    .withMessage("Please provide a valid phone number"),
    
  body("subject")
    .trim()
    .notEmpty()
    .withMessage("Subject is required")
    .isLength({ min: 5, max: 200 })
    .withMessage("Subject must be between 5-200 characters"),
    
  body("inquiry")
    .optional()
    .isIn(['general', 'sales', 'support', 'demo', 'partnership'])
    .withMessage("Invalid inquiry type"),
    
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Message must be between 10-2000 characters"),
    
  body("gymName")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Gym name must be less than 100 characters"),
    
  body("ownerName")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Owner name must be less than 100 characters")
];

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array()
    });
  }
  next();
};

// Contact form route - simplified without rate limiting
router.post(
  "/contact",
  contactValidation,       // Apply validation
  handleValidationErrors,  // Handle validation errors
  submitContactForm        // Handle the actual submission
);

module.exports = router;