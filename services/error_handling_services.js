
const error_types = require("../model/api_models/error_types");

module.exports = (error_type,value)=>{
  let errorMessage = {
    [error_types.invalidValue] : `invalid value: ${value}`,
    [error_types.dataNotFound]: `data not found: ${value}`,
    [error_types.logicalError]: `logical error: ${value}`,
    [error_types.authorizationError]: `authorization error at: ${value}`,
    [error_types.expiredRefreshToken]: `jwt refresh token expired so login required.`,
    [error_types.jwtNotFound]: `authentication required(with json web token)`
  }
  return errorMessage[error_type];
}
