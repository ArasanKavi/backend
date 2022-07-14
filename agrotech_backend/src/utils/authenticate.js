require('dotenv').config();

const jwt = require('jsonwebtoken');
//const Response = require('../responses/responses')
const { user } = require('../database/models')

// authenticate
function authenticate() {
  const methods = {

    verifyToken: async (token) => {
      try {

        let decoded = await jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded)
        return {
          status: true,
          data: decoded
        }
      } catch (err) {
        console.log("err", err);
        return {
          status: false,
          erroType: 'TokenExpiredError'
        }
      }
    },

    verifyRefreshToken: async (token) => {
      try {

        let decoded = await jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

        let userData = await user.findOne({ _id: decoded._id, refreshToken: token })
        console.log("userData", userData);
        if (userData) {
          return {
            status: true,
            data: {
              _id: userData._id,
              emailId: userData.emailId
            }
          }
        } else {
          return {
            status: false,
            erroType: 'userNotFound'
          }
        }
      } catch (err) {
        console.log("err", err);
        return {
          status: false,
          erroType: 'TokenExpiredError'
        }
      }
    },

    verifyForgotPasswordToken: async (token) => {
      try {
        let decoded = await jwt.verify(token, process.env.FORGOT_PASSWORD_SECRET);
        let userData = '';
        userData = await user.findById(decoded._id)

        if (userData) {
          return {
            status: true,
            data: {
              _id: userData._id,
              emailId: userData.emailId
            }
          }
        } else {
          return {
            status: false,
            erroType: 'userNotFound'
          }
        }
      } catch (err) {
        console.log("err", err);
        return {
          status: false,
          erroType: 'TokenExpiredError'
        }
      }
    },

    verifyUserForgotPasswordToken: async (token) => {
      try {

        let decoded = await jwt.verify(token, process.env.FORGOT_PASSWORD_SECRET);
        let userData = '';
        userData = await user.findById(decoded._id)

        if (userData) {
          return {
            status: true,
            data: {
              _id: userData._id,
              emailId: userData.emailId
            }
          }
        } else {
          return {
            status: false,
            erroType: 'userNotFound'
          }
        }
      } catch (err) {
        console.log("err", err);
        return {
          status: false,
          erroType: 'TokenExpiredError'
        }
      }
    }






  }



  // return Object freeze 
  return Object.freeze(methods);
}

// exporting the modules 
module.exports = authenticate();