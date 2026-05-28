import { Server } from "socket.io";
import { BadRequestException } from "../../../common/exceptions";
import { IAuthSoket } from "../../../common/types/express.types";
import { soketValidation } from "../../../middleware";
import { chatService, ChatService } from "../chat.service";

import * as validators from "../chat.validate"
import { redisService, RedisService } from "../../../common/services";

export class ChatEvent {
  private chatService:ChatService
  private redisServic : RedisService
  constructor(){
this.chatService = chatService
this.redisServic = redisService
  }
  sayHi =   (socket:IAuthSoket)=>{return socket.on("sayHi", async (data:{name:string}) => {
try {
  await soketValidation<{name:string}>(validators.sayHi, data)
          console.log({ data });
          const result = this.chatService.sayHi()
        socket.emit("sayHi", result)
        throw new BadRequestException("Fail")
} catch (error) {
  socket.emit("custom_error", error)
}  
    })
  }
  sendMessage = (socket:IAuthSoket, io:Server)=>{
    return socket.on("sendMessage", async({content, sendTo}:{sendTo:string, content:string})=>{
      try {

        await this.chatService.sendMessage({content, sendTo},socket.data.user)
        console.log({content, sendTo});
        
        io.to(await this.redisServic.getSockets(socket.data.user._id)).emit("successMessage", {content, sendTo})
const receiverSocketIds = await this.redisServic.getSockets(socket.data.user._id)
if (receiverSocketIds.length) {
        socket.to(receiverSocketIds).emit("newMessage", {content, from:socket.data.user})
  
}
      } catch (error) {
        socket.emit("custom_error", error)
      }
    })
  }

  sendGroupMessage = (socket:IAuthSoket, io:Server)=>{
    return socket.on("sendGroupMessage", async({content, groupId}:{ content:string, groupId:string})=>{
      try {

        const roomId = await this.chatService.sendGroupMessage({content, groupId},socket.data.user)
        console.log({content, groupId});
        
        io.to(await this.redisServic.getSockets(socket.data.user._id)).emit("successMessage", {content, sendTo:groupId})
socket.to(roomId).emit("newMessage", {content, groupId})
      } catch (error) {
        socket.emit("custom_error", error)
      }
    })
  }

    join_room = (socket:IAuthSoket, _io:Server)=>{
    return socket.on("joinRoom", async({roomId}:{ roomId:string})=>{
      try {
socket.join(roomId)
      } catch (error) {
        socket.emit("custom_error", error)
      }
    })
  }

}

export const chatEvent = new ChatEvent()