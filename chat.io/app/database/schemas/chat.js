'use strict'

var Mongoose = require('mongoose');

var ChatSchemma = new Mongoose.Schema({
    roomId: {type: String, required:true},
    date: {type: String},
    username: {type: String},
    content: {type: String},
    isDeal: {type: String, required:true, default:"false"},
    imageId: {type: String, default:""}
});

var chatModel = Mongoose.model('chat',ChatSchemma);

module.exports = chatModel;