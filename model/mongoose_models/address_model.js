const mongoose = require('mongoose');

module.exports = new mongoose.Schema({
  address_title: {type: String, required: true},
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
})
