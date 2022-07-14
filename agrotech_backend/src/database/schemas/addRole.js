const mongoose = require("mongoose");
const Schema = mongoose.Schema;

module.exports = new Schema(
    {
        roleName: {
            type: String,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        permissions: [],
        roleId: {
            type: String,
            trim: true
        },
    },
    {
        timestamps: true
    }
);