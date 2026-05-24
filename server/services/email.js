const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // Assuming gmail for dev, use SMTP host for prod
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendAnnouncementEmail = async (emails, title, content) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email service not configured. Skipping email notification.");
    return;
  }

  try {
    await transporter.sendMail({
      from: `"PlaceIQ Admin" <${process.env.EMAIL_USER}>`,
      to: emails, // Can be comma-separated list
      subject: `Important Announcement: ${title}`,
      text: content,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>${title}</h2>
          <p>${content}</p>
          <br/>
          <p style="color: gray; font-size: 12px;">This is an automated message from PlaceIQ.</p>
        </div>
      `
    });
    console.log(`Email sent to ${emails.length} recipients`);
  } catch (error) {
    console.error("Failed to send email", error);
  }
};
