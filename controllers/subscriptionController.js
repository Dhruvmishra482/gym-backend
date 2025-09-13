// controllers/subscriptionController.js - PART 1

const Owner = require("../models/Owner");
const Member = require("../models/Member");
const { mailSender } = require("../utils/mailSender");
const { PLAN_CONFIG } = require("../config/planConfig");
const {
  createExpiryEmailTemplate,
  createPostExpiryEmailTemplate,
  createUpgradeSuccessTemplate,
} = require("../templates/subscriptionEmailTemplates");

// Get comprehensive subscription details with usage analytics
exports.getSubscriptionDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await Owner.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
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
        percentage:
          planLimits.members === -1
            ? 0
            : Math.min((actualMemberCount / planLimits.members) * 100, 100),
        remaining:
          planLimits.members === -1
            ? "Unlimited"
            : Math.max(planLimits.members - actualMemberCount, 0),
      },
      whatsappReminders: {
        current: user.usageStats.featureUsage.whatsappReminders.count,
        limit: planLimits.whatsappReminders,
        percentage: user.getUsagePercentage("whatsappReminders"),
        remaining:
          planLimits.whatsappReminders === -1
            ? "Unlimited"
            : Math.max(
                planLimits.whatsappReminders -
                  user.usageStats.featureUsage.whatsappReminders.count,
                0
              ),
      },
      analyticsViews: {
        current: user.usageStats.featureUsage.analyticsViews.count,
        limit: planLimits.analyticsViews,
        percentage: user.getUsagePercentage("analyticsViews"),
        remaining:
          planLimits.analyticsViews === -1
            ? "Unlimited"
            : Math.max(
                planLimits.analyticsViews -
                  user.usageStats.featureUsage.analyticsViews.count,
                0
              ),
      },
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
          features: planConfig.features,
        },
        usage: usageAnalytics,
        limits: planLimits,
        trends: monthlyTrends,
        billing: {
          nextPayment: subscriptionStatus.expiry,
          amount: planConfig.monthlyPrice,
          currency: "INR",
          cycleInfo: user.getBillingCycleStatus(),
        },
      },
    });
  } catch (error) {
    console.error("Get subscription details error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve subscription details",
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
        message: "User not found",
      });
    }

    const currentUsage = {
      members: user.usageStats.membersCount,
      whatsappReminders: user.usageStats.featureUsage.whatsappReminders.count,
      analyticsViews: user.usageStats.featureUsage.analyticsViews.count,
    };

    const plans = Object.keys(PLAN_CONFIG)
      .filter((plan) => plan !== "NONE")
      .map((planKey) => {
        const plan = PLAN_CONFIG[planKey];
        return {
          id: planKey,
          name: plan.name,
          monthlyPrice: plan.monthlyPrice,
          yearlyPrice: plan.yearlyPrice,
          savings: plan.yearlyPrice
            ? `Save ₹${plan.monthlyPrice * 12 - plan.yearlyPrice}`
            : null,
          limits: plan.limits,
          features: plan.features,
          current: user.subscriptionPlan === planKey,
          recommended:
            currentUsage.members > plan.limits.members * 0.8 &&
            planKey !== user.subscriptionPlan,
          canFitUsage:
            plan.limits.members === -1 ||
            currentUsage.members <= plan.limits.members,
        };
      });

    return res.status(200).json({
      success: true,
      data: {
        plans,
        currentUsage,
      },
    });
  } catch (error) {
    console.error("Get plan comparison error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve plan comparison",
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
        message: "User not found",
      });
    }

    if (!PLAN_CONFIG[targetPlan]) {
      return res.status(400).json({
        success: false,
        message: "Invalid target plan",
      });
    }

    const currentPlan = PLAN_CONFIG[user.subscriptionPlan];
    const newPlan = PLAN_CONFIG[targetPlan];

    const subscriptionStatus = user.getSubscriptionStatus();
    const daysLeft = subscriptionStatus.daysLeft || 0;

    let proratedDiscount = 0;
    let newPrice =
      billing === "yearly" ? newPlan.yearlyPrice : newPlan.monthlyPrice;

    // Calculate prorated discount for remaining days
    if (daysLeft > 0 && user.subscriptionPlan !== "NONE") {
      const currentPrice =
        billing === "yearly"
          ? currentPlan.yearlyPrice
          : currentPlan.monthlyPrice;
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
          daysLeft,
        },
        breakdown: {
          newPlanPrice: newPrice,
          creditForRemainingDays: proratedDiscount,
          youPay: finalPrice,
        },
      },
    });
  } catch (error) {
    console.error("Calculate upgrade price error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to calculate upgrade price",
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
        message: "User not found",
      });
    }

    const planLimits = user.getPlanLimits();
    let canPerform = false;
    let currentUsage = 0;
    let limit = 0;
    let message = "";

    switch (action) {
      case "members":
        currentUsage = user.usageStats.membersCount;
        limit = planLimits.members;
        canPerform = limit === -1 || currentUsage + count <= limit;
        message = canPerform
          ? `You can add ${count} more member(s)`
          : `Member limit reached (${currentUsage}/${limit}). Upgrade to add more members.`;
        break;

      case "whatsappReminders":
        currentUsage = user.usageStats.featureUsage.whatsappReminders.count;
        limit = planLimits.whatsappReminders;
        canPerform = limit === -1 || currentUsage + count <= limit;
        message = canPerform
          ? `You can send ${count} more reminder(s)`
          : `WhatsApp reminder limit reached (${currentUsage}/${limit}). Upgrade for more reminders.`;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid action type",
        });
    }

    return res.status(200).json({
      success: true,
      data: {
        canPerform,
        currentUsage,
        limit: limit === -1 ? "Unlimited" : limit,
        remaining:
          limit === -1 ? "Unlimited" : Math.max(limit - currentUsage, 0),
        message,
        upgradeRequired: !canPerform,
      },
    });
  } catch (error) {
    console.error("Check usage limit error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check usage limit",
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
        message: "User not found",
      });
    }

    await user.trackFeatureUsage(feature);

    return res.status(200).json({
      success: true,
      message: "Feature usage tracked successfully",
    });
  } catch (error) {
    console.error("Track feature usage error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to track feature usage",
    });
  }
};
// controllers/subscriptionController.js - PART 2

