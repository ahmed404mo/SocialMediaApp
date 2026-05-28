import { Server } from "socket.io";
import { IAuthSoket } from "../../../common/types/express.types";
import { chatEvent, ChatEvent } from "./chat.events";

export class ChatGateway{
  private chatEvent:ChatEvent
  constructor(){
  this.chatEvent=chatEvent
  }

  registerEvents=(socket:IAuthSoket, io:Server)=>{
this.chatEvent.sayHi(socket)
this.chatEvent.sendMessage(socket,io)
this.chatEvent.join_room(socket,io)
      };

  }


export const chatGateway = new ChatGateway()