const ms = require("ms");
const jwt = require("jsonwebtoken");

const error_messages = require("../model/api_models/error_messages");
const envs = require("dotenv").config();

module.exports.validateJwt = async (req,res,next) => {
  // extracting token
  const token = req.headers["x-access-token"]; // Authorization: 'Bearer TOKEN'  const refreshToken = req.
  const refreshToken = req.headers["x-access-refresh-token"];
  // validating token nullability
  if(!token) {
    // if token is null go to the errors mw and send the error message
    return next(new Error(error_messages.notFoundToken));
  }
  else{
    // verifying token
    try {
	    const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY);
      req.decoded = decoded;
      return next();
    } catch (error) {
      if(error.message== error_messages.expiredJwtToken){
        // creating new token
        try {
          console.log(error.message);
           const newToken = await this.createNewJwtTokenWithRefreshToken(refreshToken);
           req.token = newToken;
           const decoded = await jwt.decode(req.token);
           req.decoded = decoded;
           return next();
        } catch (error) {
          return next(error);
        }
      }
      console.log(error);
      return next(error);
    }
  }
}

module.exports.createJwtToken = (username, email, id)=>{
  // creating jsw token and hold username and email (expires 1 minute)
  const token = jwt.sign({username: username, email: email, id: id},process.env.JWT_SECRET_KEY,{expiresIn: ms('3h')})
  //creating jsw refresh token and for 5 days
  const refreshToken = jwt.sign({username: username, email: email, id: id}, process.env.JWT_REFRESH_SECRET_KEY, {expiresIn: "5d"});
  return {refresh_token: refreshToken, jwt_token: token};
}

module.exports.createNewJwtTokenWithRefreshToken = async (refreshToken)=>{
  try {
	  const validatingRefreshToken = jwt.verify(refreshToken,  process.env.JWT_REFRESH_SECRET_KEY,);
    const newToken = jwt.sign({username: validatingRefreshToken.username, email: validatingRefreshToken.email, id: validatingRefreshToken.id},process.env.JWT_SECRET_KEY, {expiresIn: ms('3h')});
    return newToken;
  } catch (error) {
    if(error.message == error_messages.expiredJwtToken){
      //TODO: redirecting authentication again
      throw new Error("refresh token is expired so authentication required");
    }
    else{
      throw error;
    }
  }
}