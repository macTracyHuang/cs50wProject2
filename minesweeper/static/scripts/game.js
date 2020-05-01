document.addEventListener('DOMContentLoaded', function() {
  initBoard()
});

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
    this.xSize=xSize;
    this.ySize = ySize;
    this.mineCount = mineCount;
    //createBoard
    for (let x = 0; x < this.xSize; x++) {
      for (let y = 0; y < this.ySize; y++) {
        this.cells["cell_" + x + "_" + y] = new Cell(x, y, false, false, false, 0);
      }
    }
    randomlyAssignMines(this);
    calculateNeighborMineCounts(this);

    //Functions
    //Randomly Assign Mines
    function randomlyAssignMines(aBoard) {
      var mineLocation = [];
      for (let i = 0; i < aBoard.mineCount; i++) {
        let cell = generateAMine();
        //reallocate mine when the cell is already mined
        while (mineLocation.includes(cell)) {
          cell = generateAMine();
        }
        mineLocation.push(cell);
        console.log(i + ':put ' + cell);
        aBoard.cells[cell].neighbor='x';
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

    function calculateNeighborMineCounts(aBoard) {
      let cells = aBoard.cells;
      let xSize = aBoard.xSize;
      let ySize = aBoard.ySize;
      for (let cell in cells) {
        let neighborMineCount = 0;
        if (!cells[cell].mined) {
          let neighbors = getNeighbors(cells[cell], xSize, ySize);
          for (let neighbor of neighbors) {
            neighborMineCount += cells[neighbor].mined ? 1:0;
          }
          cells[cell].neighbor = neighborMineCount;
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
    }
  }
  //Method
  //toString
  toString() {
    return `Board ${this.cells},xSize:${this.xSize},ySize:${this.ySize},mineCount:${this.mineCount}`;
  }
}

function initBoard(){
  const template = Handlebars.compile(document.querySelector('#aCell').innerHTML);
  const newBoard = new Board(30, 16, 99);
  for (let y  =0;y<newBoard.ySize;y++){
    for(let x =0;x<newBoard.xSize;x++){
      let cell = "cell_" + x + "_" + y;
      const content = template({'cell_id': cell,'cell_x':x, 'cell_y':y});
      document.querySelector('#A4').innerHTML += content;
    }
    const clear = `<div class="clear"></div>`;
    document.querySelector('#A4').innerHTML += clear;
  }
}
