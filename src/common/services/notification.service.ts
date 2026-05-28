import admin from "firebase-admin";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export class NotificationService {
  private client: admin.app.App | undefined;
  constructor() {
    try {
      let serviceAccount;
      if (process.env.FIREBASE_CREDENTIALS) {
        serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
      } else {
        serviceAccount = JSON.parse(
          readFileSync(
            resolve(
              "./src/config/notifaction-4a435-firebase-adminsdk-fbsvc-1ecfd772af.json",
            ),
            "utf8",
          ),
        );
      }
      this.client = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      console.warn(
        "⚠️ Firebase Admin initialization skipped: Credentials not found or invalid.",
      );
    }
  }
  async sendNotification({
    token,
    data,
  }: {
    token: string;
    data: {
      title: string;
      body: string;
    };
  }) {
    if (!this.client) return;
    const message = {
      token,
      data,
    };
    return await this.client.messaging().send(message);
  }
  async sendNotifications({
    tokens,
    data,
  }: {
    tokens: string[];
    data: {
      title: string;
      body: string;
    };
  }) {
    await Promise.allSettled(
      tokens.map((token) => {
        return this.sendNotification({ token, data });
      }),
    );
  }
}

export const notificationService = new NotificationService();
