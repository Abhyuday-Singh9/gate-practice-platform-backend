require("dotenv").config();

const nodemailer = require("nodemailer");

const emailUser = process.env.EMAIL_USER;
const emailAppPassword = process.env.EMAIL_APP_PASSWORD;
const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:3000";

const transporter = emailUser && emailAppPassword
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailAppPassword
      }
    })
  : null;

async function sendEmail({ to, subject, text, html }) {
  if (!transporter) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email service is not configured");
    }

    return { skipped: true };
  }

  return transporter.sendMail({
    from: emailUser,
    to,
    subject,
    text,
    html
  });
}

function buildAuthLink(path, token) {
  return `${appBaseUrl}${path}${path.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
}

module.exports = {
  buildAuthLink,
  sendEmail
};
