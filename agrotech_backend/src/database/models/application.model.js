const mongoose = require("mongoose");
const applicationSchema = require("../schemas").application;

module.exports = mongoose.model("application", applicationSchema);