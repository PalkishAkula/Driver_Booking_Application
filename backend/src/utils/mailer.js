const nodemailer = require("nodemailer");

function createTransport() {
  const hasService = !!process.env.MAIL_SERVICE;
  const base = hasService
    ? {
        service: process.env.MAIL_SERVICE,
      }
    : {
        host: process.env.MAIL_HOST || "smtp.gmail.com",
        port: Number(process.env.MAIL_PORT) || 465,
        secure:
          process.env.MAIL_SECURE !== undefined
            ? String(process.env.MAIL_SECURE).toLowerCase() === "true"
            : true,
      };

  const transporter = nodemailer.createTransport({
    ...base,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
  return transporter;
}

async function sendMail({ to, subject, text }) {
  const transporter = createTransport();
  const fromAddress =
    process.env.MAIL_FROM ||
    process.env.MAIL_USER ||
    '"Trip Verification" <dataengineering445@gmail.com>';
  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
    });
    return info;
  } catch (err) {
    console.error(
      "Mailer sendMail error:",
      err?.response || err?.message || err
    );
    throw err;
  }
}

module.exports = { sendMail };
