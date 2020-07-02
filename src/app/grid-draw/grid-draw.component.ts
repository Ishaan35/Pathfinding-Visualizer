import { Component, ViewChild, ElementRef, OnInit, forwardRef } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { Queue } from '../queue';


@Component({
  selector: 'app-grid-draw',
  templateUrl: './grid-draw.component.html',
  styleUrls: ['./grid-draw.component.css']
})
export class GridDrawComponent implements OnInit {
  private httpClient: HttpClient;

  constructor(http: HttpClient) {
    this.httpClient = http;
  }

  @ViewChild('canvas', { static: true })


  animDelay;
  startNodeColor;
  endNodeColor;
  shapedimension;
  lineWidth;

  shapes; //2d array of square nodes
  canvas = null;
  ctxGrid = null;

  drawWall = true;
  eraseWall = false;
  changeStartNode = false;
  changeEndNode = false;

  disableButtons = false;

  startImage;
  noPath;




  ngOnInit(): void {


    //initialize values
    this.animDelay = 15;
    this.startNodeColor = "#FF3600";
    this.endNodeColor = "#00AB5C";
    this.shapedimension = 13;
    this.lineWidth = 0.05;


    //initialize array an grid
    this.shapes = new Array(95);
    for (let i = 0; i < this.shapes.length; i++) { this.shapes[i] = new Array(40) };
    this.canvas = <HTMLCanvasElement>document.getElementById('myCanvas');
    this.ctxGrid = this.canvas.getContext('2d');

    this.ctxGrid.canvas.height = 520;
    this.ctxGrid.canvas.width = 1235;
    this.ctxGrid.canvas.style.imageRendering = 'auto';//default
    this.ctxGrid.translate(0.5, 0.5);
    this.ctxGrid.imageSmoothingEnabled = false;




    //start image initialize
    this.startImage = new Image();
    this.noPath = new Image();
    this.startImage.onload = this.resetGrid();
    this.startImage.src = "/assets/StartIcon.PNG";
    this.noPath.src = "/assets/NoPath.png";



    //the evvent listeners to draw walls or change positions of start or end nodes

    this.canvas.addEventListener('mousemove', function (e) {
      const rect = this.canvas.getBoundingClientRect();

      let cx = e.clientX - rect.left;
      let cy = e.clientY - rect.top;
      this.draw_erase_walls(e, cx, cy);
    }.bind(this))

    //single click for start and end nodes
    this.canvas.addEventListener('mousedown', function (e) {
      const rect = this.canvas.getBoundingClientRect();
      let cx = e.clientX - rect.left;
      let cy = e.clientY - rect.top;

      this.changeStart(cx, cy);
      this.changeEnd(cx, cy);
    }.bind(this))

  }


