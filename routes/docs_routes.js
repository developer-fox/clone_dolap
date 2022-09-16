
// will replaced

const express = require('express');
const error_types = require('../model/api_models/error_types');
const error_handling_services = require('../services/error_handling_services');
const fileServices = require("../services/file_services");
const router = express.Router();

router.get("/:main_folder/:body_folder?/:file_path", async (req, res, next)=>{
  let path = "";

  for (let i = 0; i < Object.keys(req.params).length; i++) {
    let key = Object.keys(req.params)[i];
    if(req.params[key] != null){
      path += req.params[key];
      if(i != Object.keys(req.params).length -1) path += "/";
    }
  }

  try {
    fileServices.s3.getObject({Bucket: process.env.bucket_name, Key: path},(err,data)=>{
      if(err){
        if(err.message == "The specified key does not exist."){
          return next(new Error(error_handling_services(error_types.dataNotFound,`file: ${path}`)));
        }
        return next(err); 
      } 
      res.attachment(req.params.file_path); // Set Filename
      res.type(data.ContentType); // Set FileType
      res.send(data.Body);        // Send File Buffer
    });
  } catch (error) {
    return next(error);
  }

})

module.exports = router;
