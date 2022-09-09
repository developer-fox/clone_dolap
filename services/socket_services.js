
const io = require("socket.io");
const http = require("http");
const ms = require("ms");
const jwtService = require("./jwt_services");
const jsonwebtoken = require("jsonwebtoken");
const error_messages = require("../model/api_models/error_messages");

let _socket;

module.exports.getIo = ()=>{
  if(!_socket) {
    throw new Error("io is not initialized");
  }
  else{
    return _socket;
  }
}

module.exports.initializeIo = (server)=>{
  if(!server){
    throw new Error("server is not initialized")
  }
  else if(!server instanceof http.Server){
    throw new Error("wrong server type");
  }
  else{
    _socket = io(server);

    // jwt validating
    _socket.use(async (socket,next)=>{
      let auth = socket.handshake.auth;
      if(!auth.jwt || !auth.jwt_refresh){
        next(new Error("auth error"));
      }
      else{
        try {
	        const jwtValid = jsonwebtoken.verify(auth.jwt,process.env.JWT_SECRET_KEY);
          socket.jwt = auth.jwt;
          socket.jwt_refresh = auth.jwt_refresh;
          socket.decoded = jwtValid;
          next();
        } catch (error) {
          if(error.message == error_messages.expiredJwtToken){
            try {
              const new_jwt = await jwtService.createNewJwtTokenWithRefreshToken(auth.jwt_refresh);
              socket.jwt = new_jwt;
              socket.jwt_refresh = auth.jwt_refresh;
              socket.decoded = await jsonwebtoken.decode(new_jwt);
              next();ss
            } catch (error) {
              if(error.message == error_messages.expiredJwtToken){
                next(new Error("refresh token expired"));
              }
              else{
                next(new Error("auth error"));
              }
            }
          }else{
            next(new Error("auth error"));
          }
        }
      }
    })


    _socket.on("connection",(socket)=>{
      console.log(socket.jwt);
      console.log(socket.decoded);
      
      if(socket.jwt != socket.handshake.auth.jwt){
        _socket.to(socket.id).emit("new_jwt",{token: socket.jwt});
      }

    })

  } 
}




