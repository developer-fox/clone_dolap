

const mongoose = require('mongoose');

const _schema = new mongoose.Schema({
  notice: {type: mongoose.SchemaTypes.ObjectId, required: true, ref: "notice"},
  saler_user: {type: mongoose.SchemaTypes.ObjectId, required: true, ref: "user"},
  buyer_user: {type: mongoose.SchemaTypes.ObjectId, required: true, ref: "user"},
  taken_date: {type: mongoose.SchemaTypes.Date, required:true},
  cargo_type: {type: String, required: true},
  order_code : {type: String, required: true},
  states: [{
    state_date: {type: Date, required: true},
    state_type: {type: String, required: true},
  }],
  contact_informations: {
    name: {type: String, required: true},
    surname: {type: String, required: true},
    phone_number: {type: String, required: true},
    credendial_id_number: {type: String, required: true},
  },
  address_informations: {
    city: {type: String, required: true},
    county: {type: String, required: true},
    neighborhood: {type: String, required: false},
    address_description: {type: String,required: true},
  },
  payment_details: [{
    payment_title: {type: String, required: true},
    payment_amount: {type: Number, required: true},
  }],
  payment_total : {
    amount: {type: Number, required: true},
    payment_type: {type: String, required: true},
  },
  is_rated: {type: Boolean, default: false},
  // card informations be add later
  //card_information: 
})

module.exports = mongoose.model("sold_notice",_schema, "sold_notices");