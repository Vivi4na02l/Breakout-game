//* Arduino variables */
let serial; /* variable for the serial object */
let latestData = "waiting for data"; /* variable to hold the data */
let arduinoValues;

let but1Value = 0;
let red = 255;
let green = 255;

let joystickX;


//* ML5 handpose webcam variables */
let handpose;
let video;
let predictions = [];
let dims = {};
let averageX = 0;
let newAverageX;
let handSkeletonColor = "#FFFF00"


//* Code logic variables */
let ms;
let calibration = false;
let calibrationDone = false;
let msLeftStarted, msRightStarted;
let lineLeftColor = '#FFFF00', lineRightColor = '#FFFF00';
let timerLeftStarted = false, timerRightStarted = false;
let lineLeftChecked = false, lineRightChecked = false;
let joyStick = true;
let gameStarted = false;


//* Game scenario variables */
let strings = [];

let lines = [1, 3, 5, 5, 7, 7, 7, 7, 5, 3, 1];
let rectangles = [];
let rectNbr = 0;
let rectW;
let rectH = window.innerHeight * 0.03;
let lineRect = 0;
let nbrRectPerLine = -1;
let rectColor;
let rectMarginTop;

let balls = [];
let isBallOut = false;
let playerX;
/**
 * size and position of canvas + definiting the port being used to detect the arduino in use
 */
function setup() {
  createCanvas(window.innerWidth, window.innerHeight);
  frameRate(30);
  rectMode(CENTER);
  fill(0, 0, 0);
  

  //* serial port used to detect the arduino */
  setupSerial('COM9');


  //* ML5 */
  video = createCapture(VIDEO, webcamIsReady);

  handpose = ml5.handpose(video, modelReady);
  handpose.on("predict", results => {
    predictions = results;
  });

  video.hide();


  //* Non-interactive game SCENARIO */
  for (let i = 0; i < 5; i++) {
    strings.push(new floorString(height, height, i));
  }


  //* GAME SCENARIO */
  for (let i = 0; i < 52; i++) {
    nbrRectPerLine++
    rectNbr++

    if (i == 0) {
      lineRect = 1;
      rectNbr = 0;
    } else if (nbrRectPerLine == lines[lineRect-1]) {
      lineRect++
      nbrRectPerLine = 0
      rectNbr = -Math.floor(lines[lineRect-1] / 2)
    }

    if (lineRect <= 8) {
      rectColor = '#EFCC6D'
      rectMarginTop = 0;
    } else {
      rectColor = '#A44EA0'
      rectMarginTop = height*0.005;
    }

    let smallRect = 15;
    let isSmallRect = false;
    for (let j = 0; j < 8; j++) {
      if (i+1 == smallRect) {
        width*0.025
        isSmallRect = true;
      }

      if (j % 2 == 0) {
        smallRect += 6
      } else {
        smallRect += 1
      }
    }

    if (!isSmallRect) {
      rectW = width*0.035;
    }
    // else {
    //   rectW = width*0.02;
    // }
    

    rectangles.push(new Rectangle(width*0.5+rectNbr*rectW, lineRect, rectW, rectH, rectColor, rectMarginTop));
  }

  balls.push(new Ball(window.innerWidth*0.5, height*0.85));
  playerX = width * 0.5;
}
 
function webcamIsReady() {
  dims.canvasWidth = window.innerWidth, dims.canvasHeight = window.innerHeight
  dims.videoWidth = video.width, dims.videoHeight = video.height
}

/* random line to say made by: Viviana :) */

/**
 * draw function
 */
