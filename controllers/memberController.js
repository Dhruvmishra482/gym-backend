// const Member = require("../models/Member");
// const { sendWhatsapp, testTwilioSetup } = require('../utils/sendWhatsapp');

// // Add Member
// exports.addMember = async (req,res) =>
// {
//   try
//   {
//     const {
//       name,
//       phoneNo,
//       email,
//       gender,
//       age,
//       joiningDate,
//       planDuration,
//       feesAmount,
//       nextDueDate,
//       paymentStatus,
//       lastPaidOn,
//       address,
//     } = req.body;

//     const existingMember = await Member.findOne({ phoneNo });
//     if (existingMember)
//     {
//       return res.status(409).json({ success: false,message: "Member already exists" });
//     }

//     const member = await Member.create({
//       name,
//       phoneNo,
//       email,
//       gender,
//       age,
//       joiningDate,
//       planDuration,
//       feesAmount,
//       nextDueDate,
//       paymentStatus,
//       lastPaidOn,
//       address,
//     });

//     res.status(201).json({
//       success: true,
//       message: "New member added successfully",
//       data: member,
//     });
//   } catch (error)
//   {
//     console.error(error);
//     res.status(500).json({ success: false,message: "Unable to add member, please try again" });
//   }
// };

// // Edit Member
// // Get Member by Phone Number
// exports.getMemberByPhone = async (req,res) =>
// {
//   try
//   {
//     const { phoneNo } = req.params;

//     const member = await Member.findOne({ phoneNo });

//     if (!member)
//     {
//       return res.status(404).json({
//         success: false,
//         message: "Member not found with this phone number"
//       });
//     }

//     const data = await member.save();

//     res.status(200).json({
//       success: true,
//       message: "Member fetched successfully",
//       data: data,
//     });
//   } catch (error)
//   {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Unable to fetch member, please try again"
//     });
//   }
// };
// // Delete Member
// exports.deleteMember = async (req,res) =>
// {
//   try
//   {
//     const { phoneNo } = req.params;

//     const deletedMember = await Member.findOneAndDelete({ phoneNo });

//     if (!deletedMember)
//     {
//       return res.status(404).json({ success: false,message: "Member not found!" });
//     }

//     res.status(200).json({ success: true,message: "Deleted successfully",data: deletedMember });
//   } catch (error)
//   {
//     console.error(error);
//     res.status(500).json({ success: false,message: "Unable to delete member, please try again" });
//   }
// };

// exports.getAllMembers = async (req,res) =>
// {
//   try
//   {
//     const members = await Member.find({}).sort({ joiningDate: -1 });

//     res.status(200).json({
//       success: true,
//       message: "Members fetched successfully",
//       data: members,
//     });
//   } catch (error)
//   {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Unable to fetch members, please try again"
//     });
//   }
// };

// // Add this function to your memberController.js file

// // Edit Member
// exports.editMember = async (req,res) =>
// {
//   try
//   {
//     const { phoneNo } = req.params;
//     const updateData = req.body;

//     // Remove empty or undefined fields from updateData
//     const cleanUpdateData = {};
//     Object.keys(updateData).forEach(key =>
//     {
//       if (updateData[key] !== undefined && updateData[key] !== null && updateData[key] !== '')
//       {
//         cleanUpdateData[key] = updateData[key];
//       }
//     });

//     const updatedMember = await Member.findOneAndUpdate(
//       { phoneNo },
//       cleanUpdateData,
//       { new: true,runValidators: true }
//     );

//     if (!updatedMember)
//     {
//       return res.status(404).json({
//         success: false,
//         message: "Member not found with this phone number"
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Member updated successfully",
//       data: updatedMember,
//     });
//   } catch (error)
//   {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Unable to update member, please try again"
//     });
//   }
// };
// exports.searchMember = async (req,res) =>
// {
//   try
//   {
//     const { query } = req.params;

//     // Basic validation
//     if (!query || query.trim() === '')
//     {
//       return res.status(400).json({
//         success: false,
//         message: "Search query is required"
//       });
//     }

//     const searchTerm = query.trim();
//     console.log('=== SEARCH DEBUG START ===');
//     console.log('Raw query:',query);
//     console.log('Trimmed search term:',searchTerm);

//     // Determine if it's a phone number or name
//     const isPhoneNumber = /^\d+$/.test(searchTerm);
//     console.log('Is phone number:',isPhoneNumber);

//     let foundMember = null;

//     if (isPhoneNumber)
//     {
//       // Phone number search - exact match
//       console.log('Searching by phone number...');
//       foundMember = await Member.findOne({ phoneNo: searchTerm });
//       console.log('Phone search result:',foundMember ? foundMember.name : 'Not found');
//     } else
//     {
//       // Name search - multiple strategies
//       console.log('Searching by name...');

//       // Strategy 1: Exact case-insensitive match
//       foundMember = await Member.findOne({
//         name: new RegExp(`^${searchTerm}$`,'i')
//       });
//       console.log('Exact match result:',foundMember ? foundMember.name : 'Not found');

//       // Strategy 2: If not found, try partial match from beginning
//       if (!foundMember)
//       {
//         foundMember = await Member.findOne({
//           name: new RegExp(`^${searchTerm}`,'i')
//         });
//         console.log('Starts with match result:',foundMember ? foundMember.name : 'Not found');
//       }

//       // Strategy 3: If still not found, try contains match
//       if (!foundMember)
//       {
//         foundMember = await Member.findOne({
//           name: new RegExp(searchTerm,'i')
//         });
//         console.log('Contains match result:',foundMember ? foundMember.name : 'Not found');
//       }
//     }

