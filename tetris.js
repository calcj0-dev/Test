const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

const COLS = 12;
const ROWS = 20;
const BLOCK_SIZE = 20;

// テトロミノの形状
const SHAPES = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[1, 1, 1], [0, 1, 0]], // T
    [[1, 1, 1], [1, 0, 0]], // L
    [[1, 1, 1], [0, 0, 1]], // J
    [[1, 1, 0], [0, 1, 1]], // S
    [[0, 1, 1], [1, 1, 0]]  // Z
];

// 色
const COLORS = [
    '#00f0f0', // I - シアン
    '#f0f000', // O - 黄色
    '#a000f0', // T - 紫
    '#f0a000', // L - オレンジ
    '#0000f0', // J - 青
    '#00f000', // S - 緑
    '#f00000'  // Z - 赤
];

let board = [];
let currentPiece = null;
let currentX = 0;
let currentY = 0;
let score = 0;
let level = 1;
let lines = 0;
let gameLoop = null;
let isPaused = false;
let gameStarted = false;

// ボードの初期化
function initBoard() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

// 新しいピースを生成
function newPiece() {
    const shapeIndex = Math.floor(Math.random() * SHAPES.length);
    currentPiece = {
        shape: SHAPES[shapeIndex],
        color: COLORS[shapeIndex]
    };
    currentX = Math.floor(COLS / 2) - Math.floor(currentPiece.shape[0].length / 2);
    currentY = 0;
    
    if (collision()) {
        gameOver();
    }
}

// 衝突判定
function collision() {
    for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x]) {
                const newX = currentX + x;
                const newY = currentY + y;
                
                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return true;
                }
                
                if (newY >= 0 && board[newY][newX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

// ピースを固定
function mergePiece() {
    for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x]) {
                const newY = currentY + y;
                const newX = currentX + x;
                if (newY >= 0) {
                    board[newY][newX] = currentPiece.color;
                }
            }
        }
    }
}

// ラインを消す
function clearLines() {
    let linesCleared = 0;
    
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            y++; // 同じ行を再チェック
        }
    }
    
    if (linesCleared > 0) {
        lines += linesCleared;
        score += linesCleared * 100 * level;
        level = Math.floor(lines / 10) + 1;
        updateStats();
    }
}

// 統計情報を更新
function updateStats() {
    scoreElement.textContent = score;
    levelElement.textContent = level;
    linesElement.textContent = lines;
}

// ピースを回転
function rotate() {
    const newShape = currentPiece.shape[0].map((_, i) =>
        currentPiece.shape.map(row => row[i]).reverse()
    );
    
    const previousShape = currentPiece.shape;
    currentPiece.shape = newShape;
    
    if (collision()) {
        currentPiece.shape = previousShape;
    }
}

// ピースを移動
function move(dir) {
    currentX += dir;
    if (collision()) {
        currentX -= dir;
    }
}

// ピースを下に移動
function drop() {
    currentY++;
    if (collision()) {
        currentY--;
        mergePiece();
        clearLines();
        newPiece();
    }
}

// 一気に落下
function hardDrop() {
    while (!collision()) {
        currentY++;
    }
    currentY--;
    mergePiece();
    clearLines();
    newPiece();
}

// 描画
function draw() {
    // 背景をクリア
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // ボードを描画
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                ctx.fillStyle = board[y][x];
                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
            }
        }
    }
    
    // 現在のピースを描画
    if (currentPiece) {
        ctx.fillStyle = currentPiece.color;
        for (let y = 0; y < currentPiece.shape.length; y++) {
            for (let x = 0; x < currentPiece.shape[y].length; x++) {
                if (currentPiece.shape[y][x]) {
                    ctx.fillRect(
                        (currentX + x) * BLOCK_SIZE,
                        (currentY + y) * BLOCK_SIZE,
                        BLOCK_SIZE - 1,
                        BLOCK_SIZE - 1
                    );
                }
            }
        }
    }
    
    // グリッド線を描画
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i * BLOCK_SIZE, 0);
        ctx.lineTo(i * BLOCK_SIZE, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i <= ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * BLOCK_SIZE);
        ctx.lineTo(canvas.width, i * BLOCK_SIZE);
        ctx.stroke();
    }
}

// ゲームループ
function update() {
    if (!isPaused) {
        drop();
        draw();
    }
}

// ゲーム開始
function startGame() {
    initBoard();
    score = 0;
    level = 1;
    lines = 0;
    isPaused = false;
    gameStarted = true;
    updateStats();
    newPiece();
    
    startBtn.style.display = 'none';
    restartBtn.style.display = 'inline-block';
    
    if (gameLoop) {
        clearInterval(gameLoop);
    }
    
    gameLoop = setInterval(update, 1000 / level);
    draw();
}

// ゲームオーバー
function gameOver() {
    clearInterval(gameLoop);
    gameStarted = false;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 20);
}

// キーボード操作
document.addEventListener('keydown', (e) => {
    if (!gameStarted || isPaused) {
        if (e.key === 'p' || e.key === 'P') {
            isPaused = !isPaused;
        }
        return;
    }
    
    switch(e.key) {
        case 'ArrowLeft':
            move(-1);
            draw();
            break;
        case 'ArrowRight':
            move(1);
            draw();
            break;
        case 'ArrowDown':
            drop();
            draw();
            break;
        case 'ArrowUp':
            rotate();
            draw();
            break;
        case ' ':
            hardDrop();
            draw();
            e.preventDefault();
            break;
        case 'p':
        case 'P':
            isPaused = !isPaused;
            break;
    }
});

// ボタンイベント
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// レベルに応じてスピードを調整
setInterval(() => {
    if (gameStarted && gameLoop) {
        clearInterval(gameLoop);
        gameLoop = setInterval(update, Math.max(100, 1000 - (level - 1) * 100));
    }
}, 100);

// 初期描画
initBoard();
draw();
