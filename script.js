let currentUser = localStorage.getItem('nickname');
const symbols = ["🍒","🍋","🍇","💎","7️⃣"];
const PAYOUTS_3 = {
    "🍒🍒🍒": 15,
    "💎💎💎": 20,
    "7️⃣7️⃣7️⃣": 25,
    "🍋🍋🍋": 10,
    "🍇🍇🍇": 12
};
const PAYOUTS_2 = {
    "firstSecond": 0.75, // 35% ставки
    "secondThird": 0.75,
    "firstThird": 0.5
};

const spinSound = document.getElementById('spin-sound');
const winSound = document.getElementById('win-sound');
const loseSound = document.getElementById('lose-sound');

const balanceElement = document.getElementById("balance");
const betInput = document.getElementById("bet-input");
const currentBetSpan = document.getElementById("current-bet");
const messageElement = document.getElementById("message");
const LOCAL_STORAGE_KEY = "neonStarCasinoBalance";
const INITIAL_BALANCE = 0;
let currentBalance = 0;

function playSound(audio) {
    audio.currentTime = 0;
    audio.play().catch(e => console.log("Ошибка воспроизведения звука:", e));
}

// === Баланс ===
function loadBalance() {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    currentBalance = stored ? parseFloat(stored) : INITIAL_BALANCE;
    updateBalanceDisplay();
}

function saveBalance() {
    localStorage.setItem(LOCAL_STORAGE_KEY, currentBalance.toFixed(0));
}

function updateBalanceDisplay() {
    balanceElement.textContent = currentBalance.toFixed(0);
}

// === Ставка ===
betInput.addEventListener("input", () => {
    let bet = parseInt(betInput.value);
    if (isNaN(bet) || bet < 1) bet = 1;
    else if (bet > 100) bet = 100;
    betInput.value = bet;
    currentBetSpan.textContent = bet;
});

// === Ленты и прокрутка ===
function createStripWithResult(finalSymbol, totalSymbols = 20) {
    let html = "";
    for (let i = 0; i < totalSymbols - 1; i++) {
        html += `<div class="symbol">${symbols[Math.floor(Math.random() * symbols.length)]}</div>`;
    }
    html += `<div class="symbol">${finalSymbol}</div>`;
    return html;
}

function spinReel(reel, finalSymbol, spinDuration = 1000) {
    return new Promise(resolve => {
        reel.innerHTML = `<div class="reel-strip">${createStripWithResult(finalSymbol)}</div>`;
        const strip = reel.querySelector(".reel-strip");
        const symbolHeight = 80;
        const symbolsCount = strip.children.length;
        const moveDistance = symbolHeight * (symbolsCount - 1);

        strip.style.transition = "none";
        strip.style.transform = "translateY(0)";

        setTimeout(() => {
            playSound(spinSound);
            strip.style.transition = `transform ${spinDuration}ms cubic-bezier(.32,.64,.45,1)`;
            strip.style.transform = `translateY(-${moveDistance}px)`;
        }, 20);

        setTimeout(() => resolve(finalSymbol), spinDuration + 20);
    });
}

// === Основной спин ===
document.getElementById("spin-button").addEventListener("click", async () => {
    const bet = parseInt(betInput.value);
    if (bet > currentBalance) {
        messageElement.textContent = "Недостаточно средств!";
        return;
    }

    currentBalance -= bet;
    updateBalanceDisplay();
    saveBalance();

    const spinButton = document.getElementById("spin-button");
    spinButton.disabled = true;

    const reels = [
        document.getElementById("reel-1"),
        document.getElementById("reel-2"),
        document.getElementById("reel-3")
    ];

    const finalResults = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
    ];

    const results = await Promise.all([
        spinReel(reels[0], finalResults[0], 1500),
        spinReel(reels[1], finalResults[1], 1700),
        spinReel(reels[2], finalResults[2], 1900)
    ]);

    let winAmount = 0;
    let message = "";

    // Три одинаковых символа
    if (results[0] === results[1] && results[1] === results[2]) {
        winAmount = bet * 30;
        message = `🎉 ДЖЕКПОТ! ${results.join('')} - ВЫИГРЫШ ${winAmount} 💰!`;
        playSound(winSound);
    }
    // Два одинаковых подряд (лево-середина или середина-право)
    else if (results[0] === results[1] || results[1] === results[2]) {
        winAmount = Math.floor(bet * 0.7); // 70% ставки
        message = `✨ Два подряд! ${results.join('')} - МАЛЫЙ ВЫИГРЫШ ${winAmount} 💰`;
        playSound(winSound);
    }
    // Два одинаковых на краях
    else if (results[0] === results[2]) {
        winAmount = Math.floor(bet * 0.5); // 50% ставки
        message = `💫 Два на краях! ${results.join('')} - МАЛЕНЬКИЙ ВЫИГРЫШ ${winAmount} 💰`;
        playSound(winSound);
    }
    // Нет совпадений
    else {
        message = `😢 Попробуйте ещё раз! ${results.join('')}`;
        playSound(loseSound);
    }

    currentBalance += winAmount;
    messageElement.textContent = message;
    updateBalanceDisplay();
    saveBalance();
    spinButton.disabled = false;
});

// === Инициализация ===
loadBalance();
currentBetSpan.textContent = betInput.value;

document.addEventListener('DOMContentLoaded', async () => {
    const nicknameDisplay = document.getElementById('nickname-display');
    const registerLink = document.getElementById('register-link');

    if (currentUser) {
        nicknameDisplay.textContent = `Вы вошли как: ${currentUser}`;
        registerLink.style.display = 'none';
        await loadBalance();
    } else {
        nicknameDisplay.textContent = 'Вы не зарегистрированы. Зарегистрируйтесь:';
        registerLink.style.display = 'inline-block';
        currentBalance = INITIAL_BALANCE;
        updateBalanceDisplay();
    }
});