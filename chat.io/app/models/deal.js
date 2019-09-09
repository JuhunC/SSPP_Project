'use strict'

var dealModel = require('../database').models.deal;
var chatModel = require('../database').models.chat;

var create = function (data, callback){
    var newDeal = new dealModel(data);
    newDeal.save(callback);
}

var findAll = function(data, callback){
    dealModel.find(data,callback).exec(function(err,response){
        if(err)throw err;
        //console.log(response);
        return callback(response);
    });
}

var findOneLatest = function(data, callback){
	dealModel.findOne(data).sort({'_id':-1}).exec(function(err, res){
        if (err) throw err;
        return callback(res);
    });
}

var getDeal = function (data, callback){
    var conditions = {
        roomId : data.roomId,
        sellerId : data.sellerId
    };
    dealModel.findOne(conditions).sort({'_id':-1}).exec(function(err, res){
        if(err){
            throw err;
        }
        else{
            return callback(null, res);
        }
    })
}

var updatePrice = function (data, callback){
    var conditions = {
        roomId : data.roomId,
        sellerId : data.sellerId
    };
    var update = {
        price : data.price
    };

    dealModel.findOneAndUpdate(conditions, update, function(err){
       if(err){
           throw(err);
       } 
       else{
           console.log("price updated successfully");
       }
    });
}

var updateBuyer = function (data, callback){
    var conditions = {
        roomId : data.roomId,
        sellerId : data.sellerId
    };
    var update = {
        buyerId : data.buyerId,
        finishedDate : data.finishedDate
    };
    dealModel.findOneAndUpdate(conditions, update).sort({'_id':-1}).exec(function(e, res){   
    });
    var chat_cond ={
        roomId: data.roomId,
        username: data.sellerId
    };
    var chat_update ={
        isDeal: "false"
    }
    chatModel.findOneAndUpdate(chat_cond, chat_update).sort({'_id':-1}).exec(function(e,res){
    });
}

module.exports = {
    create,
    findOneLatest,
    getDeal,
    updatePrice,
    updateBuyer,
    findAll
}