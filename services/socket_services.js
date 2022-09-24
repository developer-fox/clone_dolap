const { isValidObjectId , Types} = require("mongoose");
const {ObjectId} = require("mongodb")
const notification_types = require("../model/data_helper_models/notification_types");
const socket_model = require("../model/mongoose_models/socket_model");
const user_model = require("../model/mongoose_models/user_model");

module.exports = (io)=>{
  //* emits
  const emitExample = function(title){
    io.to("H4YIcAOtWvN7cn8-AAAB").emit("notification",{content: title});
  }
  const emitNotificationOneUser = async function(notificationModel,userId){
    try {
      const socket = await socket_model.findOne({user: Types.ObjectId(userId)}).populate("user","notifications unseen_notifications_count");
      if(!socket) throw new Error("socket id not found");
      const user = socket.user;
      await user_model.findByIdAndUpdate(user._id,{
        $addToSet: {
          notifications: notificationModel.modelToObject()
        },
        $inc: {unseen_notifications_count:1},
      });

	    io.to(socket.socket_id).emit("notification",{notification_data: {title: notificationModel.title,type: notificationModel.type }});
    } catch (error) {
      console.log(error);
    }
  }
  const emitNewJwt = async function(new_jwt,userId){
    try {
      const socket = await socket_model.findOne({user: userId});
      if(!socket) throw new Error("socket id not found");
	    io.to(socket.socket_id).emit("new_jwt",{new_jwt:new_jwt});
    } catch (error) {
      console.log(error);
    }
  }
  const emitActivationInfoToAnotherUsers = async function(user_id){
    try {
	    const user = await user_model.findById(user_id).select("last_seen is_active");
	    io.to(`activation:${user_id}`).emit(`activation_info`,{user_id: user.id,last_seen: user.last_seen, is_active: user.is_active});
    } catch (error) {
      console.log(error);
    }
  }

  //*listens 
  const listenExample = function(data){
    const socket = this;
    console.log(data);
  }
  const setNotificationSeenInfo = async function(notification_id){
    try {
      const socket = this;
      
      if(typeof notification_id != "string" || !isValidObjectId(notification_id)){
        throw new Error("invalid notification id");
      }
      else{
        const user = await user_model.findById(socket.decoded.id).select("notifications unseen_notifications_count").populate("notifications");
        let currentNotification;
        for(let notification of user.notifications){
          if(notification_id == notification.id){
            currentNotification = notification;
          }
        }
        if(!currentNotification)throw new Error("notification not found");
        if(currentNotification.is_seen) throw new Error("notification is already seen");
        currentNotification.is_seen = true;
        user.unseen_notifications_count = user.unseen_notifications_count -1;
        await user.save();
      }
    } catch (error) {
      console.log(error);
    }
  }
  const activateUser = async function(){
    try {
      const socket = this;
      await user_model.findByIdAndUpdate(socket.decoded.id,{
        $set: {is_active: true},
      });
      emitActivationInfoToAnotherUsers(socket.decoded.id);
    } catch (error) {
      console.log(error);
    }
  }
  const deactivateUser = async function(){
    try {
      const socket = this;
      const user = await user_model.findByIdAndUpdate(socket.decoded.id).select("is_active");
      if(!user.is_active) throw new Error("user already deactive.");
      await user.updateOne({
        $set: {
          is_active: false,
          last_seen: new Date(),
        },
      });
      emitActivationInfoToAnotherUsers(socket.decoded.id);
    } catch (error) {
      console.log(error);
    }
  }
  const listenUserActivation = async function(user_id){
    const socket = this;
    try {
	    if(typeof user_id != "string" || !isValidObjectId(user_id)){
	      throw new Error("invalid notification id");
	    }
	    const user = await user_model.findById(user_id).select("last_seen is_active");
	    if(!user) throw new Error("user not found");
      socket.join(`activation:${user_id}`);
      io.to(socket.socket_id).emit(`activation_info`,{user_id: user.id,last_seen: user.last_seen, is_active: user.is_active});
    } catch (error) {
      console.log(error);
    }
  }
  const abortListeningUserActivation = async function(user_id){
    const socket = this;
    try {
	    if(typeof user_id != "string" || !isValidObjectId(user_id)){
	      throw new Error("invalid notification id");
	    }
	    const user = await user_model.findById(user_id).select("username");
	    if(!user) throw new Error("user not found");
      socket.leave(`activation:${user_id}`);
    } catch (error) {
      console.log(error);
    }
  }

  return {
    emitExample,
    listenExample,
    emitNotificationOneUser,
    setNotificationSeenInfo,
    activateUser,
    deactivateUser,
    listenUserActivation,
    abortListeningUserActivation,
    emitActivationInfoToAnotherUsers,
    emitNewJwt  
  };
}