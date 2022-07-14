if (!/prod/.test(process.env.NODE_ENV)) {
  require("dotenv/config");
}
let CONFIG = require('./config')(process.env.CONFIG_ARG)
const mongoose = require("mongoose");
module.exports = async () => {
  mongoose.connect(CONFIG.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
  });
  let db = mongoose.connection;
 // mongoose.set('debug', true);
  db.on("error", err => {
    console.log("MongoDB connection error. Please make sure MongoDB is running");
    process.exit();
  });
  console.log("Database connection established.")
}

