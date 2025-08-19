const cron = require("node-cron");
const member = require("../models/Member");
const sendWhatsapp = require("./sendWhatsapp");
const Member = require("../models/Member");

cron.schedule("0 0 * * *", async () => {
  const today = new Date().toISOString().split("T")[0];
  const dueMember = await Member.find({ nextDueDate: today });

  for (const member of dueMember) {
    await sendWhatsapp(
      member.phoneNo,
      `Hi ${member.name}, your gym fees is due today.`
    );
    await sendWhatsapp(
      process.env.OWNER_PHONE,
      `Fees due today for member ${member.name} (${member.feesAmount})`
    );
  }
});