  async resetGrid() {

    this.ctxGrid.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctxGrid.lineWidth = this.lineWidth;
    this.ctxGrid.fillStyle = "000000";

    //this allows the image to load
    await new Promise(resolve =>
      setTimeout(() => {
        resolve();
      }, 50)
    );
    //grid with rectangles
    for (let i = 0; i < this.shapes.length; i++) {
      for (let j = 0; j < this.shapes[i].length; j++) {
        //variables
        let x = i * this.shapedimension;
        let y = j * this.shapedimension;
        let type = "";
        let visited = false;

        //a* algorithm info
        let F = 100000;
        let G = 100000;
        let H = 100000;
        let cameFrom = undefined;
        //maze stuff
        //neighbouring nodes
        let neighbors = new Array();

        if (i == 4 && j == 4) {

          this.ctxGrid.fillStyle = this.startNodeColor;

          type = "Start"
          //draw it
          this.ctxGrid.strokeRect(x, y, this.shapedimension, this.shapedimension);

          this.ctxGrid.fillStyle = this.startNodeColor;

          this.ctxGrid.fillRect(x, y, this.shapedimension, this.shapedimension);

        }

        else if (i == (this.canvas.width / this.shapedimension - 5) && j == (this.canvas.height / this.shapedimension - 5)) {
          this.ctxGrid.fillStyle = this.endNodeColor;

          type = "End"
          //draw it
          this.ctxGrid.strokeRect(x, y, this.shapedimension, this.shapedimension);
          this.ctxGrid.fillRect(x, y, this.shapedimension, this.shapedimension);
        }

        else {
          //push the default square info
          type = "";
          this.ctxGrid.fillStyle = "#000000"
          //draw it
          this.ctxGrid.strokeRect(x, y, this.shapedimension, this.shapedimension);
        }
        this.shapes[i][j] = { x, y, i, j, type, F, G, H, neighbors, cameFrom, visited };  //x and y are grid coordinates, and i j is the index in array the square object is in, and type is the type of the node, FGH is a* related info

      }
    }
    //a_star_search();

  }
  async draw_erase_walls(e, cx, cy) {
    //mouse pressed
    if (e.which == 1 && !this.disableButtons) {
      //find out which square object is this
      for (let i = 0; i < this.shapes.length; i++) {

        for (let j = 0; j < this.shapes[i].length; j++) {

          if ((cx < (this.shapes[i][j].x + 12) && (cx > this.shapes[i][j].x) && (cy < (this.shapes[i][j].y + 12)) && cy > (this.shapes[i][j].y))) {
            //make sure we are not building walls over certain nodes
            if (this.drawWall && this.shapes[i][j].type != "Wall" && this.shapes[i][j].type != "Start" && this.shapes[i][j].type != "End") {
              this.ctxGrid.lineWidth = this.lineWidth;
              this.ctxGrid.fillStyle = "#000000";
              this.shapes[i][j].type = "Wall";

              let x = this.shapedimension / 2;
              let y = this.shapedimension / 2;
              let dx = 0;
              let dy = 0;
              //a little delay animation for filling in the square
              for (let k = this.shapedimension / 2; k > 0; k--) {
                await new Promise(resolve =>
                  setTimeout(() => {
                    resolve();
                  }, this.animDelay)
                );
                this.ctxGrid.fillRect(this.shapes[i][j].x + x, this.shapes[i][j].y + y, dx - 0.1, dy - 0.1);

                x--;
                y--;
                dx += 2;
                dy += 2;

              }
            }
            //erase
            if (this.eraseWall && this.shapes[i][j].type == "Wall") {
              this.ctxGrid.lineWidth = this.lineWidth;
              this.ctxGrid.fillStyle = "#FFFFFF";
              this.ctxGrid.lineWidth = this.lineWidth;
              this.ctxGrid.strokeRect(this.shapes[i][j].x, this.shapes[i][j].y, this.shapedimension, this.shapedimension);

              this.shapes[i][j].type = "";

              this.ctxGrid.clearRect(this.shapes[i][j].x, this.shapes[i][j].y, this.shapedimension, this.shapedimension);
              this.ctxGrid.strokeRect(this.shapes[i][j].x, this.shapes[i][j].y, this.shapedimension, this.shapedimension);

            }

          }

        }



      }
    }
  }
  async changeEnd(cx, cy) {
    for (let i = 0; i < this.shapes.length; i++) {

      for (let j = 0; j < this.shapes[i].length; j++) {

        if ((cx < (this.shapes[i][j].x + this.shapedimension) && (cx > this.shapes[i][j].x) && (cy < (this.shapes[i][j].y + this.shapedimension)) && cy > (this.shapes[i][j].y))) {
          if (this.changeEndNode && this.shapes[i][j].type != "End") {
            //identify old start position and remove it. Traversing 2d array means we need 2 new loop variables
            for (let k = 0; k < this.shapes.length; k++) {
              for (let l = 0; l < this.shapes[k].length; l++) {
                if (this.shapes[k][l].type == "End") {
                  this.ctxGrid.lineWidth = this.lineWidth;

                  this.ctxGrid.fillStyle = "#FFFFFF";
                  this.ctxGrid.clearRect(this.shapes[k][l].x - 0.5, this.shapes[k][l].y - 0.5, this.shapedimension + 0.6, this.shapedimension + 0.5);
                  this.ctxGrid.strokeRect(this.shapes[k][l].x, this.shapes[k][l].y, this.shapedimension, this.shapedimension);
                  this.shapes[k][l].type = "";
                }
              }
            }

            //add new start point
            this.ctxGrid.fillStyle = this.endNodeColor;
            this.shapes[i][j].type = "End";

            this.ctxGrid.fillRect(this.shapes[i][j].x, this.shapes[i][j].y, this.shapedimension, this.shapedimension);


          }
        }

      }


    }
  }
  async changeStart(cx, cy) {
    for (let i = 0; i < this.shapes.length; i++) {

      for (let j = 0; j < this.shapes[i].length; j++) {

        if ((cx < (this.shapes[i][j].x + this.shapedimension) && (cx > this.shapes[i][j].x) && (cy < (this.shapes[i][j].y + this.shapedimension)) && cy > (this.shapes[i][j].y))) {
          if (this.changeStartNode && this.shapes[i][j].type != "Start") {
            //identify old start position and remove it. Traversing 2d array means we need 2 new loop variables
            for (let k = 0; k < this.shapes.length; k++) {
              for (let l = 0; l < this.shapes[k].length; l++) {
                if (this.shapes[k][l].type == "Start") {
                  this.ctxGrid.lineWidth = this.lineWidth;

                  this.ctxGrid.fillStyle = "#FFFFFF";
                  this.ctxGrid.clearRect(this.shapes[k][l].x - 0.5, this.shapes[k][l].y - 0.5, this.shapedimension + 0.6, this.shapedimension + 0.5);
                  this.ctxGrid.strokeRect(this.shapes[k][l].x, this.shapes[k][l].y, this.shapedimension, this.shapedimension);
                  this.shapes[k][l].type = "";
                }
              }
            }

            //add new start point
            this.ctxGrid.fillStyle = this.startNodeColor;
            this.shapes[i][j].type = "Start";

            this.ctxGrid.fillRect(this.shapes[i][j].x, this.shapes[i][j].y, this.shapedimension, this.shapedimension);


          }
        }

      }


    }

  }
  async RandomWalls() {

    //clear board
    let start;
    let end;
    for (let i = 0; i < this.shapes.length; i++) {
      for (let j = 0; j < this.shapes[0].length; j++) {
        if (this.shapes[i][j].type == "Start") {
          start = this.shapes[i][j];
        }
        else if (this.shapes[i][j].type == "End") {
          end = this.shapes[i][j];
        }
        else {
          this.shapes[i][j].type = "";
        }

      }
    }
    this.ctxGrid.clearRect(0, 0, this.canvas.width, this.canvas.height);

    //restore grid
    for (let i = 0; i < this.shapes.length; i++) {
      for (let j = 0; j < this.shapes[0].length; j++) {
        this.ctxGrid.strokeRect(this.shapes[i][j].x, this.shapes[i][j].y, this.shapedimension, this.shapedimension);
      }
    }
    //restore start and end
    this.ctxGrid.fillStyle = "#FF3600";
    this.ctxGrid.fillRect(start.x, start.y, this.shapedimension - 1, this.shapedimension - 1);
    this.ctxGrid.fillStyle = "#00AB5C";
    this.ctxGrid.fillRect(end.x, end.y, this.shapedimension - 1, this.shapedimension - 1);


    //random walls
    for (let i = 0; i < this.shapes.length; i++) {
      for (let j = 0; j < this.shapes[0].length; j++) {

        if (this.shapes[i][j].type != "Start" && this.shapes[i][j].type != "End") {
          let rand = Math.random();

          if (rand < 0.35) {
            this.shapes[i][j].type == "Wall"
            this.ctxGrid.lineWidth = this.lineWidth;
            this.ctxGrid.fillStyle = "#000000";
            this.shapes[i][j].type = "Wall";

            this.ctxGrid.fillRect(this.shapes[i][j].x + 0.5, this.shapes[i][j].y + 0.5, this.shapedimension - 1, this.shapedimension - 1);

          }
        }


      }
    }
  }
  async drawNode(xPos, yPos, color) {
    //a little delay animation for filling in the square
    let x = this.shapedimension / 2;
    let y = this.shapedimension / 2;
    let dx = 0;
    let dy = 0;

    for (let k = this.shapedimension + 1; k > 0; k--) {
      await new Promise(resolve =>
        setTimeout(() => {
          resolve();
        }, this.animDelay * 1.5)
      );
      this.ctxGrid.fillRect(xPos + x, yPos + y, dx, dy);

      x -= 0.5;
      y -= 0.5;
      dx += 1;
      dy += 1;

    }
  }