//     console.log('=== SEARCH DEBUG END ===');

//     // Return result
//     if (!foundMember)
//     {
//       return res.status(404).json({
//         success: false,
//         message: isPhoneNumber
//           ? `No member found with phone number: ${searchTerm}`
//           : `No member found with name: ${searchTerm}`
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Member found successfully",
//       data: foundMember
//     });

//   } catch (error)
//   {
//     console.error('=== SEARCH ERROR ===');
//     console.error('Error details:',error);
//     console.error('Stack trace:',error.stack);

//     return res.status(500).json({
//       success: false,
//       message: "Internal server error during search",
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

// // Also add this helper function to test your database directly
// exports.getAllMemberNames = async (req,res) =>
// {
//   try
//   {
//     const members = await Member.find({},{ name: 1,phoneNo: 1,_id: 0 });

//     return res.status(200).json({
//       success: true,
//       message: "All member names retrieved",
//       data: members
//     });
//   } catch (error)
//   {
//     console.error('Error getting member names:',error);
//     return res.status(500).json({
//       success: false,
//       message: "Error retrieving member names"
//     });
//   }
// };

// // Get All Due Members
// exports.getAllDueMembers = async (req, res) => {
//   try {
//     console.log("🚀 getAllDueMembers controller HIT");
//     console.log("👤 Authenticated user:", req.user?.email, "| Role:", req.user?.role);
    
//     const currentDate = new Date();
//     currentDate.setHours(0, 0, 0, 0);
//     console.log("📅 Current date for comparison:", currentDate.toISOString());

//     // MongoDB query to find due members
//     const query = {
//       $and: [
//         {
//           $or: [
//             { nextDueDate: { $lte: currentDate } },
//             { paymentStatus: "Pending" }
//           ]
//         },
//         { nextDueDate: { $exists: true, $ne: null } }
//       ]
//     };
    
//     console.log("🔍 MongoDB query:", JSON.stringify(query, null, 2));
    
//     // Execute query
//     const dueMembers = await Member.find(query).sort({ nextDueDate: 1 });
//     console.log("📊 Due members fetched from DB:", dueMembers.length);
    
//     if (dueMembers.length > 0) {
//       console.log("📋 Sample member data:", {
//         name: dueMembers[0].name,
//         nextDueDate: dueMembers[0].nextDueDate,
//         paymentStatus: dueMembers[0].paymentStatus
//       });
//     }

//     // Calculate overdue days and status for each member
//     const membersWithCalculations = dueMembers.map((member, index) => {
//       console.log(`🔄 Processing member ${index + 1}: ${member.name}`);
      
//       const memberObj = member.toObject();

//       if (member.nextDueDate) {
//         const memberDueDate = new Date(member.nextDueDate);
//         memberDueDate.setHours(0, 0, 0, 0);
        
//         const timeDiff = currentDate.getTime() - memberDueDate.getTime();
//         const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
//         memberObj.overdueDays = daysDiff > 0 ? daysDiff : 0;
//         memberObj.isDueToday = daysDiff === 0;
//         memberObj.isOverdue = daysDiff > 0;
        
//         console.log(`   📊 ${member.name}: Due ${memberDueDate.toDateString()}, Days diff: ${daysDiff}, Status: ${memberObj.isOverdue ? 'Overdue' : memberObj.isDueToday ? 'Due Today' : 'Upcoming'}`);
//       } else {
//         memberObj.overdueDays = 0;
//         memberObj.isDueToday = false;
//         memberObj.isOverdue = false;
//         console.log(`   ⚠️ ${member.name}: No due date set`);
//       }

//       return memberObj;
//     });

//     // Calculate statistics
//     const statistics = {
//       total: membersWithCalculations.length,
//       overdue: membersWithCalculations.filter(m => m.isOverdue).length,
//       dueToday: membersWithCalculations.filter(m => m.isDueToday).length,
//       pending: membersWithCalculations.filter(m => m.paymentStatus === 'Pending').length
//     };
    
//     console.log("📈 Final statistics:", statistics);

//     const response = {
//       success: true,
//       message: `Found ${membersWithCalculations.length} members with due fees`,
//       count: membersWithCalculations.length,
//       data: membersWithCalculations,
//       statistics
//     };
    
//     console.log("📤 Sending successful response with", response.data.length, "members");
//     res.status(200).json(response);

//   } catch (error) {
//     console.error("❌ Error in getAllDueMembers controller:", error.message);
//     console.error("📍 Error stack:", error.stack);
//     console.error("🔧 Error details:", error);
    
