document.addEventListener('DOMContentLoaded', () => {
  //Check name exists
  if (localStorage.getItem('username')){
    document.querySelector('#username').value=localStorage.getItem('username');
  }
  document.querySelector('#nameform').onsubmit = ()=> {
    const username=document.querySelector('#username').value
    if(!isValidName(username)){
      alert("empty name");
    }
    else{
      alert(`Hello: ${username}`);
      localStorage.setItem('username',username);
      if (localStorage.getItem('last_ch'))
        $('#cur_ch2').value=localStorage.getItem('last_ch');
    }
  }
});

// Ajax check name
function isValidName(name){
  return !(name.trim() === "")
}
