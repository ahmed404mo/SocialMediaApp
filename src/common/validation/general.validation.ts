import { Types } from "mongoose";
import { z } from "zod";
export const generalValidationFields = {
  id: z
    .string()
    .refine((value) => Types.ObjectId.isValid(value), {
      message: "Invalid ObjectId",
    }),
  email: z.email(),
  password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,16}$/, {
    error: "Week password",
  }),
  phone: z
    .string({ error: "phone is required" })
    .regex(/^(00201|\+201|01)(0|1|2|5)\d{8}$/, {
      error: "Week password",
    }),
  otp: z.string({ error: "otp is required" }).regex(/^\d{6}$/, {
    error: "error otp code",
  }),
  username: z
    .string({ error: "username is mandatory" })
    .min(2, { error: "min is 2 char" })
    .max(25, { error: "max is 25" }),
  confirmPassword: z.string(),
  file: function (acceptableMimeTypes: string[]) {
    return z
      .strictObject({
        fieldname: z.string(),
        originalname: z.string(),
        encoding: z.string(),
        mimetype: z
          .string()
          .refine((val) => acceptableMimeTypes.includes(val), {
            message: "Invalid file type",
          }),
        buffer: z.any().optional(),
        path: z.string().optional(),
        size: z.number(),
      })
      .superRefine((args, ctx) => {
        if (!args.path && !args.buffer) {
          ctx.addIssue({
            code: "custom",
            message: "buffer is required",
            path: ["buffer"],
          });
        }
      });
  },
};

export const paginationValidationSchema = {
  query: z.strictObject({
    page: z.coerce.number().optional(),
    size: z.coerce.number().optional(),
    search: z.string().optional(),
  }),
};

export type PagiateDto = z.infer<typeof paginationValidationSchema.query>;
