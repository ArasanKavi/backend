const mongoose = require("mongoose");
const reportBodyDataSchema = require("../schemas").reportBodyData;

module.exports = mongoose.model("reportDataSchema", reportBodyDataSchema);