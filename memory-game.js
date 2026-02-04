// ゲーム状態
let difficulty = 'easy';
let cards = [];
let flippedCards = [];
let matchedPairs = [];
let playerScore = 0;
let computerScore = 0;
let currentPlayer = 'player'; // 'player' or 'computer'
let isProcessing = false;
let computerMemory = []; // コンピュータの記憶

// カードの種類
const suits = ['♠', '♥', '♦', '♣'];
const suitNames = ['spades', 'hearts', 'diamonds', 'clubs'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// ゲーム開始
function startGame(selectedDifficulty) {
    console.log('startGame called with difficulty:', selectedDifficulty);
    difficulty = selectedDifficulty;
    initializeGame();
    document.getElementById('difficultyScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    console.log('Game started successfully');
}

// ゲーム初期化
function initializeGame() {
    console.log('Initializing game...');
    cards = [];
    flippedCards = [];
    matchedPairs = [];
    playerScore = 0;
    computerScore = 0;
    currentPlayer = 'player';
    isProcessing = false;
    computerMemory = [];
    
    // カードデッキを作成（各カード2枚ずつ）
    suits.forEach((suit, suitIndex) => {
        values.forEach(value => {
            for (let i = 0; i < 2; i++) {
                cards.push({
                    suit: suit,
                    suitName: suitNames[suitIndex],
                    value: value,
                    id: `${suit}-${value}-${i}`
                });
            }
        });
    });
    
    console.log('Total cards created:', cards.length);
    
    // シャッフル
    cards = shuffleArray(cards);
    
    // カードボードを作成
    renderCards();
    updateScore();
    updateTurn();
    console.log('Game initialized successfully');
}

// カードをシャッフル
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// カードをレンダリング
function renderCards() {
    const boardElement = document.getElementById('cardBoard');
    boardElement.innerHTML = '';
    
    cards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${card.suitName}`;
        cardElement.dataset.index = index;
        cardElement.onclick = () => flipCard(index);
        
        cardElement.innerHTML = `
            <div class="card-back">?</div>
            <div class="card-face">
                <div class="card-value">${card.value}</div>
                <div class="card-suit">${card.suit}</div>
            </div>
        `;
        
        boardElement.appendChild(cardElement);
    });
}

// カードをめくる
function flipCard(index) {
    if (isProcessing || currentPlayer !== 'player') return;
    
    const cardElement = document.querySelectorAll('.card')[index];
    if (cardElement.classList.contains('flipped') || cardElement.classList.contains('matched')) {
        return;
    }
    
    cardElement.classList.add('flipped');
    flippedCards.push(index);
    
    if (flippedCards.length === 2) {
        isProcessing = true;
        checkMatch();
    }
}

// マッチをチェック
function checkMatch() {
    const [index1, index2] = flippedCards;
    const card1 = cards[index1];
    const card2 = cards[index2];
    
    setTimeout(() => {
        if (card1.suit === card2.suit && card1.value === card2.value && card1.id !== card2.id) {
            // マッチ！
            const cardElements = document.querySelectorAll('.card');
            cardElements[index1].classList.add('matched');
            cardElements[index2].classList.add('matched');
            matchedPairs.push([index1, index2]);
            
            if (currentPlayer === 'player') {
                playerScore++;
            } else {
                computerScore++;
            }
            
            updateScore();
            flippedCards = [];
            isProcessing = false;
            
            // ゲーム終了チェック
            if (matchedPairs.length === 26) {
                endGame();
                return;
            }
            
            // 同じプレイヤーが続行
            if (currentPlayer === 'computer') {
                setTimeout(() => computerTurn(), 1000);
            }
        } else {
            // マッチしない
            const cardElements = document.querySelectorAll('.card');
            
            // コンピュータの記憶に追加
            if (currentPlayer === 'player') {
                computerMemory.push({ index: index1, card: card1 });
                computerMemory.push({ index: index2, card: card2 });
            }
            
            setTimeout(() => {
                cardElements[index1].classList.remove('flipped');
                cardElements[index2].classList.remove('flipped');
                flippedCards = [];
                isProcessing = false;
                
                // ターン交代
                currentPlayer = currentPlayer === 'player' ? 'computer' : 'player';
                updateTurn();
                
                if (currentPlayer === 'computer') {
                    setTimeout(() => computerTurn(), 1000);
                }
            }, 1500);
        }
    }, 1000);
}

// コンピュータのターン
function computerTurn() {
    if (matchedPairs.length === 26) return;
    
    let firstCard = null;
    let secondCard = null;
    
    if (difficulty === 'hard') {
        // 上級: 完全記憶
        const pair = findPairInMemory();
        if (pair) {
            firstCard = pair[0];
            secondCard = pair[1];
        }
    } else if (difficulty === 'normal') {
        // 中級: 最近の記憶から探す（最新10ターン分）
        const recentMemory = computerMemory.slice(-20);
        const pair = findPairInMemory(recentMemory);
        if (pair) {
            firstCard = pair[0];
            secondCard = pair[1];
        }
    }
    
    // ペアが見つからない場合はランダム
    if (!firstCard || !secondCard) {
        const availableCards = cards
            .map((card, index) => index)
            .filter(index => {
                const cardElement = document.querySelectorAll('.card')[index];
                return !cardElement.classList.contains('matched') && 
                       !cardElement.classList.contains('flipped');
            });
        
        firstCard = availableCards[Math.floor(Math.random() * availableCards.length)];
        
        const remainingCards = availableCards.filter(i => i !== firstCard);
        secondCard = remainingCards[Math.floor(Math.random() * remainingCards.length)];
    }
    
    // 1枚目をめくる
    const cardElements = document.querySelectorAll('.card');
    cardElements[firstCard].classList.add('flipped');
    flippedCards.push(firstCard);
    
    // 2枚目をめくる
    setTimeout(() => {
        cardElements[secondCard].classList.add('flipped');
        flippedCards.push(secondCard);
        isProcessing = true;
        checkMatch();
    }, 800);
}

// 記憶からペアを探す
function findPairInMemory(memory = computerMemory) {
    const cardElements = document.querySelectorAll('.card');
    
    for (let i = 0; i < memory.length; i++) {
        for (let j = i + 1; j < memory.length; j++) {
            const mem1 = memory[i];
            const mem2 = memory[j];
            
            if (mem1.card.suit === mem2.card.suit && 
                mem1.card.value === mem2.card.value &&
                !cardElements[mem1.index].classList.contains('matched') &&
                !cardElements[mem2.index].classList.contains('matched')) {
                return [mem1.index, mem2.index];
            }
        }
    }
    return null;
}

// スコアを更新
function updateScore() {
    document.getElementById('playerScore').textContent = playerScore;
    document.getElementById('computerScore').textContent = computerScore;
    document.getElementById('remainingPairs').textContent = 26 - matchedPairs.length;
}

// ターン表示を更新
function updateTurn() {
    const playerTurn = document.getElementById('playerTurn');
    const computerTurn = document.getElementById('computerTurn');
    const turnMessage = document.getElementById('turnMessage');
    
    if (currentPlayer === 'player') {
        playerTurn.classList.add('active');
        computerTurn.classList.remove('active');
        turnMessage.textContent = 'あなたのターン';
    } else {
        playerTurn.classList.remove('active');
        computerTurn.classList.add('active');
        turnMessage.textContent = 'コンピュータのターン';
    }
}

// ゲーム終了
function endGame() {
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('resultScreen').style.display = 'flex';
    
    document.getElementById('finalPlayerScore').textContent = playerScore;
    document.getElementById('finalComputerScore').textContent = computerScore;
    
    const resultTitle = document.getElementById('resultTitle');
    if (playerScore > computerScore) {
        resultTitle.textContent = '🎉 あなたの勝ち！';
        resultTitle.style.color = '#4caf50';
    } else if (playerScore < computerScore) {
        resultTitle.textContent = '😢 コンピュータの勝ち';
        resultTitle.style.color = '#f44336';
    } else {
        resultTitle.textContent = '🤝 引き分け';
        resultTitle.style.color = '#ff9800';
    }
}

// ゲームをリセット
function resetGame() {
    initializeGame();
}

// 再戦
function restartGame() {
    document.getElementById('resultScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    initializeGame();
}

// メニューに戻る
function backToMenu() {
    document.getElementById('resultScreen').style.display = 'none';
    document.getElementById('difficultyScreen').style.display = 'flex';
}

// スクリプト読み込み完了確認
console.log('memory-game.js loaded successfully');
console.log('startGame function:', typeof startGame);

// DOMが読み込まれた後に初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    console.log('Difficulty screen element:', document.getElementById('difficultyScreen'));
});