//     res.status(500).json({
//       success: false,
//       message: "Unable to fetch due members, please try again",
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };const sendMemberReminder = async (req, res) => {
//   try {
//     const { memberId } = req.params;
    
//     console.log(`📧 Sending reminder to member ID: ${memberId}`);

//     // Test Twilio setup first
//     const twilioTest = await testTwilioSetup();
//     if (!twilioTest.success) {
//       console.error('❌ Twilio setup test failed:', twilioTest.error);
//       return res.status(503).json({
//         success: false,
//         message: 'WhatsApp service unavailable. Please contact administrator.',
//         error: 'Service configuration error'
//       });
//     }
    
//     // Find the member
//     const member = await Member.findById(memberId);
//     if (!member) {
//       console.log(`❌ Member not found with ID: ${memberId}`);
//       return res.status(404).json({
//         success: false,
//         message: 'Member not found'
//       });
//     }

//     // Check if member has phone number
//     if (!member.phoneNo) {
//       console.log(`❌ Member ${member.name} has no phone number`);
//       return res.status(400).json({
//         success: false,
//         message: 'Member phone number not found'
//       });
//     }

//     // Calculate overdue days if applicable
//     const today = new Date();
//     const dueDate = new Date(member.nextDueDate);
//     const timeDiff = today.getTime() - dueDate.getTime();
//     const overdueDays = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
    
//     // Create reminder message
//     let message;
//     if (overdueDays > 0) {
//       message = `Hi ${member.name}, your gym fees of ₹${member.feesAmount || 'pending amount'} is overdue by ${overdueDays} days. Please make the payment at your earliest convenience. Thank you!`;
//     } else {
//       message = `Hi ${member.name}, your gym fees of ₹${member.feesAmount || 'pending amount'} is due today. Please make the payment. Thank you!`;
//     }

//     console.log(`📱 Preparing to send WhatsApp to ${member.phoneNo}`);

//     try {
//       // Send WhatsApp message to member
//       const result = await sendWhatsapp(member.phoneNo, message);
      
//       console.log(`✅ WhatsApp sent successfully:`, result);
      
//       // Update member record with reminder sent timestamp
//       await Member.findByIdAndUpdate(memberId, {
//         lastReminderSent: new Date()
//       });

//       // ❌ REMOVED: Owner notification section
//       // No more extra messages to owner!

//       console.log(`✅ Reminder sent successfully to member: ${member.name}`);

//       res.json({
//         success: true,
//         message: 'Reminder sent successfully via WhatsApp',
//         data: {
//           memberId: member._id,
//           memberName: member.name,
//           phoneNo: member.phoneNo,
//           sentAt: new Date(),
//           whatsappSid: result.sid
//         }
//       });

//     } catch (whatsappError) {
//       console.error('❌ WhatsApp sending failed:', whatsappError);
      
//       // Handle different types of WhatsApp errors
//       let errorMessage = 'Failed to send WhatsApp reminder';
//       let statusCode = 500;
      
//       if (whatsappError.isAuthError) {
//         errorMessage = 'WhatsApp service authentication error. Please contact administrator.';
//         statusCode = 503;
//       } else if (whatsappError.isPhoneNumberError) {
//         errorMessage = `Invalid or unverified phone number: ${member.phoneNo}`;
//         statusCode = 400;
//       } else if (whatsappError.twilioCode) {
//         errorMessage = `WhatsApp service error: ${whatsappError.twilioMessage}`;
//       }
      
//       return res.status(statusCode).json({
//         success: false,
//         message: errorMessage,
//         error: process.env.NODE_ENV === 'development' ? whatsappError.message : 'WhatsApp service error'
//       });
//     }

//   } catch (error) {
//     console.error('❌ Error in sendMemberReminder:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to send reminder',
//       error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
//     });
//   }
// };
// // Get detailed member information
// const getMemberDetails = async (req, res) => {
//   try {
//     const { memberId } = req.params;

//     console.log(`👁️ Fetching member details for ID: ${memberId}`);

//     // Find the member with all details
//     const member = await Member.findById(memberId);
//     if (!member) {
//       console.log(`❌ Member not found with ID: ${memberId}`);
//       return res.status(404).json({
//         success: false,
//         message: 'Member not found'
//       });
//     }

//     // Calculate additional fields
//     const today = new Date();
//     const dueDate = new Date(member.nextDueDate);
//     const timeDiff = today.getTime() - dueDate.getTime();
//     const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
//     const overdueDays = Math.max(0, daysDiff);
//     const isDueToday = daysDiff === 0;
//     const isOverdue = daysDiff > 0;

//     // Enhanced member data
//     const memberData = {
//       ...member.toObject(),
//       isOverdue,
//       isDueToday,
//       overdueDays: isOverdue ? overdueDays : 0,
//       daysUntilDue: isDueToday ? 0 : Math.abs(daysDiff),
//       membershipDuration: member.joiningDate ? 
//         Math.floor((today - new Date(member.joiningDate)) / (1000 * 60 * 60 * 24)) : 0,
//       memberId: member._id.toString().slice(-6),
//       joinDate: member.joiningDate // Add alias for frontend compatibility
//     };

//     console.log(`✅ Member details fetched successfully: ${member.name}`);

//     res.json({
//       success: true,
//       message: 'Member details fetched successfully',
//       data: memberData
//     });

//   } catch (error) {
//     console.error('❌ Error fetching member details:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch member details',
//       error: error.message
//     });
//   }
// };

// // Send reminders to all due members (bulk operation)
// const sendAllMemberReminders = async (req, res) => {
//   try {
//     console.log(`📧 Starting bulk reminder sending process`);
    
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     // Find all due members (due today or overdue) - using same logic as getAllDueMembers
//     const query = {
//       $and: [
//         {
//           $or: [
//             { nextDueDate: { $lte: today } },
//             { paymentStatus: "Pending" }
//           ]
//         },
//         { nextDueDate: { $exists: true, $ne: null } },
//         { phoneNo: { $exists: true, $ne: null, $ne: "" } } // Only members with phone numbers
//       ]
//     };

//     const dueMembers = await Member.find(query);

//     console.log(`📊 Found ${dueMembers.length} due members with phone numbers`);

//     if (dueMembers.length === 0) {
//       return res.json({
//         success: true,
//         message: 'No due members found with phone numbers',
//         data: {
//           totalMembers: 0,
//           successful: 0,
//           failed: 0,
//           results: []
//         }
//       });
//     }

//     const results = [];
//     let successful = 0;
//     let failed = 0;

//     // Send reminders to all due members
//     for (const member of dueMembers) {
//       try {
//         // Calculate overdue days
//         const dueDate = new Date(member.nextDueDate);
//         const timeDiff = today.getTime() - dueDate.getTime();
//         const overdueDays = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
        
//         // Create reminder message
//         let message;
//         if (overdueDays > 0) {
//           message = `Hi ${member.name}, your gym fees of ₹${member.feesAmount || 0} is overdue by ${overdueDays} days. Please make the payment at your earliest convenience. Thank you!`;
//         } else {
//           message = `Hi ${member.name}, your gym fees of ₹${member.feesAmount || 0} is due today. Please make the payment. Thank you!`;
//         }

//         // Send WhatsApp message
//         await sendWhatsapp(member.phoneNo, message);

//         // Update member record
//         await Member.findByIdAndUpdate(member._id, {
//           lastReminderSent: new Date()
//         });

//         console.log(`✅ Reminder sent to: ${member.name}`);
//         results.push({
//           memberId: member._id,
//           memberName: member.name,
//           phoneNo: member.phoneNo,
//           status: 'success',
//           sentAt: new Date()
//         });
//         successful++;

//       } catch (error) {
//         console.error(`❌ Failed to send reminder to ${member.name}:`, error);
//         results.push({
//           memberId: member._id,
//           memberName: member.name,
//           status: 'failed',
//           error: error.message
//         });
//         failed++;
//       }
//     }

//     // Send summary to owner
//     if (process.env.OWNER_PHONE && successful > 0) {
//       try {
//         const summaryMessage = `Bulk reminders sent: ${successful} successful, ${failed} failed out of ${dueMembers.length} due members.`;
//         await sendWhatsapp(process.env.OWNER_PHONE, summaryMessage);
//         console.log(`📱 Summary sent to owner`);
//       } catch (error) {
//         console.error('Error sending summary to owner:', error);
//       }
//     }

//     console.log(`✅ Bulk reminder process completed - Success: ${successful}, Failed: ${failed}`);

//     res.json({
//       success: true,
//       message: `Reminders sent to ${successful} members successfully`,
//       data: {
//         totalMembers: dueMembers.length,
//         successful,
//         failed,
//         results
//       }
//     });

//   } catch (error) {
//     console.error('❌ Error in bulk reminder sending:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to send bulk reminders',
//       error: error.message,
//       data: {
//         totalMembers: 0,
//         successful: 0,
//         failed: 0,
//         results: []
//       }
//     });
//   }
// };
// const markMemberFeePaid = async (req, res) => {
//   try {
//     const { memberId } = req.params;
//     const { paidDate, paymentMethod = 'Cash', notes } = req.body;

//     console.log(`💰 Marking member as paid - ID: ${memberId}`);

//     // Find the member
//     const member = await Member.findById(memberId);
//     if (!member) {
//       console.log(`❌ Member not found with ID: ${memberId}`);
//       return res.status(404).json({
//         success: false,
//         message: 'Member not found'
//       });
//     }

//     // Calculate next due date based on plan duration
//     const lastPaidDate = paidDate ? new Date(paidDate) : new Date();
//     let nextDueDate = new Date(lastPaidDate);

//     // Add duration based on plan (adjust logic as per your plan structure)
//     const planDurationMap = {
//       '1 month': 30,
//       '3 month': 90,
//       '6 month': 180,
//       '1 year': 365,
//     };

//     const daysToAdd = planDurationMap[member.planDuration] || 30; // Default to 30 days
//     nextDueDate.setDate(nextDueDate.getDate() + daysToAdd);

//     console.log(`📅 Updating payment - Last paid: ${lastPaidDate.toISOString()}, Next due: ${nextDueDate.toISOString()}`);

//     // Update member record
//     const updatedMember = await Member.findByIdAndUpdate(
//       memberId,
//       {
//         lastPaidOn: lastPaidDate,
//         nextDueDate: nextDueDate,
//         paymentStatus: 'Paid',
//         paymentMethod: paymentMethod,
//         paymentNotes: notes,
//         updatedAt: new Date()
//       },
//       { 
//         new: true,
//         runValidators: true
//       }
//     );

//     // Optional: Send confirmation WhatsApp to member
//     if (member.phoneNo) {
//       const confirmationMessage = `Hi ${member.name}, we have received your payment of ₹${member.feesAmount}. Your next due date is ${nextDueDate.toLocaleDateString('en-IN')}. Thank you!`;
//       try {
//         await sendWhatsapp(member.phoneNo, confirmationMessage);
//         console.log(`📱 Payment confirmation sent to member: ${member.name}`);
//       } catch (whatsappError) {
//         console.error('Error sending confirmation WhatsApp:', whatsappError);
//         // Don't fail the main operation if WhatsApp fails
//       }
//     }

//     // Optional: Send notification to owner/admin
//     if (process.env.OWNER_PHONE) {
//       const ownerMessage = `Payment received from ${member.name} (${member._id.toString().slice(-6)}) - Amount: ₹${member.feesAmount}. Next due: ${nextDueDate.toLocaleDateString('en-IN')}`;
//       try {
//         await sendWhatsapp(process.env.OWNER_PHONE, ownerMessage);
//         console.log(`📱 Owner payment notification sent`);
//       } catch (whatsappError) {
//         console.error('Error sending owner notification:', whatsappError);
//       }
//     }

//     console.log(`✅ Member payment updated successfully: ${member.name}`);

//     res.json({
//       success: true,
//       message: 'Member payment updated successfully',
//       data: {
//         memberId: updatedMember._id,
//         memberName: updatedMember.name,
//         lastPaidOn: updatedMember.lastPaidOn,
//         nextDueDate: updatedMember.nextDueDate,
//         paymentStatus: updatedMember.paymentStatus,
//         amount: updatedMember.feesAmount
//       }
//     });

//   } catch (error) {
//     console.error('❌ Error marking member as paid:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to update payment status',
//       error: error.message
//     });
//   }
// };


// // Export ALL functions using both exports.function and regular assignment
// exports.sendMemberReminder = sendMemberReminder;
// exports.markMemberFeePaid = markMemberFeePaid;
// exports.getMemberDetails = getMemberDetails;
// exports.sendAllMemberReminders = sendAllMemberReminders;

// // Aliases for consistency
// exports.markMemberAsPaid = markMemberFeePaid;
// exports.sendAllReminders = sendAllMemberReminders

const Member = require("../models/Member");
const { sendWhatsapp, testTwilioSetup } = require('../utils/sendWhatsapp');

// SECURITY FIX: Add Member with owner isolation
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

    // SECURITY FIX: Check if member exists for THIS owner only
    const existingMember = await Member.findOne({ 
      phoneNo: phoneNo,
      ownerId: req.user.id // Only check within this owner's members
    });
    
    if (existingMember) {
      return res.status(409).json({ 
        success: false, 
        message: "Member already exists in your gym" 
      });
    }

    // SECURITY FIX: Create member with owner reference
    const member = await Member.create({
      ownerId: req.user.id, // Add owner reference
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
    res.status(500).json({ 
      success: false, 
      message: "Unable to add member, please try again" 
    });
  }
};

// SECURITY FIX: Get Member by Phone Number (owner-specific)
exports.getMemberByPhone = async (req, res) => {
  try {
    const { phoneNo } = req.params;

    // SECURITY FIX: Find member only within this owner's gym
    const member = await Member.findOne({ 
      phoneNo: phoneNo,
      ownerId: req.user.id
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found in your gym"
      });
    }

    const data = await member.save();

    res.status(200).json({
      success: true,
      message: "Member fetched successfully",
      data: data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch member, please try again"
    });
  }
};

