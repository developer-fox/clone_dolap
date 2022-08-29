
const mongoose = require('mongoose');
const coupon_states = require('../data_helper_models/coupon_states');

const couponSchema = new mongoose.Schema({
  amount: {type: Number, required: true},
  // example: if price_condition equals to 100, if purchase price to equals 100 or more the coupon valid 
  title: {type: String, required: true},
  price_condition: {type: Number, required: true},
  expire_date: {type: Date, required: true},
  extent: {type: String, required: true},
  state: {type: String, default: coupon_states.usable, required: true},
  code: {type: String, required: true},
  informations: {
    type: [String], 
    default: [
      "Kupon indirimi sepette uygulanır.",
      "MyDolap kupon üzerinde değişiklik yapma hakkına sahiptir."
    ]
  }
});

module.exports = mongoose.model("coupon", couponSchema,"coupons");