function draw() {
  clear();
  noSmooth();
  strokeWeight(1);
  noStroke();
  stars();

  //* PRE-GAME logics */
  if (!gameStarted) {
    if (document.querySelector('#calibrationScreen').style.display == 'flex') {
      calibration = true;
      ms = millis();
    } else {
      calibration = false
    }
  }
  
  if (!gameStarted && document.querySelector('#calibrationScreen').style.display != 'flex' && document.querySelector('#mainMenu').style.display == 'none') {
    gameStarted = true;
  }


  //* Non-interactive game SCENARIO */
  strokeWeight(3);
  stroke('#A44EA0');
  line(0, height*0.7, width, height*0.7);

  line(0, height*0.85, width*0.1, height*0.7);
  line(width*0.9, height*0.7, width, height*0.85);

  line(width*0.21, height, width*0.3, height*0.7);
  line(width*0.7, height*0.7, width*0.79, height);

  line(width*0.5, height*0.7, width*0.5, height);

  for (let i = 0; i < strings.length; i++) {
    let string = strings[i];
    string.draw();
    string.moveString();
  }
  

  //* GAME logics */
  if (gameStarted) {
    /** Draw rectangle sun */
    for (let i = 0; i < rectangles.length; i++) {
      let rectangle = rectangles[i];
      rectangle.draw();
    }

    /** Draw ball */
    if (!isBallOut) {
      for (let i = 0; i < balls.length; i++) {
        let ball = balls[i];
        ball.render();
      }
    } else {
      for (let i = 0; i < balls.length; i++) {
        let ball = balls[i];
        ball.draw();
      }

      /** Detects collision between ball and rectangles */
      for (let i = 0; i < balls.length; i++) {
        let ball = balls[i];

        for (let i = 0; i < rectangles.length; i++) {
          let rectangle = rectangles[i];

          if (ball.collides(rectangle)) {
            ball.afterRectangle(rectangle);
            console.log('ball-x: '+ball.bPos.x+', rect-x: '+rectangle.rectX);
            rectangles.splice(i, 1);
          }
        }
      }

      for (let i = 0; i < balls.length; i++) {
        let ball = balls[i];

        ball.afterBorder();
      }
    }
  }


  //* ARDUINO */
  if (joyStick && gameStarted) {
    serialReceive(); 
    text("Input Line: " + latestData, 10, height - 30); // print the data to the sketch
  }

  // in this example, we are reciving a 0 and a 1
  // if the button1 is not pressed we get a 0
  /* if (but1Value == 0) {
    ellipse(width / 2, height / 2, 0.8 * height, 0.8 * height);
  } else { // if it is pressed, we get a 1
    rect(width / 2, height / 2, 0.8 * height, 0.8 * height);
  } */

  
  //* ML5 */
  translate(width, 0);
  scale(-1, 1); /* inverts canvas so that the webcam hand captation mechanic is less confusion for the player */
  if (calibration) {
    tint(255, 51);
    image(video, 0, 0, width, height);
  }

  if (calibration || (!joyStick && gameStarted)) {
    drawKeypoints();
  }
}

/**
 * function that draws ellipses and skeletons over the detected keypoints
 */
