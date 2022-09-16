
const express = require("express");
const router = express.Router();
const user_model = require("../model/mongoose_models/user_model");
const { sendJsonWithTokens } = require("../services/response_sendjson");
const noticeModel = require('../model/mongoose_models/notice_model');


router.get("/get_profile_info", async (req, res, next)=>{
  try {
	const user = await user_model.findById(req.decoded.id).select("profile_photo username phone_number email profile_description");
	return res.send(sendJsonWithTokens(req,user));
  } catch (error) {
    return next(error);  
  }
})

router.get("/notice_details",async (req, res, next)=>{
  try {
	  const notice_id = req.body.notice_id;
	  if(!notice_id) return next(new Error(error_handling_services(error_types.dataNotFound,"notice id")));
	  if(!isValidObjectId(notice_id)) return next(new Error(error_handling_services(error_types.invalidValue,notice_id)));
	
	  const notice = await noticeModel.findById(notice_id).select("-price_details.buying_price -offers -photos_replace_count -offers_count").populate("saler_user","profile_photo username is_validated saler_score").populate("favorited_users", "profile_photo username")
    await notice.updateOne({
	    $inc: {displayed_count: 1},
	  });
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
  } catch (error) {
    return next(error);
  }
})

module.exports = router;