// Send expiry reminder emails (called by scheduler)
exports.sendExpiryReminders = async (req, res) => {
  try {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const today = new Date(now.toDateString());
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    let emailsSent = 0;

    // Find users with subscriptions expiring in 7 days
    const users7Days = await Owner.find({
      subscriptionPlan: { $ne: "NONE" },
      subscriptionExpiry: {
        $gte: new Date(in7Days.toDateString()),
        $lt: new Date(in7Days.getTime() + 24 * 60 * 60 * 1000),
      },
      "notificationSettings.expiryReminders.enabled": true,
      "notificationSettings.expiryReminders.emailSent7Days": false,
    });

    // Send 7-day reminders
    for (let user of users7Days) {
      try {
        const template = createExpiryEmailTemplate(
          `${user.firstName} ${user.lastName}`,
          7,
          PLAN_CONFIG[user.subscriptionPlan].name
        );

        await mailSender(user.email, template.subject, template.html);

        user.notificationSettings.expiryReminders.emailSent7Days = true;
        await user.save();
        emailsSent++;
      } catch (emailError) {
        console.error(
          `Failed to send 7-day reminder to ${user.email}:`,
          emailError
        );
      }
    }

    // Find users with subscriptions expiring in 3 days
    const users3Days = await Owner.find({
      subscriptionPlan: { $ne: "NONE" },
      subscriptionExpiry: {
        $gte: new Date(in3Days.toDateString()),
        $lt: new Date(in3Days.getTime() + 24 * 60 * 60 * 1000),
      },
      "notificationSettings.expiryReminders.enabled": true,
      "notificationSettings.expiryReminders.emailSent3Days": false,
    });

    // Send 3-day reminders
    for (let user of users3Days) {
      try {
        const template = createExpiryEmailTemplate(
          `${user.firstName} ${user.lastName}`,
          3,
          PLAN_CONFIG[user.subscriptionPlan].name
        );

        await mailSender(user.email, template.subject, template.html);

        user.notificationSettings.expiryReminders.emailSent3Days = true;
        await user.save();
        emailsSent++;
      } catch (emailError) {
        console.error(
          `Failed to send 3-day reminder to ${user.email}:`,
          emailError
        );
      }
    }

    // Find users with subscriptions expiring today
    const usersToday = await Owner.find({
      subscriptionPlan: { $ne: "NONE" },
      subscriptionExpiry: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
      "notificationSettings.expiryReminders.enabled": true,
      "notificationSettings.expiryReminders.emailSentExpiry": false,
    });

    // Send expiry day reminders
    for (let user of usersToday) {
      try {
        const template = createExpiryEmailTemplate(
          `${user.firstName} ${user.lastName}`,
          1,
          PLAN_CONFIG[user.subscriptionPlan].name
        );

        await mailSender(user.email, template.subject, template.html);

        user.notificationSettings.expiryReminders.emailSentExpiry = true;
        await user.save();
        emailsSent++;
      } catch (emailError) {
        console.error(
          `Failed to send expiry reminder to ${user.email}:`,
          emailError
        );
      }
    }

    // Find users with subscriptions that expired yesterday (post-expiry)
    const usersExpired = await Owner.find({
      subscriptionPlan: "NONE",
      subscriptionExpiry: {
        $gte: new Date(yesterday.toDateString()),
        $lt: today,
      },
      "notificationSettings.expiryReminders.enabled": true,
      "notificationSettings.expiryReminders.emailSentPostExpiry": false,
    });

    // Send post-expiry reminders
    for (let user of usersExpired) {
      try {
        const template = createPostExpiryEmailTemplate(
          `${user.firstName} ${user.lastName}`,
          "Basic Plan" // Default plan name for expired users
        );

        await mailSender(user.email, template.subject, template.html);

        user.notificationSettings.expiryReminders.emailSentPostExpiry = true;
        await user.save();
        emailsSent++;
      } catch (emailError) {
        console.error(
          `Failed to send post-expiry reminder to ${user.email}:`,
          emailError
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: `Expiry reminder emails sent successfully`,
      data: {
        emailsSent,
        breakdown: {
          sevenDay: users7Days.length,
          threeDay: users3Days.length,
          expiryDay: usersToday.length,
          postExpiry: usersExpired.length,
        },
      },
    });
  } catch (error) {
    console.error("Send expiry reminders error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send expiry reminders",
    });
  }
};
exports.processUpgrade = async (req, res) => {
    try {
        const { targetPlan, billing = "monthly", paymentId, orderId } = req.body;
        const userId = req.user.id;
        const user = await Owner.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (!PLAN_CONFIG[targetPlan]) {
            return res.status(400).json({
                success: false,
                message: "Invalid target plan",
            });
        }

        const oldPlan = user.subscriptionPlan;
        const oldPlanName = PLAN_CONFIG[oldPlan].name;
        const newPlanName = PLAN_CONFIG[targetPlan].name;

        // Calculate pricing
        const subscriptionStatus = user.getSubscriptionStatus();
        const daysLeft = subscriptionStatus.daysLeft || 0;
        const newPlan = PLAN_CONFIG[targetPlan];
        const newPrice = billing === "yearly" ? newPlan.yearlyPrice : newPlan.monthlyPrice;

        let proratedDiscount = 0;
        if (daysLeft > 0 && oldPlan !== "NONE") {
            const currentPlan = PLAN_CONFIG[oldPlan];
            const currentPrice = billing === "yearly" ? currentPlan.yearlyPrice : currentPlan.monthlyPrice;
            const dailyRate = currentPrice / (billing === "yearly" ? 365 : 30);
            proratedDiscount = Math.floor(dailyRate * daysLeft);
        }

        // FIXED: Calculate new expiry date properly for early renewals
        const currentExpiry = user.subscriptionExpiry;
        const now = new Date();
        const duration = billing === "yearly" ? 365 : 30;
        let newExpiryDate;

        if (currentExpiry && currentExpiry > now) {
            // Early renewal: Extend from current expiry date
            newExpiryDate = new Date(currentExpiry);
            if (billing === "yearly") {
                newExpiryDate.setFullYear(currentExpiry.getFullYear() + 1);
            } else {
                newExpiryDate.setDate(currentExpiry.getDate() + 30);
                // Handle month overflow (e.g., Jan 31 + 30 days)
                if (newExpiryDate.getDate() !== currentExpiry.getDate()) {
                    newExpiryDate.setDate(0); // Go to last day of previous month
                }
            }
        } else {
            // Late renewal or expired plan: Start from today
            newExpiryDate = new Date(now);
            if (billing === "yearly") {
                newExpiryDate.setFullYear(now.getFullYear() + 1);
            } else {
                newExpiryDate.setDate(now.getDate() + 30);
            }
        }

        // Update subscription
        user.subscriptionPlan = targetPlan;
        user.subscriptionExpiry = newExpiryDate;

        // FIXED: Initialize or update billing cycle for new subscription
        if (!user.billingCycle.startDate || oldPlan === "NONE") {
            // First time subscription - initialize billing cycle
            user.initializeBillingCycle(billing);
        } else {
            // Existing subscription upgrade - update cycle based on renewal type
            if (currentExpiry && currentExpiry > now) {
                // Early renewal: Keep existing cycle, just extend end date
                user.billingCycle.cycleType = billing;
                user.billingCycle.nextResetDate = new Date(newExpiryDate);
            } else {
                // Late renewal: Start fresh billing cycle
                user.initializeBillingCycle(billing);
            }
        }

        // Reset notification flags for new subscription
        user.notificationSettings.expiryReminders.emailSent7Days = false;
        user.notificationSettings.expiryReminders.emailSent3Days = false;
        user.notificationSettings.expiryReminders.emailSentExpiry = false;
        user.notificationSettings.expiryReminders.emailSentPostExpiry = false;

        // Add to payment history
        user.paymentHistory.push({
            orderId: orderId || `upgrade_${Date.now()}`,
            paymentId: paymentId || `upgrade_${Date.now()}`,
            amount: newPrice - proratedDiscount,
            currency: "INR",
            billing: billing,
            status: "SUCCESS",
            plan: targetPlan,
            createdAt: new Date(),
            renewalType: (currentExpiry && currentExpiry > now) ? "early" : "late"
        });

        await user.save();

        // Send upgrade success email
        try {
            const template = createUpgradeSuccessTemplate(
                `${user.firstName} ${user.lastName}`,
                oldPlanName,
                newPlanName,
                proratedDiscount
            );

            await mailSender(user.email, template.subject, template.html);
        } catch (emailError) {
            console.error("Failed to send upgrade success email:", emailError);
        }

        // Calculate renewal details for response
        const renewalType = (currentExpiry && currentExpiry > now) ? "early" : "late";
        const daysExtended = renewalType === "early" ? daysLeft : 0;

        return res.status(200).json({
            success: true,
            message: "Subscription upgraded successfully",
            data: {
                oldPlan,
                newPlan: targetPlan,
                oldExpiry: currentExpiry,
                newExpiry: newExpiryDate,
                savings: proratedDiscount,
                renewalType: renewalType,
                daysExtended: daysExtended,
                subscription: user.getSubscriptionStatus(),
                billingCycle: user.getBillingCycleStatus()
            },
        });

    } catch (error) {
        console.error("Process upgrade error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to process upgrade",
        });
    }
};

