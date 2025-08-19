require("dotenv").config();
jest.setTimeout(30000);
// console.log(process.env.TWILIO_AUTH_TOKEN)
// console.log(process.env.TWILIO_ACCOUNT_SID);

const sendWhatsapp = require("../utils/sendWhatsapp");

describe("Whatsapp Real send test", () => {
  it("should send a real whatsapp message", async () => {
    const response = await sendWhatsapp(
      process.env.OWNER_PHONE,
      "✅ Test message from automated test case"
    );

    expect(response.sid).toBeDefined();
  });
});
