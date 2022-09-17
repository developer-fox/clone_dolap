
const socketio = require("socket.io");
const http = require("http");
const ms = require("ms");
const jsonwebtoken = require("jsonwebtoken");
const jwtService = require("./jwt_services");
const socketModel = require("../model/mongoose_models/socket_model");

let io;

module.exports.getIo = ()=>{
  if(!io) {
    throw new Error("io is not initialized");
  }
  else{
    return io;
  }
}


module.exports.initializeIo = (server)=>{
  if(!server){
    throw new Error("server is not initialized")
  }
  else{
    io = socketio(server);

    // jwt validating
    io.use(async (socket,next)=>{
      let auth = socket.handshake.auth;
      if(!auth.jwt || !auth.jwt_refresh){
        next(new Error("auth error"));
      }
      else{
        try {
  	      const jwtValid = jsonwebtoken.verify(auth.jwt,process.env.WEBSOCKET_JWT_SECRET_KEY);
          socket.jwt = auth.jwt;
          socket.jwt_refresh = auth.jwt_refresh;
          socket.decoded = jwtValid;
          next();
        } catch (error) {
          if(error.message == "jwt expired"){
            try {
              const new_jwt = await jwtService.createNewJwtTokenWithRefreshTokenForWebsockets(auth.jwt_refresh);
              socket.jwt = new_jwt;
              socket.is_replaced_jwt = true;
              socket.jwt_refresh = auth.jwt_refresh;
              socket.decoded = await jsonwebtoken.decode(new_jwt);
              next();
            } catch (error) {
              if(error.message == "jwt expired"){
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

    // socket id middleware
    io.use(async (socket, next) => {
      try {
  	    const userSocket = await socketModel.findOne({user: socket.decoded.id});
  	    if(!userSocket){
  	      const newSocket = new socketModel({
  	        user: socket.decoded.id,
  	        socket_id: socket.id
  	      });
  	      await newSocket.save();
          socket.socket_id = newSocket.socket_id;
          socket.join(newSocket.socket_id);
          next();
  	    }
        else{
          socket.socket_id = userSocket.socket_id;
          socket.join(userSocket.socket_id);
          next();
        }
      } catch (error) {
        next(new Error("error exprected when creating socket data"));
      }    
    })

    const socketService = require("./socket_services")(this.getIo());

    const onConnection = (socket) =>{
      //listens
      socket.on("info",socketService.listenExample),
      socket.on("notification_seen",socketService.setNotificationSeenInfo),
      socket.on("activate_user", socketService.activateUser),
      socket.on("deactivate_user",socketService.deactivateUser),
      socket.on("listen_user_activate", socketService.listenUserActivation),
      socket.on("abort_listen_user_activate", socketService.abortListeningUserActivation),
      // emits
      socketService.emitExample,
      socketService.emitNotificationOneUser,
      socketService.emitActivationInfoToAnotherUsers,
      socketService.emitNewJwt
      if(socket.is_replaced_jwt) socketService.emitNewJwt(socket.jwt, socket.decoded.id);
    }

    io.on("connection",onConnection);
    
  } 
}