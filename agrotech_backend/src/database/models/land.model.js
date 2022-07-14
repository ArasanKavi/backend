const mongoose = require("mongoose");
const landSchema = require("../schemas").land;

module.exports = mongoose.model("land", landSchema);