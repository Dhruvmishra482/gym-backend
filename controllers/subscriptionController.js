// controllers/subscriptionController.js - PART 1

const Owner = require("../models/Owner");
const Member = require("../models/Member");
const { mailSender } = require("../utils/mailSender");
const { PLAN_CONFIG } = require("../config/planConfig");
const { 
    createExpiryEmailTemplate, 
    createPostExpiryEmailTemplate, 
    createUpgradeSuccessTemplate 
} = require("../templates/subscriptionEmailTemplates");

// Get comprehensive subscription details with usage analytics
exports.getSubscriptionDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await Owner.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Get actual member count from database
        const actualMemberCount = await Member.countDocuments({ ownerId: userId });
        
        // Update user's member count if it's incorrect
        if (user.usageStats.membersCount !== actualMemberCount) {
            user.usageStats.membersCount = actualMemberCount;
            await user.save();
        }

        const subscriptionStatus = user.getSubscriptionStatus();
        const planLimits = user.getPlanLimits();
        const planConfig = PLAN_CONFIG[user.subscriptionPlan];

        // Calculate usage percentages
        const usageAnalytics = {
            members: {
                current: actualMemberCount,
                limit: planLimits.members,
                percentage: planLimits.members === -1 ? 0 : Math.min((actualMemberCount / planLimits.members) * 100, 100),
                remaining: planLimits.members === -1 ? "Unlimited" : Math.max(planLimits.members - actualMemberCount, 0)
            },
            whatsappReminders: {
                current: user.usageStats.featureUsage.whatsappReminders.count,
                limit: planLimits.whatsappReminders,
                percentage: user.getUsagePercentage('whatsappReminders'),
                remaining: planLimits.whatsappReminders === -1 ? "Unlimited" : Math.max(planLimits.whatsappReminders - user.usageStats.featureUsage.whatsappReminders.count, 0)
            },
            analyticsViews: {
                current: user.usageStats.featureUsage.analyticsViews.count,
                limit: planLimits.analyticsViews,
                percentage: user.getUsagePercentage('analyticsViews'),
                remaining: planLimits.analyticsViews === -1 ? "Unlimited" : Math.max(planLimits.analyticsViews - user.usageStats.featureUsage.analyticsViews.count, 0)
            }
        };

        // Monthly trends (last 6 months)
        const monthlyTrends = user.usageStats.monthlyStats
            .sort((a, b) => b.month.localeCompare(a.month))
            .slice(0, 6)
            .reverse();

        return res.status(200).json({
            success: true,
            data: {
                subscription: subscriptionStatus,
                plan: {
                    current: user.subscriptionPlan,
                    name: planConfig.name,
                    features: planConfig.features
                },
                usage: usageAnalytics,
                limits: planLimits,
                trends: monthlyTrends,
                billing: {
                    nextPayment: subscriptionStatus.expiry,
                    amount: planConfig.monthlyPrice,
                    currency: "INR"
                }
            }
        });

    } catch (error) {
        console.error("Get subscription details error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve subscription details"
        });
    }
};

// Get plan comparison with current usage context
exports.getPlanComparison = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await Owner.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const currentUsage = {
            members: user.usageStats.membersCount,
            whatsappReminders: user.usageStats.featureUsage.whatsappReminders.count,
            analyticsViews: user.usageStats.featureUsage.analyticsViews.count
        };

        const plans = Object.keys(PLAN_CONFIG).filter(plan => plan !== 'NONE').map(planKey => {
            const plan = PLAN_CONFIG[planKey];
            return {
                id: planKey,
                name: plan.name,
                monthlyPrice: plan.monthlyPrice,
                yearlyPrice: plan.yearlyPrice,
                savings: plan.yearlyPrice ? `Save ₹${(plan.monthlyPrice * 12) - plan.yearlyPrice}` : null,
                limits: plan.limits,
                features: plan.features,
                current: user.subscriptionPlan === planKey,
                recommended: currentUsage.members > (plan.limits.members * 0.8) && planKey !== user.subscriptionPlan,
                canFitUsage: plan.limits.members === -1 || currentUsage.members <= plan.limits.members
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                plans,
                currentUsage
            }
        });

    } catch (error) {
        console.error("Get plan comparison error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve plan comparison"
        });
    }
};

