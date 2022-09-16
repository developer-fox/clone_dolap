const ms = require("ms");
const jwt = require("jsonwebtoken");
const error_types = require("../model/api_models/error_types");
const error_handling_services = require("./error_handling_services");

const envs = require("dotenv").config();

module.exports.validateJwt = async (req,res,next) => {
  // extracting token
  const token = req.headers["x-access-token"]; // Authorization: 'Bearer TOKEN'  const refreshToken = req.
  const refreshToken = req.headers["x-access-refresh-token"];
  // validating token nullability
  if(!token) {
    // if token is null go to the errors mw and send the error message
    return next(new Error(error_handling_services(error_types.jwtNotFound)));
  }
  else{
    // verifying token
    try {
	    const decoded = jwt.verify(token ,process.env.JWT_SECRET_KEY);
      req.decoded = decoded;
      return next();
    } catch (error) {
      if(error.message== "jwt expired"){
        // creating new token
        try {
           const newToken = await this.createNewJwtTokenWithRefreshToken(refreshToken);
           req.token = newToken;
           const decoded = await jwt.decode(req.token);
           req.decoded = decoded;
           return next();
        } catch (error) {
          return next(error);
        }
      }
      return next(error);
    }
  }
}

module.exports.createJwtToken = (id)=>{
  // creating jsw token and hold username and email (expires 1 minute)
  const token = jwt.sign({id: id},process.env.JWT_SECRET_KEY,{expiresIn: "3h"})
  //creating jsw refresh token and for 5 days
  const refreshToken = jwt.sign({id: id}, process.env.JWT_REFRESH_SECRET_KEY, {expiresIn: "5d"});
  return {refresh_token: refreshToken, jwt_token: token};
}
module.exports.createJwtTokenForWebsockets = (id)=>{
  // creating jsw token and hold username and email (expires 1 minute)
  const token = jwt.sign({id: id},process.env.WEBSOCKET_JWT_SECRET_KEY,{expiresIn: "3h"})
  //creating jsw refresh token and for 5 days
  const refreshToken = jwt.sign({id: id}, process.env.WEBSOCKET_JWT_REFRESH_SECRET_KEY, {expiresIn: "5d"});
  return {websocket_refresh_token: refreshToken, websocket_jwt_token: token};
}

module.exports.createNewJwtTokenWithRefreshToken = async (refreshToken)=>{
  try {
	  const validatingRefreshToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET_KEY,);
    const newToken = jwt.sign({id: validatingRefreshToken.id},process.env.JWT_SECRET_KEY, {expiresIn: "3h"});
    return newToken;
  } catch (error) {
    if(error.message == "jwt expired"){
      //TODO: redirecting authentication again
      throw new Error(error_handling_services(error_types.expiredRefreshToken,""));
    }
    else{
      throw error;
    }
  }
}
module.exports.createNewJwtTokenWithRefreshTokenForWebsockets = async (refreshToken)=>{
  try {
	  const validatingRefreshToken = jwt.verify(refreshToken, process.env.WEBSOCKET_JWT_REFRESH_SECRET_KEY,);
    const newToken = jwt.sign({id: validatingRefreshToken.id},process.env.WEBSOCKET_JWT_SECRET_KEY, {expiresIn: "3h"});
    return newToken;
  } catch (error) {
    if(error.message == "jwt expired"){
      //TODO: redirecting authentication again
      throw new Error(error_handling_services(error_types.expiredRefreshToken,""));
    }
    else{
      throw error;
    }
  }
}