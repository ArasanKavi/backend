const mongoose = require("mongoose");
const roleTypeSchema = require("../schemas").roleType;

module.exports = mongoose.model("roleType", roleTypeSchema);