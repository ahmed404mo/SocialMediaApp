import { IComment } from "../../common/interfaces";
import { CommentModel } from "../model";
import { DatabaseRepository } from "./base.repository";

export class CommentRepository extends DatabaseRepository<IComment>{
  constructor(){
    super(CommentModel)
  }
}