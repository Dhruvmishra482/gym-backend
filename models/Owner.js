const mongoose = require("mongoose");

const ownerSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        mobileNumber: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        accountType: {
            type: String,
            default: "owner",
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        otp: {
            type: String,
        },
        otpExpires: {
            type: Date,
        },
        // FIXED: Updated subscription fields with correct enum values
        subscriptionPlan: {
            type: String,
            enum: ["NONE", "BASIC", "ADVANCED", "ENTERPRISE"], // NONE must be first
            default: "NONE", // Changed from FREE to NONE
        },
        subscriptionExpiry: {
            type: Date,
            default: null,
        },
        // Payment history for tracking
        paymentHistory: [{
            orderId: String,
            paymentId: String,
            amount: Number,
            currency: String,
            billing: {
                type: String,
                enum: ["monthly", "yearly"],
                default: "monthly"
            },
            status: {
                type: String,
                enum: ["SUCCESS", "FAILED", "PENDING"]
            },
            plan: String,
            createdAt: {
                type: Date,
                default: Date.now
            }
        }]
    },
    { timestamps: true }
);

// Instance method to check if subscription is active
ownerSchema.methods.hasActiveSubscription = function() {
    if (this.subscriptionPlan === "NONE") return false;
    if (!this.subscriptionExpiry) return false;
    return new Date() < this.subscriptionExpiry;
};

// Instance method to get subscription status
ownerSchema.methods.getSubscriptionStatus = function() {
    if (this.subscriptionPlan === "NONE") {
        return { 
            isActive: false, 
            plan: "NONE", 
            expiry: null, 
            needsSubscription: true 
        };
    }
    
    const isActive = this.hasActiveSubscription();
    return {
        isActive,
        plan: this.subscriptionPlan,
        expiry: this.subscriptionExpiry,
        needsSubscription: !isActive,
        daysLeft: isActive ? Math.ceil((this.subscriptionExpiry - new Date()) / (1000 * 60 * 60 * 24)) : 0
    };
};

module.exports = mongoose.model("Owner", ownerSchema);