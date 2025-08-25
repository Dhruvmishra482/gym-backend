const cron = require("node-cron");
const Member = require("../models/Member");
const sendWhatsapp = require("./sendWhatsapp");

cron.schedule("0 0 * * *", async () => {
  const today = new Date().toISOString().split("T")[0];
  const dueMember = await Member.find({ nextDueDate: today });

  for (const member of dueMember) {
    try {
      await sendWhatsapp(
        member.phoneNo,
        `Hi ${member.name}, your gym fees is due today.`
      );
      await sendWhatsapp(
        process.env.OWNER_PHONE,
        `Fees due today for member ${member.name} (${member.feesAmount})`
      );
    } catch (error) {
      console.error(`Failed to send WhatsApp to ${member.name}:`, error);
    }
  }
});

module.exports = {}; // Export empty object or specific functions if needed