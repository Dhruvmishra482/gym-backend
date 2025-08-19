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
        default: Date.now()
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
        required: true
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

},{ timestamps: true })

module.exports = mongoose.model("Member",memberSchema);