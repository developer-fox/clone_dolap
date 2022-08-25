
module.exports.sendJsonWithTokens = (req,json) => {
  return {
    tokens: {jwt_token: req.token, refresh_token: req.headers["x-access-refresh-token"]},
    json: json
  }
}
