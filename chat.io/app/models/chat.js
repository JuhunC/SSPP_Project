'use strict'

var chatModel = require('../database').models.chat;

var create= function(data, callback){
    var newChat = new chatModel(data);
    newChat.save(callback);
};

var findById = function(id, callback){
    chatModel.findById(id, callback);
}

var addChat = function(data,callback){
    var chat = {
        roomId: data.roomId,
        date: data.date,
        username: data.username,
        content: data.content
    };
    create(chat,function(err,newChat){
        callback(err,newChat);
    });
}

var getChats = function(room, socket, callback){
    var chats = [];
    var roomID = room.id;
    
    chats = chatModel.find({roomId : roomID}, function(err, data){
        if (err){
            throw err;
        }else{
            return callback(null, data);
        }
    });
    //return callback(null, chats);
}

module.exports={
    create,
    addChat,
    getChats
};