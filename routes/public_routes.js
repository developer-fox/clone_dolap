
const { sendJsonWithTokens } = require("../services/response_sendjson");
const noticeModel = require('../model/mongoose_models/notice_model');
const express = require('express');
const router = express.Router();
const userModel = require('../model/mongoose_models/user_model');
const error_handling_services = require('../services/error_handling_services');
const error_types = require('../model/api_models/error_types');
const { default: mongoose, isValidObjectId } = require("mongoose");

router.get("/user_info/:user_id", async (req, res, next) =>{
  const user_id = req.params.user_id;
  if(!user_id) return next(new Error(error_handling_services(error_types.dataNotFound,"user id")));
  if(!mongoose.isValidObjectId(user_id)) return next(new Error(error_handling_services(error_types.invalidValue,user_id)));
  try {
	  const user = await userModel.findById(user_id).select("username profile_description profile_photo last_seen is_validated saler_score followers_count follows_count sold_notices_count favorites_count is_credible_saler average_send_time notices_count ratings_count");
	  if(!user) return next(new Error(error_handling_services(error_types.dataNotFound,"user")));
    if(req.decoded != null) return res.send(sendJsonWithTokens(req, user));
    return res.send(user);
  } catch (error) {
    return next(error);
  }
});

router.get("/notice_details/:notice_id",async (req, res, next)=>{
  try {
	  const notice_id = req.params.notice_id;
	  if(!notice_id) return next(new Error(error_handling_services(error_types.dataNotFound,"notice id")));
	  if(!isValidObjectId(notice_id)) return next(new Error(error_handling_services(error_types.invalidValue,notice_id)));
	
	  const notice = await noticeModel.findById(notice_id).select("-price_details.buying_price -offers -photos_replace_count -offers_count -accepted_offers -list_of_the_users_added_this_in_their_cart").populate("saler_user","profile_photo username is_validated saler_score").populate("favorited_users", "profile_photo username");
    if(!notice) return next(new Error(error_handling_services(error_types.dataNotFound,"notice")));
    await notice.updateOne({
	    $inc: {displayed_count: 1},
	  });

    if (req.decoded != null) {
	    await userModel.findByIdAndUpdate(req.decoded.id, {
	      $set: {most_favorite_category_for_looking: await getUserMostFavoriteCategories.forLooking(req.decoded.id)}
	    });
      const noticeWithAcceptedOffers = await noticeModel.findById(notice_id).select("accepted_offers");
      let resultData = {
        notice: notice,
        acceptedOffer: {
          isFound: false,
          amount: 0
        } 
      }
      for await(let offer of noticeWithAcceptedOffers.accepted_offers){
        if(offer.proposer == req.decoded.id){
          resultData.acceptedOffer = {
            isFound: true,
            amount: offer.amount,
            offer_id: offer._id
          }
        }
      }
      return res.send(sendJsonWithTokens(req, resultData));
    }
    return res.send(notice);
  } catch (error) {
    return next(error);
  }
})

module.exports = router;