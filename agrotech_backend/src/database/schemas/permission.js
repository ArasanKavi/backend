const mongoose = require("mongoose");
const Schema = mongoose.Schema;

module.exports = new Schema(
  {
    name: {
      type: String
    },
    permissionId: {
      type: String
    }
  },
  {
    timestamps: true
  }
);