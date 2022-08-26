
const mongoose = require('mongoose');

module.exports = new mongoose.Schema({
  question: {
    type: {
      date: {type: Date, required: true},
      user: {type: mongoose.SchemaTypes.ObjectId, required: true, ref: "user"},
      content: {type: String, required: true},
    }  
  },
  answers:  {
   type: [
    { date: {type: Date},
    user: {type: mongoose.SchemaTypes.ObjectId,  ref: "user"},
    content: {type: String},
  }],
   default: [],
  },
})