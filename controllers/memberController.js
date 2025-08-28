const Member = require("../models/Member");

// Add Member
exports.addMember = async (req,res) =>
{
  try
  {
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
    if (existingMember)
    {
      return res.status(409).json({ success: false,message: "Member already exists" });
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
  } catch (error)
  {
    console.error(error);
    res.status(500).json({ success: false,message: "Unable to add member, please try again" });
  }
};

// Edit Member
// Get Member by Phone Number
exports.getMemberByPhone = async (req,res) =>
{
  try
  {
    const { phoneNo } = req.params;

    const member = await Member.findOne({ phoneNo });

    if (!member)
    {
      return res.status(404).json({
        success: false,
        message: "Member not found with this phone number"
      });
    }

    const data = await member.save();

    res.status(200).json({
      success: true,
      message: "Member fetched successfully",
      data: data,
    });
  } catch (error)
  {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch member, please try again"
    });
  }
};
// Delete Member
exports.deleteMember = async (req,res) =>
{
  try
  {
    const { phoneNo } = req.params;

    const deletedMember = await Member.findOneAndDelete({ phoneNo });

    if (!deletedMember)
    {
      return res.status(404).json({ success: false,message: "Member not found!" });
    }

    res.status(200).json({ success: true,message: "Deleted successfully",data: deletedMember });
  } catch (error)
  {
    console.error(error);
    res.status(500).json({ success: false,message: "Unable to delete member, please try again" });
  }
};

exports.getAllMembers = async (req,res) =>
{
  try
  {
    const members = await Member.find({}).sort({ joiningDate: -1 });

    res.status(200).json({
      success: true,
      message: "Members fetched successfully",
      data: members,
    });
  } catch (error)
  {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch members, please try again"
    });
  }
};

// Add this function to your memberController.js file

// Edit Member
exports.editMember = async (req,res) =>
{
  try
  {
    const { phoneNo } = req.params;
    const updateData = req.body;

    // Remove empty or undefined fields from updateData
    const cleanUpdateData = {};
    Object.keys(updateData).forEach(key =>
    {
      if (updateData[key] !== undefined && updateData[key] !== null && updateData[key] !== '')
      {
        cleanUpdateData[key] = updateData[key];
      }
    });

    const updatedMember = await Member.findOneAndUpdate(
      { phoneNo },
      cleanUpdateData,
      { new: true,runValidators: true }
    );

    if (!updatedMember)
    {
      return res.status(404).json({
        success: false,
        message: "Member not found with this phone number"
      });
    }

    res.status(200).json({
      success: true,
      message: "Member updated successfully",
      data: updatedMember,
    });
  } catch (error)
  {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Unable to update member, please try again"
    });
  }
};