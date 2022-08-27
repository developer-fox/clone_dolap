const mongoose = require('mongoose');
const offerStates = require('../data_helper_models/offer_states');
const addressSchema = require("./address_model");
const sizes_model = require('./sizes_model');
const soldNoticeModel = require("./taken_notice_model");

const userSchema = new mongoose.Schema({
  // credit card informations will be added later"
  username: {type: String, required: true}, 
  phone_number : {type: String, required: true},
  email: {type: String, required: true},
  password: {type: String, required: true},
  addresses:{
    type: [addressSchema],
    default: [],
  },
  profile_description: {type:String, default:""},
  profile_photo: {type: String,  default: "default_photo.png"},
  followers: [{
    type: mongoose.SchemaTypes.ObjectId,
    default: [],
    ref: "user",
  }],
  follows: [{ 
    type: mongoose.SchemaTypes.ObjectId,
    default: [],
    ref: "user",
  }],
  favorites: [{
    type: mongoose.SchemaTypes.ObjectId,
    default: [],
    ref: "notice",
  }],
  sales: [{
    type: mongoose.SchemaTypes.ObjectId,
    ref: "notice",
    default: [],
  }],
  is_credible_saler :{type: Boolean, default: false},
  saler_score: {type: Number, required: false},
  last_seen: {type: Date},
  ratings: [
    {
      type: {
        rater_user: {type: mongoose.SchemaTypes.ObjectId, required: true, ref:"user"},
        rate_date: {type: Date,required: true},
        rating_content: {type: String, required: true},
        saler_answer: {type: String, required: false, },
        rating: {type: Number, required: true},
      },
      default: [],
    },
  ],
  notices: [{type: mongoose.SchemaTypes.ObjectId, default: [], ref: "notice"},],
  average_send_time: {type: Number, required: false},
  is_validated: {type: Boolean, default: false},
  enjoyed_campaings: [{
    type: mongoose.SchemaTypes.ObjectId,
    default: [],
    ref: "campaign"
  }],
  user_coupons: [{
    type: {
      coupon: {type: mongoose.SchemaTypes.ObjectId, required: true, ref: "coupon"},
      is_used_before: {type:Boolean, required: true, default: false},
    },
    default: [],
  }],
  buying_offers: [{
    type: {
      remaining_time: {type: mongoose.SchemaTypes.Date, required: true},
      price: {type: Number, required: true},
      notice: {type: mongoose.SchemaTypes.ObjectId, required: true, ref: "notice"},
      state: {type:String , default: offerStates.pending},
    },
    default: [],
  }],
  brands: [{type: String, default: []}],
  sizes: {
    type: [{
      top_size: {type: String, required: true},
      medium_size: {type: String, required: true},
      bottom_size: {type: String, required: true},
    },
    ],
    default: [],
  },
  feedbacks: {
    type: [mongoose.SchemaTypes.ObjectId],
    ref: "feedback",
    default: []
  },
  notifications: [{
    type: {
      notification_category: {type: String, required: true},
      Notification_content: {type: String, required: true},
      notification_date: {type: Date, required: true},
      is_seen: {type: Boolean, default: false},
      notification_relating_id: {type: mongoose.SchemaTypes.ObjectId, required: true},
    },
    default: [],
  }],
  taken_notices: {
    type: [mongoose.SchemaTypes.ObjectId],
    ref: "sold_notice",
    default: [],
  },
  sold_notices: {
    type: [mongoose.SchemaTypes.ObjectId],
    ref: "sold_notice",
    default: [],
  },

})

module.exports= mongoose.model("user", userSchema, "users");