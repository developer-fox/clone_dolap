
const morgan = require('morgan');
const mongoose = require('mongoose');

// log schema for logging datas
const logSchema = new mongoose.Schema({
  ip_address: {type: String, required: true},
  request_method : {type: String, required: true},
  url: {type: String, required: true},
  status_code: {type: String, required: true},
  response_time: {type: Number, required: true},
  x_access_token: {type: String, required: true},
  request_body: {type: mongoose.SchemaTypes.String, required: true},
});

const logModel = mongoose.model("log",logSchema,"logs");

// create writer function for logging stream option
const writeToDb = {
  write: (line) => {
    let [ip_address, request_method, url, status_code, response_time,x_access_token,request_body] = line.split(" ");
    if(Number.isNaN(Number.parseInt(response_time))) response_time = -1;
    const newLog = new logModel({ip_address: ip_address, request_method: request_method,url: url,status_code: status_code, response_time: response_time, x_access_token: x_access_token.trim(), request_body: request_body.trim()});
    newLog.save((err)=>{
      if(err) console.log(err);
    });
  }
}

morgan.token("body",(req,res)=>{
  if(Object.keys(req.body).includes("password")){
    req.body.password = "*******************";
  }
  return JSON.stringify(req.body);
})

module.exports = morgan(":remote-addr :method :url :status :response-time[digits] :req[x-access-token] :body",{
  skip: function(req,res) {return req.url == "/favicon.ico"},
  stream: writeToDb
});