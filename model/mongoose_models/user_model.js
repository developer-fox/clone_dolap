const mongoose = require('mongoose');
const offerStates = require('../data_helper_models/offer_states');
const addressSchema = require("./address_model");
const notification_schema = require('./notification_schema');

const userSchema = new mongoose.Schema({
  username: {type: String, required: true}, 
  phone_number : {type: String, required: true},
  email: {type: String, required: true},
  password: {type: String, required: true},
  addresses:{
    type: [addressSchema],
    default: [],
  },
  profile_description: {type:String, default:""},
  profile_photo: {type: String,  default: "https://dolap-backend-bucket.s3.eu-west-2.amazonaws.com/blank-user.jpg"},
  profile_photo_replace_count: {type: Number, default: 0},
  followers: [{
    type: mongoose.SchemaTypes.ObjectId,
    default: [],
    ref: "user",
  }],
  followers_count : {type: Number, default: 0},
  follows: [{ 
    type: mongoose.SchemaTypes.ObjectId,
    default: [],
    ref: "user",
  }],
  follows_count : {type: Number, default: 0},
  favorites: [{
    type: mongoose.SchemaTypes.ObjectId,
    default: [],
    ref: "notice",
  }],
  favorites_count: {type: Number, default: 0},
  sales: [{
    type: mongoose.SchemaTypes.ObjectId,
    ref: "notice",
    default: [],
  }],
  is_credible_saler :{type: Boolean, default: false},
  saler_score: {type: Number, required: false},
  ratings: {
    type: [
      {
        rater_user: {type: mongoose.SchemaTypes.ObjectId, required: true, ref:"user"},
        rating_notice: {type: mongoose.SchemaTypes.ObjectId, required:true, ref: "notice"},
        rate_date: {type: Date,required: true},
        rating_content: {type: String, required: false},
        saler_answer: {type: String, required: false, },
        total_rating: {type: Number, required: true},
        rating_details: {
          communication_rate: {type: Number, required: true},
          validity_rate: {type: Number, required: true},
          packing_rate : {type: Number, required: true},
        },
      },
    ],
    default: [],
  },
  ratings_count: {type: Number, default: 0},
  notices: [{type: mongoose.SchemaTypes.ObjectId, default: [], ref: "notice"},],
  notices_count: {type: Number, default: 0,},
  average_send_time: {type: Number, required: false},
  is_validated_with_phone: {type: Boolean, default: false},
  is_validated_with_email: {type: Boolean, default: false},
  email_validation_hashed_route: {type: String, required: false},
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

  gotten_buying_offers: {
    type: [{
      remaining_time: {type: mongoose.SchemaTypes.Date, required: true},
      price: {type: Number, required: true},
      notice: {type: mongoose.SchemaTypes.ObjectId, required: true, ref: "notice"},
      state: {type:String , default: offerStates.pending},
    }
    ]
  },

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
  notifications: {
    type: [notification_schema],
    default: [],
  },
  unseen_notifications_count: {type: Number, default: 0},
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
  sold_notices_count: {type: Number, default: 0},
  most_favorite_category_for_looking : {type: String}, 
  most_favorite_category_for_saling : {type: String}, 
  user_looked_notices: {
    type: [mongoose.SchemaTypes.ObjectId],
    default: [],
    ref: "notice"
  },
  homepage_notices: {type: [mongoose.SchemaTypes.ObjectId], ref:"notice"},
  cart: {
    type: {
      items: [{
        notice: {type: mongoose.SchemaTypes.ObjectId, required: true, ref: "notice"},
        total_price: {type: Number, required: true},
        },
        ],
        details: [{
        detail_id: {type: mongoose.SchemaTypes.ObjectId},
        description: {type: String},
        amount: {type: Number},
        }]
      },
      default: {
        items: [],
        details: [],
      }
  },
  cart_items_count: {type: Number, default: 0},
  own_use_trending: {type: Number, default: 0},
  last_search : {
    type: [mongoose.SchemaTypes.ObjectId],
    ref: "notice"
  },
  last_seen: {type: Date},
  is_active: {type: Boolean, default: false},
})

module.exports= mongoose.model("user", userSchema, "users");