const Member = require("../models/Member");

// Add Member
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
      return res.status(409).json({ success: false, message: "Member already exists" });
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
    res.status(500).json({ success: false, message: "Unable to add member, please try again" });
  }
};

// Edit Member
exports.editMember = async (req, res) => {
  try {
    const { phoneNo } = req.params;

    const allowedToUpdate = ["age", "planDuration", "feesAmount", "nextDueDate", "lastPaidOn", "paymentStatus"];
    const isAllowed = Object.keys(req.body).every((field) => allowedToUpdate.includes(field));

    if (!isAllowed) {
      return res.status(400).json({ success: false, message: "Update not allowed" });
    }

    const updatedMember = await Member.findOneAndUpdate(
      { phoneNo },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedMember) {
      return res.status(404).json({ success: false, message: "Member not found with this phone number" });
    }

    res.status(200).json({ success: true, message: "Updated successfully", data: updatedMember });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Unable to update member, please try again" });
  }
};

// Delete Member
exports.deleteMember = async (req, res) => {
  try {
    const { phoneNo } = req.params;

    const deletedMember = await Member.findOneAndDelete({ phoneNo });

    if (!deletedMember) {
      return res.status(404).json({ success: false, message: "Member not found!" });
    }

    res.status(200).json({ success: true, message: "Deleted successfully", data: deletedMember });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Unable to delete member, please try again" });
  }
};
