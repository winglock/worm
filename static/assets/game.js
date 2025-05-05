// 캔버스, 컨텍스트, 그리고 게임 컨테이너 요소 초기화 
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const gameContainer = document.getElementById("game-container");

// 게임 설정
const WIDTH = 640;
const HEIGHT = 480;
const CELL_SIZE = 20;
const ROWS = HEIGHT / CELL_SIZE;
const COLS = WIDTH / CELL_SIZE;

// 색상 정의
const BLACK = "#000000";
const GREEN = "#00ff00";
const RED = "#ff0000";
const GRAY = "#282828";

// Global state log list
let stateLog = [];

// 게임 상태 변수
let snake = [{ x: Math.floor(COLS / 2) * CELL_SIZE, y: Math.floor(ROWS / 2) * CELL_SIZE }];
let direction = { x: CELL_SIZE, y: 0 }; // 초기 오른쪽 이동
let food = randomFood();
let score = 0;
let frameCounter = 0;
let running = true;
let gameInterval = null;

// 해시 계산 (더미 구현)
function calculateMerkleHash(frameData) {
  const jsonString = JSON.stringify(frameData, Object.keys(frameData).sort());
  let hash = 0;
  for (let i = 0; i < jsonString.length; i++) {
    hash = ((hash << 5) - hash) + jsonString.charCodeAt(i);
    hash |= 0;
  }
  return "hash_" + Math.abs(hash);
}

// 랜덤 먹이 생성
function randomFood() {
  const x = Math.floor(Math.random() * COLS) * CELL_SIZE;
  const y = Math.floor(Math.random() * ROWS) * CELL_SIZE;
  return { x, y };
}

// 격자 그리기 함수
function drawGrid() {
  ctx.strokeStyle = GRAY;
  ctx.lineWidth = 1;
  for (let x = 0; x <= WIDTH; x += CELL_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= HEIGHT; y += CELL_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
}

// 게임 상태 로깅
function logGameState(newHead) {
  let dx, dz;
  if (snake.length > 1) {
    dx = snake[0].x - snake[1].x;
    dz = snake[0].y - snake[1].y;
  } else {
    dx = direction.x;
    dz = direction.y;
  }
  const state = {
    frame_number: frameCounter,
    head: { x: newHead.x, y: newHead.y },
    direction: { dx: dx / CELL_SIZE, dy: dz / CELL_SIZE },
    snake_length: snake.length,
    food_position: { x: food.x, y: food.y },
    valid_movement: true
  };
  state.timestamp = new Date().toISOString();
  state.hash_chain = calculateMerkleHash(state);
  stateLog.push(state);
}

// 게임 업데이트
function update() {
  const newHead = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  // 벽 또는 자기 자신과의 충돌 검사
  if (
    newHead.x < 0 || newHead.x >= WIDTH ||
    newHead.y < 0 || newHead.y >= HEIGHT ||
    snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
  ) {
    return endGame();
  }

  snake.unshift(newHead);

  // 먹이 섭취 검사
  if (newHead.x === food.x && newHead.y === food.y) {
    score += 1;
    food = randomFood();
  } else {
    snake.pop();
  }

  logGameState(newHead);
  frameCounter++;
}

// 화면 그리기
function draw() {
  // 캔버스 초기화
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // 격자 그리기
  drawGrid();

  // 먹이 그리기
  ctx.fillStyle = RED;
  ctx.fillRect(food.x, food.y, CELL_SIZE, CELL_SIZE);

  // 뱀 그리기
  snake.forEach((segment, index) => {
    ctx.fillStyle = (index === 0) ? "#ff00ff" : "#d966ff";
    ctx.fillRect(segment.x, segment.y, CELL_SIZE, CELL_SIZE);
  });

  // 점수 및 뱀 길이 표시
  ctx.fillStyle = "#ffffff";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);
  ctx.fillText(`Length: ${snake.length}`, 10, 60);
}

