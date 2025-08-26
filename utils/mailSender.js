const nodemailer = require('nodemailer');

const mailSender = async (to, subject, html) => {
  try {
    // Transporter setup
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Gmail ke liye
      auth: {
        user: process.env.MAIL_USER, // aapka Gmail
        pass: process.env.MAIL_PASS, // App Password
      },
    });

    // Email options
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME || 'Gym Management'}" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error.message);
    throw error;
  }
};

module.exports = { mailSender };
