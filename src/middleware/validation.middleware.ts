import type{ NextFunction, Request, Response } from "express";
import { BadRequestException, MapGraphQLError } from "../common/exceptions";
import { ZodError, ZodType } from "zod";

type SchemaType  = Partial<Record<keyRequestType, ZodType>>
type keyRequestType = keyof Request
type IssuesType =Array<{
    key:keyRequestType,
    issues:Array<{
      message:string,
      path:(symbol | number | string | undefined | null)[]
    }> 
  }>

export const validation=(schema:SchemaType)=>{
return(req:Request, res:Response, next:NextFunction)=>{
  console.log(Object.keys(schema));
  const issues:IssuesType=[] 
  for (const key of Object.keys(schema) as keyRequestType[]) {
    if (!schema [key]) continue 

    const validationResult = schema[key].safeParse(req[key]);
    if (!validationResult.success) {
      if (req.file) {
        req.body.file = req.file
      }
      if (req.files) {
        req.body.files = req.files
      }
      const error=validationResult.error as ZodError
      issues.push({key, issues:error.issues.map(issue=> {return {path:issue.path , message: issue.message}})})
    }
    if (issues.length) {
      throw new BadRequestException("validation Error", {issues})
    }
  }
next()
}
}


export const GQLValidation = async <T>(schema: ZodType, args: T):Promise<boolean> => {

    const validationResult = schema.safeParse(args)
    if (!validationResult.success) {
        throw MapGraphQLError(new BadRequestException("Validation Error", {
            issues: validationResult.error.issues.map(issue => { return { path: issue.path, message: issue.message } })
        }))
    }
    return true
}

export const soketValidation = async <T>(schema: ZodType, args: T):Promise<boolean> => {

    const validationResult = schema.safeParse(args)
    if (!validationResult.success) {
        throw new BadRequestException("Validation Error"), {
            issues: validationResult.error.issues.map(issue => { return { path: issue.path, message: issue.message } })
        }
    }
    return true
}