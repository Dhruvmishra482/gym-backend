const twilio=require("twilio")

const client=twilio(
    process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const sendWhatsapp=(toNumber,message)=>{
  return client.messages.create({
    from:"whatsapp:"+process.env.TWILIO_WHATSAPP_NUMBER,
    to:"whatsapp:"+ toNumber,
    body:message,
  })
}
module.exports=sendWhatsapp