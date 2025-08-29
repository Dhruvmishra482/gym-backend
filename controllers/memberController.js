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

// Alternative Search Member function - Complete rewrite
exports.searchMember = async (req,res) =>
{
  try
  {
    const { query } = req.params;

    // Basic validation
    if (!query || query.trim() === '')
    {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    const searchTerm = query.trim();
    console.log('=== SEARCH DEBUG START ===');
    console.log('Raw query:',query);
    console.log('Trimmed search term:',searchTerm);

    // Determine if it's a phone number or name
    const isPhoneNumber = /^\d+$/.test(searchTerm);
    console.log('Is phone number:',isPhoneNumber);

    let foundMember = null;

    if (isPhoneNumber)
    {
      // Phone number search - exact match
      console.log('Searching by phone number...');
      foundMember = await Member.findOne({ phoneNo: searchTerm });
      console.log('Phone search result:',foundMember ? foundMember.name : 'Not found');
    } else
    {
      // Name search - multiple strategies
      console.log('Searching by name...');

      // Strategy 1: Exact case-insensitive match
      foundMember = await Member.findOne({
        name: new RegExp(`^${searchTerm}$`,'i')
      });
      console.log('Exact match result:',foundMember ? foundMember.name : 'Not found');

      // Strategy 2: If not found, try partial match from beginning
      if (!foundMember)
      {
        foundMember = await Member.findOne({
          name: new RegExp(`^${searchTerm}`,'i')
        });
        console.log('Starts with match result:',foundMember ? foundMember.name : 'Not found');
      }

      // Strategy 3: If still not found, try contains match
      if (!foundMember)
      {
        foundMember = await Member.findOne({
          name: new RegExp(searchTerm,'i')
        });
        console.log('Contains match result:',foundMember ? foundMember.name : 'Not found');
      }
    }

    console.log('=== SEARCH DEBUG END ===');

    // Return result
    if (!foundMember)
    {
      return res.status(404).json({
        success: false,
        message: isPhoneNumber
          ? `No member found with phone number: ${searchTerm}`
          : `No member found with name: ${searchTerm}`
      });
    }

    return res.status(200).json({
      success: true,
      message: "Member found successfully",
      data: foundMember
    });

  } catch (error)
  {
    console.error('=== SEARCH ERROR ===');
    console.error('Error details:',error);
    console.error('Stack trace:',error.stack);

    return res.status(500).json({
      success: false,
      message: "Internal server error during search",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Also add this helper function to test your database directly
exports.getAllMemberNames = async (req,res) =>
{
  try
  {
    const members = await Member.find({},{ name: 1,phoneNo: 1,_id: 0 });

    return res.status(200).json({
      success: true,
      message: "All member names retrieved",
      data: members
    });
  } catch (error)
  {
    console.error('Error getting member names:',error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving member names"
    });
  }
};