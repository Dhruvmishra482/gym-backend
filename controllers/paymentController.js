const Razorpay = require("razorpay");
const crypto = require("crypto");
const Owner = require("../models/Owner");
const { mailSender } = require("../utils/mailSender");
const { 
  paymentSuccessTemplate, 
  paymentFailureTemplate, 
  welcomePremiumTemplate 
} = require("../templates/paymentTemplate");

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, // Add your Razorpay key ID in env
  key_secret: process.env.RAZORPAY_KEY_SECRET, // Add your Razorpay secret in env
});

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  BASIC: {
    name: "Basic",
    tagline: "Start Your Gym Journey", 
    description: "Perfect for small gyms and personal trainers who want to digitize and automate their operations.",
    monthlyAmount: 399,
    yearlyAmount: 3990,
    currency: "INR",
    monthlyDuration: 30,
    yearlyDuration: 365,
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
    ],
    savings: "Save ₹798 yearly"
  }
};

// FIXED: Initiate payment process with billing cycle support
exports.initiatePayment = async (req, res) => {
  try {
    const { plan, billing = "monthly" } = req.body; // FIXED: Extract billing parameter
    const userId = req.user.id;

    // Validate plan
    if (!plan || !SUBSCRIPTION_PLANS[plan]) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription plan selected"
      });
    }

    // Validate billing cycle
    if (!["monthly", "yearly"].includes(billing)) {
      return res.status(400).json({
        success: false,
        message: "Invalid billing cycle. Must be 'monthly' or 'yearly'"
      });
    }

    // Get user details
    const user = await Owner.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user is already on this plan or higher
    if (user.subscriptionPlan === plan && user.hasActiveSubscription()) {
      return res.status(400).json({
        success: false,
        message: `You already have an active ${plan} subscription`
      });
    }

    const selectedPlan = SUBSCRIPTION_PLANS[plan];
    const amount = billing === "yearly" ? selectedPlan.yearlyAmount : selectedPlan.monthlyAmount; // FIXED
    const duration = billing === "yearly" ? selectedPlan.yearlyDuration : selectedPlan.monthlyDuration; // FIXED
    
    // Create Razorpay order
    const orderOptions = {
      amount: amount * 100, // Convert to paise
      currency: selectedPlan.currency,
      receipt: `order_${userId}_${Date.now()}`,
      notes: {
        userId: userId,
        plan: plan,
        billing: billing, // FIXED: Add billing to notes
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`
      }
    };

    const order = await razorpay.orders.create(orderOptions);

    if (!order) {
      return res.status(500).json({
        success: false,
        message: "Failed to create payment order"
      });
    }

    // Save order details temporarily
    user.paymentHistory.push({
      orderId: order.id,
      amount: amount, // FIXED: Use calculated amount
      currency: selectedPlan.currency,
      billing: billing, // FIXED: Save billing cycle
      status: "PENDING",
      plan: plan
    });
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Payment order created successfully",
      data: {
        orderId: order.id,
        amount: amount, // FIXED: Return calculated amount
        currency: selectedPlan.currency,
        planName: selectedPlan.name,
        billing: billing, // FIXED: Return billing cycle
        duration: duration, // FIXED: Return duration
        key: process.env.RAZORPAY_KEY_ID,
        user: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          contact: user.mobileNumber
        }
      }
    });

  } catch (error) {
    console.error("Payment initiation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to initiate payment process"
    });
  }
};

// Verify payment and update subscription
exports.verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature 
    } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification details"
      });
    }

    // Create signature for verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    // Verify signature
    if (expectedSignature !== razorpay_signature) {
      // Payment signature verification failed
      await this.handlePaymentFailure(razorpay_order_id, "Invalid payment signature");
      
      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Invalid signature."
      });
    }

    // Signature verified - process successful payment
    const result = await this.handlePaymentSuccess(
      razorpay_payment_id, 
      razorpay_order_id, 
      req.user.id
    );

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: "Payment verified and subscription activated successfully",
        data: {
          user: result.user,
          subscription: result.subscription
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed"
    });
  }
};

// FIXED: Handle successful payment with billing cycle support
exports.handlePaymentSuccess = async (paymentId, orderId, userId) => {
  try {
    // Find user and the payment record
    const user = await Owner.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Find the payment record
    const paymentRecord = user.paymentHistory.find(
      payment => payment.orderId === orderId
    );

    if (!paymentRecord) {
      throw new Error("Payment record not found");
    }

    // Calculate subscription expiry date based on billing cycle
    const plan = paymentRecord.plan;
    const billing = paymentRecord.billing || "monthly";
    const selectedPlan = SUBSCRIPTION_PLANS[plan];
    
    if (!selectedPlan) {
      throw new Error("Invalid subscription plan");
    }

    const duration = billing === "yearly" ? selectedPlan.yearlyDuration : selectedPlan.monthlyDuration; // FIXED
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + duration);

    // Update user subscription
    user.subscriptionPlan = plan;
    user.subscriptionExpiry = expiryDate;

    // Update payment record
    paymentRecord.paymentId = paymentId;
    paymentRecord.status = "SUCCESS";

    await user.save();

    // Send success email
    try {
      const planName = selectedPlan.name;
      const amount = billing === "yearly" ? selectedPlan.yearlyAmount : selectedPlan.monthlyAmount; // FIXED
      
      await mailSender(
        user.email,
        `Payment Successful - ${planName}`,
        paymentSuccessTemplate(
          `${user.firstName} ${user.lastName}`,
          `${planName} (${billing === "yearly" ? "Yearly" : "Monthly"})`,
          amount,
          orderId,
          expiryDate
        )
      );

      // Send welcome email
      await mailSender(
        user.email,
        `Welcome to ${planName} - Iron Throne Gym`,
        welcomePremiumTemplate(`${user.firstName} ${user.lastName}`, planName)
      );
    } catch (emailError) {
      console.error("Email sending error:", emailError);
    }

    return {
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionExpiry: user.subscriptionExpiry
      },
      subscription: user.getSubscriptionStatus()
    };

  } catch (error) {
    console.error("Payment success handling error:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

// FIXED: Handle failed payment with billing cycle support
exports.handlePaymentFailure = async (orderId, reason = "Payment processing failed") => {
  try {
    // Find user with this order
    const user = await Owner.findOne({
      "paymentHistory.orderId": orderId
    });

    if (!user) {
      console.error("User not found for failed payment:", orderId);
      return { success: false, message: "User not found" };
    }

    // Find and update payment record
    const paymentRecord = user.paymentHistory.find(
      payment => payment.orderId === orderId
    );

    if (paymentRecord) {
      paymentRecord.status = "FAILED";
      await user.save();

      // Send failure email
      try {
        const selectedPlan = SUBSCRIPTION_PLANS[paymentRecord.plan];
        const planName = selectedPlan?.name || "Subscription Plan";
        const billing = paymentRecord.billing || "monthly";
        const amount = billing === "yearly" ? selectedPlan?.yearlyAmount : selectedPlan?.monthlyAmount || 0; // FIXED
        
        await mailSender(
          user.email,
          `Payment Failed - ${planName}`,
          paymentFailureTemplate(
            `${user.firstName} ${user.lastName}`,
            `${planName} (${billing === "yearly" ? "Yearly" : "Monthly"})`,
            amount,
            orderId,
            reason
          )
        );
      } catch (emailError) {
        console.error("Failure email sending error:", emailError);
      }
    }

    return { success: true, message: "Payment failure handled" };

  } catch (error) {
    console.error("Payment failure handling error:", error);
    return { success: false, message: error.message };
  }
};

// FIXED: Get subscription plans with correct field names
exports.getSubscriptionPlans = async (req, res) => {
  try {
    const plans = Object.keys(SUBSCRIPTION_PLANS).map(key => ({
      id: key,
      name: SUBSCRIPTION_PLANS[key].name,
      tagline: SUBSCRIPTION_PLANS[key].tagline,
      description: SUBSCRIPTION_PLANS[key].description,
      monthlyAmount: SUBSCRIPTION_PLANS[key].monthlyAmount, // FIXED
      yearlyAmount: SUBSCRIPTION_PLANS[key].yearlyAmount, // FIXED
      currency: SUBSCRIPTION_PLANS[key].currency,
      monthlyDuration: SUBSCRIPTION_PLANS[key].monthlyDuration, // FIXED
      yearlyDuration: SUBSCRIPTION_PLANS[key].yearlyDuration, // FIXED
      features: SUBSCRIPTION_PLANS[key].features, // FIXED: Use direct access
      savings: SUBSCRIPTION_PLANS[key].savings
    }));

    return res.status(200).json({
      success: true,
      message: "Subscription plans retrieved successfully",
      data: { 
        plans,
        note: "Currently only Basic plan is available. Advanced and Enterprise plans coming in 3-4 days!"
      }
    });
  } catch (error) {
    console.error("Get plans error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve subscription plans"
    });
  }
};

// Get user's subscription status
exports.getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await Owner.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const subscriptionStatus = user.getSubscriptionStatus();
    
    return res.status(200).json({
      success: true,
      message: "Subscription status retrieved successfully",
      data: {
        subscription: subscriptionStatus,
        paymentHistory: user.paymentHistory.slice(-5)
      }
    });
  } catch (error) {
    console.error("Get subscription status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve subscription status"
    });
  }
};

// Webhook for Razorpay events
exports.webhookHandler = async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (webhookSecret) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (expectedSignature !== webhookSignature) {
        return res.status(400).json({
          success: false,
          message: "Invalid webhook signature"
        });
      }
    }

    const event = req.body.event;
    const paymentEntity = req.body.payload.payment.entity;
    
    switch (event) {
      case 'payment.captured':
        console.log("Payment captured:", paymentEntity.id);
        break;
        
      case 'payment.failed':
        await this.handlePaymentFailure(
          paymentEntity.order_id, 
          paymentEntity.error_description || "Payment failed"
        );
        break;
        
      default:
        console.log("Unhandled webhook event:", event);
    }

    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Webhook handling error:", error);
    return res.status(500).json({
      success: false,
      message: "Webhook processing failed"
    });
  }
};