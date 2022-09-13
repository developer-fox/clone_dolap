
const notificationTypes = require('../model/data_helper_models/notification_types');
const notice_model = require('../model/mongoose_models/notice_model');
const user_model = require('../model/mongoose_models/user_model');
const sold_notice_model = require('../model/mongoose_models/sold_notice_model');
const { default: mongoose } = require('mongoose');
const error_types = require('../model/api_models/error_types');
const error_handling_services = require('../services/error_handling_services');

module.exports = async (items) =>{
  let result = [];
  for await(let item of items){
    const data = await getItemDatas(item).catch((err) =>console.log(err));
    result.push(data);
  }
  return result;
}


function getItemDatas(item)  {
  if(!mongoose.isValidObjectId(item.item_id)) throw new Error(error_handling_services(error_types.invalidValue,item.item_id));
  let type = item.item_type;
  switch (type) {
    case "notice":
      return new Promise(async(resolve, reject) =>{
        try {
          const data = await notice_model.findById(item.item_id).select("profile_photo");
          resolve({notice_id: data._id, notice_profile_photo: data.profile_photo});
        } catch (error) {
          reject(error);
        }
      });
    case "user": 
      return new Promise(async(resolve,reject)=>{
        try {
          const data = await user_model.findById(item.item_id).select("profile_photo");
          resolve({user_id: data._id, user_profile_photo: data.profile_photo});
        } catch (error) {
          reject(error);
        }
      });
    case "sold_notice": 
      return new Promise(async(resolve, reject) =>{
        try {
          const data = await sold_notice_model.findById(item.item_id).select("notice saler_user buyer_user"). populate("notice","profile_photo").populate("saler_user","profile_photo").populate("buyer_user", "profile_photo");
          const result = {
            notice: {notice_id: data.notice._id, notice_profile_photo: data.notice.profile_photo},
            saler_user: {user_id: data.saler_user._id, user_profile_photo: data.saler_user.profile_photo},
            buyer_user: {user_id: data.buyer_user._id, user_profile_photo: data.buyer_user.profile_photo},
          }
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    default:
      throw new Error(error_handling_services(error_types.invalidValue,type));
  }
}
