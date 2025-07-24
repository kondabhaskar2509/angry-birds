let canvas = document.getElementById("canvas");
let context = canvas.getContext("2d");
let toggle = document.getElementById("toggle");

let canvasWidth = 1000;
let canvasHeight = 600;

canvas.width = canvasWidth;
canvas.height = canvasHeight;

let blocks = [];
let birds = [
  { x: 60, y: 560, w: 40, h: 40, color: "red", speed: 0.07, damage: 1 },
  { x: 120, y: 540, w: 60, h: 60, color: "green", speed: 0.05, damage: 2 },
  { x: 200, y: 520, w: 80, h: 80, color: "blue", speed: 0.03, damage: 3 },
];
let selectedBird = null;
let dragging = false;
let launchedBird = null;
let shotsLeft = 5;
let score = 0;
let gameActive = false;
let gameEnded = false;
let draggingTrajectory = false;
let tx = 0;
let ty = 0;
let gravity = 0.25;
let launchedBlocksHit = 0;
let boardX = 200;
let boardY = 400;

const birdMaxBlocks = {
  red: 3,
  green: 7,
  blue: 10,
};

function resetBirds() {
  birds[0].x = 60;
  birds[0].y = 560;
  birds[1].x = 120;
  birds[1].y = 540;
  birds[2].x = 200;
  birds[2].y = 520;
}

class Block {
  constructor(x, y, w, h, color, health = 3) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.color = color;
    this.health = health;
    this.alive = true;
  }
  draw(context) {
    if (!this.alive) return;
    context.beginPath();
    context.fillStyle = this.color;
    context.fillRect(this.x, this.y, this.w, this.h);
    context.closePath();
  }
}

function setupBlocks() {
  for (let i = 120; i < 480; i += 40) {
    blocks.push(new Block(760, i, 60, 38, "orange", 3));
    blocks.push(new Block(830, i, 60, 38, "orange", 3));
    blocks.push(new Block(900, i, 60, 38, "orange", 3));
  }
}

class Bird {
  constructor(x, y, w, h, color) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.color = color;
  }
  draw(context) {
    context.beginPath();
    context.fillStyle = this.color;
    context.fillRect(this.x, this.y, this.w, this.h);
    context.strokeStyle = "black";
    context.lineWidth = 3;
    context.strokeRect(this.x, this.y, this.w, this.h);
    context.closePath();
    context.beginPath();
    context.arc(
      this.x + this.w * 0.3,
      this.y + this.h * 0.3,
      this.w * 0.06,
      0,
      Math.PI * 2
    );
    context.arc(
      this.x + this.w * 0.7,
      this.y + this.h * 0.3,
      this.w * 0.06,
      0,
      Math.PI * 2
    );
    context.fillStyle = "black";
    context.fill();
    context.closePath();
    context.beginPath();
    context.moveTo(this.x + this.w * 0.5, this.y + this.h * 0.5);
    context.lineTo(this.x + this.w * 0.6, this.y + this.h * 0.7);
    context.lineTo(this.x + this.w * 0.4, this.y + this.h * 0.7);
    context.closePath();
    context.fillStyle = "orange";
    context.fill();
  }
}

function drawBoard() {
  context.beginPath();
  context.moveTo(boardX - 50, boardY);
  context.lineTo(boardX + 50, boardY);
  context.lineWidth = 8;
  context.strokeStyle = "#444";
  context.stroke();
  context.closePath();
}

function getBoardPositionForBird(bird) {
  let bx = boardX - bird.w / 2;
  let by = boardY - bird.h - 8;
  return { x: bx, y: by };
}

function startGame() {
  toggle.style.display = "none";
  canvas.style.display = "block";
  shotsLeft = 5;
  score = 0;
  gameActive = true;
  gameEnded = false;
  launchedBird = null;
  selectedBird = null;
  dragging = false;
  draggingTrajectory = false;
  launchedBlocksHit = 0;
  resetBirds();
  setupBlocks();
  drawAll();
}

function gameEnd() {
  gameActive = false;
  gameEnded = true;
  setTimeout(() => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.display = "none";
    toggle.textContent = "Play Again";
    toggle.style.display = "block";
  }, 2000);
}

function drawScoreAndShots() {
  context.save();
  context.font = "bold 24px Arial";
  context.fillStyle = "#222";
  context.textBaseline = "top";
  context.fillText(`Score: ${score}   Shots Left: ${shotsLeft}`, 24, 18);
  context.restore();
}

