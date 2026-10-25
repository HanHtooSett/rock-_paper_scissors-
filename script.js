const WINNING_SCORE = 5;
const SHAKE_MS = 900;        // 3 pumps of 300ms, must match the CSS "pump" animation
const NEXT_ROUND_MS = 1600;  // pause after a reveal before the next round starts

// Thinking time per round, in milliseconds
const LEVELS = {
    easy: 5000,
    medium: 3000,
    hard: 1500,
};

const CHOICES = {
    rock: { icon: "✊", beats: "scissors" },
    paper: { icon: "✋", beats: "rock" },
    scissors: { icon: "✌️", beats: "paper" },
};

const KEYS = { r: "rock", p: "paper", s: "scissors" };

const choiceButtons = document.querySelectorAll(".choice");
const levelButtons = document.querySelectorAll(".level");
const startButton = document.getElementById("startButton");
const themeToggle = document.getElementById("themeToggle");
const humanScoreElement = document.getElementById("humanScoreElement");
const computerScoreElement = document.getElementById("computerScoreElement");
const roundElement = document.getElementById("roundElement");
const resultArea = document.getElementById("resultArea");
const timerBar = document.getElementById("timerBar");
const timerText = document.getElementById("timerText");
const humanHand = document.getElementById("humanHand");
const computerHand = document.getElementById("computerHand");

let humanScore = 0, computerScore = 0, round = 0;
let level = "medium";
let phase = "idle"; // idle | thinking | revealing | over
let roundEndsAt = 0;
let timerId = null;
let pendingTimeouts = [];

/* ---------- helpers ---------- */

function later(fn, ms) {
    pendingTimeouts.push(setTimeout(fn, ms));
}

function clearPending() {
    clearInterval(timerId);
    pendingTimeouts.forEach(clearTimeout);
    pendingTimeouts = [];
}

function capitalize(word) {
    return word[0].toUpperCase() + word.slice(1);
}

function getComputerChoice() {
    const names = Object.keys(CHOICES);
    return names[Math.floor(Math.random() * names.length)];
}

function getOutcome(humanChoice, computerChoice) {
    if (humanChoice === null) return "timeout";
    if (humanChoice === computerChoice) return "draw";
    return CHOICES[humanChoice].beats === computerChoice ? "win" : "lose";
}

function describe(outcome, humanChoice, computerChoice) {
    switch (outcome) {
        case "win":
            return `You win! ${capitalize(humanChoice)} beats ${computerChoice}.`;
        case "lose":
            return `You lose. ${capitalize(computerChoice)} beats ${humanChoice}.`;
        case "draw":
            return `Draw. You both picked ${humanChoice}.`;
        default:
            return "⏰ Too slow! The computer takes the point.";
    }
}

/* ---------- UI updates ---------- */

function announce(message, tone = "") {
    resultArea.textContent = message;
    resultArea.className = tone;
}

function updateScoreboard() {
    humanScoreElement.textContent = humanScore;
    computerScoreElement.textContent = computerScore;
    roundElement.textContent = `Round ${round}`;
}

function setHand(hand, choice) {
    hand.querySelector(".glyph").textContent = CHOICES[choice].icon;
}

// Swap the hands' animation class, restarting it even if it's the same one
function animateHands(className) {
    [humanHand, computerHand].forEach((hand) => {
        hand.classList.remove("idle", "shake", "pop");
        void hand.offsetWidth;
        if (className) hand.classList.add(className);
    });
}

function setChoicesEnabled(enabled) {
    choiceButtons.forEach((button) => {
        button.disabled = !enabled;
        button.classList.remove("picked");
    });
}

function resetTimerDisplay() {
    timerBar.style.width = "100%";
    timerBar.classList.remove("urgent");
    timerText.textContent = "--";
}

function setPlaying(playing) {
    levelButtons.forEach((button) => (button.disabled = playing));
    startButton.textContent = playing ? "■ Stop" : "▶ Start";
}

/* ---------- game flow ---------- */

function startGame() {
    clearPending();
    humanScore = 0;
    computerScore = 0;
    round = 0;
    setPlaying(true);
    startRound();
}

