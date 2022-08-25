"use strict"
const validator = require("express-validator");
const { saveNewUser, isEmailNotUsing } = require("../data_access/authentication_access");
const error_messages = require("../model/api_models/error_messages");
const newUser = require("../model/api_models/registering_user");
const express = require("express");
const bcrypt = require("bcrypt");
const tokenService = require("../services/jwt_services");
const { validationResult } = require("express-validator");
const { response } = require("express");
const user_model = require("../model/mongoose_models/user_model");
const login_types = require("../model/api_models/login_types");
const { sendJsonWithTokens } = require("../services/response_sendjson");

module.exports.signupController = async function (req, res, next) {
  if(req.token != null){
     const err = new Error("user already logged in");
    return next(err);
  };
  let errors = validator.validationResult(req);
  if(!errors.isEmpty()){
    return res.send(errors);
  }

  try {
    const search = await isEmailNotUsing(req.body.email);
    if(!search) {
      return next(new Error(error_messages.emailUsing));
    }
    const password = await bcrypt.hash(req.body.password, 12);
    const email = req.body.email;
    const phoneNumber = req.body.phone_number;
    const username = req.body.username;
    const user = new newUser(username, password, email, phoneNumber);
    let current_user = await user.saveToDatabase();
    const tokens = tokenService.createJwtToken(username, email, current_user._id);
    return res.status(201).send(tokens);
  } catch (error) {
    return next(error);
  }
}

module.exports.loginController = async (req, res, next) => {
  let errors = validator.validationResult(req);
  if(!errors.isEmpty()){
    return res.send(errors);
  }

  if(req.headers["x-access-token"] || req.headers["x-access-refresh-token"]){
    return next(new Error("user already logined"));
  }
  let userInDb;
  if(req.url == "/login_with_email"){
    const email = req.body.email;
    userInDb = await user_model.findOne({email: email});
    if(!userInDb){
      return next(new Error("user not found(email)"));
    }
  }
  else if(req.url == "/login_with_username"){
    const username = req.body.username;
    userInDb = await user_model.findOne({username: username});
    if(!userInDb){
      return next(new Error("user not found(username)"));
    }
  } 
  else{
    return next(new Error("undefined login type"));
  }
    const password = req.body.password;
    const passwordCompare = await bcrypt.compare(password, userInDb.password);
    if(!passwordCompare){
      return next(new Error("email veya kullanıcı adı hatalı"));
    }

  const tokens = tokenService.createJwtToken(userInDb.username, userInDb.email, userInDb._id);
  return res.status(202).send({
    info: "successfuly logined!",
    tokens
  });
}

module.exports.newPasswordController = async (req, res, next)=>{
  const user = await user_model.findOne({email: req.decodedJwt.email});
  const passwordComparing = await bcrypt.compare(req.body.newPassword, user.password);
  if(passwordComparing){
    return next(new Error("please select different password from old password"));
  }
  const hashedNewPassword = await bcrypt.hash(req.body.newPassword, 12);
  const result = await user.updateOne({$set: {password: hashedNewPassword}});
  if(result.modifiedCount){
    return res.send(sendJsonWithTokens(req, "password changing finished successfuly!"));
  }
  return next(new Error("error expected"));
}