// 로그 패널 업데이트
function updateLogPanel() {
  const logElement = document.getElementById("game-log");
  // 최근 5개 로그 항목 추출
  const logsToShow = stateLog.slice(-5);
  let html = "";
  logsToShow.forEach(log => {
    html += `<pre>${JSON.stringify(log, null, 2)}</pre><hr>`;
  });
  logElement.innerHTML = html;
}

// 게임 루프
function gameLoop() {
  if (!running) return;
  update();
  draw();
  updateLogPanel();
}

// 게임 종료 처리 (게임 보드 내부에 오버레이 표시)
function endGame() {
  running = false;
  clearInterval(gameInterval);

  const finalLog = {
    metadata: {
      game_version: "1.2.0",
      timestamp: new Date().toISOString(),
      finalScore: score
    },
    frames: stateLog
  };
  console.log("Game Log:", finalLog);

  // 게임 보드 내부(#game-container)에 오버레이 생성
  const overlay = document.createElement("div");
  overlay.id = "game-over-overlay";
  overlay.style.position = "absolute";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  // 배경을 asset.gif로 변경
  overlay.style.backgroundImage = 'url("/static/assets/asset.gif")';
  overlay.style.backgroundSize = "cover";
  overlay.style.backgroundRepeat = "no-repeat";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.fontFamily = "Arial, sans-serif";
  overlay.innerHTML = `
    <h1 style="font-size: 48px; margin-bottom: 20px; color: black;">Game Over!</h1>
    <p style="font-size: 24px; color: black;">Score: ${score}</p>
    <button id="play-again-btn" style="padding: 10px 20px; font-size: 20px; margin-top: 30px; cursor: pointer; border: none; border-radius: 8px; background-color: #ff00ff; color: black;">Play Again</button>
  `;
  gameContainer.appendChild(overlay);

  document.getElementById("play-again-btn").addEventListener("click", () => {
    // 제거된 오버레이 없애고 게임 상태 리셋 후 바로 다시 시작
    gameContainer.removeChild(overlay);
    // 초기 상태 재설정
    snake = [{ x: Math.floor(COLS / 2) * CELL_SIZE, y: Math.floor(ROWS / 2) * CELL_SIZE }];
    direction = { x: CELL_SIZE, y: 0 };
    food = randomFood();
    score = 0;
    frameCounter = 0;
    stateLog = [];
    running = true;
    gameInterval = setInterval(gameLoop, 100);
  });
}

// 키보드 컨트롤 (방향 전환 및 스크롤 방지)
document.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
    event.preventDefault();
  }
  
  switch (event.key) {
    case "ArrowUp":
      if (direction.y !== CELL_SIZE) direction = { x: 0, y: -CELL_SIZE };
      break;
    case "ArrowDown":
      if (direction.y !== -CELL_SIZE) direction = { x: 0, y: CELL_SIZE };
      break;
    case "ArrowLeft":
      if (direction.x !== CELL_SIZE) direction = { x: -CELL_SIZE, y: 0 };
      break;
    case "ArrowRight":
      if (direction.x !== -CELL_SIZE) direction = { x: CELL_SIZE, y: 0 };
      break;
  }
});

// 게임 초기화 및 시작 (Start 버튼 누른 후 시작)
function init() {
  const startButton = document.getElementById("start-btn");
  startButton.addEventListener("click", () => {
    // 버튼을 숨김 처리
    startButton.style.display = "none";
    // 게임 루프 시작
    gameInterval = setInterval(gameLoop, 100);
  });
}

window.onload = init;

function updateLogPanel() {
    const logElement = document.getElementById("json-log");
    // 최근 5개 로그 항목 추출
    const logsToShow = stateLog.slice(-5);
    let html = "";
    logsToShow.forEach(log => {
      html += `<pre>${JSON.stringify(log, null, 2)}</pre><hr>`;
    });
    logElement.innerHTML = html;
  }