function stopGame() {
    clearPending();
    phase = "idle";
    setChoicesEnabled(false);
    setPlaying(false);
    resetTimerDisplay();
    humanHand.classList.remove("timedOut");
    setHand(humanHand, "rock");
    setHand(computerHand, "rock");
    animateHands("idle");
    announce("Game stopped. Pick a difficulty and press Start.");
}

function startRound() {
    round++;
    phase = "thinking";
    updateScoreboard();

    humanHand.classList.remove("timedOut");
    setHand(humanHand, "rock");
    setHand(computerHand, "rock");
    animateHands("idle");

    setChoicesEnabled(true);
    announce("Choose your move!");

    roundEndsAt = performance.now() + LEVELS[level];
    timerId = setInterval(tick, 50);
    tick();
}

function tick() {
    const remaining = Math.max(0, roundEndsAt - performance.now());
    const fraction = remaining / LEVELS[level];

    timerBar.style.width = `${fraction * 100}%`;
    timerBar.classList.toggle("urgent", fraction < 0.35);
    timerText.textContent = `${(remaining / 1000).toFixed(1)}s`;

    if (remaining === 0) resolveRound(null);
}

// humanChoice is null when the timer ran out
function resolveRound(humanChoice) {
    if (phase !== "thinking") return;
    phase = "revealing";
    clearInterval(timerId);

    setChoicesEnabled(false);
    if (humanChoice) {
        document.querySelector(`[data-choice="${humanChoice}"]`).classList.add("picked");
    }

    const computerChoice = getComputerChoice();
    announce("Rock… Paper… Scissors…");
    animateHands("shake");
    later(() => reveal(humanChoice, computerChoice), SHAKE_MS);
}

function reveal(humanChoice, computerChoice) {
    setHand(computerHand, computerChoice);
    if (humanChoice) {
        setHand(humanHand, humanChoice);
    } else {
        humanHand.classList.add("timedOut");
    }
    animateHands("pop");

    const outcome = getOutcome(humanChoice, computerChoice);
    if (outcome === "win") humanScore++;
    if (outcome === "lose" || outcome === "timeout") computerScore++;
    updateScoreboard();
    announce(describe(outcome, humanChoice, computerChoice), outcome);

    if (humanScore >= WINNING_SCORE || computerScore >= WINNING_SCORE) {
        later(endGame, NEXT_ROUND_MS);
    } else {
        later(startRound, NEXT_ROUND_MS);
    }
}

function endGame() {
    phase = "over";
    resetTimerDisplay();
    setPlaying(false);
    startButton.textContent = "↻ Play again";

    if (humanScore > computerScore) {
        announce(`🏆 You won the game ${humanScore}–${computerScore}!`, "win");
    } else {
        announce(`💻 Computer wins ${computerScore}–${humanScore}. Try again!`, "lose");
    }
}

/* ---------- difficulty ---------- */

function setLevel(newLevel) {
    level = newLevel;
    levelButtons.forEach((button) => {
        button.setAttribute("aria-pressed", button.dataset.level === level);
    });
}

/* ---------- day / night ---------- */

function loadTheme() {
    try {
        const saved = localStorage.getItem("rps-theme");
        if (saved) return saved;
    } catch {}
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const night = theme === "dark";
    themeToggle.textContent = night ? "☀️" : "🌙";
    themeToggle.setAttribute("aria-label", night ? "Switch to day mode" : "Switch to night mode");
    try {
        localStorage.setItem("rps-theme", theme);
    } catch {}
}

/* ---------- events ---------- */

choiceButtons.forEach((button) => {
    button.addEventListener("click", () => resolveRound(button.dataset.choice));
});

levelButtons.forEach((button) => {
    button.addEventListener("click", () => setLevel(button.dataset.level));
});

startButton.addEventListener("click", () => {
    if (phase === "thinking" || phase === "revealing") {
        stopGame();
    } else {
        startGame();
    }
});

themeToggle.addEventListener("click", () => {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});

document.addEventListener("keydown", (e) => {
    const choice = KEYS[e.key.toLowerCase()];
    if (choice && phase === "thinking") resolveRound(choice);
});

applyTheme(loadTheme());