// SECURITY FIX: Delete Member (owner-specific)
exports.deleteMember = async (req, res) => {
  try {
    const { phoneNo } = req.params;

    // SECURITY FIX: Delete only from this owner's gym
    const deletedMember = await Member.findOneAndDelete({ 
      phoneNo: phoneNo,
      ownerId: req.user.id
    });

    if (!deletedMember) {
      return res.status(404).json({ 
        success: false, 
        message: "Member not found in your gym" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Deleted successfully", 
      data: deletedMember 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: "Unable to delete member, please try again" 
    });
  }
};

// SECURITY FIX: Get All Members (owner-specific)
exports.getAllMembers = async (req, res) => {
  try {
    // SECURITY FIX: Only fetch members belonging to this owner
    const members = await Member.find({ 
      ownerId: req.user.id 
    }).sort({ joiningDate: -1 });

    res.status(200).json({
      success: true,
      message: "Members fetched successfully",
      data: members,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch members, please try again"
    });
  }
};

// SECURITY FIX: Edit Member (owner-specific)
exports.editMember = async (req, res) => {
  try {
    const { phoneNo } = req.params;
    const updateData = req.body;

    // Remove empty or undefined fields from updateData
    const cleanUpdateData = {};
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && updateData[key] !== null && updateData[key] !== '') {
        cleanUpdateData[key] = updateData[key];
      }
    });

    // SECURITY FIX: Update only within this owner's gym
    const updatedMember = await Member.findOneAndUpdate(
      { 
        phoneNo: phoneNo,
        ownerId: req.user.id
      },
      cleanUpdateData,
      { new: true, runValidators: true }
    );

    if (!updatedMember) {
      return res.status(404).json({
        success: false,
        message: "Member not found in your gym"
      });
    }

    res.status(200).json({
      success: true,
      message: "Member updated successfully",
      data: updatedMember,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Unable to update member, please try again"
    });
  }
};

