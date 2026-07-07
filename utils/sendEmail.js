const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use SSL
  family: 4,    // Force IPv4 (helps avoid IPv6 connection issues)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    // Verify SMTP connection
    await transporter.verify();
    console.log("SMTP Server is ready");

    // Send email
    const info = await transporter.sendMail({
      from: `"work.find" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
};

module.exports = sendEmail;