// // Reset monthly usage stats (called by scheduler)
// exports.resetMonthlyUsage = async (req, res) => {
//   try {
//     const currentMonth = new Date().toISOString().substring(0, 7);

//     const users = await Owner.find({
//       subscriptionPlan: { $ne: "NONE" },
//     });

//     let usersUpdated = 0;

//     for (let user of users) {
//       // Check if current month stats already exist
//       const monthlyRecord = user.usageStats.monthlyStats.find(
//         (stat) => stat.month === currentMonth
//       );

//       if (!monthlyRecord) {
//         // Create new monthly record
//         user.usageStats.monthlyStats.push({
//           month: currentMonth,
//           membersAdded: 0,
//           featuresUsed: {
//             whatsappReminders: 0,
//             analyticsViews: 0,
//             searchQueries: 0,
//           },
//         });

//         // Keep only last 12 months of data
//         user.usageStats.monthlyStats = user.usageStats.monthlyStats
//           .sort((a, b) => b.month.localeCompare(a.month))
//           .slice(0, 12);

//         await user.save();
//         usersUpdated++;
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Monthly usage stats reset successfully",
//       data: {
//         usersUpdated,
//         currentMonth,
//       },
//     });
//   } catch (error) {
//     console.error("Reset monthly usage error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to reset monthly usage",
//     });
//   }
// };
// WITH THIS NEW FUNCTION:
exports.resetCustomBillingCycles = async (req, res) => {
  try {
    const now = new Date();
    console.log(`Running billing cycle reset check at ${now.toISOString()}`);

    // Find users whose billing cycle has ended
    const usersToReset = await Owner.find({
      subscriptionPlan: { $ne: "NONE" },
      "billingCycle.nextResetDate": { $lte: now },
    });

    let usersUpdated = 0;

    for (let user of usersToReset) {
      // Reset usage using new model method
      user.resetUsageCycle();
      await user.save();
      usersUpdated++;

      console.log(`Reset billing cycle for user ${user.email}`);
    }

    return res.status(200).json({
      success: true,
      message: "Custom billing cycles reset successfully",
      data: {
        usersUpdated,
        timestamp: now,
      },
    });
  } catch (error) {
    console.error("Reset billing cycles error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset billing cycles",
    });
  }
};
// Update notification preferences
exports.updateNotificationSettings = async (req, res) => {
  try {
    const { expiryReminders } = req.body;
    const userId = req.user.id;
    const user = await Owner.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (expiryReminders !== undefined) {
      user.notificationSettings.expiryReminders.enabled = expiryReminders;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Notification settings updated successfully",
      data: {
        notificationSettings: user.notificationSettings,
      },
    });
  } catch (error) {
    console.error("Update notification settings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update notification settings",
    });
  }
};// Add this function to subscriptionController.js
exports.syncMemberCounts = async (req, res) => {
    try {
        const owners = await Owner.find({ 
            subscriptionPlan: { $ne: "NONE" } 
        });
        
        let syncedUsers = 0;
        
        for (let owner of owners) {
            const actualCount = await Member.countDocuments({ 
                ownerId: owner._id 
            });
            
            if (owner.usageStats.membersCount !== actualCount) {
                console.log(`Syncing ${owner.email}: ${owner.usageStats.membersCount} → ${actualCount}`);
                owner.usageStats.membersCount = actualCount;
                owner.usageStats.lastMemberCountUpdate = new Date();
                await owner.save();
                syncedUsers++;
            }
        }
        
        return res ? res.status(200).json({
            success: true,
            message: "Member count sync completed",
            data: { syncedUsers, totalChecked: owners.length }
        }) : { syncedUsers, totalChecked: owners.length };
        
    } catch (error) {
        console.error("Member count sync error:", error);
        if (res) {
            return res.status(500).json({
                success: false,
                message: "Failed to sync member counts"
            });
        }
        throw error;
    }
};
exports.getUsageAnalytics = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await Owner.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const planLimits = user.getPlanLimits();
        
        const currentUsage = {
            members: {
                used: user.usageStats.membersCount,
                limit: planLimits.members,
                percentage: user.getUsagePercentage('members')
            },
            whatsappReminders: {
                used: user.usageStats.featureUsage.whatsappReminders.count,
                limit: planLimits.whatsappReminders,
                percentage: user.getUsagePercentage('whatsappReminders')
            },
            analyticsViews: {
                used: user.usageStats.featureUsage.analyticsViews.count,
                limit: planLimits.analyticsViews,
                percentage: user.getUsagePercentage('analyticsViews')
            }
        };

        // Generate warnings for high usage (90%+)
        const warnings = [];
        if (currentUsage.members.percentage >= 90) {
            warnings.push({
                type: "members",
                message: "You're approaching your member limit. Consider upgrading your plan."
            });
        }
        if (currentUsage.whatsappReminders.percentage >= 90) {
            warnings.push({
                type: "whatsappReminders",
                message: "You're approaching your WhatsApp reminder limit."
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                currentUsage,
                warnings,
                plan: {
                    name: PLAN_CONFIG[user.subscriptionPlan].name,
                    features: PLAN_CONFIG[user.subscriptionPlan].features
                }
            }
        });

    } catch (error) {
        console.error("Get usage analytics error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve usage analytics"
        });
    }
};