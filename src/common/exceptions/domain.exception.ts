import { GraphQLError } from "graphql"
import { ApplicationException } from "./appliction.exception"

export const MapGraphQLError = (error: ApplicationException) => {

    throw new GraphQLError(
        error.message || 'internalServerError',
        {
            extensions: {
                statusCode: error.statusCode || 500,
                cause: error.cause
            }
        }
    )
}

export class BadRequestException extends ApplicationException {
  constructor(message:string="BadRequest", cause?:unknown){
    super(message,400,{cause})
  }
  
}

export class ConflictException extends ApplicationException {
  constructor(message:string="conflict", cause?:unknown){
    super(message,409,{cause})
  }
  
}
export class NotFoundException extends ApplicationException {
  constructor(message:string="NotFound", cause?:unknown){
    super(message,404,{cause})
  }
  
}
export class UnauthorizedException extends ApplicationException {
  constructor(message:string="Unauthorized", cause?:unknown){
    super(message,401,{cause})
  }
  
}
export class forbiddenException extends ApplicationException {
  constructor(message:string="forbidden", cause?:unknown){
    super(message,403,{cause})
  }
  
}