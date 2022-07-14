const mongoose = require("mongoose");
const Schema = mongoose.Schema;

module.exports = new Schema({
  
roleType:{
    type:String,
    trim:true
    
},
description:{
    type:String,
    trim:true
}

}, {
  timestamps: true
});