function drawTrajectoryLine() {
  if (draggingTrajectory && selectedBird !== null) {
    let b = birds[selectedBird];
    let bx = b.x + b.w / 2;
    let by = b.y + b.h / 2;
    context.save();
    context.strokeStyle = "#333";
    context.lineWidth = 2;
    context.setLineDash([6, 6]);
    context.beginPath();
    context.moveTo(bx, by);
    context.lineTo(tx, ty);
    context.stroke();
    context.setLineDash([]);
    context.restore();
  }
}

function drawAll() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "lightgreen";
  context.fillRect(0, 0, canvas.width, canvas.height);
  blocks.forEach((block) => block.draw(context));
  birds.forEach((b) => {
    let bird = new Bird(b.x, b.y, b.w, b.h, b.color);
    bird.draw(context);
  });
  drawBoard();
  if (launchedBird) {
    let bird = new Bird(
      launchedBird.x,
      launchedBird.y,
      launchedBird.w,
      launchedBird.h,
      launchedBird.color
    );
    bird.draw(context);
  }
  drawTrajectoryLine();
  drawScoreAndShots();
}

function getBirdMaxBlocks(bird) {
  if (bird.color === "red") return birdMaxBlocks.red;
  if (bird.color === "green") return birdMaxBlocks.green;
  if (bird.color === "blue") return birdMaxBlocks.blue;
  return 5;
}



canvas.addEventListener("click", function (e) {
  if (!gameActive || launchedBird || dragging) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  for (let i = 0; i < birds.length; i++) {
    let b = birds[i];
    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
      resetBirds();
      let pos = getBoardPositionForBird(b);
      birds[i].x = pos.x;
      birds[i].y = pos.y;
      selectedBird = i;
      drawAll();
      break;
    }
  }
});

canvas.addEventListener("mousedown", function (e) {
  if (!gameActive || launchedBird || selectedBird === null) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  let b = birds[selectedBird];
  if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
    dragging = true;
    draggingTrajectory = true;
    tx = 760;
    ty = boardY;
  }
});

canvas.addEventListener("mousemove", function (e) {
  if (!gameActive) return;
  if (dragging && selectedBird !== null && !launchedBird) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let b = birds[selectedBird];
    let bx = b.x + b.w / 2;
    let by = b.y + b.h / 2;
    let angle = Math.atan2(my - by, mx - bx);
    let dx = 760 - bx;
    let dy = Math.tan(angle) * dx;
    ty = Math.max(0, Math.min(by + dy, canvas.height));
    tx = 760;
    drawAll();
  }
});

canvas.addEventListener("mouseup", function (e) {
  if (!gameActive) return;
  if (dragging && selectedBird !== null && !launchedBird) {
    let b = birds[selectedBird];
    let bx = b.x + b.w / 2;
    let by = b.y + b.h / 2;
    let dx = (tx - bx) * b.speed;
    let dy = (ty - by) * b.speed;
    launchedBird = {
      x: b.x,
      y: b.y,
      w: b.w,
      h: b.h,
      color: b.color,
      vx: dx,
      vy: dy,
      damage: b.damage,
    };
    birds[selectedBird].x = b.x;
    birds[selectedBird].y = b.y;
    dragging = false;
    draggingTrajectory = false;
    drawAll();
    shotsLeft--;
    if (shotsLeft <= 0) {
      setTimeout(gameEnd, 800);
    }
  }
});



function update() {
  if (gameActive && launchedBird) {
    launchedBird.vy += gravity;
    launchedBird.x += launchedBird.vx;
    launchedBird.y += launchedBird.vy;
    for (let block of blocks) {
      if (
        block.alive &&
        launchedBird.x + launchedBird.w > block.x &&
        launchedBird.x < block.x + block.w &&
        launchedBird.y + launchedBird.h > block.y &&
        launchedBird.y < block.y + block.h
      ) {
        let prevHealth = block.health;
        block.health -= launchedBird.damage;
        if (block.health < 0) block.health = 0;
        if (block.health <= 0) block.alive = false;
        score += Math.min(prevHealth, launchedBird.damage);
        launchedBlocksHit++;
        if (launchedBlocksHit >= getBirdMaxBlocks(launchedBird)) {
          launchedBird = null;
          launchedBlocksHit = 0;
          break;
        }
      }
    }
    if (
      !launchedBird ||
      launchedBird.y > canvas.height ||
      launchedBird.x > canvas.width ||
      launchedBird.x < 0
    ) {
      launchedBird = null;
      launchedBlocksHit = 0;
    }
  }
  if (gameActive && blocks.every((b) => !b.alive) && shotsLeft > 0) {
    setupBlocks();
  }
  drawAll();
  requestAnimationFrame(update);
}

canvas.style.display = "none";
toggle.style.display = "block";
requestAnimationFrame(update);
