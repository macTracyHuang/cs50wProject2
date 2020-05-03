const startmines = 99;
var mines;
var gameover;
var board;
var time;
var checked = 0;
var downid;
var first=true;
var timerid;
var sync =false;

//Get User name
if (!localStorage.getItem('username')){
  console.log('no name');
};
const username=localStorage.getItem('username');

function startTime(){
  timerid = setInterval(myTimer, 1000);
}
function stopTime(){
  console.log('stoptime');
  clearInterval(timerid);
  updateTime();
}
function myTimer() {
  time+=1;
  if(time<=999){
    updateTime();
  }
}

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

document.querySelector('#invite').onclick = function() {
  // XNOR
  sync= (sync === false);
  if(sync){
    restart();
    this.innerHTML = "Cancel";
    socket.emit('invite', {'board': board});
    console.log('invite others');
  }
  else{
    this.innerHTML = "Invite";
    socket.emit('cancel sync',{});
    console.log('cancel sync send');
  }
  this.classList.toggle('sync');
}

document.addEventListener('DOMContentLoaded', function() {
  //Socket Listeners
  //new cell
  socket.on('new open', data => {
    console.log('socket: newopen: ' + data['cell'].id + ' from: ' + data['username']);
    const fromcell = data['cell'];
    //opencell locally
    if (!board.cells[fromcell.id].opened) {
      opencell(fromcell.id);
    }
  });
  //new flag
  socket.on('new flag', data => {
    const fromcell = data['cell'];
    //flag cell locally
    if (!board.cells[fromcell.id].flagged) {
      let htmlcell=document.querySelector('#'+fromcell.id);
      console.log('socket: newflag: ' + data['cell'].id + ' from: ' + data['username']);
      flagcell(htmlcell);
    }
  });
  //receive invitation
  socket.on('update board', data => {
    console.log('update board received');
    checked = 0;
    mines = startmines;
    first=true;
    gameover = false;
    time = 0;
    stopTime();
    startTime();
    if(sync){
      console.log('socket: newboard: ' + data['board'].xSize + ' from: ' + data['username']);
      const fromuser = data['username'];
      const fromboard = data['board'];
      alert(fromuser + ' invites you to play together');
      //sync
      document.querySelectorAll('.cell').forEach((item, i) => {
        item.className="";
        item.classList.add('cell', 'closed');
      });
      board = fromboard;
      let face = document.querySelector('#top_area_face')
      face.className="";
      face.classList.add('top-area-face','top-area-face-unpressed');
    }
  });

  //update sync
  socket.on('update sync', data =>{
    let newsync = data['sync'];
    let invitebtn =document.querySelector('#invite');
    sync = newsync;
    console.log(newsync);
    if(sync){
      invitebtn.innerHTML = "Cancel";
      console.log('sync receive');
    }
    else{
      invitebtn.innerHTML = "Invite";
      console.log('cancel sync receive');
    }
    invitebtn.classList.toggle('sync');
  });
  //End socketlisteners

  //initBoard when app start
  initBoard();
});
//End DOMContentLoaded

// classes definition
class Cell {
  constructor(x, y, opened, flagged, mined, neighbor) {
    this.id = "cell_" + x + "_" + y;
    this.x = x;
    this.y = y;
    this.opened = opened;
    this.flagged = flagged;
    this.mined = mined;
    this.neighbor = neighbor;
  }

  // Getter
  get cell() {
    return;
  }
  // Method
  cellMethod() {
    return;
  }
  //toString
  toString() {
    return `Cell ${this.id},x:${this.x},y:${this.y},opened:${this.opened},flagged:${this.flagged},mined:${this.mined},neighbor:${this.neighbor}`;
  }
}


class Board {
  constructor(xSize, ySize, mineCount) {
    this.cells = {};
    this.xSize = xSize;
    this.ySize = ySize;
    this.mineCount = mineCount;
    //createBoard
    for (let x = 0; x < this.xSize; x++) {
      for (let y = 0; y < this.ySize; y++) {
        this.cells["cell_" + x + "_" + y] = new Cell(x, y, false, false, false, 0);
      }
    }
    Board.randomlyAssignMines(this);
    Board.calculateNeighborMineCounts(this);
  }
  //Method

