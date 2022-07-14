 require('dotenv').config();
module.exports = function (env) {
  const DEV_CONSTANTS = {
    PORT: 2122,
    MONGO_URL: "mongodb+srv://mrmed:mrmed@cluster0.qz1mw.mongodb.net/agrotech_user_stage?retryWrites=true&w=majority",
    NODE_ENV: process.env.NODE_ENV,
    200: "success"
  };

  const LOCAL_CONSTANTS = {
    PORT: 2122,
    MONGO_URL: "mongodb+srv://mrmed:mrmed@cluster0.qz1mw.mongodb.net/agrotech_user_stage?retryWrites=true&w=majority",
    NODE_ENV: process.env.NODE_ENV,
    200: "success"
  };

  const PREPROD_CONSTANTS = {
    PORT: 2122,
    MONGO_URL: "mongodb+srv://mrmed:mrmed@cluster0.qz1mw.mongodb.net/agrotech_user_stage?retryWrites=true&w=majority",
    NODE_ENV: process.env.NODE_ENV,
    200: "success"
  };

  const PROD_CONSTANTS = {
    PORT: process.env.PORT,
    MONGO_URL: process.env.MONGO_URL,
    NODE_ENV: process.env.NODE_ENV,
    200: "success"
  };
  
  let envType;

  switch(env){
      
    case "DEV": envType = DEV_CONSTANTS;
                break;

    case "LOCAL": envType = LOCAL_CONSTANTS;
                break;

    case "PREPROD": envType = PREPROD_CONSTANTS;
                break;
    
    case "PROD": envType = PROD_CONSTANTS;
                break;
                
    default   : envType = {NA: "NA"};
                break;
  }

  return envType;
};