// Calculate prorated upgrade pricing
exports.calculateUpgradePrice = async (req, res) => {
    try {
        const { targetPlan, billing = "monthly" } = req.body;
        const userId = req.user.id;
        const user = await Owner.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!PLAN_CONFIG[targetPlan]) {
            return res.status(400).json({
                success: false,
                message: "Invalid target plan"
            });
        }

        const currentPlan = PLAN_CONFIG[user.subscriptionPlan];
        const newPlan = PLAN_CONFIG[targetPlan];
        
        const subscriptionStatus = user.getSubscriptionStatus();
        const daysLeft = subscriptionStatus.daysLeft || 0;

        let proratedDiscount = 0;
        let newPrice = billing === "yearly" ? newPlan.yearlyPrice : newPlan.monthlyPrice;

        // Calculate prorated discount for remaining days
        if (daysLeft > 0 && user.subscriptionPlan !== "NONE") {
            const currentPrice = billing === "yearly" ? currentPlan.yearlyPrice : currentPlan.monthlyPrice;
            const dailyRate = currentPrice / (billing === "yearly" ? 365 : 30);
            proratedDiscount = Math.floor(dailyRate * daysLeft);
        }

        const finalPrice = Math.max(newPrice - proratedDiscount, 0);
        const savings = newPrice - finalPrice;

        return res.status(200).json({
            success: true,
            data: {
                currentPlan: user.subscriptionPlan,
                targetPlan,
                billing,
                pricing: {
                    originalPrice: newPrice,
                    proratedDiscount,
                    finalPrice,
                    savings,
                    daysLeft
                },
                breakdown: {
                    newPlanPrice: newPrice,
                    creditForRemainingDays: proratedDiscount,
                    youPay: finalPrice
                }
            }
        });

    } catch (error) {
        console.error("Calculate upgrade price error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to calculate upgrade price"
        });
    }
};

// Check if user can perform an action (member addition, feature usage)
exports.checkUsageLimit = async (req, res) => {
    try {
        const { action, count = 1 } = req.body; // action: 'members', 'whatsappReminders', etc.
        const userId = req.user.id;
        const user = await Owner.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const planLimits = user.getPlanLimits();
        let canPerform = false;
        let currentUsage = 0;
        let limit = 0;
        let message = "";

        switch (action) {
            case 'members':
                currentUsage = user.usageStats.membersCount;
                limit = planLimits.members;
                canPerform = limit === -1 || (currentUsage + count) <= limit;
                message = canPerform 
                    ? `You can add ${count} more member(s)` 
                    : `Member limit reached (${currentUsage}/${limit}). Upgrade to add more members.`;
                break;
                
            case 'whatsappReminders':
                currentUsage = user.usageStats.featureUsage.whatsappReminders.count;
                limit = planLimits.whatsappReminders;
                canPerform = limit === -1 || (currentUsage + count) <= limit;
                message = canPerform 
                    ? `You can send ${count} more reminder(s)` 
                    : `WhatsApp reminder limit reached (${currentUsage}/${limit}). Upgrade for more reminders.`;
                break;
                
            default:
                return res.status(400).json({
                    success: false,
                    message: "Invalid action type"
                });
        }

        return res.status(200).json({
            success: true,
            data: {
                canPerform,
                currentUsage,
                limit: limit === -1 ? "Unlimited" : limit,
                remaining: limit === -1 ? "Unlimited" : Math.max(limit - currentUsage, 0),
                message,
                upgradeRequired: !canPerform
            }
        });

    } catch (error) {
        console.error("Check usage limit error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to check usage limit"
        });
    }
};

// Track feature usage (called by other controllers)
exports.trackFeatureUsage = async (req, res) => {
    try {
        const { feature } = req.body; // 'whatsappReminders', 'analyticsViews', 'searchQueries'
        const userId = req.user.id;
        const user = await Owner.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        await user.trackFeatureUsage(feature);

        return res.status(200).json({
            success: true,
            message: "Feature usage tracked successfully"
        });

    } catch (error) {
        console.error("Track feature usage error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to track feature usage"
        });
    }
};