// SECURITY FIX: Search Member (owner-specific)
exports.searchMember = async (req, res) => {
  try {
    const { query } = req.params;

    // Basic validation
    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    const searchTerm = query.trim();
    console.log('=== SEARCH DEBUG START ===');
    console.log('Raw query:', query);
    console.log('Trimmed search term:', searchTerm);
    console.log('Owner ID:', req.user.id);

    // Determine if it's a phone number or name
    const isPhoneNumber = /^\d+$/.test(searchTerm);
    console.log('Is phone number:', isPhoneNumber);

    let foundMember = null;

    // SECURITY FIX: Base query to include owner filter
    const baseQuery = { ownerId: req.user.id };

    if (isPhoneNumber) {
      // Phone number search - exact match within owner's gym
      console.log('Searching by phone number...');
      foundMember = await Member.findOne({ 
        ...baseQuery,
        phoneNo: searchTerm 
      });
      console.log('Phone search result:', foundMember ? foundMember.name : 'Not found');
    } else {
      // Name search - multiple strategies within owner's gym
      console.log('Searching by name...');

      // Strategy 1: Exact case-insensitive match
      foundMember = await Member.findOne({
        ...baseQuery,
        name: new RegExp(`^${searchTerm}$`, 'i')
      });
      console.log('Exact match result:', foundMember ? foundMember.name : 'Not found');

      // Strategy 2: If not found, try partial match from beginning
      if (!foundMember) {
        foundMember = await Member.findOne({
          ...baseQuery,
          name: new RegExp(`^${searchTerm}`, 'i')
        });
        console.log('Starts with match result:', foundMember ? foundMember.name : 'Not found');
      }

      // Strategy 3: If still not found, try contains match
      if (!foundMember) {
        foundMember = await Member.findOne({
          ...baseQuery,
          name: new RegExp(searchTerm, 'i')
        });
        console.log('Contains match result:', foundMember ? foundMember.name : 'Not found');
      }
    }

    console.log('=== SEARCH DEBUG END ===');

    // Return result
    if (!foundMember) {
      return res.status(404).json({
        success: false,
        message: isPhoneNumber
          ? `No member found with phone number: ${searchTerm} in your gym`
          : `No member found with name: ${searchTerm} in your gym`
      });
    }

    return res.status(200).json({
      success: true,
      message: "Member found successfully",
      data: foundMember
    });

  } catch (error) {
    console.error('=== SEARCH ERROR ===');
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);

    return res.status(500).json({
      success: false,
      message: "Internal server error during search",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// SECURITY FIX: Get All Member Names (owner-specific)
exports.getAllMemberNames = async (req, res) => {
  try {
    // SECURITY FIX: Only get members for this owner
    const members = await Member.find(
      { ownerId: req.user.id },
      { name: 1, phoneNo: 1, _id: 0 }
    );

    return res.status(200).json({
      success: true,
      message: "All member names retrieved for your gym",
      data: members
    });
  } catch (error) {
    console.error('Error getting member names:', error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving member names"
    });
  }
};
// SECURITY FIX: Get All Due Members (owner-specific)
exports.getAllDueMembers = async (req, res) => {
  try {
    console.log("🚀 getAllDueMembers controller HIT");
    console.log("👤 Authenticated user:", req.user?.email, "| Role:", req.user?.role);
    console.log("🏠 Owner ID:", req.user?.id);

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    console.log("📅 Current date for comparison:", currentDate.toISOString());

    // SECURITY FIX: MongoDB query to find due members for THIS owner only
    const query = {
      ownerId: req.user.id, // Add owner filter
      $and: [
        {
          $or: [
            { nextDueDate: { $lte: currentDate } },
            { paymentStatus: "Pending" }
          ]
        },
        { nextDueDate: { $exists: true, $ne: null } }
      ]
    };

    console.log("🔍 MongoDB query:", JSON.stringify(query, null, 2));

    // Execute query
    const dueMembers = await Member.find(query).sort({ nextDueDate: 1 });
    console.log("📊 Due members fetched from DB:", dueMembers.length);

    if (dueMembers.length > 0) {
      console.log("📋 Sample member data:", {
        name: dueMembers[0].name,
        nextDueDate: dueMembers[0].nextDueDate,
        paymentStatus: dueMembers[0].paymentStatus,
        ownerId: dueMembers[0].ownerId
      });
    }

    // Calculate overdue days and status for each member
    const membersWithCalculations = dueMembers.map((member, index) => {
      console.log(`🔄 Processing member ${index + 1}: ${member.name}`);

      const memberObj = member.toObject();

      if (member.nextDueDate) {
        const memberDueDate = new Date(member.nextDueDate);
        memberDueDate.setHours(0, 0, 0, 0);

        const timeDiff = currentDate.getTime() - memberDueDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        memberObj.overdueDays = daysDiff > 0 ? daysDiff : 0;
        memberObj.isDueToday = daysDiff === 0;
        memberObj.isOverdue = daysDiff > 0;

        console.log(`   📊 ${member.name}: Due ${memberDueDate.toDateString()}, Days diff: ${daysDiff}, Status: ${memberObj.isOverdue ? 'Overdue' : memberObj.isDueToday ? 'Due Today' : 'Upcoming'}`);
      } else {
        memberObj.overdueDays = 0;
        memberObj.isDueToday = false;
        memberObj.isOverdue = false;
        console.log(`   ⚠️ ${member.name}: No due date set`);
      }

      return memberObj;
    });

    // Calculate statistics
    const statistics = {
      total: membersWithCalculations.length,
      overdue: membersWithCalculations.filter(m => m.isOverdue).length,
      dueToday: membersWithCalculations.filter(m => m.isDueToday).length,
      pending: membersWithCalculations.filter(m => m.paymentStatus === 'Pending').length
    };

    console.log("📈 Final statistics:", statistics);

    const response = {
      success: true,
      message: `Found ${membersWithCalculations.length} members with due fees in your gym`,
      count: membersWithCalculations.length,
      data: membersWithCalculations,
      statistics
    };

    console.log("📤 Sending successful response with", response.data.length, "members");
    res.status(200).json(response);

  } catch (error) {
    console.error("❌ Error in getAllDueMembers controller:", error.message);
    console.error("📍 Error stack:", error.stack);
    console.error("🔧 Error details:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch due members, please try again",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// SECURITY FIX: Send Member Reminder (owner-specific)
const sendMemberReminder = async (req, res) => {
  try {
    const { memberId } = req.params;

    console.log(`📧 Sending reminder to member ID: ${memberId}`);

    // Test Twilio setup first
    const twilioTest = await testTwilioSetup();
    if (!twilioTest.success) {
      console.error('❌ Twilio setup test failed:', twilioTest.error);
      return res.status(503).json({
        success: false,
        message: 'WhatsApp service unavailable. Please contact administrator.',
        error: 'Service configuration error'
      });
    }

    // SECURITY FIX: Find the member only within this owner's gym
    const member = await Member.findOne({
      _id: memberId,
      ownerId: req.user.id
    });

    if (!member) {
      console.log(`❌ Member not found with ID: ${memberId} in your gym`);
      return res.status(404).json({
        success: false,
        message: 'Member not found in your gym'
      });
    }

    // Check if member has phone number
    if (!member.phoneNo) {
      console.log(`❌ Member ${member.name} has no phone number`);
      return res.status(400).json({
        success: false,
        message: 'Member phone number not found'
      });
    }

    // Calculate overdue days if applicable
    const today = new Date();
    const dueDate = new Date(member.nextDueDate);
    const timeDiff = today.getTime() - dueDate.getTime();
    const overdueDays = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

    // Create reminder message
    let message;
    if (overdueDays > 0) {
      message = `Hi ${member.name}, your gym fees of ₹${member.feesAmount || 'pending amount'} is overdue by ${overdueDays} days. Please make the payment at your earliest convenience. Thank you!`;
    } else {
      message = `Hi ${member.name}, your gym fees of ₹${member.feesAmount || 'pending amount'} is due today. Please make the payment. Thank you!`;
    }

    console.log(`📱 Preparing to send WhatsApp to ${member.phoneNo}`);

    try {
      // Send WhatsApp message to member
      const result = await sendWhatsapp(member.phoneNo, message);

      console.log(`✅ WhatsApp sent successfully:`, result);

      // Update member record with reminder sent timestamp
      await Member.findOneAndUpdate(
        { _id: memberId, ownerId: req.user.id },
        { lastReminderSent: new Date() }
      );

      console.log(`✅ Reminder sent successfully to member: ${member.name}`);

      res.json({
        success: true,
        message: 'Reminder sent successfully via WhatsApp',
        data: {
          memberId: member._id,
          memberName: member.name,
          phoneNo: member.phoneNo,
          sentAt: new Date(),
          whatsappSid: result.sid
        }
      });

    } catch (whatsappError) {
      console.error('❌ WhatsApp sending failed:', whatsappError);

      // Handle different types of WhatsApp errors
      let errorMessage = 'Failed to send WhatsApp reminder';
      let statusCode = 500;

      if (whatsappError.isAuthError) {
        errorMessage = 'WhatsApp service authentication error. Please contact administrator.';
        statusCode = 503;
      } else if (whatsappError.isPhoneNumberError) {
        errorMessage = `Invalid or unverified phone number: ${member.phoneNo}`;
        statusCode = 400;
      } else if (whatsappError.twilioCode) {
        errorMessage = `WhatsApp service error: ${whatsappError.twilioMessage}`;
      }

      return res.status(statusCode).json({
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? whatsappError.message : 'WhatsApp service error'
      });
    }

  } catch (error) {
    console.error('❌ Error in sendMemberReminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reminder',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// SECURITY FIX: Get detailed member information (owner-specific)
const getMemberDetails = async (req, res) => {
  try {
    const { memberId } = req.params;

    console.log(`👁️ Fetching member details for ID: ${memberId}`);

    // SECURITY FIX: Find the member with all details only within this owner's gym
    const member = await Member.findOne({
      _id: memberId,
      ownerId: req.user.id
    });

    if (!member) {
      console.log(`❌ Member not found with ID: ${memberId} in your gym`);
      return res.status(404).json({
        success: false,
        message: 'Member not found in your gym'
      });
    }

    // Calculate additional fields
    const today = new Date();
    const dueDate = new Date(member.nextDueDate);
    const timeDiff = today.getTime() - dueDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    const overdueDays = Math.max(0, daysDiff);
    const isDueToday = daysDiff === 0;
    const isOverdue = daysDiff > 0;

    // Enhanced member data
    const memberData = {
      ...member.toObject(),
      isOverdue,
      isDueToday,
      overdueDays: isOverdue ? overdueDays : 0,
      daysUntilDue: isDueToday ? 0 : Math.abs(daysDiff),
      membershipDuration: member.joiningDate ?
        Math.floor((today - new Date(member.joiningDate)) / (1000 * 60 * 60 * 24)) : 0,
      memberId: member._id.toString().slice(-6),
      joinDate: member.joiningDate // Add alias for frontend compatibility
    };

    console.log(`✅ Member details fetched successfully: ${member.name}`);

    res.json({
      success: true,
      message: 'Member details fetched successfully',
      data: memberData
    });

  } catch (error) {
    console.error('❌ Error fetching member details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch member details',
      error: error.message
    });
  }
};

// SECURITY FIX: Send reminders to all due members (bulk operation, owner-specific)
const sendAllMemberReminders = async (req, res) => {
  try {
    console.log(`📧 Starting bulk reminder sending process for owner: ${req.user.id}`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // SECURITY FIX: Find all due members for THIS owner only
    const query = {
      ownerId: req.user.id, // Add owner filter
      $and: [
        {
          $or: [
            { nextDueDate: { $lte: today } },
            { paymentStatus: "Pending" }
          ]
        },
        { nextDueDate: { $exists: true, $ne: null } },
        { phoneNo: { $exists: true, $ne: null, $ne: "" } } // Only members with phone numbers
      ]
    };

    const dueMembers = await Member.find(query);

    console.log(`📊 Found ${dueMembers.length} due members with phone numbers in your gym`);

    if (dueMembers.length === 0) {
      return res.json({
        success: true,
        message: 'No due members found with phone numbers in your gym',
        data: {
          totalMembers: 0,
          successful: 0,
          failed: 0,
          results: []
        }
      });
    }

    const results = [];
    let successful = 0;
    let failed = 0;

    // Send reminders to all due members
    for (const member of dueMembers) {
      try {
        // Calculate overdue days
        const dueDate = new Date(member.nextDueDate);
        const timeDiff = today.getTime() - dueDate.getTime();
        const overdueDays = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

        // Create reminder message
        let message;
        if (overdueDays > 0) {
          message = `Hi ${member.name}, your gym fees of ₹${member.feesAmount || 0} is overdue by ${overdueDays} days. Please make the payment at your earliest convenience. Thank you!`;
        } else {
          message = `Hi ${member.name}, your gym fees of ₹${member.feesAmount || 0} is due today. Please make the payment. Thank you!`;
        }

        // Send WhatsApp message
        await sendWhatsapp(member.phoneNo, message);

        // Update member record
        await Member.findOneAndUpdate(
          { _id: member._id, ownerId: req.user.id },
          { lastReminderSent: new Date() }
        );

        console.log(`✅ Reminder sent to: ${member.name}`);
        results.push({
          memberId: member._id,
          memberName: member.name,
          phoneNo: member.phoneNo,
          status: 'success',
          sentAt: new Date()
        });
        successful++;

      } catch (error) {
        console.error(`❌ Failed to send reminder to ${member.name}:`, error);
        results.push({
          memberId: member._id,
          memberName: member.name,
          status: 'failed',
          error: error.message
        });
        failed++;
      }
    }

    // Send summary to owner
    if (process.env.OWNER_PHONE && successful > 0) {
      try {
        const summaryMessage = `Bulk reminders sent: ${successful} successful, ${failed} failed out of ${dueMembers.length} due members.`;
        await sendWhatsapp(process.env.OWNER_PHONE, summaryMessage);
        console.log(`📱 Summary sent to owner`);
      } catch (error) {
        console.error('Error sending summary to owner:', error);
      }
    }

    console.log(`✅ Bulk reminder process completed - Success: ${successful}, Failed: ${failed}`);

    res.json({
      success: true,
      message: `Reminders sent to ${successful} members successfully`,
      data: {
        totalMembers: dueMembers.length,
        successful,
        failed,
        results
      }
    });

  } catch (error) {
    console.error('❌ Error in bulk reminder sending:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk reminders',
      error: error.message,
      data: {
        totalMembers: 0,
        successful: 0,
        failed: 0,
        results: []
      }
    });
  }
};

// SECURITY FIX: Mark Member Fee Paid (owner-specific)
const markMemberFeePaid = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { paidDate, paymentMethod = 'Cash', notes } = req.body;

    console.log(`💰 Marking member as paid - ID: ${memberId}`);

    // SECURITY FIX: Find the member only within this owner's gym
    const member = await Member.findOne({
      _id: memberId,
      ownerId: req.user.id
    });

    if (!member) {
      console.log(`❌ Member not found with ID: ${memberId} in your gym`);
      return res.status(404).json({
        success: false,
        message: 'Member not found in your gym'
      });
    }

    // Calculate next due date based on plan duration
    const lastPaidDate = paidDate ? new Date(paidDate) : new Date();
    let nextDueDate = new Date(lastPaidDate);

    // Add duration based on plan (adjust logic as per your plan structure)
    const planDurationMap = {
      '1 month': 30,
      '3 month': 90,
      '6 month': 180,
      '1 year': 365,
    };

    const daysToAdd = planDurationMap[member.planDuration] || 30; // Default to 30 days
    nextDueDate.setDate(nextDueDate.getDate() + daysToAdd);

    console.log(`📅 Updating payment - Last paid: ${lastPaidDate.toISOString()}, Next due: ${nextDueDate.toISOString()}`);

    // SECURITY FIX: Update member record only within this owner's gym
    const updatedMember = await Member.findOneAndUpdate(
      { _id: memberId, ownerId: req.user.id },
      {
        lastPaidOn: lastPaidDate,
        nextDueDate: nextDueDate,
        paymentStatus: 'Paid',
        paymentMethod: paymentMethod,
        paymentNotes: notes,
        updatedAt: new Date()
      },
      { 
        new: true,
        runValidators: true
      }
    );

    // Optional: Send confirmation WhatsApp to member
    if (member.phoneNo) {
      const confirmationMessage = `Hi ${member.name}, we have received your payment of ₹${member.feesAmount}. Your next due date is ${nextDueDate.toLocaleDateString('en-IN')}. Thank you!`;
      try {
        await sendWhatsapp(member.phoneNo, confirmationMessage);
        console.log(`📱 Payment confirmation sent to member: ${member.name}`);
      } catch (whatsappError) {
        console.error('Error sending confirmation WhatsApp:', whatsappError);
        // Don't fail the main operation if WhatsApp fails
      }
    }

    // Optional: Send notification to owner/admin
    if (process.env.OWNER_PHONE) {
      const ownerMessage = `Payment received from ${member.name} (${member._id.toString().slice(-6)}) - Amount: ₹${member.feesAmount}. Next due: ${nextDueDate.toLocaleDateString('en-IN')}`;
      try {
        await sendWhatsapp(process.env.OWNER_PHONE, ownerMessage);
        console.log(`📱 Owner payment notification sent`);
      } catch (whatsappError) {
        console.error('Error sending owner notification:', whatsappError);
      }
    }

    console.log(`✅ Member payment updated successfully: ${member.name}`);

    res.json({
      success: true,
      message: 'Member payment updated successfully',
      data: {
        memberId: updatedMember._id,
        memberName: updatedMember.name,
        lastPaidOn: updatedMember.lastPaidOn,
        nextDueDate: updatedMember.nextDueDate,
        paymentStatus: updatedMember.paymentStatus,
        amount: updatedMember.feesAmount
      }
    });

  } catch (error) {
    console.error('❌ Error marking member as paid:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status',
      error: error.message
    });
  }
};

// Export ALL functions using both exports.function and regular assignment
exports.sendMemberReminder = sendMemberReminder;
exports.markMemberFeePaid = markMemberFeePaid;
exports.getMemberDetails = getMemberDetails;
exports.sendAllMemberReminders = sendAllMemberReminders;

// Aliases for consistency
exports.markMemberAsPaid = markMemberFeePaid;
exports.sendAllReminders = sendAllMemberReminders;