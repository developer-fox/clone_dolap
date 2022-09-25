const express = require("express");
const error_types = require("../model/api_models/error_types");

module.exports = function (error,req, res, next) {
    for(let errorMessageString of definedErrorMessagesIncludedStrings){
      if(error.message.includes(errorMessageString)){
        let statusCode = statusCodesLiteral(error.message);
        return res.status(statusCode).send(error.message);
      }
    }
    console.log(error);
    return res.status(449).send("an error occurred: ");
}

function statusCodesLiteral(error_message){
  const objectLiteral =  {
    [error_message.includes("invalid value:") ? error_message:""]: 400,
    [error_message.includes("data not found:")? error_message:""]: 404,
    [error_message.includes("logical error: ")? error_message:""]: 412,
    [error_message.includes("authorization error at:")? error_message:""]: 401,
    [error_message.includes("jwt refresh token expired so login required.")? error_message:""]: 408,
    ["authentication required(with json web token)"]: 407
  }
  return objectLiteral[error_message];
}

const definedErrorMessagesIncludedStrings = [
  "invalid value:",
  "data not found:",
  "logical error: ",
  "authorization error at:",
  "jwt refresh token expired so login required.",
  "authentication required(with json web token)"
];