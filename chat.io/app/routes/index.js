'use strict';

var express = require('express');
var router = express.Router();
var passport = require('passport');
var multer = require('multer'); // express에 multer모듈 적용 (for 파일업로드)
// multer라는 모듈이 함수라서 함수에 옵션을 줘서 실행을 시키면, 해당 함수는 미들웨어를 리턴한다.

let storage = multer.diskStorage({
  destination: function(req, file ,callback){
    callback(null, "public/uploads/")
  },
  filename: function(req, file, callback){
    callback(null, file.originalname)
  }
})
 
let upload = multer({storage: storage})

var User = require('../models/user');
var Room = require('../models/room');
var Deal = require('../models/deal');

// Home page
router.get('/', function (req, res, next) {
  // If user is already logged in, then redirect to rooms page
  if (req.isAuthenticated()) {
    res.redirect('/main');
  }
  else {
    res.render('login', {
      success: req.flash('success')[0],
      errors: req.flash('error'),
      showRegisterForm: req.flash('showRegisterForm')[0]
    });
  }
});

// Login
router.post('/login', passport.authenticate('local', {
  failureRedirect: '/',
  failureFlash: true
}), (req, res) => {
  if (req.user.username === 'admin') {
    res.redirect('/admin');
  }
  if (req.user.username !== 'admin') {
    res.redirect('/main');
  }
});

// Register via username and password
router.post('/register', function (req, res, next) {

  var credentials = { 'username': req.body.username, 'password': req.body.password };

  if (credentials.username === '' || credentials.password === '') {
    req.flash('error', 'Check ID or PW');
    req.flash('showRegisterForm', true);
    res.redirect('/');
  } 
  else {
    // Check if the username already exists for non-social account
    User.findOne({ 'username': new RegExp('^' + req.body.username + '$', 'i'), 'socialId': null }, function (err, user) {
      if (err) throw err;
      if (user) {
        if (credentials.username === 'admin') {
          req.flash('error', 'admin is not allowed');
          req.flash('showRegisterForm', true);
          res.redirect('/');
        }
        req.flash('error', 'Username already exists.');
        req.flash('showRegisterForm', true);
        res.redirect('/');
      } else {
        User.create(credentials, function (err, newUser) {
          if (err) throw err;
          req.flash('success', 'Your account has been created. Please log in.');
          res.redirect('/');
        });
      }
    });
  }
});

router.get('/main', [User.isAuthenticated, function (req, res, next) {
  Room.find(function (err, rooms) {
    if (err) throw err;
    res.render('main', { rooms });
  });
}]);

// Rooms
router.get('/rooms', [User.isAuthenticated, function (req, res, next) {
  Room.find(function (err, rooms) {
    if (err) throw err;
    res.render('rooms', { rooms });
  });
}]);

// Deal management
router.get('/deal', [User.isAuthenticated, function (req, res, next) {
  var queryCount = 0;
  Room.find(function(err, rooms){
    var deals = [];
    for(var i=0; i<rooms.length; i++){
      var searchData = {
        roomId : rooms[i].id,
        sellerId : req.user.username
      };
      Deal.findAll(searchData, function(dealData){
        if(dealData !==null){
          queryCount = dealData.length;
          for(var i =0;i<queryCount;i++){
            deals.push(dealData[i]);
          }
          res.render('deal',{deals});
        }else{
          queryCount++;
          //res.render('deal',{deals});
        }
      });
    }
  });
}]);

// Chat Room 
router.get('/chat/:id', [User.isAuthenticated, function (req, res, next) {
  var roomId = req.params.id;
  Room.findById(roomId, function (err, room) {
    if (err) throw err;
    if (!room) {
      return next();
    }
    res.render('chatroom', { user: req.user, room: room });
  });

}]);

// Logout
router.get('/logout', function (req, res, next) {
  // remove the req.user property and clear the login session
  req.logout();

  // destroy session data
  req.session = null;

  // redirect to homepage
  res.redirect('/');
});

router.get('/registration', [User.isAuthenticated, function (req, res, next) {
   
}]);

router.get('/admin', [User.isAuthenticated, function (req, res, next) {
  Room.find(function (err, rooms) {
    if (err) throw err;
    res.render('admin', { rooms });
  });
}]);

router.route('/approve').post(function(req,res){
    let testName = req.body.test;
    Room.approveRoom(testName);
    Room.find(function (err, rooms) {
      if (err) throw err;
      res.render('admin', { rooms });
    });
  })

  // router.route('/change_usr').post(function(req, res){
  //   let Id =req.body.usr_id;
  //   let passWord = req.body.usr_pw;
  //   User.changePassword(Id, passWord)
  //   Room.find(function (err, rooms) {
  //     if (err) throw err;
  //     res.render('user', { rooms });
  //   });
  // })
  
  // 파일 업로드 처리
  router.post('/upload', upload.single('userfile'), function(req, res, next){
    console.log(req.file); // 콘솔(터미널)을 통해서 req.file Object 내용 확인 가능.
    res.send("<script>window.close();</script>");
  });

module.exports = router;