
//Popover button add channel
$('#addChannel').popover({
container: 'body',
html: true,
placement: 'bottom',
sanitize: false,
content:
`<div id="PopoverContent">
  <div class="input-group">
    <input type="text" class="form-control" id="chName" placeholder="Channel Name"
         aria-label="Recipient's username with two button addons" aria-describedby="button-addon1">
    <div class="input-group-append" id="button-addon1">
      <button class="btn btn-outline-primary" id="addon1" type="button" data-toggle="popover" data-placement="bottom"
          data-html="true" data-title="Add">
        <i class="fas fa-plus-circle"></i>
      </button>
    </div>
  </div>
</div>`
});

//User name
if (!localStorage.getItem('username')){
  console.log('no name');
};
var cur_ch;
var pmto;
var nameSet = new Set();
const username=localStorage.getItem('username');
document.addEventListener('DOMContentLoaded', () => {
  //Genrate msgs templates
  function convert_msg(msg){
    if(msg.username === username){
      if(msg.pmto === 'undefined'){
        const template = Handlebars.compile(document.querySelector('#out_msg').innerHTML);
        const content = template({'msg': msg.msg,'time_date':msg.time_date});
        document.querySelector('.msg_history').innerHTML += content;
      }
      else{
        const template = Handlebars.compile(document.querySelector('#pmout_msg').innerHTML);
        const content = template({'msg': msg.msg,'time_date':msg.time_date});
        document.querySelector('.msg_history').innerHTML += content;
      }
    }
    else{
      if(msg.pmto === username){
        const template = Handlebars.compile(document.querySelector('#pmin_msg').innerHTML);
        const content = template({'username':msg.username,'msg': msg.msg,'time_date':msg.time_date});
        document.querySelector('.msg_history').innerHTML += content;
      }
      else if (msg.pmto === 'undefined'){
        const template = Handlebars.compile(document.querySelector('#in_msg').innerHTML);
        const content = template({'username':msg.username,'msg': msg.msg,'time_date':msg.time_date});
        document.querySelector('.msg_history').innerHTML += content;
      }
      nameSet.add(msg.username);
      console.log(nameSet);
    }
    for(let name of nameSet){
      setPopover(name);
    }
  }

  function setPopover(name){
    console.log(`setpopover ${name}`);
    if (name !== 'Admin'){
      //set user_pop
      setTimeout(() =>{
        //Popover button user_pop
        $('.pop_'+name).each(function () {
          $(this).popover({
          container: 'body',
          html: true,
          placement: 'right',
          sanitize: false,
          trigger: 'focus',
          content:
          `<div>
            <button type="button" class="btn btn-sm private_game">Play Game</button>
            <button type="button" class="btn btn-sm private_msg">Private Msg</button>
          </div>
          `
          });
        })
      }, 10);
      setTimeout(()=>{
        $('.pop_'+name).each(function () {
          const button = $(this);
          button.on('shown.bs.popover', function () {
            //gamebuttion on click
            document.querySelector('.private_game').onclick = function() {
              const toUser = name;
              socket.emit('invite game',{'toUser':toUser,'fromUser':username});
              console.log('invite game '+toUser);
            };
            //Private msg button on onclick
            document.querySelector('.private_msg').onclick = function() {
              pmto = name;
              document.querySelector('#pmMode').innerHTML = `Cancel`
              document.querySelector('#pmMode').disabled = false;
              document.querySelector('#msgHolder').placeholder = `Private msg to ${name}`;
            };
            //end private msg onclick
            //pm mode onclick
            document.querySelector('#pmMode').onclick = function(){
              pmto = undefined;
              document.querySelector('#pmMode').innerHTML = `off`
              document.querySelector('#pmMode').disabled = true;
              document.querySelector('#msgHolder').placeholder = `Type a message`
            }
          });
        });
      },20);
    }
  }

  function load_msg(channel){
    const ch = channel
    document.querySelector('#currentCh').innerHTML = ch;
    //load messages of a channels
    //try get from server via Ajax
    const request = new XMLHttpRequest();
    request.open('POST', "/loadmsg");
    // Callback function for when request completes
    request.onload = () => {
      const data = JSON.parse(request.responseText);
      if (data.success){
        clear_content();
        const msgs = data.msgs;
        // loop through a dic using for/of instead of for/in
        for (let msg of msgs) {
          convert_msg(msg);
        }
        console.log("load msgs");
        document.querySelector('.msg_history').scrollTop = document.querySelector('.msg_history').scrollHeight;
      }
      else{
        return false;
      }
    }
    // Add data to send with request
    const data = new FormData();
    data.append('ch', ch);
    //send request
    request.send(data);
    cur_ch=ch;
    localStorage.setItem('last_ch',ch);
  }
  //update channel onclick.
  function update_onclick(){
    //Switch to another Channel
    document.querySelectorAll('.channel').forEach(button => {
      button.onclick = () => {
        const ch = button.getAttribute('id');
        cur_ch=ch
        localStorage.setItem('last_ch',cur_ch);
        load_msg(ch);
      };
    });
  }

  //Clear msg_history
  function clear_content(){
    document.querySelector('.msg_history').innerHTML = '';
  }

  //Initilize channel list onclick attribute
  update_onclick()
  //Initialize Current channel
  if (!localStorage.getItem('last_ch')){
    cur_ch="Flack";
    localStorage.setItem('last_ch',cur_ch)
  }
  else{
    cur_ch=localStorage.getItem('last_ch');
  }
  //Set current channel dispaly name
  document.querySelector('#currentCh').innerHTML = cur_ch;
  //load message
  load_msg(cur_ch);
  //Channels List and Sidebar
  $('#sidebarCollapse').on('click', function () {
      $('#sidebar').toggleClass('active');
  });
  document.querySelector('#username').insertAdjacentHTML('beforeend', username);

  //SocketIO
  // Connect to websocket
  var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

  // When connected, Do Something
  socket.on('connect', () => {
  });
  //Error Listener
  socket.on('error', error => {
      alert(error);
  });
  // When a new channel is created, emit it to the server
  $("#addChannel").on('shown.bs.popover', () => {
    document.querySelector('#addon1').onclick = () => {
      const chName = document.querySelector('#chName').value.trim();
      if(chName === ""){
        alert('channel name is empty');
      }
      else{
        socket.emit('create channel', {'chName': chName});
      }
      $('#addChannel').popover("hide");
    };
  });

  // When a new channel is announced, add to the unordered list
  socket.on('new channel', chName => {
      console.log('new channel');
      const template = Handlebars.compile(document.querySelector('#aChannel').innerHTML);
      const content = template({'chName': chName});
      document.querySelector('#chList').innerHTML += content;
      update_onclick()
  });

  //Enable press Enter to send messages
  document.querySelector('.write_msg').onkeypress = event => {
  // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
      // Cancel the default action, if needed
      event.preventDefault();
      // Trigger the button element with a click
      $('.msg_send_btn').click();
    }
  };
  //When a message is sent, emit it to the server
  document.querySelector('.msg_send_btn').onclick = () => {
    if(pmto===undefined){
      pmto = 'undefined';
    }
    const msg = document.querySelector('.write_msg').value;
    document.querySelector('.write_msg').value='';
    console.log(pmto);
    socket.emit('send msg',{'username':username,'msg':msg,'cur_ch':cur_ch,'pmto':pmto});
  }

  //Message announced
  socket.on('new msg', data => {
    const ch=data['ch'];
    const msg=data['newmsg'];
    if(ch === cur_ch){
      console.log('new msg');
      convert_msg(msg);
    }
    document.querySelector('.msg_history').scrollTop = 9999999;
  });

  //receive game invitation
  socket.on('new game', data =>{
    const fromUser = data['fromUser'];
    const toUser = data['toUser'];
    if(toUser===username){
      console.log('new game from '+ fromUser);
      $('#gameModal .modal-body').html(`${fromUser} invites you to play a game.`);
      $('#gameModal').modal('show');
    }
  });

  $('#gameModal #gameNo').click(function(){
    console.log(`reject game send from ${username}`);
    socket.emit('reject game',{});
  });
  $('#gameModal #gameYes').click(function(){
    console.log(`accept game send form ${username}`);
    socket.emit('accept game',{});
  });

  //accept game Invitation
  socket.on('yes game', data =>{
    if (username===data.toUser | username===data.fromUser){
      alert(data.toUser+data.fromUser);
      window.location.replace("/game");
    };
  });

  //receive game Invitation rejection
  socket.on('no game', data =>{
    if (username===data.toUser){
      console.info(data.fromUser+': no game');
      alert(`${data.fromUser} rejects your invitation`);
    };
  });

});
