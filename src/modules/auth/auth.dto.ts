import {z} from "zod"
import { confirmEmail, loginSchema, resendConfirmEmail, signupSchema } from "./auth.validation"


// export interface LoginDto {
//   email:string;
//   password:string;
// }
export type LoginDto = z.infer<typeof loginSchema.body>
export type SignupDto = z.infer<typeof signupSchema.body>
export type ConfirmEmaiilDto = z.infer<typeof confirmEmail.body>
export type ResendConfirmEmaiilDto = z.infer<typeof resendConfirmEmail.body>

