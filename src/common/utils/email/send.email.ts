import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer/index.js";
import {
  APPLICATION_NAME,
  EMAIL_APP,
  EMAIL_APP_PASSWORD,
} from "../../../config/config";

export const sendEmail = async ({
  to,
  cc,
  bcc,
  subject,
  html,
  attachments = [],
}: Mail.Options): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_APP,
      pass: EMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    to,
    cc,
    bcc,
    subject,
    attachments,
    from: `"${APPLICATION_NAME} "<${EMAIL_APP}>`,
    html,
  });
};
// console.log("USER:", EMAIL_APP, "PASS:", EMAIL_APP_PASSWORD);
