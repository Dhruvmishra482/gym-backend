// controllers/ownerProfileController.js
const Owner = require('../models/Owner'); // Adjust path as needed

// Get owner profile
const getOwnerProfile = async (req, res) => {
  try {
    console.log('👤 Fetching owner profile for ID:', req.user.id);

    // Fetch owner from database (excluding sensitive fields)
    const owner = await Owner.findById(req.user.id).select('-password -otp -otpExpires');
    
    if (!owner) {
      console.log('❌ Owner profile not found');
      return res.status(404).json({
        success: false,
        message: 'Owner profile not found'
      });
    }

    console.log('✅ Owner profile fetched successfully');
    res.json({
      success: true,
      message: 'Profile fetched successfully',
      data: {
        id: owner._id,
        firstName: owner.firstName,
        lastName: owner.lastName,
        mobileNumber: owner.mobileNumber,
        email: owner.email,
        accountType: owner.accountType,
        isVerified: owner.isVerified,
        createdAt: owner.createdAt,
        updatedAt: owner.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Error fetching owner profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update owner profile
const updateOwnerProfile = async (req, res) => {
  try {
    const { firstName, lastName, mobileNumber, email } = req.body;
    const ownerId = req.user.id;

    console.log('🔄 Updating owner profile for ID:', ownerId);
    console.log('📝 Update data:', { firstName, lastName, mobileNumber, email });

    // First, get the current owner data to compare changes
    const currentOwner = await Owner.findById(ownerId);
    if (!currentOwner) {
      console.log('❌ Owner not found');
      return res.status(404).json({
        success: false,
        message: 'Owner profile not found'
      });
    }

    // Validation - Check required fields
    if (!firstName || !lastName || !mobileNumber || !email) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'All fields are required (firstName, lastName, mobileNumber, email)'
      });
    }

    // Validate first name
    if (firstName.trim().length < 2) {
      console.log('❌ First name too short');
      return res.status(400).json({
        success: false,
        message: 'First name must be at least 2 characters long'
      });
    }

    // Validate last name
    if (lastName.trim().length < 2) {
      console.log('❌ Last name too short');
      return res.status(400).json({
        success: false,
        message: 'Last name must be at least 2 characters long'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format');
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Mobile number validation (Indian format)
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(cleanMobile.slice(-10))) {
      console.log('❌ Invalid mobile number format');
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit mobile number starting with 6-9'
      });
    }

    // ✅ NEW LOGIC: Only check for duplicates if the values have actually changed
    const trimmedEmail = email.trim().toLowerCase();
    const emailChanged = trimmedEmail !== currentOwner.email.toLowerCase();
    
    // Check if email already exists for another owner (only if email changed)
    if (emailChanged) {
      console.log('📧 Email changed, checking for duplicates...');
      const existingOwnerWithEmail = await Owner.findOne({ 
        email: trimmedEmail, 
        _id: { $ne: ownerId } 
      });
      
      if (existingOwnerWithEmail) {
        console.log('❌ Email already exists for another owner');
        return res.status(409).json({
          success: false,
          message: 'Email address is already in use by another account'
        });
      }
    } else {
      console.log('📧 Email unchanged, skipping duplicate check');
    }

    // Check if mobile number already exists for another owner (only if mobile changed)
    const mobileChanged = cleanMobile !== currentOwner.mobileNumber;
    if (mobileChanged) {
      console.log('📱 Mobile number changed, checking for duplicates...');
      const existingOwnerWithMobile = await Owner.findOne({ 
        mobileNumber: cleanMobile, 
        _id: { $ne: ownerId } 
      });
      
      if (existingOwnerWithMobile) {
        console.log('❌ Mobile number already exists for another owner');
        return res.status(409).json({
          success: false,
          message: 'Mobile number is already in use by another account'
        });
      }
    } else {
      console.log('📱 Mobile number unchanged, skipping duplicate check');
    }

    // Update the owner profile
    const updatedOwner = await Owner.findByIdAndUpdate(
      ownerId,
      {
        $set: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          mobileNumber: cleanMobile,
          email: trimmedEmail
        }
      },
      { 
        new: true, // Return updated document
        runValidators: true // Run schema validations
      }
    ).select('-password -otp -otpExpires');

    if (!updatedOwner) {
      console.log('❌ Owner not found for update');
      return res.status(404).json({
        success: false,
        message: 'Owner profile not found'
      });
    }

    console.log('✅ Owner profile updated successfully');
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedOwner._id,
        firstName: updatedOwner.firstName,
        lastName: updatedOwner.lastName,
        mobileNumber: updatedOwner.mobileNumber,
        email: updatedOwner.email,
        accountType: updatedOwner.accountType,
        isVerified: updatedOwner.isVerified,
        createdAt: updatedOwner.createdAt,
        updatedAt: updatedOwner.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Error updating owner profile:', error);
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      let field = 'field';
      if (error.keyPattern?.email) field = 'email';
      if (error.keyPattern?.mobileNumber) field = 'mobile number';
      
      return res.status(409).json({
        success: false,
        message: `This ${field} is already in use by another account`
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getOwnerProfile,
  updateOwnerProfile
};