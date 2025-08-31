// // routes/ownerProfileRoutes.js
// const express = require('express');
// const router = express.Router();
// const ownerProfileController = require('../controllers/ownerProfileController');
// const { authenticateOwner } = require('../middleware/auth'); // Assuming you have auth middleware

// // GET /api/owner/profile - Get owner profile
// router.get('/profile', authenticateOwner, ownerProfileController.getOwnerProfile);

// // PUT /api/owner/profile - Update owner profile
// router.put('/profile', authenticateOwner, ownerProfileController.updateOwnerProfile);

// module.exports = router;

const express = require('express');
const router = express.Router();
const { 
  getOwnerProfile, 
  updateOwnerProfile 
} = require('../controllers/ownerProfileController');

const { auth, isOwner } = require("../middleware/authMiddleware");

// @route   GET /api/owner/profile
// @desc    Get owner profile
// @access  Private (Owner only)
router.get('/profile', auth, isOwner, getOwnerProfile);

// @route   PUT /api/owner/profile
// @desc    Update owner profile
// @access  Private (Owner only)
router.put('/profile', auth, isOwner, updateOwnerProfile);

module.exports = router;