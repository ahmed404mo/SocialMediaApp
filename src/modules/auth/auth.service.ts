import {
  ConfirmEmaiilDto,
  LoginDto,
  ResendConfirmEmaiilDto,
  SignupDto,
} from "./auth.dto";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../common/exceptions";
import { UserRepository } from "../../DB/repository";
import {
  compareHash,
  generateEncryption,
  generateHash,
} from "../../common/utils/security";
import { SecurityServices } from "../../common/services/security.service";
import { emailEmitter, sendEmail } from "../../common/utils/email";
import { emailTemplate } from "../../common/utils/email/template.email";
import {
  NotificationService,
  notificationService,
  RedisService,
  redisService,
  TokenService,
} from "../../common/services";
import { EmailEnum, ProviderEnum } from "../../common/enums";
import { createRandomOtp } from "../../common/utils/otp";
import { ILoginResponse } from "./auth.entity";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { CLIENT_IDS } from "../../config/config";
import { IdTokenOptions } from "./../../../node_modules/google-auth-library/build/src/auth/idtokenclient.d";
import { Types } from "mongoose";

class AuthenticationService {
  private userRepository: UserRepository;
  private readonly securityServices: SecurityServices;
  private readonly redis: RedisService;
  private readonly tokenService: TokenService;
  private readonly notification: NotificationService;
  constructor() {
    this.userRepository = new UserRepository();
    this.securityServices = new SecurityServices();
    this.redis = redisService;
    this.tokenService = new TokenService();
    this.notification = notificationService;
  }

  // Login
  public async login(
    inputs: LoginDto,
    issuer: string,
  ): Promise<ILoginResponse> {
    const { email, password, FCM } = inputs;

    const user = await this.userRepository.findOne({
      filter: {
        email,
        provider: ProviderEnum.SYSTEM,
      },
    });
    if (!user) {
      throw new NotFoundException("Invalid login credentials");
    }

    if (!user.confirmEmail) {
      throw new BadRequestException("Please confirm your email first");
    }

    if (
      !(await compareHash({ plaintext: password, cipherText: user.password }))
    ) {
      throw new NotFoundException("Invalid login credentials");
    }
    if (FCM) {
      await this.redis.addFCM(user._id, FCM);
      const tokens = await this.redis.getFCMs(user._id);
      if (tokens?.length) {
        
        await this.notification.sendNotifications({tokens, data:{title:"login", body:`New login at ${Date.now()}`}})
      }
    }
    return await this.tokenService.createLoginCredentials(user, issuer);
  }

  private async sendEmailOtp({
    email,
    subject,
    title,
  }: {
    email: string;
    subject: EmailEnum;
    title: string;
  }) {
    const isBlockedTTL = await this.redis.ttl(
      this.redis.blockOtpKey({ email, subject }),
    );
    if (isBlockedTTL > 0) {
      throw new BadRequestException(
        `Sorry we cannot request new otp while are blocked please try again after ${isBlockedTTL}`,
      );
    }

    // 2. Check remaining OTP TTL
    const remainingOtpTTL = await this.redis.ttl(
      this.redis.otpKey({ email, subject }),
    );
    if (remainingOtpTTL > 0) {
      throw new BadRequestException(
        `Sorry we cannot request new otp while current otp still active please try again after ${remainingOtpTTL}`,
      );
    }

    // 3. Check max trial count
    const maxTrial = await this.redis.get(
      this.redis.maxAttemptOtpKey({ email, subject }),
    );
    if (maxTrial >= 3) {
      await this.redis.set({
        key: this.redis.blockOtpKey({ email, subject }),
        value: 1,
        ttl: 7 * 60,
      });
      throw new BadRequestException(`you have reached the max trial`);
    }

    // 4. Generate and save OTP
    const code = createRandomOtp();
    await this.redis.set({
      key: this.redis.otpKey({ email, subject }),
      value: await generateHash({ plaintext: `${code}` }),
      ttl: 120,
    });

    emailEmitter.emit("sendEmail", async () => {
      await sendEmail({
        to: email,
        subject,
        html: emailTemplate({ code, title }),
      });

      await this.redis.incr(this.redis.maxAttemptOtpKey({ email, subject }));
    });
  }

  public Signup = async ({
    email,
    username,
    password,
    phone,
  }: SignupDto): Promise<any> => {
    const checkUserExist = await this.userRepository.findOne({
      filter: { email },
      projection: "email",
      options: { lean: false },
    });
    console.log({ checkUserExist });
    if (checkUserExist) {
      throw new ConflictException("email exist");
    }

    const user = await this.userRepository.createOne({
      data: {
        email,
        username,
        password,
        phone: phone as string,
      },
    });
    if (!user) {
      throw new BadRequestException("Fail");
    }

    this.sendEmailOtp({
      email,
      subject: EmailEnum.CONFIRM_EMAIL,
      title: "Verfy Email",
    });
    return user.toJSON();
  };

