import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(`./.env.${process.env.NODE_ENV}`) });

export const PORT = process.env.PORT;
export const DB_URI = process.env.DB_URI as string;
export const ENC_BYTE = process.env.ENC_BYTE ?? "16";
export const SALT_ROUND = parseInt(process.env.SALT_ROUND ?? "10");

export const USER_TOKEN_SECRET_KEY = process.env
  .USER_TOKEN_SECRET_KEY as string;
export const USER_REFRESH_TOKEN_SECRET_KEY = process.env
  .USER_REFRESH_TOKEN_SECRET_KEY as string;
export const System_TOKEN_SECRET_KEY = process.env
  .System_TOKEN_SECRET_KEY as string;
export const System_REFRESH_TOKEN_SECRET_KEY = process.env
  .System_REFRESH_TOKEN_SECRET_KEY as string;

export const ACCESS_EXPIRES_IN = parseInt(
  process.env.ACCESS_EXPIRES_IN ?? "1800",
);
export const REFRESH_EXPIRES_IN = parseInt(
  process.env.REFRESH_EXPIRES_IN ?? "1800",
);
export const ENC_IV_LENGTH = parseInt(process.env.ENC_IV_LENGTH ?? "16");

export const RUDIS_URI = process.env.RUDIS_URI as string;

export const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD as string;
export const EMAIL_APP = process.env.EMAIL_APP as string;
export const APPLICATION_NAME = process.env.APPLICATION_NAME as string;
export const ORIGINS = (process.env.ORIGINS?.split(",") || []) as string[];
export const CLIENT_IDS = (process.env.CLIENT_IDS?.split(",") || []) as string[];

// cloudinary 
export const API_SECRET = process.env.API_SECRET as string;
export const API_KEY = process.env.API_KEY as string;
export const CLOUD_NAME = process.env.CLOUD_NAME as string;
