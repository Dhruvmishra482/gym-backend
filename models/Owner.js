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
        // EXISTING SUBSCRIPTION FIELDS
        subscriptionPlan: {
            type: String,
            enum: ["NONE", "BASIC", "ADVANCED", "ENTERPRISE"],
            default: "NONE",
        },
        subscriptionExpiry: {
            type: Date,
            default: null,
        },
        // EXISTING PAYMENT HISTORY
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
        }],
        
        // NEW: USAGE TRACKING FIELDS
        usageStats: {
            membersCount: {
                type: Number,
                default: 0
            },
            lastMemberCountUpdate: {
                type: Date,
                default: Date.now
            },
            featureUsage: {
                whatsappReminders: {
                    count: { type: Number, default: 0 },
                    lastUsed: { type: Date }
                },
                analyticsViews: {
                    count: { type: Number, default: 0 },
                    lastUsed: { type: Date }
                },
                searchQueries: {
                    count: { type: Number, default: 0 },
                    lastUsed: { type: Date }
                }
            },
            monthlyStats: [{
                month: String, // Format: "2025-09"
                membersAdded: { type: Number, default: 0 },
                featuresUsed: {
                    whatsappReminders: { type: Number, default: 0 },
                    analyticsViews: { type: Number, default: 0 },
                    searchQueries: { type: Number, default: 0 }
                }
            }]
        },
        
        // NEW: NOTIFICATION TRACKING
        notificationSettings: {
            expiryReminders: {
                enabled: { type: Boolean, default: true },
                emailSent7Days: { type: Boolean, default: false },
                emailSent3Days: { type: Boolean, default: false },
                emailSentExpiry: { type: Boolean, default: false },
                emailSentPostExpiry: { type: Boolean, default: false }
            }
        }
    },
    { timestamps: true }
);

// EXISTING METHODS - UNCHANGED
ownerSchema.methods.hasActiveSubscription = function() {
    if (this.subscriptionPlan === "NONE") return false;
    if (!this.subscriptionExpiry) return false;
    return new Date() < this.subscriptionExpiry;
};

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

// NEW METHODS - USAGE TRACKING
ownerSchema.methods.incrementMemberCount = async function() {
    this.usageStats.membersCount += 1;
    this.usageStats.lastMemberCountUpdate = new Date();
    
    // Update monthly stats
    const currentMonth = new Date().toISOString().substring(0, 7); // "2025-09"
    let monthlyRecord = this.usageStats.monthlyStats.find(stat => stat.month === currentMonth);
    
    if (!monthlyRecord) {
        this.usageStats.monthlyStats.push({
            month: currentMonth,
            membersAdded: 1,
            featuresUsed: {
                whatsappReminders: 0,
                analyticsViews: 0,
                searchQueries: 0
            }
        });
    } else {
        monthlyRecord.membersAdded += 1;
    }
    
    return await this.save();
};

ownerSchema.methods.decrementMemberCount = async function() {
    if (this.usageStats.membersCount > 0) {
        this.usageStats.membersCount -= 1;
        this.usageStats.lastMemberCountUpdate = new Date();
        return await this.save();
    }
};

ownerSchema.methods.trackFeatureUsage = async function(featureName) {
    const validFeatures = ['whatsappReminders', 'analyticsViews', 'searchQueries'];
    if (!validFeatures.includes(featureName)) return;
    
    // Update total usage
    this.usageStats.featureUsage[featureName].count += 1;
    this.usageStats.featureUsage[featureName].lastUsed = new Date();
    
    // Update monthly stats
    const currentMonth = new Date().toISOString().substring(0, 7);
    let monthlyRecord = this.usageStats.monthlyStats.find(stat => stat.month === currentMonth);
    
    if (!monthlyRecord) {
        const newRecord = {
            month: currentMonth,
            membersAdded: 0,
            featuresUsed: {
                whatsappReminders: 0,
                analyticsViews: 0,
                searchQueries: 0
            }
        };
        newRecord.featuresUsed[featureName] = 1;
        this.usageStats.monthlyStats.push(newRecord);
    } else {
        monthlyRecord.featuresUsed[featureName] += 1;
    }
    
    return await this.save();
};

ownerSchema.methods.getPlanLimits = function() {
    const planLimits = {
        NONE: {
            members: 0,
            whatsappReminders: 0,
            analyticsViews: 0,
            searchQueries: 0,
            features: []
        },
        BASIC: {
            members: 150,
            whatsappReminders: 1000,
            analyticsViews: 500,
            searchQueries: 1000,
            features: [
                "Up to 150 members",
                "AI-powered member insights",
                "Smart payment reminders (WhatsApp)",
                "Member dashboard with profiles",
                "24/7 chat & email support",
                "Search active members",
                "Add new members manually",
                "Basic analytics reports",
                "Due notifications to owner",
                "Single location support"
            ]
        },
        ADVANCED: {
            members: 500,
            whatsappReminders: 5000,
            analyticsViews: 2000,
            searchQueries: 5000,
            features: [
                "Up to 500 members",
                "Advanced AI insights",
                "Unlimited WhatsApp reminders",
                "Advanced analytics & reports",
                "Multi-location support",
                "Staff management",
                "Custom branding",
                "Priority support"
            ]
        },
        ENTERPRISE: {
            members: -1, // Unlimited
            whatsappReminders: -1,
            analyticsViews: -1,
            searchQueries: -1,
            features: [
                "Unlimited members",
                "White-label solution",
                "Custom integrations",
                "Dedicated account manager",
                "Advanced reporting",
                "API access",
                "Custom features"
            ]
        }
    };
    
    return planLimits[this.subscriptionPlan] || planLimits.NONE;
};

ownerSchema.methods.canAddMember = function() {
    const limits = this.getPlanLimits();
    if (limits.members === -1) return true; // Unlimited
    return this.usageStats.membersCount < limits.members;
};

ownerSchema.methods.canUseFeature = function(featureName) {
    const limits = this.getPlanLimits();
    if (limits[featureName] === -1) return true; // Unlimited
    return this.usageStats.featureUsage[featureName].count < limits[featureName];
};

ownerSchema.methods.getUsagePercentage = function(type) {
    const limits = this.getPlanLimits();
    if (limits[type] === -1) return 0; // Unlimited
    
    let current = 0;
    if (type === 'members') {
        current = this.usageStats.membersCount;
    } else {
        current = this.usageStats.featureUsage[type]?.count || 0;
    }
    
    return Math.min((current / limits[type]) * 100, 100);
};

module.exports = mongoose.model("Owner", ownerSchema);