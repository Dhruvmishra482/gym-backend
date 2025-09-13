// routes/subscriptionRoutes.js

const express = require("express");
const { body, validationResult } = require("express-validator");
const {
    getSubscriptionDetails,
    getPlanComparison,
    calculateUpgradePrice,
    checkUsageLimit,
    trackFeatureUsage,
    sendExpiryReminders,
    processUpgrade,
    resetCustomBillingCycles,
    getUsageAnalytics,
    updateNotificationSettings,
    // syncMemberCounts
   
} = require("../controllers/subscriptionController");

// Import middleware
const { auth, isOwner } = require("../middleware/authMiddleware");
const { isSubscribed, checkSubscriptionExpiry } = require("../middleware/subscriptionMiddleware");

const router = express.Router();

// Validation middleware
const validateRequest = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        
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
};

// ===== PUBLIC ROUTES (Admin/Scheduler access) =====

// Send expiry reminders (called by scheduler)
router.post("/send-reminders", sendExpiryReminders);

// Reset monthly usage (called by scheduler)
router.post("/reset-billing-cycles", resetCustomBillingCycles);

// ===== PROTECTED ROUTES (Auth required) =====

// Get comprehensive subscription details with usage analytics
router.get("/details", 
    auth, 
    isOwner, 
    checkSubscriptionExpiry,
    getSubscriptionDetails
);

// Get plan comparison with current usage context
router.get("/plans", 
    auth, 
    isOwner, 
    checkSubscriptionExpiry,
    getPlanComparison
);
// Manual sync route (admin use)
// router.post("/sync-member-counts", 
//     auth,
//     isOwner,
//     syncMemberCounts

// );

// Calculate prorated upgrade pricing
router.post("/calculate-upgrade",
    auth,
    isOwner,
    checkSubscriptionExpiry,
    validateRequest([
        body("targetPlan")
            .notEmpty()
            .withMessage("Target plan is required")
            .isIn(["BASIC", "ADVANCED", "ENTERPRISE"])
            .withMessage("Invalid target plan"),
        body("billing")
            .optional()
            .isIn(["monthly", "yearly"])
            .withMessage("Invalid billing cycle")
    ]),
    calculateUpgradePrice
);

// Check usage limits before performing actions
router.post("/check-limit",
    auth,
    isOwner,
    checkSubscriptionExpiry,
    validateRequest([
        body("action")
            .notEmpty()
            .withMessage("Action is required")
            .isIn(["members", "whatsappReminders", "analyticsViews", "searchQueries"])
            .withMessage("Invalid action type"),
        body("count")
            .optional()
            .isInt({ min: 1 })
            .withMessage("Count must be a positive integer")
    ]),
    checkUsageLimit
);

// Track feature usage
router.post("/track-usage",
    auth,
    isOwner,
    checkSubscriptionExpiry,
    validateRequest([
        body("feature")
            .notEmpty()
            .withMessage("Feature is required")
            .isIn(["whatsappReminders", "analyticsViews", "searchQueries"])
            .withMessage("Invalid feature type")
    ]),
    trackFeatureUsage
);

// Process subscription upgrade (after payment)
router.post("/upgrade",
    auth,
    isOwner,
    checkSubscriptionExpiry,
    validateRequest([
        body("targetPlan")
            .notEmpty()
            .withMessage("Target plan is required")
            .isIn(["BASIC", "ADVANCED", "ENTERPRISE"])
            .withMessage("Invalid target plan"),
        body("billing")
            .optional()
            .isIn(["monthly", "yearly"])
            .withMessage("Invalid billing cycle"),
        body("paymentId")
            .optional()
            .isString()
            .withMessage("Payment ID must be a string"),
        body("orderId")
            .optional()
            .isString()
            .withMessage("Order ID must be a string")
    ]),
    processUpgrade
);

// Get usage analytics for dashboard
router.get("/analytics", 
    auth, 
    isOwner, 
    checkSubscriptionExpiry,
    getUsageAnalytics
);

// Update notification preferences
router.put("/notifications",
    auth,
    isOwner,
    validateRequest([
        body("expiryReminders")
            .optional()
            .isBoolean()
            .withMessage("Expiry reminders must be a boolean")
    ]),
    updateNotificationSettings
);

