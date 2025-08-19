const Member = require("../models/Member");

exports.addMember = async (req, res) => {
  try {
    const {
      name,
      phoneNo,
      email,
      gender,
      age,
      joiningDate,
      planDuration,
      feesAmount,
      nextDueDate,
      paymentStatus,
      lastPaidOn,
      address,
    } = req.body;

    const existingMember = await Member.findOne({ phoneNo });
    if (existingMember) {
      return res
        .status(409)
        .json({ success: false, message: "Member already exists" });
    }

    const member = await Member.create({
      name,
      phoneNo,
      email,
      gender,
      age,
      joiningDate,
      planDuration,
      feesAmount,
      nextDueDate,
      paymentStatus,
      lastPaidOn,
      address,
    });

    res.status(201).json({
      success: true,
      message: "New member added successfully",
      data: member,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Unable to add member, please try again" });
  }
};
