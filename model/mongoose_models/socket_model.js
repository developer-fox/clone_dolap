
const mongoose = require('mongoose');
const uuid = require('uuid');

const socketSchema = new mongoose.Schema({
  user: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "user",
    required: true
  },
  socket_id: {
    type: String,
    required: true
  }
})

module.exports = mongoose.model("socket",socketSchema,"sockets");
