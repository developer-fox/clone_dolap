
const mongoose = require('mongoose');
const userModel = require("../model/mongoose_models/user_model");

module.exports.isEmailNotUsing = async function (email){
  const foundUser = await userModel.findOne({email: email});
  return (foundUser == null);
}

module.exports.saveNewUser = async function (newUser) {
  try {
    const savedUser = new userModel({
      email: newUser.email,
      password: newUser.password,
      phone_number: newUser.phone_number,
      username: newUser.username,
    });
    await savedUser.save();
    return savedUser._id != null;
  } catch (error) {
    return error;
  }
}



