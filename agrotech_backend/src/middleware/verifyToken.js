const { statusCodes } = require('./../configs');
const { InternalServices } = require('./../apiServices');
const jwt = require('jsonwebtoken');
const unAuthorizedResponse = {status: statusCodes.HTTP_UNAUTHORIZED, message: "unauthorized"};
module.exports = {
  validateToken: async (req, res, next) => {
    // try {
    //   req.user = await InternalServices.verifyToken(req.headers);
    //   console.log("user", req.user);
    //   next();
    // } catch (err) {
    //   console.log("error msgs", err.message);
    //   next({status: statusCodes.HTTP_UNAUTHORIZED, message: "unauthorized"})
    // }
    
    try {
      
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
      next(unAuthorizedResponse)
    }
   
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        next(unAuthorizedResponse)
      }
      req.user = user;
      next();
    })
  } catch (err) {
      console.log("error msgs", err.message);
      next(unAuthorizedResponse)
    }
  
  }
};