  //toString
  toString() {
    return `Board ${this.cells},xSize:${this.xSize},ySize:${this.ySize},mineCount:${this.mineCount}`;
  }

  //Static fuctions
  //Randomly Assign Mines
  static randomlyAssignMines(aBoard) {
    var mineLocation = [];
    for (let i = 0; i < aBoard.mineCount; i++) {
      let cell = generateAMine();
      //reallocate mine when the cell is already mined
      while (mineLocation.includes(cell)) {
        cell = generateAMine();
      }
      mineLocation.push(cell);
      aBoard.cells[cell].neighbor = 10;
      aBoard.cells[cell].mined = true;
    }
    return aBoard;

    function generateAMine() {
      let randomX = Math.floor(Math.random() * aBoard.xSize);
      let randomY = Math.floor(Math.random() * aBoard.ySize);
      let cell = "cell_" + randomX + "_" + randomY;

      return cell;
    }
  }

  static calculateNeighborMineCounts(aBoard) {
    let cells = aBoard.cells;
    let xSize = aBoard.xSize;
    let ySize = aBoard.ySize;
    for (let cell in cells) {
      let neighborMineCount = 0;
      if (!cells[cell].mined) {
        let neighbors = getNeighbors(cells[cell], xSize, ySize);
        for (let neighbor of neighbors) {
          neighborMineCount += cells[neighbor].mined ? 1 : 0;
        }
        cells[cell].neighbor = neighborMineCount;
      }
    }
  }
}

function getNeighbors(cell, xSize, ySize) {
  var neighbors = [];
  let x = cell.x;
  let y = cell.y;
  //left
  if (x !== 0) {
    if (y !== 0) {
      neighbors.push("cell_" + (x - 1) + "_" + (y - 1));
    }

    neighbors.push("cell_" + (x - 1) + "_" + y);

    if (y !== ySize - 1) {
      neighbors.push("cell_" + (x - 1) + "_" + (y + 1));
    }
  }
  //middle
  if (y !== 0) {
    neighbors.push("cell_" + x + "_" + (y - 1));
  }
  if (y !== ySize - 1) {
    neighbors.push("cell_" + x + "_" + (y + 1));
  }
  //right
  if (x !== xSize - 1) {
    if (y !== 0) {
      neighbors.push("cell_" + (x + 1) + "_" + (y - 1));
    }
    neighbors.push("cell_" + (x + 1) + "_" + y);
    if (y !== ySize - 1) {
      neighbors.push("cell_" + (x + 1) + "_" + (y + 1));
    }
  }
  return neighbors;
}