  // confirmEmail
  public async confirmEmail({ email, otp }: ConfirmEmaiilDto) {
    const hashOtp = await this.redis.get(
      this.redis.otpKey({ email, subject: EmailEnum.CONFIRM_EMAIL }),
    );
    if (!hashOtp) {
      throw new NotFoundException("Expired otp");
    }

    const account = await this.userRepository.findOne({
      filter: {
        email,
        confirmEmail: { $exists: false },
        provider: ProviderEnum.SYSTEM,
      },
    });
    if (!account) {
      throw new NotFoundException("Fail to find matching account");
    }

    if (!(await compareHash({ plaintext: otp, cipherText: hashOtp }))) {
      throw new ConflictException("Invalid otp");
    }

    account.confirmEmail = new Date();
    await account.save();

    await this.redis.deleteKey(
      await this.redis.keys(this.redis.otpKey({ email })),
    );
    return;
  }

  // resend confirm email
  public async resendConfirmEmail({ email }: ResendConfirmEmaiilDto) {
    const account = await this.userRepository.findOne({
      filter: {
        email,
        confirmEmail: { $exists: false },
        provider: ProviderEnum.SYSTEM,
      },
    });
    if (!account) {
      throw new NotFoundException("Fail to find matching account");
    }

    await this.sendEmailOtp({
      email,
      subject: EmailEnum.CONFIRM_EMAIL,
      title: "Verify Email",
    });

    return;
  }

  // verify Gemail
  private async verifyGoogleAccount(idToken: string): Promise<TokenPayload> {
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: CLIENT_IDS,
    });
    const payload = ticket.getPayload();
    if (!payload?.email_verified) {
      throw new BadRequestException("Invalid token payload");
    }
    return payload;
  }

  // Login With Gemail
  async loginWithGmail(idToken: string, issuer: string) {
    const payload = await this.verifyGoogleAccount(idToken);

    const user = await this.userRepository.findOne({
      filter: {
        email: payload.email as string,
        provider: ProviderEnum.GOOGLE,
      },
    });
    if (!user) {
      throw new NotFoundException(
        "Invalid account provider or not register account",
      );
    }

    return await this.tokenService.createLoginCredentials(user, issuer);
  }

  // Signup With Gemail
  async signupWithGmail(idToken: string, issuer: string) {
    const payload = await this.verifyGoogleAccount(idToken);
    const checkExist = await this.userRepository.findOne({
      filter: {
        email: payload.email as string,
      },
    });
    console.log({ checkExist });
    if (checkExist) {
      if (checkExist.provider != ProviderEnum.GOOGLE) {
        throw new ConflictException("Invalid account provider");
      }
      return {
        status: 200,
        credentials: await this.loginWithGmail(idToken, issuer),
      };
    }

    const account = await this.userRepository.createOne({
      data: {
        firstName: payload.given_name as string,
        lastName: payload.family_name as string,
        email: payload.email as string,
        profilePicture: payload.picture as string,
        confirmEmail: new Date(),
        provider: ProviderEnum.GOOGLE,
      },
    });
    return {
      status: 201,
      credentials: await this.tokenService.createLoginCredentials(
        account,
        issuer,
      ),
    };
  }

  // Forgot-Password
  async requestForgotPasswordCode({ email }: { email: string }) {
    const account = await this.userRepository.findOne({
      filter: {
        email,
        confirmEmail: { $exists: true },
        provider: ProviderEnum.SYSTEM,
      },
    });

    if (!account) {
      throw new NotFoundException("invalid account");
    }

    await this.sendEmailOtp({
      email,
      subject: EmailEnum.FORGET_PASSWORD,
      title: "Reset Password",
    });

    return;
  }

  async verifyForgotPasswordCode({
    email,
    otp,
  }: {
    email: string;
    otp: string;
  }) {
    const hashOtp = await this.redis.get(
      this.redis.otpKey({ email, subject: EmailEnum.FORGET_PASSWORD }),
    );

    if (!hashOtp) {
      throw new NotFoundException("Expired otp");
    }

    if (!(await compareHash({ plaintext: otp, cipherText: hashOtp }))) {
      throw new ConflictException("invalid otp");
    }

    return;
  }

  async resetForgotPasswordCode({
    email,
    otp,
    password,
  }: {
    email: string;
    otp: string;
    password: string;
  }) {
    await this.verifyForgotPasswordCode({ email, otp });

    const account = await this.userRepository.findOneAndUpdate({
      filter: {
        email,
        confirmEmail: { $exists: true },
        provider: ProviderEnum.SYSTEM,
      },
      update: {
        password: await generateHash({ plaintext: password }),
        changeCredentialsTime: new Date(),
      },
      options: { new: true },
    });

    if (!account) {
      throw new NotFoundException("invalid account");
    }

    const otpKeys = await this.redis.keys(
      this.redis.otpKey({ email, subject: EmailEnum.FORGET_PASSWORD }),
    );

    if (otpKeys.length) {
      await this.redis.deleteKey(otpKeys);
    }

    return;
  }
}

export default new AuthenticationService();
