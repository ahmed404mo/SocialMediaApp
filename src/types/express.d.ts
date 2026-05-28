import { IUser } from "../common/interfaces";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}