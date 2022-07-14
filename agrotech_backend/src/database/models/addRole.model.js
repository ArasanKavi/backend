const mongoose = require("mongoose");
const addRoleSchema = require("../schemas").addRole;

module.exports = mongoose.model("addRole", addRoleSchema);