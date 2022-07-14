const { messages, statusCodes } = require("../configs");
//const Response = require('../responses/responses')
const jwt = require('jsonwebtoken');
const { response } = require('./../middleware')
const authenticate = require('../utils/authenticate')

// exporting the hooks 
module.exports = async (req, res, next) => {
  try {

    let token = req.headers["x-access-token"] || req.headers["authorization"];

    if (!token) {
      return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, messages.invalidToken)
    } else {
      token = token.split(" ")
      token = token[1]
    }

    let checkToken = await authenticate.verifyToken(token);
    console.log("checkToken", checkToken);

    if (checkToken.status === true) {
      req.user = checkToken.data
      next();
    } else {
      response.errors(req, res, statusCodes.HTTP_UNAUTHORIZED, messages.unAuthorized);
    }
  } catch (e) {
    console.log(e);
    next({ status: statusCodes.HTTP_INTERNAL_SERVER_ERROR });
  }
};