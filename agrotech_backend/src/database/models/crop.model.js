const mongoose = require("mongoose");
const cropSchema = require("../schemas").crop;

module.exports = mongoose.model("crop", cropSchema);