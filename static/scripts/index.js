var users = [];

document.addEventListener('DOMContentLoaded', () => {
  //Check name exists
  if (localStorage.getItem('username')){
    document.querySelector('#username').value=localStorage.getItem('username');
  }
  document.querySelector('#nameform').onsubmit = (e)=> {
    const username=document.querySelector('#username').value
    getUsers();
    setTimeout(()=>{
      if(!isValidName(username)){
        alert("Name is empty or already taken");
      }
      else{
        alert(`Hello: ${username}`);
        localStorage.setItem('username',username);
        if (localStorage.getItem('last_ch')){
          $('#cur_ch2').value=localStorage.getItem('last_ch');
        };

        redirectPost('/channels', {'username':username,'cur_ch':$('#cur_ch2').attr('value')});
      }
    },50);
    e.preventDefault()
  }
  $('#start').attr('disabled', false);
});

// Ajax check name
function isValidName(name){
  if(name.trim()==="Admin" | name.trim() === "" | users.includes(name)){
    console.log(`${name} is in ${users}`)
    return false;
  }
  else{
    console.log(`${name} is valid`)
    return true;
  }
}

//Ajax get users
function getUsers(){
  //get users from server
  const request = new XMLHttpRequest();
  request.open('GET', "/users");
  request.send();
  // Callback function for when request completes
  request.onload = () => {
    const data = JSON.parse(request.responseText);
    if (data.success){
      users=data.users;
    }
  }
}

//mock redirectPost
function redirectPost(url, data) {
    var form = document.createElement('form');
    document.body.appendChild(form);
    form.method = 'post';
    form.action = url;
    for (var name in data) {
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = data[name];
        form.appendChild(input);
    }
    form.submit();
}
