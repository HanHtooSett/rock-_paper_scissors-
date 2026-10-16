console.log("Hello World");

function getComputerChoice() {
    randomNumber = Math.floor(Math.random() * 3);
    switch (randomNumber) {
        case 0:
            return "rock";
        case 1:
            return "paper";
        default:
            return "scissors";
    };
};

function getHumanChoice() {
    humanChoice = prompt("Choose Rock Paper Scissors","rock");
    return humanChoice;
};

function playRound (humanChoice, computerChoice ) {
    computerChoice = computerChoice.toLowerCase();
    humanChoice = humanChoice.toLowerCase();

    if (humanChoice === "rock") {
        if (computerChoice === "paper") {
            ++computerScore;
            return "You lose. Paper beats rock";
        } else if (computerChoice === "scissors") {
            ++humanScore;
            return "You win. Rock beats scissors";
        } else if (computerChoice === "rock") {
            return "Fair. Both pick rock";
        } else {
            return "Error";
        }

    } else if (humanChoice === "paper") {
        if (computerChoice === "rock") {
            ++humanScore;
            return "You win. Paper beats rock";
        } else if (computerChoice === "scissors") {
            ++computerScore;
            return "You lose. Scissors beats paper";
        } else if (computerChoice === "paper") {
            return "Fair. Both pick paper";
        } else {
            return "Error";
        }

    } else  if (humanChoice === "scissors") {
        if (computerChoice === "paper") {
            ++humanScore;
            return "You win. Scissors beats paper";
        } else if (computerChoice === "rock") {
            ++computerScore;
            return "You lose. Rock beats scissors";
        } else if (computerChoice === "scissors") {
            return "Fair. Both pick scissors";
        } else {
            return "Error";
        }
    }
}

function playGame() {
    for (let i = 0; i < 5; i++) {
        console.log(playRound(getHumanChoice(), getComputerChoice()))
        console.log(`Computer ${computerScore} : Human ${humanScore}`)
    }

    if (humanScore > computerScore) {
        console.log("The winnder is the human")
    } else if (humanScore < computerScore) {
        console.log("The winner is the computer")
    } else {
        console.log("Fair Game")
    };
}

let humanScore = 0, computerScore = 0;
playGame();

