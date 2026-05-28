import multer from "multer";

export const fileFieldValidation = {
  image: ["image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp"],
  document: ["application/pdf", "application/msword"],
};

const storage = multer.diskStorage({});
export const upload = multer({ storage });
