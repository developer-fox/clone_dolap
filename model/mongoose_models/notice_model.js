
const mongoose = require('mongoose');
const offerStates = require('../data_helper_models/offer_states');

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
      size: {
        type: String,
        required: true,
      },
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
        selling_with_offer : {type: Boolean, required: true}
      }
    },
    photos: {
      type: [{type: String, required: true}],
    },
    is_sold:{type: Boolean, default: false},
    saler_user:{type: mongoose.SchemaTypes.ObjectId, ref: "user", required: true},
    favorites_count: {type: Number, default: 0},
    created_date: {type: mongoose.SchemaTypes.Date, required: true},
    notice_questions: [
      {
        type: {
          question: {
            type: {
              date: {type: Date, required: true},
              user: {type: mongoose.SchemaTypes.ObjectId, required: true, ref: "user"},
              content: {type: String, required: true},
            }  
          },
          answer:  {
            date: {type: Date},
            user: {type: mongoose.SchemaTypes.ObjectId,  ref: "user"},
            content: {type: String},
          }
        },
        default: [],
      }
    ],
    offers: [{
      type: {
        proposer : {type: mongoose.SchemaTypes.ObjectId, required: true, ref: "user"},
        offer_price: {type: Number, required: true},
        offer_state: {type: String, default: offerStates.pending},
      },
      default: [],
    }],
});

module.exports = mongoose.model("notice", noticeShema, "notices");