function drawKeypoints() {
  for (let i = 0; i < predictions.length; i += 1) {
    const prediction = predictions[i]; /* coords for every circle on every finger */
    averageX = 0;

    for (let j = 0; j < prediction.landmarks.length; j += 1) {
      const keypoint = prediction.landmarks[j]; /* coords for every each circle */
 
      let newX = map(keypoint[0], 0, dims.videoWidth, 0, dims.canvasWidth)
      let newY = map(keypoint[1], 0, dims.videoHeight, 0, dims.canvasHeight)

      // only shows the circles of the hand-skeleton when in the calibration screen
      if (calibration) {
        fill(handSkeletonColor);
        noStroke();
        circle(newX, newY, 10);
      }
      
      averageX += keypoint[0]

      // only draws rectangle if the player chose the HAND DETECTION and if he is on the "play" screen
      if (j == prediction.landmarks.length-1) {
        averageX = averageX / prediction.landmarks.length;
        // let newAverageX = map(averageX, 0, dims.videoWidth, 0, dims.canvasWidth)
        newAverageX = map(averageX, 0, dims.videoWidth, 0, width);

        if (calibration) {
          if (newAverageX < width*0.8 && newAverageX > width*0.6) {
            handSkeletonColor = '#00FF00';
            lineLeftColor = '#00FF00';
            
            if (!timerLeftStarted) {
              timerLeftStarted = true
              msLeftStarted = ms;
            }

            if (ms - msLeftStarted > 1000) {
              lineLeftChecked = true  
            }
          } else if (newAverageX < width*0.4 && newAverageX > width*0.2) {
            handSkeletonColor = '#00FF00';
            lineRightColor = '#00FF00';
            
            if (!timerRightStarted) {
              timerRightStarted = true
              msRightStarted = ms;
            }

            if (ms - msRightStarted > 1000) {
              lineRightChecked = true  
            }
          } else {
            handSkeletonColor = '#FFFF00'

            if (!lineLeftChecked) {
              lineLeftColor = '#FFFF00';
              timerLeftStarted = false; 
            }

            if (!lineRightChecked) {
              lineRightColor = '#FFFF00';
              timerRightStarted = false;
            }
          }
        }

        // if ((!joyStick && gameStarted)) {
        //   movingRect(joyStick, gameStarted, newAverageX);
        // }
      }
    }
  }

  if ((!joyStick && gameStarted)) {
    movingRect(joyStick, gameStarted, newAverageX);
  }

  if (calibration) {  
    noStroke();
    fill(lineLeftColor);

    if (!lineLeftChecked) {
      rect(width*0.8,height*0.9, width*0.2, 10); /* since the canvas is inverted horizontally, the X coords would originally be: width * 0.2 */ 
    }

    fill(lineRightColor);
    if (!lineRightChecked) {
      rect(width*0.2,height*0.9, width*0.2, 10); /* since the canvas is inverted horizontally, the X coords would originally be: width * 0.8 */
    }
    
    if (lineLeftChecked && lineRightChecked && !calibrationDone && document.querySelector('#btnJoystick').classList.contains("active")) {
      calibrationDone = true;
      joyStick = false;
      document.querySelector('#mainMenu').style.display = 'flex';
      document.querySelector('#calibrationScreen').style.display = 'none';
      document.querySelector('#btnHand').classList.add("active");
      document.querySelector('#btnJoystick').classList.remove("active");

    } else if (lineLeftChecked && lineRightChecked && calibrationDone && document.querySelector('#btnJoystick').classList.contains("active")) {
      calibrationDone = false;
      joyStick = true;

      lineLeftChecked = false;
      timerLeftStarted = false;
      lineLeftColor = '#FFFF00';

      lineRightChecked = false;
      timerRightStarted = false;
      lineRightColor = '#FFFF00';
    }
  }
}

function modelReady() {
  console.log("Model ready!");
}

/**
 * when data is received in the serial buffer
 * function that receives data from arduino serial monitor
 */ 
function serialReceive() {
  let currentString = serial.readLine(); /* store the data from arduino's serial monitor in a variable */
  trim(currentString); // get rid of whitespace
  if (!currentString) {  // if there's nothing in arduino's serial monitor
    movingRect(joyStick, gameStarted, joystickX);
  } else {
    arduinoValues = split(currentString, ' '); /* creates an array with data from arduino */
    latestData = currentString; // save it to the global variable

    // joystickX = map(arduinoValues[0], 0, 200, window.innerWidth*0.1, (window.innerWidth*0.9*200)/1023);
    // joystickX = map(arduinoValues[0], 200, 800, (window.innerWidth*0.9*200)/1023, (window.innerWidth*0.9*800)/1023);
    // joystickX = map(arduinoValues[0], 800, 1023, (window.innerWidth*0.9*800)/1023, window.innerWidth*0.9);

    joystickX = map(arduinoValues[0], 0, 1023, window.innerWidth*0.05, window.innerWidth*0.95);
    movingRect(joyStick, gameStarted, joystickX);
  }

  but1Value = 0; // Reset value
  but1Value = arduinoValues[1];
}

