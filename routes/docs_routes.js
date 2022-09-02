
const express = require('express');

const router = express.Router();

router.get("/:path", async (req, res, next)=>{
  const path = req.params.path;
  const splitted = path.split("*")[0];
  try {
	  if(splitted == "user"){
	    return res.sendFile(process.env.rootPath + "files/user/"+path.split("*")[1]);
	  }
	  else if(splitted == "notice"){
      console.log(process.env.rootPath + "files/notice/"+path.split("*")[1]+"/"+path.split("*")[2]);
      return res.sendFile(process.env.rootPath + "files/notice/"+path.split("*")[1]+"/"+path.split("*")[2]);
	  }
    else{
      return next(new Error("document not found"));
    }
	
  } catch (error) {
    return next(error);
  }

})

module.exports = router;
