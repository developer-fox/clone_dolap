
const ms = require("ms");
const mongoose = require('mongoose');
const notice_model = require("../model/mongoose_models/notice_model");
const offer_states = require("../model/data_helper_models/offer_states");
const user_model = require("../model/mongoose_models/user_model");
const notice_states = require("../model/data_helper_models/notice_states");
const sold_notice_model = require("../model/mongoose_models/sold_notice_model");
const saled_notice_states = require("../model/data_helper_models/saled_notice_states");

module.exports.deleteOffer = (notice_id, proposer_id) => {
  setTimeout(async() => {
    const notice = await notice_model.findById(notice_id).select("offers");
    notice.offers.forEach( async offer => {
      if(offer.proposer == proposer_id && (offer.offer_state == offer_states.pending || offer.offer_state == offer_states.accepted) && offer.offer_type == "buy"){
        offer.offer_state = offer_states.expired;
        await notice_model.findOneAndUpdate({"_id": notice_id, "offers._id": offer._id}, {$set:{
          "offers.$": offer
        }});

        const proposer = await user_model.findById(proposer_id).select("buying_offers");
        proposer.buying_offers.forEach(async offer=>{
          if(offer.notice == notice_id){
            offer.state = offer_states.expired;
            await user_model.findOneAndUpdate({
              "_id": proposer_id,
              "buying_offers._id": offer._id
            },{$set: {
              "buying_offers.$": offer
            }}
            )
          }
        })
      }
    });
    console.log("expired");
  },ms("1d"));
}

module.exports.deleteSalingOffer = (notice_id, proposer_id,buyer_id) =>{
  setTimeout(async() => {
    const notice = await notice_model.findById(notice_id).select("offers");
    notice.offers.forEach( async offer => {
      if(offer.proposer == proposer_id && offer.offer_state == offer_states.pending && offer.offer_type == "sale"){
        offer.offer_state = offer_states.expired;
        await notice_model.findOneAndUpdate({"_id": notice_id, "offers._id": offer._id}, {$set:{
          "offers.$": offer
        }});

        const proposer = await user_model.findById(proposer_id).select("gotten_buying_offers");
        proposer.buying_offers.forEach(async offer=>{
          if(offer.notice == notice_id){
            offer.state = offer_states.expired;
            await user_model.findOneAndUpdate({
              "_id": buyer_id,
              "gotten_buying_offers._id": offer._id
            },{$set: {
              "gotten_buying_offers.$": offer
            }}
            )
          }
        })
      }
    });
    console.log("expired");
  },ms("1d"));
}

module.exports.deleteSalingAcceptedOffer = (notice_id, proposer_id,buyer_id) =>{
  setTimeout(async() => {
    const notice = await notice_model.findById(notice_id).select("offers");
    notice.offers.forEach( async offer => {
      if(offer.proposer == proposer_id && offer.offer_state == offer_states.accepted && offer.offer_type == "sale"){
        offer.offer_state = offer_states.expired;
        await notice_model.findOneAndUpdate({"_id": notice_id, "offers._id": offer._id}, {$set:{
          "offers.$": offer
        }});

        const proposer = await user_model.findById(proposer_id).select("gotten_buying_offers");
        proposer.buying_offers.forEach(async offer=>{
          if(offer.notice == notice_id){
            offer.state = offer_states.expired;
            await user_model.findOneAndUpdate({
              "_id": buyer_id,
              "gotten_buying_offers._id": offer._id
            },{$set: {
              "gotten_buying_offers.$": offer
            }}
            )
          }
        })
      }
    });
    console.log("expired");
  },ms("1d"));
}

module.exports.deleteStandOut = (notice_id)=>{
  setTimeout(async()=>{
    try {
	    const notice = await notice_model.findById(notice_id).select("is_featured state");
	    if(!notice) throw new Error("notice not found");
      if(notice.state == notice_states.takable && notice.is_featured){
        await notice_model.findByIdAndUpdate(notice_id, {$set: {is_featured: false}, $set: {feature_expire_time: new Date(1995, 11, 17, 3, 24, 0)}})
      }
    } catch (error) {
	  throw error;
    }
  },ms("1d"));
}

module.exports.soldNoticeToCargo = (sold_notice_id)=>{
  const randomHour = Math.floor(Math.random() * 48) +1;
  setTimeout(async()=>{
    try {

      const sold_notice = await sold_notice_model.findById(sold_notice_id).populate("notice", "details.brand details.category.detail_category");
      const currentNotice = sold_notice.notice;
      if(sold_notice.states[sold_notice.states.length-1].state_type == saled_notice_states.approved){
        await sold_notice_model.findByIdAndUpdate(sold_notice_id, {
          $addToSet: {
            states: {
              state_date: new Date(),
              state_type: saled_notice_states.shipped
            }
          }
        })  

        const buyerNotification = new notificationModel(
          "Siparişin Kargoya verildi.",
          `${currentNotice.details.brand} marka ${currentNotice.details.category.detail_category} ürün satıcı tarafından kargoya verildi. Detayları görmek için tıkla.`,
          notification_types.orderInfo,
          new Date(),
          [{item_id: sold_notice_id, item_type:"sold_notice"}]
        );
        socketServices.emitNotificationOneUser(buyerNotification, sold_notice.buyer_user);

        this.soldNoticeToDelivered(sold_notice_id);
      }
    } catch (error) {
      throw error;
    }  
  },
  ms(`${randomHour}h`));
}

module.exports.soldNoticeToDelivered = (sold_notice_id)=>{
  const randomHour = Math.floor(Math.random() * 48) +1;
  setTimeout(async()=>{
    try {
	    await sold_notice_model.findByIdAndUpdate(sold_notice_id, {
	      $addToSet: {
	        states: {
	          state_date: new Date(),
	          state_type: saled_notice_states.delivered
	        }
	      }
	    });

      const sold_notice = await sold_notice_model.findById(sold_notice_id).populate("notice", "details.brand details.category.detail_category");
      const currentNotice = sold_notice.notice;
	
      const buyerNotification = new notificationModel(
        "Siparişin teslim edildi.",
        `${currentNotice.details.brand} marka ${currentNotice.details.category.detail_category} ürünün ${sold_notice.contact_informations.name} ${sold_notice.contact_informations.surname} tarafından teslim alındı. İyi günlerde kullanın!`,
        notification_types.orderInfo,
        new Date(),
        [{item_id: sold_notice_id, item_type:"sold_notice"}]
        );
      socketServices.emitNotificationOneUser(buyerNotification, sold_notice.buyer_user.id);
    } catch (error) {
      throw error;
    }  
  },
  ms(`${randomHour}h`));
}