////////////////////////////////////////////////////////////////
function setupSerial(port){
  // serial constructor
  serial = new p5.SerialPort();
  // get a list of all connected serial devices
  serial.list();
  // serial port to use - you'll need to change this
  serial.open(port);
  // callback for when the sketchs connects to the server
  serial.on('connected', serverConnected);
  // callback to print the list of serial devices
  serial.on('list', gotList);
  // what to do when we get serial data
  //serial.on('data', gotData);
  // what to do when there's an error
  serial.on('error', gotError);
  // when to do when the serial port opens
  serial.on('open', gotOpen);
  // what to do when the port closes
  serial.on('close', gotClose);
}

/////////////////////////////////////////
function serverConnected() {
  console.log("Connected to Server");
}

/////////////////////////////////////////
// list the ports
function gotList(thelist) {
  console.log("List of Serial Ports:");
  for (let i = 0; i < thelist.length; i++) {
    console.log(i + " " + thelist[i]);
  }
}

/////////////////////////////////////////
function gotOpen() {
  console.log("Serial Port is Open");
}

/////////////////////////////////////////
function gotClose() {
  console.log("Serial Port is Closed");
  latestData = "Serial Port is Closed";
}

/////////////////////////////////////////
function gotError(theerror) {
  console.log(theerror);
}
////////////////////////////////////////////////////////////////


function keyPressed() {
  if (key === ' ') {
    isBallOut = true;
  }
}


function stars() {
  fill('#ffffff15')
  let randomX, randomH, randomSize;

  for (let i = 0; i < 20; i++) {
    randomX = random(0, width);
    randomH = random(0, height);
    randomSize = random(width*0.001, width*0.005)

    ellipse(randomX, randomH, randomSize, randomSize);
  }
}


function movingRect(joystick, gameStarted, rectX) {
  let rectangleW = width*0.1;
  let rectangleH = 30;
  let rectY = height*0.9
  let pinkW = rectangleW * 0.15;

  if (!isBallOut) {
    playerX = window.innerWidth * 0.5;
  } else {
    playerX = rectX;
  }

  stroke('#036280');
  strokeWeight(3);
  fill('#000');
  smooth();
  rect(playerX, rectY, rectangleW, rectangleH);
  
  noStroke();
  fill('#FF01A4');
  rect(playerX-rectangleW*0.3, rectY, pinkW, rectangleH*0.5);

  noStroke();
  fill('#FF01A4');
  rect(playerX+rectangleW*0.3, rectY, pinkW, rectangleH*0.5);

  noStroke();
  fill('#A48A6C');
  rect(playerX, rectY, pinkW*2, rectangleH*0.5);

  for (let i = 0; i < balls.length; i++) {
    let ball = balls[i];

    // if (ball.collides({rectX: playerX, rectY: rectY, rectW: rectangleW, rectH: rectangleH})) {
    //   console.log("entrou");
      
    //   ball.afterRectangle({rectX: playerX, rectY: rectY, rectW: rectangleW, rectH: rectangleH});
    // }
    
    let playerX_1 = playerX - rectangleW/2; //left on arduino
    let playerX_2 = playerX + rectangleW/2; //right on arduino
    if (!joystick) {
      playerX_1 = width-(playerX + rectangleW/2); //VISUALLY right on ml5.js (because image is mirrored)
      playerX_2 = width-(playerX - rectangleW/2); //left on ml5.js
    }

    // console.log(ball.bPos.x, ball.bPos.y, playerX_1, playerX_2, rectY - rectangleH / 2, width);

    if (ball.bPos.x > playerX_1 && ball.bPos.x < playerX_2 && ball.bPos.y + ball.bR > rectY - rectangleH / 2 ) { //&& ball.bPos.y < height*0.9
      console.log("entrou");
      let newAngleX = map(ball.bPos.x, playerX - rectangleW / 2, playerX + rectangleW / 2, -1, 1);
      ball.bAngle.set(newAngleX, -ball.bSpeed);
    }
  }
}


class floorString {
  constructor(stringY0, stringY1, stringNbr) {
      // Here are assigned the initial values of properties
      this.stringY0 = stringY0;
      this.stringY1 = stringY1;
      this.stringNbr = stringNbr;
  }


