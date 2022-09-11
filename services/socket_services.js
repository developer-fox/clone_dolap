const { isValidObjectId } = require("mongoose");
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
      const socket = await socket_model.findOne({user: userId}).populate("user","notifications unseen_notifications_count");
      if(!socket) throw new Error("socket id not found");
      const user = socket.user;
      await user.updateOne({
        $addToSet: {
          notifications: notificationModel.modelToObject()
        },
        $inc: {unseen_notifications_count:1},
      });

	    io.to(socket.socket_id).emit("notification",{notification_data: notificationModel});
    } catch (error) {
      throw error;
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
      console.log(socket.decoded.id);
      console.log(socket.socket_id);
      console.log(notification_id);
      
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
	    const user = await user_model.findById(user_id).select("username");
	    if(!user) throw new Error("user not found");
      
      socket.join(`activation:${user_id}`);
      console.log(socket.rooms);

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
    listenUserActivation  
  };
}
