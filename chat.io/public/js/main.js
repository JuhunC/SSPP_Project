'use strict';
var inum = 0;
var app = {

  rooms: function(){

    var socket = io('/rooms', { transports: ['websocket'] });

    // When socket connects, get a list of chatrooms
    socket.on('connect', function () {

      // Update rooms list upon emitting updateRoomsList event
      socket.on('updateRoomsList', function(room) {
        if(document.URL.includes("rooms")){
          // Display an error message upon a user error(i.e. creating a room with an existing title)
          $('.room-create p.message').remove();
          if(room.error != null){
            $('.room-create').append(`<p class="message error">${room.error}</p>`);
          }else{
            app.helpers.updateRoomsList(room);
          }
        }
      });

      $('.room-search button').on('click', function(e){
        var input = $("input[id='pro_name']");
        var inputString = input.val().trim();
        $("ul").empty();
        socket.emit('searchRoom',inputString);
        input.val('');
      });

      // Whenever the user hits the create button, emit createRoom event.
      $('.room-create button').on('click', function(e) {
        var inputEle = $("input[name='title']");
        var roomTitle = inputEle.val().trim();
        if(roomTitle !== '') {
          socket.emit('createRoom', roomTitle);
          inputEle.val('');
        }
      });

    });
  },

  chat: function(roomId, username){
    
    var socket = io('/chatroom', { transports: ['websocket'] });

      // When socket connects, join the current chatroom
      socket.on('connect', function () {

        socket.emit('join', roomId);

        var roomTitle = '';
        socket.on('getRoomTitle', function(response){
            roomTitle = response;
        });
        console.log(roomTitle);
        var filename = '';

        // init deal elements.
        $(".deal_submit #deal_seller").val(username);

        // Update users list upon emitting updateUsersList event
        socket.on('updateUsersList', function(users, clear) {

          $('.container p.message').remove();
          if(users.error != null){
            $('.container').html(`<p class="message error">${users.error}</p>`);
          }else{
            app.helpers.updateUsersList(users, clear);
          }
        });
      
        socket.on('retrieveMessages', function(msgs){
          app.helpers.retrieveMessages(msgs, roomId, socket);
        })

        $(".deal_show #make_deal").on('click',function(e){
          console.log("Hello");
          var dealmsg = {
            roomId : roomId,
            productName: $(".deal_show #deal_product").val(),
            sellerId : $(".deal_show #deal_seller").val(),
            buyerId : username,
            imageId : '',
            price : $(".deal_show #deal_price").val(),
            finishedDate: Date.now()
          };
          console.log(dealmsg);
          if(dealmsg.sellerId != dealmsg.buyerId){
            socket.emit('makeDeal',dealmsg);
          }else{
            alert("You cannot buy your own product!!");
          }
          document.getElementById('deal_show').style.visibility='hidden';
          location.reload();
        });

        socket.on('reload', function(){
          location.reload();
        });

        // Whenever the user hits the save button, emit newMessage event.
        $(".chat-message button").eq(0).on('click', function(e) {

          var textareaEle = $("textarea[name='message']");
          var messageContent = textareaEle.val().trim();
          if(messageContent !== '') {
            var message = { 
              content: messageContent, 
              username: username,
              date: Date.now(),
              isDeal: "false",
              imageId : ""
            };

            socket.emit('newMessage', roomId, message);
            textareaEle.val('');
            app.helpers.addMessage(message, roomId, socket);
          }
        });

        // deal submit button event handler (+) button
        $(".chat-message button").eq(1).on('click', function(e){
          document.getElementById('deal_submit').style.visibility='visible';
        });

        $(".deal_submit #submit_ok").on('click', function(e){

          var numRegx = new RegExp("^[1-9][0-9]*$");

          if(numRegx.test($(".deal_submit #deal_price").val())){
            var dealData = {
              roomId : roomId,
              productName: roomTitle,
              sellerId : username,
              price : $(".deal_submit #deal_price").val(),
              imageId : $(".deal_submit #userfile").val().split('\\').pop(),
              submitDate: Date.now()
            };
            socket.emit("dealSubmit", dealData, function(response){
              if(response === "true"){
                var message = {
                  content : username + "님 " + $(".deal_submit #deal_price").val() + " 원 판매",
                  username : username,
                  date: Date.now(),
                  imageId: $(".deal_submit #userfile").val().split('\\').pop(),
                  isDeal : "true"
                }            
                socket.emit('newMessage', roomId, message);
                app.helpers.addMessage(message, roomId, socket);
              }
            });
            document.getElementById('deal_submit').style.visibility='hidden';
          }else{
            alert("유효한 가격을 입력해주세요");
          }
        });

        // Whenever a user leaves the current room, remove the user from users list
        socket.on('removeUser', function(userId) {
          $('li#user-' + userId).remove();
          app.helpers.updateNumOfUsers();
        });

        // Append a new message 
        socket.on('addMessage', function(message) {
          app.helpers.addMessage(message, roomId, socket);
        });

        socket.on("hereDeal", function(dealData){
          $(".deal_show #deal_product").val(roomTitle);
          $(".deal_show #deal_seller").val(dealData.sellerId);
          $(".deal_show #deal_price").val(dealData.price);
        });
      });
  },

  deal : function(deals){
    var socket = io('/deal', { transports: ['websocket'] });

    socket.on("connect", function(){ 
      deals = JSON.parse(deals);
      var dl= [];
      for(var i =deals.length-1;i>=0;i--){
        dl.push(deals[i]);
      }
      dl.forEach(function(deal){
        var title;
        socket.emit("getTitle", deal.roomId, function(title){
          var finishedDate = (new Date(parseInt(deal.finishedDate))).toLocaleString();
          var buyerId = deal.buyerId;
          if(deal.finishedDate == undefined){
            finishedDate = "";
            buyerId ="";
            var class_name = "deal-item"
          }else{
            var class_name = "deal-item-finished";
          }
          var html1 =`<li class="${class_name}" style="text-align:left;">
                    상품 : ${title}<br>
                    가격 : ${deal.price}<br>
                    구매자 : ${buyerId}<br>
                    거래등록시간 : ${(new Date(parseInt(deal.submitDate))).toLocaleString()}<br>
                    `;
          if(deal.finishedDate == undefined){
            var html2 =`거래 대기중<br>
                      </li>
                      `;
          }else{
            var html2 =`거래 완료 ${finishedDate}<br>
                      </li>
                      `;
          }
          $(html1+html2).appendTo('.deal-list ul');
          $(".deal-list").animate({ scrollTop: $('.deal-list')[0].scrollHeight});
        });
      });
    });    
  },

  helpers: {

    encodeHTML: function (str){
      return $('<div />').text(str).html();
    },

    // Update rooms list
    updateRoomsList: function(room){
      if(room.approved == "true"){
        room.title = this.encodeHTML(room.title);
        room.title = room.title.length > 25? room.title.substr(0, 25) + '...': room.title;
        var html = `<a href="/chat/${room._id}"><li class="room-item">${room.title}</li></a>`;

        if(html === ''){ return; }

        if($(".room-list ul li").length > 0){
          $('.room-list ul').prepend(html);
        }else {
          $('.room-list ul').html('').html(html);
        }
        this.updateNumOfRooms();
      }else{
        var html = '<li class="room-item">승인대기</li>';
        if($(".room-list ul li").length > 0){
          $('.room-list ul').prepend(html);
        }else {
          $('.room-list ul').html('').html(html);
        }
      }
    },

    // Update users list
    updateUsersList: function(users, clear){
        if(users.constructor !== Array){
          users = [users];
        }

        var html = '';
        for(var user of users) {
          user.username = this.encodeHTML(user.username);
          html += `<li class="clearfix" id="user-${user._id}">
                     <img src="${user.picture}" alt="${user.username}" />
                     <div class="about">
                        <div class="name">${user.username}</div>
                        <div class="status"><i class="fa fa-circle online"></i> online</div>
                     </div></li>`;
        }

        if(html === ''){ return; }

        if(clear != null && clear == true){
          $('.users-list ul').html('').html(html);
        }else{
          $('.users-list ul').prepend(html);
        }

        this.updateNumOfUsers();
    },

    // Adding a new message to chat history
    addMessage: function(message, roomId, socket){
      message.date      = (new Date(message.date)).toLocaleString();
      message.username  = this.encodeHTML(message.username);
      message.content   = this.encodeHTML(message.content);
      
      if(message.isDeal === 'true'){
        if(message.imageId != ""){
        var html = `<li>
                      <div class="message-data">
                        <span class="message-data-name">${message.username}</span>
                        <span class="message-data-time">${message.date}</span>
                        <button id="${message.username}${inum++}">Deal</button>
                      </div>
                      <a href="/uploads/${message.imageId}" target="_blank"><img src="/uploads/${message.imageId}" width="300px" height="200px"></a>
                     <div class="message my-message" dir="auto">${message.content}</div>
                    </li>`;
        }else{
          var html = `<li>
                        <div class="message-data">
                          <span class="message-data-name">${message.username}</span>
                          <span class="message-data-time">${message.date}</span>
                          <button id="${message.username}${inum++}">Deal</button>
                        </div>
                      <div class="message my-message" dir="auto">${message.content}</div>
                      </li>`;
        }
      }else{
        if(message.imageId == ""){
          var html = `<li>
                        <div class="message-data">
                          <span class="message-data-name">${message.username}</span>
                          <span class="message-data-time">${message.date}</span>
                        </div>
                      <div class="message my-message socket.emit("hereDeal", data);" dir="auto">${message.content}</div>
                      </li>`;
        }else{
          var html = `<li>
                        <div class="message-data">
                          <span class="message-data-name">${message.username}</span>
                          <span class="message-data-time">${message.date}</span>
                        </div>
                      <a href="/uploads/${message.imageId}" target="_blank"><img src="/uploads/${message.imageId}" width="300px" height="200px"></a>
                      <div class="message my-message socket.emit("hereDeal", data);" dir="auto">${message.content}</div>
                      </li>`;
        }
      }
      $(html).hide().appendTo('.chat-history ul').slideDown(200);

      // Keep scroll bar down
      $(".chat-history").animate({ scrollTop: $('.chat-history')[0].scrollHeight});

      $(".message-data button").off('click');
      $(".message-data button").on('click',function(e){
        var deal_seller = document.activeElement.parentElement.getElementsByClassName("message-data-name");
        deal_seller = deal_seller[0].innerHTML;
        var search_data = {
          roomId : roomId,
          sellerId : deal_seller
        }
        socket.emit("getDeal", search_data);
        document.getElementById('deal_show').style.visibility='visible';
      });
    },

    // retrieve all messages from db
    retrieveMessages: function(msgs, roomId, socket){
      for(var i=0; i<msgs.length; i++){
        var message = {
          content : this.encodeHTML(msgs[i].content),
          username : this.encodeHTML(msgs[i].username),
          date : (new Date(parseInt(msgs[i].date))).toLocaleString(),
          imageId : msgs[i].imageId,
          isDeal : msgs[i].isDeal
        }
        console.log(message);
        if(message.isDeal === 'false'){
          if(message.imageId == ""){
            var html = `<li>
                          <div class="message-data">
                            <span class="message-data-name">${message.username}</span>
                            <span class="message-data-time">${message.date}</span>
                          </div>
                        <div class="message my-message socket.emit("hereDeal", data);" dir="auto">${message.content}</div>
                        </li>`;
          }else{
            var html = `<li>
                          <div class="message-data">
                            <span class="message-data-name">${message.username}</span>
                            <span class="message-data-time">${message.date}</span>
                          </div>
                        <a href="/uploads/${message.imageId}" target="_blank"><img src="/uploads/${message.imageId}" width="300px" height="200px"></a>
                        <div class="message my-message socket.emit("hereDeal", data);" dir="auto">${message.content}</div>
                        </li>`;
          }
        }else{
          if(message.imageId != ""){
            var html = `<li>
                          <div class="message-data">
                            <span class="message-data-name">${message.username}</span>
                            <span class="message-data-time">${message.date}</span>
                            <button id="${message.username}${inum++}">Deal</button>
                          </div>
                          <a href="/uploads/${message.imageId}" target="_blank"><img src="/uploads/${message.imageId}" width="300px" height="200px"></a>
                         <div class="message my-message" dir="auto">${message.content}</div>
                        </li>`;
            }else{
              var html = `<li>
                            <div class="message-data">
                              <span class="message-data-name">${message.username}</span>
                              <span class="message-data-time">${message.date}</span>
                              <button id="${message.username}${inum++}">Deal</button>
                            </div>
                          <div class="message my-message" dir="auto">${message.content}</div>
                          </li>`;
            }
        }
        $(html).hide().appendTo('.chat-history ul').slideDown(200);
      }
      $(".chat-history").animate({ scrollTop: $('.chat-history')[0].scrollHeight},40);

      $(".message-data button").on('click',function(e){
        var deal_seller = document.activeElement.parentElement.getElementsByClassName("message-data-name");
        deal_seller = deal_seller[0].innerHTML;
        var search_data = {
          roomId : roomId,
          sellerId : deal_seller
        }
        socket.emit("getDeal", search_data);
        document.getElementById('deal_show').style.visibility='visible';
      });
    },

    // Update number of rooms
    // This method MUST be called after adding a new room
    updateNumOfRooms: function(){
      var num = $('.room-list ul li').length;
      $('.room-num-rooms').text(num +  " Room(s)");
    },

    // Update number of online users in the current room
    // This method MUST be called after adding, or removing list element(s)
    updateNumOfUsers: function(){
      var num = $('.users-list ul li').length;
      $('.chat-num-users').text(num +  " User(s)");
    }
  }
};