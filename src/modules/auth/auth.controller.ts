import {type NextFunction, type Router as RouterType , type Request, type Response, Router } from "express";
import authService from './auth.service';
import { successResponse } from "../../common/response";
import { ILoginResponse, ISignupResponse } from "./auth.entity";
import * as validator from "./auth.validation"
import { validation } from "../../middleware";
const router:RouterType = Router()

router.post("/login", 
  validation(validator.loginSchema),
  async(req:Request, res:Response , _next:NextFunction):Promise<Response>=>{
const data = await authService.login(req.body, `${req.protocol}://${req.host}`)

  return successResponse<ILoginResponse>({res, data})
})

router.post("/signup", 
  validation(validator.signupSchema),
  async(req:Request, res:Response , _next:NextFunction):Promise<Response>=>{
const data =await authService.Signup(req.body)

  return successResponse<ISignupResponse>({res, status:201, data})
})

router.patch("/confirm-email",
    validation(validator.confirmEmail),
    async (req: Request, res: Response, _next: NextFunction) => {
        await authService.confirmEmail(req.body)
        return successResponse({ res })
    })

router.patch("/resend-confirm-email",
    validation(validator.resendConfirmEmail),
    async (req: Request, res: Response, _next: NextFunction) => {
        await authService.resendConfirmEmail(req.body)
        return successResponse({ res })
    })

router.post("/signup/gmail", 
  async (req: Request, res: Response, _next: NextFunction) => {
    console.log(req.body);
    const { status, credentials } = await authService.signupWithGmail(req.body.idToken, `${req.protocol}://${req.host}`)
    return successResponse({ res, status, data: { credentials } })
})


router.post("/request-forgot-password-code", 
  validation(validator.verifyEmail),
  async (req: Request, res: Response, _next: NextFunction) => {
    await authService.requestForgotPasswordCode(req.body);
    return successResponse({ res, status: 200 }); 
});

router.patch("/verify-forgot-password-code", 
  validation(validator.verifyForgotPasswordCode),
  async (req: Request, res: Response, _next: NextFunction) => {

    await authService.verifyForgotPasswordCode(req.body); 
    
    return successResponse({ res, status: 200 });
});

router.patch("/reset-forgot-password-code", 
  validation(validator.resetForgotPasswordCode),
  async (req: Request, res: Response, _next: NextFunction) => {
    await authService.resetForgotPasswordCode(req.body); 
    
    return successResponse({ res, status: 200 });
});
export default router