  findNeighbors() {
    for (let i = 0; i < this.shapes.length; i++) {
      for (let j = 0; j < this.shapes[0].length; j++) {
        if (i < this.shapes.length - 1) {
          this.shapes[i][j].neighbors.push(this.shapes[i + 1][j]);
        }
        if (i > 0) {
          this.shapes[i][j].neighbors.push(this.shapes[i - 1][j]);
        }
        if (j < this.shapes[0].length - 1) {
          this.shapes[i][j].neighbors.push(this.shapes[i][j + 1]);
        }
        if (j > 0) {
          this.shapes[i][j].neighbors.push(this.shapes[i][j - 1]);
        }

      }
    }
  }
  //clears all the nodes except for walls, start and end
  clearSearchNotWalls() {
    let wallPositions = [];
    let startPos;
    let endPos;
    //store info
    for (let i = 0; i < this.shapes.length; i++) {
      for (let j = 0; j < this.shapes[0].length; j++) {
        if (this.shapes[i][j].type == "Wall") {
          let x = this.shapes[i][j].x;
          let y = this.shapes[i][j].y;
          wallPositions.push({ x, y });
        }
        if (this.shapes[i][j].type == "Start") {
          startPos = this.shapes[i][j];
        }
        if (this.shapes[i][j].type == "End") {
          endPos = this.shapes[i][j];
        }
        this.shapes[i][j].visited = false;
        this.shapes[i][j].cameFrom = undefined;
      }
    }
    //clear grid
    this.ctxGrid.clearRect(0, 0, this.canvas.width, this.canvas.height);

    //restore stuff
    //grid
    for (let i = 0; i < this.shapes.length; i++) {
      for (let j = 0; j < this.shapes[0].length; j++) {
        this.shapes[i][j].F = 0;
        this.shapes[i][j].G = 0;
        this.shapes[i][j].H = 0;
        this.ctxGrid.strokeRect(this.shapes[i][j].x, this.shapes[i][j].y, this.shapedimension, this.shapedimension);
      }
    }


    for (let i = 0; i < wallPositions.length; i++) {
      this.ctxGrid.fillStyle = "#000000"
      this.ctxGrid.fillRect(wallPositions[i].x + 0.5, wallPositions[i].y + 0.5, this.shapedimension - 1, this.shapedimension - 1);
    }
    this.ctxGrid.fillStyle = "#FF3600";
    this.ctxGrid.fillRect(startPos.x, startPos.y, this.shapedimension - 1, this.shapedimension - 1);
    this.ctxGrid.fillStyle = "#00AB5C";
    this.ctxGrid.fillRect(endPos.x, endPos.y, this.shapedimension - 1, this.shapedimension - 1);






  }
  removeFromArray(arr, element) {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i] == element) {
        arr.splice(i, 1);
      }
    }
  }
  heuristic(a, b) {
    let d = (Math.abs(a.x - b.x) + Math.abs(a.y - b.y));
    //let d = (Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
    return d;
  }
  returnNeighbors(node) {

    //let neighbors = [this.shapes[node.i][node.j - 1], this.shapes[node.i][node.j + 1], this.shapes[node.i - 1][node.j], this.shapes[node.i + 1][node.j]]

    let neighbors = [];
    if (node.i > 0) {
      neighbors.push(this.shapes[node.i - 1][node.j]);
    }
    if (node.i < this.shapes.length - 1) [
      neighbors.push(this.shapes[node.i + 1][node.j])
    ]
    if (node.j > 0) {
      neighbors.push(this.shapes[node.i][node.j - 1]);
    }
    if (node.j < this.shapes[0].length - 1) {
      neighbors.push(this.shapes[node.i][node.j + 1]);
    }

    return neighbors;
  }






  //ALGORITHMS
  async a_star_search() {
    this.clearSearchNotWalls();
    this.disableButtons = true;
    let openSet = [];
    let closedSet = [];
    let start, end;
    let path = [];


    this.findNeighbors();


    //shapes is a 2d array of squares... a grid
    for (let i = 0; i < this.shapes.length; i++) {
      for (let j = 0; j < this.shapes[0].length; j++) {
        if (this.shapes[i][j].type == "Start") {
          start = this.shapes[i][j];
        }
        if (this.shapes[i][j].type == "End") {
          end = this.shapes[i][j];
        }
      }
    }

    openSet.push(start);


    while (openSet.length > 0) {

      let lowestIndex = 0;
      //find lowest index
      for (let i = 0; i < openSet.length; i++) {
        if (openSet[i].F < openSet[lowestIndex].F)
          lowestIndex = i;
        else if (openSet[i].F === openSet[lowestIndex].F) {
          if (openSet[i].H < openSet[lowestIndex].H) {
            lowestIndex = i;
          }
        }
      }
      //current node
      let current = openSet[lowestIndex];

      //if reached the end
      if (openSet[lowestIndex] === end) {

        path = [];
        let temp = current;
        path.push(temp);
        while (temp.cameFrom) {
          path.push(temp.cameFrom);
          temp = temp.cameFrom;
        }
        console.log("Done!"); // DONE
        //draw path
        for (let i = path.length - 1; i >= 0; i--) {
          this.ctxGrid.fillStyle = "#ffff00";
          this.ctxGrid.lineWidth = this.lineWidth;
          this.drawNode(path[i].x, path[i].y, "#ffff00")
          await new Promise(resolve =>
            setTimeout(() => {
              resolve();
            }, this.animDelay)
          );
        }
        this.disableButtons = false;
        break;
      }

      this.removeFromArray(openSet, current);
      closedSet.push(current);

      let my_neighbors = current.neighbors;
      for (let i = 0; i < my_neighbors.length; i++) {
        var neighbor = my_neighbors[i];

        if (!closedSet.includes(neighbor) && neighbor.type != "Wall") {
          let tempG = current.G + 1;

          let newPath = false;
          if (openSet.includes(neighbor)) {
            if (tempG < neighbor.G) {
              neighbor.G = tempG;
              newPath = true;
            }
          } else {
            neighbor.G = tempG;
            newPath = true;
            openSet.push(neighbor);
          }

          if (newPath) {
            neighbor.H = this.heuristic(neighbor, end);
            neighbor.F = neighbor.G + neighbor.H;
            neighbor.cameFrom = current;
          }

        }
      }


      //draw
      this.ctxGrid.lineWidth = this.lineWidth;
      for (let i = 0; i < closedSet.length; i++) { //BLUE
        this.ctxGrid.fillStyle = "#4287f5";
        this.ctxGrid.fillRect(closedSet[i].x + 0.5, closedSet[i].y + 0.5, this.shapedimension - 1, this.shapedimension - 1);
        //this.drawNode(closedSet[i].x, closedSet[i].y, "#4287f5");
      }
      for (let i = 0; i < openSet.length; i++) { //GREEN
        this.ctxGrid.fillStyle = "#00c48d";
        this.ctxGrid.fillRect(openSet[i].x + 0.5, openSet[i].y + 0.5, this.shapedimension - 1, this.shapedimension - 1);
        //this.drawNode(closedSet[i].x, closedSet[i].y, "#00c48d");

      }
      await new Promise(resolve =>
        setTimeout(() => {
          resolve();
        }, 10)
      );
    }
    if (openSet.length <= 0) {
      //no solution
      this.disableButtons = false;
    }

  }
  async dijkstraSearch_A_star_variation() {

    this.clearSearchNotWalls();
    this.disableButtons = true;
    let openSet = [];
    let closedSet = [];
    let start, end;
    let path = [];


    this.findNeighbors();


    //shapes is a 2d array of squares... a grid
    for (let i = 0; i < this.shapes.length; i++) {
      for (let j = 0; j < this.shapes[0].length; j++) {
        if (this.shapes[i][j].type == "Start") {
          start = this.shapes[i][j];
        }
        if (this.shapes[i][j].type == "End") {
          end = this.shapes[i][j];
        }
      }
    }

    openSet.push(start);


    while (openSet.length > 0) {

      let lowestIndex = 0;
      //find lowest index
      for (let i = 0; i < openSet.length; i++) {
        if (openSet[i].F < openSet[lowestIndex].F)
          lowestIndex = i;
      }
      //current node
      let current = openSet[lowestIndex];

      //if reached the end
      if (openSet[lowestIndex] === end) {

        path = [];
        let temp = current;
        path.push(temp);
        while (temp.cameFrom) {
          path.push(temp.cameFrom);
          temp = temp.cameFrom;
        }
        console.log("Done!");
        //draw path
        for (let i = path.length - 1; i >= 0; i--) {
          this.ctxGrid.fillStyle = "#ffff00";
          this.ctxGrid.lineWidth = this.lineWidth;
          this.drawNode(path[i].x, path[i].y, "#ffff00")
          await new Promise(resolve =>
            setTimeout(() => {
              resolve();
            }, this.animDelay)
          );
        }
        this.disableButtons = false;
        break;
      }

      this.removeFromArray(openSet, current);
      closedSet.push(current);

      let my_neighbors = current.neighbors;
      for (let i = 0; i < my_neighbors.length; i++) {
        var neighbor = my_neighbors[i];

        if (!closedSet.includes(neighbor) && neighbor.type != "Wall") {
          let tempG = current.G + 1;

          let newPath = false;
          if (openSet.includes(neighbor)) {
            if (tempG < neighbor.G) {
              neighbor.G = tempG;
              newPath = true;
            }
          } else {
            neighbor.G = tempG;
            newPath = true;
            openSet.push(neighbor);
          }

          if (newPath) {
            neighbor.H = this.heuristic(neighbor, end);
            neighbor.G = neighbor.F + neighbor.H;
            neighbor.cameFrom = current;
          }

        }
      }


      //draw
      this.ctxGrid.lineWidth = this.lineWidth;
      for (let i = 0; i < closedSet.length; i++) { //BLUE
        this.ctxGrid.fillStyle = "#4287f5";
        this.ctxGrid.fillRect(closedSet[i].x + 0.5, closedSet[i].y + 0.5, this.shapedimension - 1, this.shapedimension - 1);
      }
      for (let i = 0; i < openSet.length; i++) { //GREEN
        this.ctxGrid.fillStyle = "#00c48d";
        this.ctxGrid.fillRect(openSet[i].x + 0.5, openSet[i].y + 0.5, this.shapedimension - 1, this.shapedimension - 1);

      }
      await new Promise(resolve =>
        setTimeout(() => {
          resolve();
        }, 5)
      );
    }
    if (openSet.length <= 0) {
      //no solution
      this.disableButtons = false;
    }

  }
  async bfs_Search() {
    this.clearSearchNotWalls();
    this.disableButtons = true;

    let start;
    let end;
    for (let i = 0; i < this.shapes.length; i++) {
      for (let j = 0; j < this.shapes[0].length; j++) {
        if (this.shapes[i][j].type == "Start") {
          start = this.shapes[i][j];
        }
        if (this.shapes[i][j].type == "End") {
          end = this.shapes[i][j];
        }
      }
    }

    console.log(end.i + " " + end.j);

    let queue = new Queue();
    queue.enqueue(start);

    while (!queue.isEmpty()) {
      let node = queue.dequeue();

      if (node == end) {
        let current = end;
        let path = new Array();
        while (current != start) {
          current = current.cameFrom;
          path.push(current);
        }
        for (let i = path.length - 1; i >= 0; i--) {
          this.ctxGrid.fillStyle = "#ffff00";
          this.ctxGrid.lineWidth = this.lineWidth;
          this.drawNode(path[i].x, path[i].y, "#ffff00")
          await new Promise(resolve =>
            setTimeout(() => {
              resolve();
            }, this.animDelay)
          );
        }
        this.disableButtons = false;
        break;
      }

      let neighbors = this.returnNeighbors(node);

      for (let i = 0; i < neighbors.length; i++) {
        if (!neighbors[i].visited && neighbors[i].type != "Wall") {
          neighbors[i].visited = true;
          neighbors[i].cameFrom = node;
          queue.enqueue(neighbors[i]);
          this.ctxGrid.fillStyle = "#4287f5";
          this.ctxGrid.fillRect(neighbors[i].x + 0.5, neighbors[i].y + 0.5, this.shapedimension - 1, this.shapedimension - 1);
        }
      }
      await new Promise(resolve =>
        setTimeout(() => {
          resolve();
        }, 0)
      );
    }





  }

  async sampleMaze(path) {
    this.httpClient.get(path + "", { responseType: 'text' })
      .subscribe(data => this.loadSampleMaze(data));
  }
  async loadSampleMaze(data) {
    data = data + "";
    data.trim();

    let dataNew = data.split('\n');

    this.ctxGrid.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.disableButtons = true;

    for (let i = 0; i < 95; i++) {
      for (let j = 0; j < 40; j++) {
        if (dataNew[j][i] == "1") {
          this.ctxGrid.lineWidth = this.lineWidth;
          this.ctxGrid.fillStyle = "#000000";
          this.shapes[i][j].type = "Wall";

          this.ctxGrid.fillRect(this.shapes[i][j].x, this.shapes[i][j].y, this.shapedimension - 0.1, this.shapedimension - 0.1);
        }
        if (dataNew[j][i] == "0") {
          this.shapes[i][j].type = "";
          this.ctxGrid.fillStyle = "#FFFFFF"
          //draw it
          this.ctxGrid.strokeRect(this.shapes[i][j].x, this.shapes[i][j].y, this.shapedimension, this.shapedimension);
        }
        if (dataNew[j][i] == "2") {
          this.shapes[i][j].type = "Start";
          //draw it
          this.ctxGrid.strokeRect(this.shapes[i][j].x, this.shapes[i][j].y, this.shapedimension, this.shapedimension);

          this.ctxGrid.fillStyle = this.startNodeColor;

          this.ctxGrid.fillRect(this.shapes[i][j].x, this.shapes[i][j].y, this.shapedimension, this.shapedimension);
        }
        if (dataNew[j][i] == "3") {
          this.ctxGrid.fillStyle = this.endNodeColor;

          this.shapes[i][j].type = "End";
          //draw it
          this.ctxGrid.strokeRect(this.shapes[i][j].x, this.shapes[i][j].y, this.shapedimension, this.shapedimension);
          this.ctxGrid.fillRect(this.shapes[i][j].x, this.shapes[i][j].y, this.shapedimension, this.shapedimension);
        }
      }
      await new Promise(resolve =>
        setTimeout(() => {
          resolve();
        }, 0)
      );
    }
    this.disableButtons = false;


  }








  //booleans
  drawToggle() {
    this.drawWall = true;
    this.eraseWall = false;
    this.changeStartNode = false;
    this.changeEndNode = false;
  }
  eraseToggle() {
    this.drawWall = false;
    this.eraseWall = true;
    this.changeStartNode = false;
    this.changeEndNode = false;
  }
  changeEndNodeOption() {
    this.drawWall = false;
    this.eraseWall = false;
    this.changeStartNode = false;
    this.changeEndNode = true;
  }
  changeStartNodeOption() {
    this.drawWall = false;
    this.eraseWall = false;
    this.changeStartNode = true;
    this.changeEndNode = false;
  }




}