module.exports = router;
// const express = require("express");
// const { body, validationResult } = require("express-validator");
// const {
//     getSubscriptionDetails,
//     getPlanComparison,
//     calculateUpgradePrice,
//     checkUsageLimit,
//     trackFeatureUsage,
//     sendExpiryReminders,
//     processUpgrade,
//     resetCustomBillingCycles,
//     // getUsageAnalytics,  // COMMENTED - might not exist
//     updateNotificationSettings
//     // syncMemberCounts   // COMMENTED - might not exist
// } = require("../controllers/subscriptionController");

// // Import middleware
// const { auth, isOwner } = require("../middleware/authMiddleware");
// const { isSubscribed, checkSubscriptionExpiry } = require("../middleware/subscriptionMiddleware");

// const router = express.Router();

// // Validation middleware
// const validateRequest = (validations) => {
//     return async (req, res, next) => {
//         await Promise.all(validations.map(validation => validation.run(req)));
        
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Validation failed",
//                 errors: errors.array()
//             });
//         }
//         next();
//     };
// };

// // ===== BASIC ROUTES (NO PARAMETERS) =====

// // PUBLIC ROUTES (Admin/Scheduler access)
// router.post("/send-reminders", sendExpiryReminders);
// router.post("/reset-billing-cycles", resetCustomBillingCycles);

// // PROTECTED ROUTES (Auth required)
// router.get("/details", 
//     auth, 
//     isOwner, 
//     checkSubscriptionExpiry,
//     getSubscriptionDetails
// );

// router.get("/plans", 
//     auth, 
//     isOwner, 
//     checkSubscriptionExpiry,
//     getPlanComparison
// );

// router.post("/calculate-upgrade",
//     auth,
//     isOwner,
//     checkSubscriptionExpiry,
//     validateRequest([
//         body("targetPlan")
//             .notEmpty()
//             .withMessage("Target plan is required")
//             .isIn(["BASIC", "ADVANCED", "ENTERPRISE"])
//             .withMessage("Invalid target plan"),
//         body("billing")
//             .optional()
//             .isIn(["monthly", "yearly"])
//             .withMessage("Invalid billing cycle")
//     ]),
//     calculateUpgradePrice
// );

// router.post("/check-limit",
//     auth,
//     isOwner,
//     checkSubscriptionExpiry,
//     validateRequest([
//         body("action")
//             .notEmpty()
//             .withMessage("Action is required")
//             .isIn(["members", "whatsappReminders", "analyticsViews", "searchQueries"])
//             .withMessage("Invalid action type"),
//         body("count")
//             .optional()
//             .isInt({ min: 1 })
//             .withMessage("Count must be a positive integer")
//     ]),
//     checkUsageLimit
// );

// router.post("/track-usage",
//     auth,
//     isOwner,
//     checkSubscriptionExpiry,
//     validateRequest([
//         body("feature")
//             .notEmpty()
//             .withMessage("Feature is required")
//             .isIn(["whatsappReminders", "analyticsViews", "searchQueries"])
//             .withMessage("Invalid feature type")
//     ]),
//     trackFeatureUsage
// );

// router.post("/upgrade",
//     auth,
//     isOwner,
//     checkSubscriptionExpiry,
//     validateRequest([
//         body("targetPlan")
//             .notEmpty()
//             .withMessage("Target plan is required")
//             .isIn(["BASIC", "ADVANCED", "ENTERPRISE"])
//             .withMessage("Invalid target plan"),
//         body("billing")
//             .optional()
//             .isIn(["monthly", "yearly"])
//             .withMessage("Invalid billing cycle"),
//         body("paymentId")
//             .optional()
//             .isString()
//             .withMessage("Payment ID must be a string"),
//         body("orderId")
//             .optional()
//             .isString()
//             .withMessage("Order ID must be a string")
//     ]),
//     processUpgrade
// );

// router.put("/notifications",
//     auth,
//     isOwner,
//     validateRequest([
//         body("expiryReminders")
//             .optional()
//             .isBoolean()
//             .withMessage("Expiry reminders must be a boolean")
//     ]),
//     updateNotificationSettings
// );

// // ===== COMMENTED OUT ROUTES =====
// // Uncomment these one by one to test

// /*
// // Manual sync route (admin use)
// router.post("/sync-member-counts", 
//     auth,
//     isOwner,
//     syncMemberCounts
// );

// // Get usage analytics for dashboard
// router.get("/analytics", 
//     auth, 
//     isOwner, 
//     checkSubscriptionExpiry,
//     getUsageAnalytics
// );
// */

// module.exports = router;