function initBoard() {
  const template = Handlebars.compile(document.querySelector('#aCell').innerHTML);
  const newBoard = new Board(30, 16, startmines);
  first=true;
  gameover = false;
  mines = startmines;
  board = newBoard;
  time = 0;
  stopTime();
  updateMines();
  document.querySelector('#A4').innerHTML = "";
  for (let y = 0; y < newBoard.ySize; y++) {
    for (let x = 0; x < newBoard.xSize; x++) {
      let cell = "cell_" + x + "_" + y;
      const content = template({
        'cell_id': cell,
        'cell_x': x,
        'cell_y': y
      });
      document.querySelector('#A4').innerHTML += content;
    }
    const clear = `<div class="clear"></div>`;
    document.querySelector('#A4').innerHTML += clear;
  }

//handle cell event
var isdown=false;
  document.querySelectorAll('.cell').forEach(cell => {
    const id = cell.id;
    //One click
    cell.addEventListener('mousedown', event => {
      if(first){
        startTime();
        first=false;
      }
      if(!gameover && event.button === 0 &&!board.cells[id].flagged){
        downid=id;
        isdown=true;
        if(board.cells[id].opened){
          const neighbors = getNeighbors(board.cells[id], 30, 16);
          for (let neighbor of neighbors){
            let n = document.querySelector('#'+neighbor);
            if(n.classList.contains('closed') && !n.classList.contains('flag')){
              n.classList.remove('closed');
              n.classList.add('check');
            }
          }
        }
        else{
          document.querySelector('#'+id).classList.remove('closed');
          document.querySelector('#'+id).classList.add('check');
        }
      }
    });

    cell.addEventListener('mouseover', e => {
      if(isdown&&downid!==id&&e.button===0){
        if(board.cells[downid].opened){
          const neighbors = getNeighbors(board.cells[downid], 30, 16);
          for (let neighbor of neighbors){
            let n = document.querySelector('#'+neighbor);
            if(n.classList.contains('check')&&!n.classList.contains('flag')){
              n.classList.toggle('closed');
              n.classList.toggle('check');
            }
          }
        }
        else{
          document.querySelector('#'+downid).classList.toggle('closed');
          document.querySelector('#'+downid).classList.toggle('check');
        }

        if(board.cells[id].opened){
          const neighbors = getNeighbors(board.cells[id], 30, 16);
          for (let neighbor of neighbors){
            let n = document.querySelector('#'+neighbor);
            if(n.classList.contains('closed')&&!n.classList.contains('flag')){
              n.classList.toggle('closed');
              n.classList.toggle('check');
            }
          }
        }
        else{
          document.querySelector('#'+id).classList.toggle('closed');
          document.querySelector('#'+id).classList.toggle('check');
        }
        downid=id;
      }
    });

    cell.addEventListener('mouseup', event => {
      if(!gameover && isdown && event.button === 0){
        const neighbors = getNeighbors(board.cells[downid], 30, 16);
        for (let neighbor of neighbors){
          let n = document.querySelector('#'+neighbor);
          if(!board.cells[neighbor].opened&&!n.classList.contains('flag')){
            n.classList.add('closed');
            n.classList.remove('check');
          }
        }
      }
      if (!gameover &&isdown && !board.cells[id].opened && event.button === 0) {
        opencell(id);
        if (sync){
        //update to other users
        socket.emit('open cell', {
          'cell': board.cells[neighbor]
        });
        console.log('double emit');
        }
      }
      isdown=false;
    });
    //Double Click
    cell.addEventListener('dblclick', event => {
      if (!gameover) {
        const neighbors = getNeighbors(board.cells[id], 30, 16);
        let flags = 0;
        for (let neighbor of neighbors) {
          flags += board.cells[neighbor].flagged ? 1 : 0;
        }
        if (flags === board.cells[id].neighbor) {
          for (let neighbor of neighbors) {
            if (!board.cells[neighbor].flagged) {
              setTimeout(function() {
                downid=id;
                opencell(neighbor);
                if (sync){
                //update to other users
                socket.emit('open cell', {
                  'cell': board.cells[neighbor]
                });
                console.log('double emit');
                }
              }, 3);
            }
          }
        }
      }
    });
    //Right click
    cell.addEventListener('contextmenu', e => {
      flagcell(cell);
      if (sync){
        socket.emit('flag cell',{'cell':board.cells[cell.id]});
      }
      isdown=false;
      e.preventDefault();
    });
  });

  //When top area face is click
  let face = document.querySelector('#top_area_face');
  face.addEventListener('mousedown', event => {
    if(event.button===0){
      face.classList.remove('top-area-face-unpressed');
      face.classList.remove('top-area-face-lose');
      face.classList.remove('top-area-face-win');
      face.classList.toggle('top-area-face-pressed');
    }
  });
  face.addEventListener('mouseup', event => {
    if(event.button===0){
      face.classList.toggle('top-area-face-pressed');
      face.classList.add('top-area-face-unpressed');
      restart();
      if(sync){
        socket.emit('invite', {'board': board});
      }
    }
  });
}

