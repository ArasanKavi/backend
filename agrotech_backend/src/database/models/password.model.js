const mongoose = require("mongoose");
const passwordSchema = require("../schemas").password;

module.exports = mongoose.model("password", passwordSchema);