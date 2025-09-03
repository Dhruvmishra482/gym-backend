

const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phoneNo: {
        type: String,
        required: true,
        unique: true
    },
    age: {
        type: Number,
    },
    gender: {
        type: String,
        enum: ["Male","Female","Others"]
    },
    email: {
        type: String,
        lowercase: true
    },
    joiningDate: {
        type: Date,
        default: Date.now
    },
    planDuration: {
        type: String,
        enum: ["1 month","3 month","6 month","1 year"]
    },
    feesAmount: {
        type: Number,
        required: true,
    },
    nextDueDate: {
        type: Date,
        // required: true
    },
    paymentStatus: {
        type: String,
        enum: ["Paid","Pending"],
        default: "Pending"
    },
    lastPaidOn: {
        type: Date
    },
    address: {
        type: String,
        required: true
    },

    // Additional fields for reminder functionality
    lastReminderSent: {
        type: Date
    },
    paymentMethod: {
        type: String,
        enum: ["Cash","Card","UPI","Bank Transfer","Other"],
        default: "Cash"
    },
    paymentNotes: {
        type: String
    }

},{
    timestamps: true
});

// Add indexes for better query performance
memberSchema.index({ nextDueDate: 1 });
memberSchema.index({ paymentStatus: 1 });
memberSchema.index({ phoneNo: 1 });

// Virtual field to get member ID (last 6 characters of _id)
memberSchema.virtual('memberId').get(function ()
{
    return this._id.toString().slice(-6);
});

// Ensure virtual fields are serialized
memberSchema.set('toJSON',{ virtuals: true });
memberSchema.set('toObject',{ virtuals: true });

module.exports = mongoose.model("Member",memberSchema);