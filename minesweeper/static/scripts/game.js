const startmines = 99;
var mines;
var gameover;
var board;
var time;
var checked = 0;
var downid;
document.addEventListener('DOMContentLoaded', function() {
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
  gameover = false;
  mines = startmines;
  board = newBoard;
  time = 0;
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
      if(!gameover && event.button === 0){
        downid=id;
        isdown=true;
        if(board.cells[id].opened){
          const neighbors = getNeighbors(board.cells[id], 30, 16);
          for (let neighbor of neighbors){
            let n = document.querySelector('#'+neighbor);
            if(n.classList.contains('closed')){
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
            if(n.classList.contains('check')){
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
            if(n.classList.contains('closed')){
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
          if(!board.cells[neighbor].opened){
            n.classList.add('closed');
            n.classList.remove('check');
          }
        }
      }
      isdown=false;
      if (!gameover && !board.cells[id].opened && event.button === 0) {
        opencell(id);
      }
    });
    //Double Click
    cell.addEventListener('dblclick', event => {
      console.log('dbclick');
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
              }, 3);
            }
          }
        }
      }
    });
    //Right click
    cell.addEventListener('contextmenu', e => {
      if (!gameover) {
        if (!board.cells[cell.id].opened) {
          cell.classList.toggle('closed');
          cell.classList.toggle('flag');
          if (cell.classList.contains('flag')) {
            board.cells[id].flagged = true;
            mines--;
          } else {
            board.cells[id].flagged = false;
            mines++;
          }
          updateMines();
        }
        isdown=false;
        e.preventDefault();
      }
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
      //restart game
      checked = 0;
      mines = startmines;
      gameover = false;
      time = 0;
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
    cell.classList.remove('closed');
    cell.classList.add('type' + n);
    checked++;
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
    console.log('gameover');
    document.querySelectorAll('.innercell').forEach(innerinnercell => {
      let n = board.innercells[innercell.id].neighbor;
      if (!board.innercells[innercell.id].opened) {
        //wrong flag
        if ((board.innercells[innercell.id].flagged && n !== 10) || n === 10) {
          if (n !== 10) {
            n = 12;
          }
          innercell.classList.remove('closed');
          innercell.classList.remove('flag');
          innercell.classList.add('type' + n);
          checked++;
          innercell.opened = true;
        }
      }
    });
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
