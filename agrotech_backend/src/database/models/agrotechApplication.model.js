const mongoose = require("mongoose");
const agrotechApplication = require("../schemas").agrotechApplication;

module.exports = mongoose.model("agrotechApplication", agrotechApplication);