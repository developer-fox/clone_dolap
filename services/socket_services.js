const notification_types = require("../model/data_helper_models/notification_types");
const socket_model = require("../model/mongoose_models/socket_model");
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

  // listen
  const listenExample = function(data){
    const socket = this;
    console.log(data);
  }









  return {
    emitExample,
    listenExample,
    emitNotificationOneUser  
  };
}
