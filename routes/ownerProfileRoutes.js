// // // routes/ownerProfileRoutes.js
// // const express = require('express');
// // const router = express.Router();
// // const ownerProfileController = require('../controllers/ownerProfileController');
// // const { authenticateOwner } = require('../middleware/auth'); // Assuming you have auth middleware

// // // GET /api/owner/profile - Get owner profile
// // router.get('/profile', authenticateOwner, ownerProfileController.getOwnerProfile);

// // // PUT /api/owner/profile - Update owner profile
// // router.put('/profile', authenticateOwner, ownerProfileController.updateOwnerProfile);

// // module.exports = router;

// const express = require('express');
// const router = express.Router();
// const { 
//   getOwnerProfile, 
//   updateOwnerProfile 
// } = require('../controllers/ownerProfileController');

// const { auth, isOwner } = require("../middleware/authMiddleware");

// // @route   GET /api/owner/profile
// // @desc    Get owner profile
// // @access  Private (Owner only)
// router.get('/profile', auth, isOwner, getOwnerProfile);

// // @route   PUT /api/owner/profile
// // @desc    Update owner profile
// // @access  Private (Owner only)
// router.put('/profile', auth, isOwner, updateOwnerProfile);

// module.exports = router;

const express = require('express');
const router = express.Router();
const {
   getOwnerProfile,
   updateOwnerProfile
 } = require('../controllers/ownerProfileController');

const { auth, isOwner } = require("../middleware/authMiddleware");
const { checkSubscriptionExpiry } =require("../middleware/subscriptionMiddleware");

// @route   GET /api/owner/profile
// @desc    Get owner profile (includes subscription info)
// @access  Private (Owner only)
router.get('/profile', 
  auth, 
  isOwner, 
  checkSubscriptionExpiry, // Auto-check and downgrade if expired
  getOwnerProfile
);

// @route   PUT /api/owner/profile
// @desc    Update owner profile (basic info only, subscription managed separately)
// @access  Private (Owner only)
router.put('/profile', 
  auth, 
  isOwner, 
  checkSubscriptionExpiry,
  updateOwnerProfile
);

// @route   GET /api/owner/dashboard-status
// @desc    Get dashboard access status based on subscription
// @access  Private (Owner only)
router.get('/dashboard-status', 
  auth, 
  isOwner,
  checkSubscriptionExpiry,
  (req, res) => {
    const { subscriptionPlan, hasActiveSubscription } = req.user;
    
    if (subscriptionPlan === "NONE" || !hasActiveSubscription) {
      return res.json({
        success: true,
        hasAccess: false,
        message: "Subscription required to access dashboard features",
        currentPlan: subscriptionPlan,
        needsSubscription: true,
        upgradeMessage: "Start Your Gym Journey with our Basic plan!",
        features: [
          "Up to 150 members",
          "AI-powered member insights",
          "Smart payment reminders (WhatsApp)",
          "Member dashboard with profiles",
          "24/7 chat & email support"
        ]
      });
    }

    return res.json({
      success: true,
      hasAccess: true,
      message: `Welcome to your ${subscriptionPlan} dashboard!`,
      currentPlan: subscriptionPlan,
      needsSubscription: false
    });
  }
);

module.exports = router;