  draw() { /* method that draws the movable strings on the floor */
    strokeWeight(3);
    stroke('#A44EA0');

    line(0, this.stringY0 + (300 * this.stringNbr), width, this.stringY1 + (300 * this.stringNbr));
  }


  moveString() { /*method to move strings vertically */
    if (this.stringY0 <= height) {
      this.stringY0 -= 25;
      this.stringY1 -= 25;
    } else if (this.stringY0 <= height*0.9) {
      this.stringY0 -= 20;
      this.stringY1 -= 20;
    } else if (this.stringY0 <= height*0.85) {
      this.stringY0 -= 15;
      this.stringY1 -= 15;
    } else if (this.stringY0 <= height*0.8) {
      this.stringY0 -= 10;
      this.stringY1 -= 10;
    } else if (this.stringY0 <= height*0.75) {
      this.stringY0 -= 5;
      this.stringY1 -= 5;
    }

    if (this.stringY0 <= height*0.7) {
      this.stringY0 = height;
      this.stringY1 = height;
    }
  }
}


class Ball {
  constructor(x, y) {
    this.bPos = createVector(x, y);
    this.bSpeed = 15;
    this.bAngle = createVector(this.bSpeed, -this.bSpeed);
    this.bR = width*0.015;
  }

  render() {
    fill('#fff');
    noStroke();
  
    ellipse(this.bPos.x, this.bPos.y, this.bR, this.bR);
  }

  draw() {
    fill('#fff');
    noStroke();

    this.bPos.add(this.bAngle);
  
    ellipse(this.bPos.x, this.bPos.y, this.bR, this.bR);
    console.log(this.bPos);
    
  }

  collides(rectangle) {
    if (this.bPos.x + this.bR >= rectangle.rectX
      //NOT to the left
      &&
      this.bPos.x <= rectangle.rectX + rectangle.rectW
      //NOT to the right
      &&
      this.bPos.y + this.bR >= rectangle.rectY
      //NOT above
      &&
      this.bPos.y <= rectangle.rectY + rectangle.rectH) {
      //NOT below

      /* they collide! */
      return true;
    }
  }

  afterRectangle(rectangle) {
    this.bAngle.x *= -1;
    this.bAngle.y *= -1;
    this.draw();

    // if (ball.collides(rectangle)) {
    //   this.vel.x *= -1;
    //   this.vel.y *= -1;
    // }
  }

  afterBorder() {
    if (this.bPos.x + this.bR > window.innerWidth) {
      this.bAngle.x *= -1;
    } else if (this.bPos.x + this.bR < window.innerWidth*0.01) {
      this.bAngle.x *= -1;
    } else if (this.bPos.y + this.bR < height*0.05) {
      this.bAngle.y *= -1;
    }
    
    if (this.bPos.y + this.bR > height*0.95) {
      // this.bAngle.y *= -1;
      noLoop();
      document.querySelector('#gameOver').style.display = 'flex';
    }
  }
}


class Rectangle {
  constructor(rectX, lineRect, rectW, rectH, rectColor, marginTop) {
      // Here are assigned the initial values of properties
      // this.rectX0 = width*0.5
      this.rectX = rectX;
      this.lineRect = lineRect;
      this.rectW = rectW;
      this.rectH = rectH;
      this.rectColor = rectColor;
      this.marginTop = marginTop;
      this.rectY = height*0.1+(this.rectH+6+marginTop)*this.lineRect;
  }


  draw() { /* method that draws the rectangles in shape of the sun */
    // [1, 3, 5, 5, 7, 7, 7, 7, 5, 4, 1];

    fill('#000');
    strokeWeight(3);
    stroke(this.rectColor);
  
    rect(this.rectX, this.rectY, this.rectW, this.rectH);
  }


  drive() { // method to move a car
    this.posX += this.speed;

    if (this.posX < -20) {
        this.posX = width;
    }
    if (this.posX > width) {
        this.posX = -20;
    }
  }
}