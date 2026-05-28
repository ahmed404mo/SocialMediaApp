import { HydratedDocument } from "mongoose"
import { IUser } from "../interfaces"
import { AvailabilityEnum } from "../enums";

export const getAvalibality = (user:HydratedDocument<IUser>)=>{
  return[
            { availability: AvailabilityEnum.PUBLIC },
            { availability: AvailabilityEnum.ONLY_ME, createdBy: user._id },
            { availability: AvailabilityEnum.FRIENDS, createdBy:[user._id, ...(user.friends || [])] },
            { tags: { $in: [user._id] } },
  ];
}