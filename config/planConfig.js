// config/planConfig.js

const PLAN_CONFIG = {
    NONE: {
        name: "No Subscription",
        monthlyPrice: 0,
        yearlyPrice: 0,
        limits: {
            members: 0,
            whatsappReminders: 0,
            analyticsViews: 0,
            searchQueries: 0
        },
        features: ["Limited access only"]
    },
    BASIC: {
        name: "Basic Plan",
        monthlyPrice: 399,
        yearlyPrice: 3990,
        limits: {
            members: 150,
            whatsappReminders: 1000,
            analyticsViews: 500,
            searchQueries: 1000
        },
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
        name: "Advanced Plan",
        monthlyPrice: 799,
        yearlyPrice: 7990,
        limits: {
            members: 500,
            whatsappReminders: 5000,
            analyticsViews: 2000,
            searchQueries: 5000
        },
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
        name: "Enterprise Plan",
        monthlyPrice: 1599,
        yearlyPrice: 15990,
        limits: {
            members: -1, // Unlimited
            whatsappReminders: -1,
            analyticsViews: -1,
            searchQueries: -1
        },
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

module.exports = { PLAN_CONFIG };