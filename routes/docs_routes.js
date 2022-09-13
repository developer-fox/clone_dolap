
// will replaced

const express = require('express');
const fs = require('fs');
const router = express.Router();

router.get("/:path", async (req, res, next)=>{
  const path = req.params.path;
  const splitted = path.split("*")[0];
  try {
	  if(splitted == "user"){
      let dir = process.env.rootPath + "files/user/"+path.split("*")[1];
      if(!fs.existsSync(dir)){
        return next(new Error("undefined path or unreadable file"));
      }
	    return res.sendFile(dir);
	  }
	  else if(splitted == "notice"){
      let dir = process.env.rootPath + "files/notice/"+path.split("*")[1]+"/"+path.split("*")[2];
      if(!fs.existsSync(dir)){
        return next(new Error("undefined path or unreadable file"));
      }
      return res.sendFile(dir);
	  }
    else{
      return next(new Error("document not found"));
    }

  } catch (error) {
    return next(error);
  }

})

module.exports = router;
