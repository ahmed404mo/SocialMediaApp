import { EventEmitter } from "node:events";

type EmailFunction = () => Promise<void>;

export const emailEmitter = new EventEmitter();

emailEmitter.on("sendEmail", async (emailFunction: EmailFunction) => {
  try {
    await emailFunction();
  } catch (error) {
    console.log(`Fail to execute sendEmail event ${error}`);
  }
});

emailEmitter.on("Confirm_Email", async (emailFunction) => {
  try {
    await emailFunction();
  } catch (error) {
    console.log(`Fail to send user email ${error}`);
  }
});

// forgotPassword

emailEmitter.on("ForgotPassword", async (emailFunction) => {
  try {
    await emailFunction();
  } catch (error) {
    console.log(`Fail to send forgot password email ${error}`);
  }
});
