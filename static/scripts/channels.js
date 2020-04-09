//Popover button
$('[data-toggle="popover"]').popover({
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

document.addEventListener('DOMContentLoaded', () => {
  var cur_ch;
  //Initialize Current channel
  if (!localStorage.getItem('last_ch')){
    cur_ch="Flack";
    localStorage.setItem('last_ch',cur_ch)
  }
  else{
    cur_ch=localStorage.getItem('last_ch');
    console.log(cur_ch);
  }
  document.querySelector('#currentCh').innerHTML = cur_ch;
  //User name
  if (!localStorage.getItem('username')){
    console.log('no name');
  };
  //Channels List and Sidebar
  $('#sidebarCollapse').on('click', function () {
      $('#sidebar').toggleClass('active');
  });
  document.querySelector('.msg_history').scrollTop = 9999999;
  //get User
  const username=localStorage.getItem('username');
  console.log(username);
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
  $("[data-toggle='popover']").on('shown.bs.popover', () => {
    document.querySelector('#addon1').onclick = () => {
      const chName = document.querySelector('#chName').value;
      socket.emit('create channel', {'chName': chName});
      $('[data-toggle="popover"]').popover("hide");
    };
  });
  // When a new channel is announced, add to the unordered list
  socket.on('new channel', chName => {
      const template = Handlebars.compile(document.querySelector('#aChannel').innerHTML);
      const content = template({'chName': chName});
      document.querySelector('#chList').innerHTML += content;
  });

  document.querySelector('.write_msg').onkeypress = event => {
  // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
      // Cancel the default action, if needed
      event.preventDefault();
      console.log('doing');
      // Trigger the button element with a click
      $('.msg_send_btn').click();
    }
  };
  //When a message is sent, emit it to the server
  document.querySelector('.msg_send_btn').onclick = () => {
    const msg = document.querySelector('.write_msg').value;
    document.querySelector('.write_msg').value='';
    socket.emit('send msg',{'username':username,'msg':msg,'cur_ch':cur_ch});
  }

  //Message announced
  socket.on('new msg', data => {
    console.log("annoucing");
    const ch=data['ch'];
    const msg=data['newmsg'];
    if(ch === cur_ch){
      if(msg.username === username){
        const template = Handlebars.compile(document.querySelector('#out_msg').innerHTML);
        const content = template({'msg': msg.msg,'time_date':msg.time_date});
        document.querySelector('.msg_history').innerHTML += content;
        console.log(cur_ch);
      }
      else{
        const template = Handlebars.compile(document.querySelector('#in_msg').innerHTML);
        const content = template({'username':msg.username,'msg': msg.msg,'time_date':msg.time_date});
        document.querySelector('.msg_history').innerHTML += content;
        console.log("else");
      }
    }
    document.querySelector('.msg_history').scrollTop = 9999999;
  });
});

//Get channels
function getChannels(){
  if (!localStorage.getItem('channels')){
    //try get from server via Ajax
    const request = new XMLHttpRequest();
    request.open('GET', "/channels");
    // Callback function for when request completes
    request.onload = () => {
      const data = JSON.parse(request.responseText);
      if (data.success){
        for (ch in data.channels) {
          channels.push(ch);
        }
      }
      else{
        return false;
      }
    }
    request.send();
  }
  else{
    return false;
  }
}
//Display channels
function disChannels(channels){

}
