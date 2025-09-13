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
        
        // NEW: CUSTOM BILLING CYCLE TRACKING
        billingCycle: {
            startDate: {
                type: Date,
                default: Date.now
            },
            nextResetDate: {
                type: Date,
                default: function() {
                    // Default to 30 days from subscription start
                    return new Date(Date.now() + (30 * 24 * 60 * 60 * 1000));
                }
            },
            billingDay: {
                type: Number,
                default: function() {
                    return new Date().getDate(); // Day of month when user subscribed
                }
            },
            lastResetDate: {
                type: Date,
                default: Date.now
            },
            cycleType: {
                type: String,
                enum: ["monthly", "yearly"],
                default: "monthly"
            }
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
        
        // UPDATED: USAGE TRACKING FIELDS
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
            // UPDATED: Monthly stats now tracks billing cycles
            monthlyStats: [{
                cycleId: String, // Format: "2025-01-15_2025-02-15"
                cycleStart: Date,
                cycleEnd: Date,
                membersAdded: { type: Number, default: 0 },
                featuresUsed: {
                    whatsappReminders: { type: Number, default: 0 },
                    analyticsViews: { type: Number, default: 0 },
                    searchQueries: { type: Number, default: 0 }
                }
            }]
        },
        
        // EXISTING NOTIFICATION TRACKING
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

// NEW BILLING CYCLE METHODS
ownerSchema.methods.calculateNextResetDate = function(billingType = "monthly") {
    const startDate = this.billingCycle.startDate || new Date();
    const nextReset = new Date(startDate);
    
    if (billingType === "yearly") {
        nextReset.setFullYear(startDate.getFullYear() + 1);
    } else {
        // Monthly billing - add 30 days from start date
        nextReset.setDate(startDate.getDate() + 30);
    }
    
    return nextReset;
};

ownerSchema.methods.shouldResetUsage = function() {
    const now = new Date();
    return now >= this.billingCycle.nextResetDate;
};

ownerSchema.methods.initializeBillingCycle = function(billingType = "monthly") {
    const now = new Date();
    this.billingCycle.startDate = now;
    this.billingCycle.lastResetDate = now;
    this.billingCycle.billingDay = now.getDate();
    this.billingCycle.cycleType = billingType;
    this.billingCycle.nextResetDate = this.calculateNextResetDate(billingType);
};

ownerSchema.methods.resetUsageCycle = function() {
    const now = new Date();
    const oldResetDate = this.billingCycle.nextResetDate;
    
    // Store current cycle data in history
    const cycleId = `${this.billingCycle.lastResetDate.toISOString().substring(0, 10)}_${oldResetDate.toISOString().substring(0, 10)}`;
    
    this.usageStats.monthlyStats.push({
        cycleId: cycleId,
        cycleStart: this.billingCycle.lastResetDate,
        cycleEnd: oldResetDate,
        membersAdded: this.usageStats.membersCount,
        featuresUsed: {
            whatsappReminders: this.usageStats.featureUsage.whatsappReminders.count,
            analyticsViews: this.usageStats.featureUsage.analyticsViews.count,
            searchQueries: this.usageStats.featureUsage.searchQueries.count
        }
    });
    
    // Keep only last 12 cycles
    this.usageStats.monthlyStats = this.usageStats.monthlyStats
        .sort((a, b) => new Date(b.cycleStart) - new Date(a.cycleStart))
        .slice(0, 12);
    
    // Reset usage counters
    this.usageStats.featureUsage.whatsappReminders.count = 0;
    this.usageStats.featureUsage.analyticsViews.count = 0;
    this.usageStats.featureUsage.searchQueries.count = 0;
    
    // Update billing cycle dates
    this.billingCycle.lastResetDate = oldResetDate;
    this.billingCycle.nextResetDate = this.calculateNextResetDate(this.billingCycle.cycleType);
};

// UPDATED METHODS - BILLING CYCLE AWARE
ownerSchema.methods.incrementMemberCount = async function() {
    this.usageStats.membersCount += 1;
    this.usageStats.lastMemberCountUpdate = new Date();
    
    // Update current cycle stats if exists
    const currentCycle = this.usageStats.monthlyStats[this.usageStats.monthlyStats.length - 1];
    if (currentCycle && currentCycle.cycleEnd > new Date()) {
        currentCycle.membersAdded += 1;
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
    
    // Update current cycle stats if exists
    const currentCycle = this.usageStats.monthlyStats[this.usageStats.monthlyStats.length - 1];
    if (currentCycle && currentCycle.cycleEnd > new Date()) {
        currentCycle.featuresUsed[featureName] += 1;
    }
    
    return await this.save();
};

// EXISTING METHODS - UNCHANGED
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

// NEW: Billing cycle status
ownerSchema.methods.getBillingCycleStatus = function() {
    const now = new Date();
    const daysUntilReset = Math.ceil((this.billingCycle.nextResetDate - now) / (1000 * 60 * 60 * 24));
    const totalCycleDays = this.billingCycle.cycleType === "yearly" ? 365 : 30;
    const daysSinceReset = totalCycleDays - daysUntilReset;
    
    return {
        nextResetDate: this.billingCycle.nextResetDate,
        daysUntilReset: Math.max(daysUntilReset, 0),
        cycleProgress: Math.min((daysSinceReset / totalCycleDays) * 100, 100),
        cycleType: this.billingCycle.cycleType,
        shouldReset: this.shouldResetUsage()
    };
};

module.exports = mongoose.model("Owner", ownerSchema);