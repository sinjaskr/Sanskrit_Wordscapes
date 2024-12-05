let currentScore = 10;
let currentLevel = 1;
let wordsData = {};
let currentCategory = '';
let selectedWord = '';
let formedWords = new Set();
let time;
let timeLeft = 60;
let gameStarted = false;

const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const wordBoard = document.getElementById('word-board');
const letterTiles = document.getElementById('letter-tiles');
const nextLevelButton = document.getElementById('next-level');
const wordsList = document.getElementById('words-list'); 
const timerElement = document.getElementById('timer');

fetch('word.json')
  .then(response => response.json())
  .then(data => {
    wordsData = data;
    loadLevel(currentLevel);
  })
  .catch(error => console.error('Error loading word data:', error));

function loadLevel(level) {
    if (!gameStarted) return;

    if (timer) clearInterval(timer); 
    timeLeft = 60; 
    startTimer();

    const categories = Object.keys(wordsData);
    if (level > categories.length) {
        level = categories.length;  
    }
    currentCategory = categories[level - 1];
    const categoryData = wordsData[currentCategory];

    generateTiles(categoryData);
    generateWordGrid(categoryData); 
    checkLevelCompletion(categoryData);
}

function generateTiles(categoryData) {
    letterTiles.innerHTML = ''; 

    const tiles = new Set();
    categoryData.forEach(item => {
        item.letters.forEach(letter => {
            tiles.add(letter);
        });
    });

    const shuffledTiles = shuffleArray(Array.from(tiles));

    shuffledTiles.forEach(letter => {
        const letterElement = document.createElement('div');
        letterElement.classList.add('letter');
        letterElement.innerText = letter;
        letterElement.addEventListener('click', () => selectLetter(letterElement));
        letterTiles.appendChild(letterElement);
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; 
    }
    return array;
}

function selectLetter(letterElement) {
    letterElement.classList.add('active');
    selectedWord += letterElement.innerText;
    wordBoard.innerText = selectedWord;

    if (isValidWord(selectedWord)) {
        if (!formedWords.has(selectedWord)) {
            currentScore += 10; 
            timeLeft += 5; 
            scoreElement.innerText = currentScore;  
            updateScoreboard();  

            addWordToList(selectedWord);
            formedWords.add(selectedWord);  
            selectedWord = ''; 
            wordBoard.innerText = '';
            resetTileStates();

            playFeedbackSound(true);

            checkLevelCompletion(wordsData[currentCategory]);
        } else {
            selectedWord = ''; 
            wordBoard.innerText = '';
            resetTileStates();

            playFeedbackSound(false);
        }
    }
}


function isValidWord(word) {
    return wordsData[currentCategory].some(item => item.name === word);
}

function addWordToList(word) {

    updateWordGrid(word);
}

function resetTileStates() {
    const letters = document.querySelectorAll('.letter');
    letters.forEach(letter => {
        letter.classList.remove('active');
    });
}

const clearWordButton = document.getElementById('clear-word'); 

clearWordButton.addEventListener('click', () => {
    selectedWord = selectedWord.slice(0, -1); 
    wordBoard.innerText = selectedWord; 
    resetTileStates(); 
});

function generateWordGrid(categoryData) {
    const wordGrid = document.getElementById('word-grid');
    wordGrid.innerHTML = ''; 

    categoryData.forEach(item => {
        const wordElement = document.createElement('div');
        wordElement.classList.add('word');
        wordElement.dataset.word = item.letters.join(''); 

        const wordLength = item.letters.length;

        for (let i = 0; i < wordLength; i++) {
            const letterPlaceholder = document.createElement('span');
            letterPlaceholder.classList.add('placeholder');
            letterPlaceholder.setAttribute('data-index', i);
            wordElement.appendChild(letterPlaceholder);
        }

        wordElement.addEventListener('click', () => {
            displayWordImageOnGrid(item.image, wordElement);
        });

        wordGrid.appendChild(wordElement);
    });
}

function updateWordGrid(word) {
    const wordGrid = document.getElementById('word-grid');
    const wordElements = wordGrid.getElementsByClassName('word');

    for (let wordElement of wordElements) {
        const wordName = wordElement.dataset.word; 
        if (wordName === word) {
            const placeholders = wordElement.querySelectorAll('.placeholder');

            const segmenter = new Intl.Segmenter('hi', { granularity: 'grapheme' });
            const letters = Array.from(segmenter.segment(word)).map(segment => segment.segment);

            for (let i = 0; i < letters.length; i++) {
                if (placeholders[i]) {
                    placeholders[i].innerText = letters[i];  
                }
            }
            break;
        }
    }
}

function addFormedWord(word) {
    updateWordGrid(word);

    const listItem = document.createElement('li');
    listItem.innerText = word;
    wordsList.appendChild(listItem);
}

function displayWordImageOnGrid(imageUrl, wordElement) {
    const word = wordElement.dataset.word;

    const wordGrid = document.getElementById('word-grid');
    const wordElements = wordGrid.getElementsByClassName('word');
    let isWordCompleted = false;

    for (let wordElement of wordElements) {
        const wordName = wordElement.dataset.word;
        if (wordName === word) {
            const placeholders = wordElement.querySelectorAll('.placeholder');
            isWordCompleted = Array.from(placeholders).every(placeholder => placeholder.innerText !== '');
            break;
        }
    }

    if (!isWordCompleted) {
        return; 
    }

    let modal = document.getElementById('image-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'image-modal';
        modal.classList.add('modal');

        const imageContainer = document.createElement('div');
        imageContainer.classList.add('modal-content');
        modal.appendChild(imageContainer);

        document.body.appendChild(modal);

        const closeButton = document.createElement('span');
        closeButton.classList.add('close-btn');
        closeButton.innerText = 'x';
        closeButton.addEventListener('click', closeImageModal);
        imageContainer.appendChild(closeButton);

        modal.addEventListener('click', closeImageModal);
        imageContainer.addEventListener('click', (event) => event.stopPropagation());
    }

    const imageContainer = modal.querySelector('.modal-content');
    const img = imageContainer.querySelector('img') || document.createElement('img');
    img.src = imageUrl.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");
    img.alt = 'Word Image';
    
    const wordNameElement = imageContainer.querySelector('.word-name') || document.createElement('div');
    wordNameElement.classList.add('word-name');
    wordNameElement.innerText = word;  

    imageContainer.appendChild(img);
    imageContainer.appendChild(wordNameElement);

    modal.style.display = 'block';
}

function closeImageModal() {
    const modal = document.getElementById('image-modal');
    if (modal) {
        modal.style.display = 'none';
        const imageContainer = modal.querySelector('.modal-content');
        imageContainer.innerHTML = ''; 
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const rulesModal = document.getElementById('rules-modal');
    const startGameButton = document.getElementById('start-game-button');
    
    rulesModal.style.display = 'block';

    startGameButton.addEventListener('click', () => {
        rulesModal.style.display = 'none';
        gameStarted = true; 
        startGame(); 
    });
});

function startGame() {
    if (!gameStarted) return; 
    formedWords.clear(); 
    updateScoreboard();
    loadLevel(currentLevel);
}

function checkLevelCompletion(categoryData) {

    if (categoryData && formedWords.size === categoryData.length) {
        showLevelCompletionModal(); 
    }
}

function showLevelCompletionModal() {
    const levelCompletionModal = document.getElementById('level-completion-modal');
    const scoreInModal = document.getElementById('score-in-modal'); 
    scoreInModal.innerText = currentScore; 
    clearInterval(timer); 
    levelCompletionModal.style.display = 'block'; 

    const nextLevelButton = document.getElementById('next-level-button');
    nextLevelButton.addEventListener('click', () => {
        currentLevel++;
        formedWords.clear();
        loadLevel(currentLevel);  
        levelCompletionModal.style.display = 'none';  
        updateScoreboard();  
        startTimer();
    });
}

function updateScoreboard() {
    const levelElement = document.getElementById('level');
    const scoreElement = document.getElementById('score');  

    levelElement.innerText = currentLevel;
    scoreElement.innerText = currentScore;  
}

const correctAudio = document.getElementById('correctAudio');
const wrongAudio = document.getElementById('wrongAudio');

function playFeedbackSound(isCorrect) {
    if (isCorrect) {
        correctAudio.play();
    } else {
        wrongAudio.play();
    }
}

function startTimer() {
    if (!gameStarted || timeLeft <= 0) return;  
    
    if (timer) clearInterval(timer); 

    timerElement.innerText = timeLeft;

    timer = setInterval(() => {
        timeLeft--;
        timerElement.innerText = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timer); 
            endLevel();
        }
    }, 1000);
}