function opencell(sid){
  if(!gameover&&!board.cells[sid].opened){
    const cell = document.querySelector('#'+sid);
    const neighbors = getNeighbors(board.cells[sid], 30, 16);
    // const x = cell.getAttribute("data-x");
    // const y = cell.getAttribute("data-y");
    let n = board.cells[sid].neighbor;
    if (n === 0) {
      for (let neighbor of neighbors) {
        if(!board.cells[neighbor].opened){
          setTimeout(function() {
            downid=sid;
            opencell(neighbor);
          }, 3);
        }
      }
    }
    //When a mine is clicked
    else if (n === 10) {
      gameover = true;
      document.querySelector('#top_area_face').classList.remove('top-area-face-unpressed');
      document.querySelector('#top_area_face').classList.add('top-area-face-lose');
      n = 11;
    }
    cell.classList.remove('check');
    cell.classList.remove('flag');
    cell.classList.remove('closed');
    cell.classList.add('type' + n);
    checked++;
    console.log(checked);
    board.cells[sid].opened = true;
  }
  //check win
  if (isWined()) {
    gameover = true;
    let face = document.querySelector('#top_area_face');
    face.classList.remove('top-area-face-unpressed');
    face.classList.add('top-area-face-win');
    console.log('win');
  }

  if (gameover) {
    stopTime();
    document.querySelectorAll('.cell').forEach(innercell => {
      // console.log('gameover');
      let n = board.cells[innercell.id].neighbor;
      if (!board.cells[innercell.id].opened) {

        if ((board.cells[innercell.id].flagged && n !== 10) || n === 10) {
          //wrong flag
          if (n !== 10) {
            n = 12;
            innercell.classList.remove('flag');
          }
          //others
          else{
            innercell.classList.remove('closed');
          }
          innercell.classList.add('type' + n);
          board.cells[innercell.id].opened = true;
        }
      }
    });
  }
}

//flag cell
function flagcell(cell){
  if (!gameover) {
    if (!board.cells[cell.id].opened) {
      cell.classList.toggle('closed');
      cell.classList.toggle('flag');
      if (cell.classList.contains('flag')) {
        board.cells[cell.id].flagged = true;
        mines--;
      } else {
        board.cells[cell.id].flagged = false;
        mines++;
      }
      updateMines();
    }
  }
}

function isWined() {
  return checked === ((board.xSize * board.ySize) - startmines);
}

function updateMines() {
  let m = mines;
  let s = [];
  while (m > 0) {
    s.push(m % 10);
    m = Math.floor(m / 10);
  }
  let mines_100 = (s[2] === undefined) ? 0 : s[2];
  let mines_10 = (s[1] === undefined) ? 0 : s[1];
  let mines_1 = (s[0] === undefined) ? 0 : s[0];
  document.querySelector('#top_area_mines_100').className = "";
  document.querySelector('#top_area_mines_100').classList.add('top-area-num', 'pull-left', 'top-area-num' + mines_100);
  document.querySelector('#top_area_mines_10').className = "";
  document.querySelector('#top_area_mines_10').classList.add('top-area-num', 'pull-left', 'top-area-num' + mines_10);
  document.querySelector('#top_area_mines_1').className = "";
  document.querySelector('#top_area_mines_1').classList.add('top-area-num', 'pull-left', 'top-area-num' + mines_1);
}
function updateTime() {
  let t = time;
  let s = [];
  while (t > 0) {
    s.push(t % 10);
    t = Math.floor(t / 10);
  }
  let time_100 = (s[2] === undefined) ? 0 : s[2];
  let time_10 = (s[1] === undefined) ? 0 : s[1];
  let time_1 = (s[0] === undefined) ? 0 : s[0];
  document.querySelector('#top_area_time_100').className = "";
  document.querySelector('#top_area_time_100').classList.add('top-area-num', 'pull-left', 'top-area-num' + time_100);
  document.querySelector('#top_area_time_10').className = "";
  document.querySelector('#top_area_time_10').classList.add('top-area-num', 'pull-left', 'top-area-num' + time_10);
  document.querySelector('#top_area_time_1').className = "";
  document.querySelector('#top_area_time_1').classList.add('top-area-num', 'pull-left', 'top-area-num' + time_1);
}

function restart(){
  let face = document.querySelector('#top_area_face');
  face.className="";
  face.classList.add('top-area-face','top-area-face-unpressed');
  //restart game
  checked = 0;
  mines = startmines;
  first=true;
  gameover = false;
  time = 0;
  stopTime();
  for (let x = 0; x < board.xSize; x++) {
    for (let y = 0; y < board.ySize; y++) {
      let id = "cell_" + x + "_" + y;
      board.cells[id].opened = false;
      board.cells[id].flagged = false;
      board.cells[id].mined = false;
      board.cells[id].neighbor = 0;
      document.querySelector('#' + id).className = "";
      document.querySelector('#' + id).classList.add('cell', 'closed');
    }
  }
  updateMines();
  Board.randomlyAssignMines(board);
  Board.calculateNeighborMineCounts(board);
}
