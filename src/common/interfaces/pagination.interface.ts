import { HydratedDocument } from "mongoose";

export interface IPaginate<TRowDoc>{
    docs:HydratedDocument<TRowDoc>[],
    currentPage?:number | string | undefined,
    pages?:number | string |undefined,
    size?:number | string | undefined,
  }