function endLevel() {
    const timeUpModal = document.getElementById('time-up-modal');
    const finalScoreElement = document.getElementById('final-score');
    const playAgainButton = document.getElementById('play-again-button');

    finalScoreElement.innerText = currentScore;

    timeUpModal.style.display = 'block';

    playAgainButton.addEventListener('click', () => {
        timeUpModal.style.display = 'none'; 
        currentLevel = 1;
        currentScore = 10;
        formedWords.clear();
        updateScoreboard();

        wordBoard.innerText = '';  
        selectedWord = '';  
        resetTileStates();

        loadLevel(currentLevel);
    });
}

const hintButton = document.getElementById('hint-button');

hintButton.addEventListener('click', () => {
    if (!gameStarted || currentScore < 5) {
        alert("Insufficient score to use a hint!");
        return;
    }

    const wordGrid = document.getElementById('word-grid');
    const wordElements = wordGrid.getElementsByClassName('word');

    for (let wordElement of wordElements) {
        const wordName = wordElement.dataset.word; 
        const placeholders = wordElement.querySelectorAll('.placeholder');

        const segmenter = new Intl.Segmenter('hi', { granularity: 'grapheme' });
        const letters = Array.from(segmenter.segment(wordName)).map(segment => segment.segment);

        for (let i = 0; i < placeholders.length; i++) {
            if (!placeholders[i].innerText) {
                placeholders[i].innerText = letters[i]; 
                currentScore -= 5; 
                updateScoreboard(); 
                return; 
            }
        }
    }

    alert("No hints available! All words are complete.");
});
