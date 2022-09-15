
const mongoose = require('mongoose');
const noticeQuestionsModel = require('./notice_questions_model');
const offerStates = require('../data_helper_models/offer_states');
const noticeStates = require('../data_helper_models/notice_states');

const noticeShema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },

  details: {
    type: {
      category: {
        type: {
          top_category: {type: String, required: true},
          medium_category: {type: String, required: true},
          bottom_category: {type: String, required: true},
          detail_category: {type: String, required: true},
        },
        required: true,
      },
      brand: {
        type: String,
      },
      use_case: {
        type: String,
        required: true,
      },
      size: {type: String,},
      color:{
        type: String,
        required: true,
      },
      size_of_cargo:{
        type: String,
        required: true,
      }
    },
  },
    payer_of_cargo:{
      type: String,
      required: true,
    },
    price_details:{
      type: {
        buying_price: {type: Number, required: true},
        saling_price: {type: Number, required: true},
        selling_with_offer : {type: Boolean, required: true},
        initial_price: {type: Number, required: true},
      }
    },
    photos: {
      type: [{type: String, default: []}],
    },
    photos_replace_count: {type: Number, default:0},
    profile_photo: {type: String, default: ""},
    state:{type: String, default: noticeStates.awaitConfirmation},
    saler_user:{type: mongoose.SchemaTypes.ObjectId, ref: "user", required: true},
    favorites_count: {type: Number, default: 0},
    favorited_users: {
      type: [mongoose.SchemaTypes.ObjectId],
      default: [],
      ref: "user"
    },
    created_date: {type: mongoose.SchemaTypes.Date, required: true},
    is_updated: {type: Boolean, default: false},
    notice_questions: [noticeQuestionsModel],
    offers: [{
      type: {
        proposer : {type: mongoose.SchemaTypes.ObjectId, required: true, ref: "user"},
        remaining_time: {type: mongoose.SchemaTypes.Date, required: true},
        offer_price: {type: Number, required: true},
        offer_state: {type: String, default: offerStates.pending},
        offer_type: {type: String, required: true},
      },
      default: [],
    }],
    offers_count: {type: Number, default: 0},
    displayed_count : {type: Number, default: 0},
    is_featured: {type: Boolean, default: false},
    feature_expire_time: {type: Date, default:new Date(1995, 11, 17, 3, 24, 0)},
    stars: {type: Number, default: 0},
    accepted_offers: [{
      type: {
        proposer: {type: mongoose.SchemaTypes.ObjectId, required: true, ref: "user"},
        amount: {type: Number, required: true},
        offer_id:  {type: mongoose.SchemaTypes.ObjectId, required: true},
      },
      default: [],
    }],
});

module.exports = mongoose.model("notice", noticeShema, "notices");