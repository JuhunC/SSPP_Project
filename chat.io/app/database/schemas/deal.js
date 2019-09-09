'use strict'

var Mongoose = require('mongoose');

var DealSchemma = new Mongoose.Schema({
    roomId : {type: String, required:true},
    productName : {type: String, required:true},
    sellerId : {type: String, required:true},
    buyerId : {type: String},
    price : {type:String, required:true},
    imageId : {type:String, default:""}, 
    submitDate: {type: String, required:true},
    finishedDate: {type: String}
});

var dealModel = Mongoose.model('deal', DealSchemma);

module.exports = dealModel;