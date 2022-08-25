const error_messages = require("../model/api_models/error_messages");
const express = require("express");

module.exports.errorsMiddleware = function (error,req, res, next) {
  res.send(error.message);
}
