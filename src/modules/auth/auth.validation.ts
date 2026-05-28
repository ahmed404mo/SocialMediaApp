import { z, ZodTypeAny } from "zod";
import { generalValidationFields } from "../../common/validation";

export const resendConfirmEmail = {
  body: z.strictObject({
    email: generalValidationFields.email,
  }),
};

export const confirmEmail = {
  body: resendConfirmEmail.body.safeExtend({
    otp: generalValidationFields.otp,
  }),
};

export const loginSchema = {
  body: resendConfirmEmail.body.safeExtend({
    password: generalValidationFields.password,
    FCM:z.string().optional()
  }),
};
export const signupSchema = {
  body: loginSchema.body
    .safeExtend({
      username: generalValidationFields.username,
      phone: generalValidationFields.phone.optional(),
      confirmPassword: generalValidationFields.confirmPassword,
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
};

export interface ValidationSchema {
  body: ZodTypeAny;
}

const emailBaseSchema = z.object({
  email: z
    .string()
    .email()
    .refine(
      (val) => {
        const tld = val.split(".").pop()?.toLowerCase();
        return ["com", "edu", "net"].includes(tld || "");
      },
      { message: "Domain must end with .com, .edu, or .net" },
    ),
});

export const verifyEmail: ValidationSchema = {
  body: emailBaseSchema,
};

const verifyCodeBaseSchema = emailBaseSchema.extend({
  otp: generalValidationFields.otp,
});

export const verifyForgotPasswordCode: ValidationSchema = {
  body: verifyCodeBaseSchema,
};

export const resetForgotPasswordCode: ValidationSchema = {
  body: verifyCodeBaseSchema
    .extend({
      password: generalValidationFields.password,
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Confirm password does not match",
      path: ["confirmPassword"],
    }),
};

export const updatePassword: ValidationSchema = {
  body: z
    .object({
      oldPassword: generalValidationFields.password,
      password: generalValidationFields.password,
      confirmPassword: z.string(),
    })
    .refine((data) => data.password !== data.oldPassword, {
      message: "New password must be different from old password",
      path: ["password"],
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Confirm password does not match",
      path: ["confirmPassword"],
    }),
};
