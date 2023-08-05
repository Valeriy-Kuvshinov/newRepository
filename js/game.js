'use strict'

var gLives = 3
var gSafeClicks = 3

var gLevelIDx = 3
var gFirstClick
var gCurrLevel
var gLevels
var gBoard
var gGame
var gGameInterval
var gMinesLeft
var gMineExterminatorUsed
var gTotalMinesSweeped

const FULLHEALTH = '🤠'
const TWOHEALTH = '😨'
const ONEHEALTH = '😱'
const NOHEALTH = '💀'
const WINNER = '😎'

const EMPTY = ' '

// handle the loading of the game, displaying highscore, and showing one of the levels
function onInit() {
    gLevels = createLevels()

    if (!localStorage.getItem('bestTimes')) {
        localStorage.setItem('bestTimes', JSON.stringify([null, null, null]))
    }
    if (!localStorage.getItem('totalMinesSweeped')) {
        localStorage.setItem('totalMinesSweeped', JSON.stringify([0, 0, 0]))
    }
    gTotalMinesSweeped = JSON.parse(localStorage.getItem('totalMinesSweeped')) || [0, 0, 0]

    onSelectLevel(gLevelIDx)

    var audio = new Audio('sound/nebuchadnezzar.mp3')
    audio.play()
    audio.volume = 0.3
}

// creating numerous levels, the size, and the number of mines in them
function createLevels() {
    const readyLevels = [
        { id: 1, SIZE: 4, MINES: 2 },
        { id: 2, SIZE: 8, MINES: 14 },
        { id: 3, SIZE: 12, MINES: 32 }
    ]
    return readyLevels
}

// handle selection of the level, reseting certain elements of the game, calling rendering, closing pop-ups, updating highscore
function onSelectLevel(difficulty) {
    if (difficulty === 1) gLevelIDx = 0
    if (difficulty === 2) gLevelIDx = 1
    if (difficulty === 3) gLevelIDx = 2

    gFirstClick = true
    gMineExterminatorUsed = false
    clearInterval(gGameInterval)

    gBoard = buildBoard()
    gGame = {
        isOn: true,
        shownCount: 0,
        markedCount: 0,
        secondsPassed: 0
    }
    if (gLevelIDx === 0) gLives = 2
    else gLives = 3

    gSafeClicks = 3

    gTotalMinesSweeped[gLevelIDx] = 0

    // setupRandomMines(gBoard, gCurrLevel)
    // setMinesNegsCount(gBoard)
    renderBoard(gBoard)

    var elWinnerScreen = document.querySelector('.win-screen')
    elWinnerScreen.style.display = 'none'
    var elLoserScreen = document.querySelector('.lose-screen')
    elLoserScreen.style.display = 'none'

    var totalMinesSweeped = JSON.parse(localStorage.getItem('totalMinesSweeped')) || [0, 0, 0]
    document.querySelector('.mummy-high-score-info').innerText = totalMinesSweeped[gLevelIDx] || '0'

    var bestTimes = JSON.parse(localStorage.getItem('bestTimes'))
    document.querySelector('.best-time-score').innerText = bestTimes[gLevelIDx] !== null ? (bestTimes[gLevelIDx] + ' seconds') : 'N/A'
}

// setting up the board of the game, the size and the cell's possible values
function buildBoard() {
    gCurrLevel = gLevels[gLevelIDx]

    gMinesLeft = gCurrLevel.MINES

    const SIZE = gCurrLevel.SIZE
    const board = []

    for (var i = 0; i < SIZE; i++) {
        board.push([])
        for (var j = 0; j < SIZE; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
        }
    }
    return board
}

// randomly put mines on the map
function setupRandomMines(board, currLevel, firstClickRow, firstClickCol) {
    const minesPerLevel = currLevel.MINES
    const SIZE = currLevel.SIZE

    for (var i = 0; i < minesPerLevel; i++) {
        const row = getRandomInt(0, SIZE)
        const col = getRandomInt(0, SIZE)

        if ((row === firstClickRow && col === firstClickCol) || board[row][col].isMine) {
            i--
            continue
        }
        board[row][col].isMine = true
    }
}

// handle rendering the map, the cells, health status, mummies and time
function renderBoard(board) {
    var strHTML = '<table border="10">'

    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < board[i].length; j++) {
            var cell = board[i][j]
            var className = cell.isShown ? 'cell' : 'cell cover'

            var cellContent

            if (cell.isMine) cellContent = `<img src="images/Mummy.png" alt="Mine">`
            else if (cell.minesAroundCount === 0) cellContent = EMPTY
            else cellContent = cell.minesAroundCount

            strHTML += `<td data-row="${i}" data-col="${j}" class="${className}" onclick="onCellClicked(this, ${i}, ${j})" oncontextmenu="event.preventDefault(); onCellMarked(this, ${i}, ${j})">${cellContent}</td>`
        }
        strHTML += '</tr>'
    }
    strHTML += '</table>'

    var elBoardContainer = document.querySelector('.board-container')
    elBoardContainer.innerHTML = strHTML

    var elLifeStatus = document.querySelector('.life-status-info')
    if (gLives === 3) elLifeStatus.innerText = FULLHEALTH
    else if (gLives === 2) elLifeStatus.innerText = TWOHEALTH
    else elLifeStatus.innerText = ONEHEALTH

    var elLivesInfo = document.querySelector('.lives-info')
    elLivesInfo.innerText = 'Lives left: ' + gLives

    var elMummiesInfo = document.querySelector('.mummies-info')
    elMummiesInfo.innerText = 'Mummies:'
    var elMummiesCounter = document.querySelector('.mummies-counter')
    elMummiesCounter.innerText = gMinesLeft

    var elTimeInfo = document.querySelector('.time-info')
    elTimeInfo.innerText = 'Seconds:'
    var elSecondsCounter = document.querySelector('.seconds-counter')
    elSecondsCounter.innerText = '0'

    var elSafeClicksCounter = document.querySelector('.safe-click-info')
    elSafeClicksCounter.innerText = gSafeClicks + ' clicks remaining'
}

// render first clicked cell, in order to reveal him to the player as well
function renderFirstCell(board, i, j) {
    var cell = board[i][j]
    var elCell = document.querySelector(`[data-row="${i}"][data-col="${j}"]`)

    var className = cell.isShown ? 'cell' : 'cell cover'
    elCell.className = className

    var cellContent
    if (cell.minesAroundCount === 0) cellContent = EMPTY
    else cellContent = cell.minesAroundCount

    elCell.innerHTML = cellContent
}

// insert the value got by countNeighborMines into a cell surounded by mines
function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            var cell = board[i][j]
            if (cell.isMine) continue
            cell.minesAroundCount = countNeighborMines(board, i, j)
        }
    }
}

// return the count of neighbor mines that surrond a certain cell
function countNeighborMines(board, row, col) {
    var mineCount = 0
    for (var i = row - 1; i <= row + 1; i++) {
        for (var j = col - 1; j <= col + 1; j++) {
            if (i >= 0 && i < board.length && j >= 0 && j < board[i].length) {
                if (board[i][j].isMine) {
                    mineCount++
                }
            }
        }
    }
    return mineCount
}

// handle clicking on a covered cell, revealing it, and the result of it
function onCellClicked(elCell, i, j) {
    var cell = gBoard[i][j]
    console.log(cell)

    if (cell.isMarked) return
    if (cell.isShown) return
    if (!gGame.isOn) return

    if (gFirstClick) {
        startGameTime()

        setupRandomMines(gBoard, gCurrLevel, i, j)
        setMinesNegsCount(gBoard)
        renderBoard(gBoard)

        cell.isShown = true
        elCell.classList.remove('cover')

        gFirstClick = false

        renderFirstCell(gBoard, i, j)
    }

    cell.isShown = true
    elCell.classList.remove('cover')

    if (cell.isMine) {
        gLives--
        onStepMine()
    }
    if (!gFirstClick) {
        if (cell.minesAroundCount === 0 && !cell.isMine) {
            expandShown(gBoard, i, j)

            var audio = new Audio('sound/emptyfound.mp3')
            audio.play()
            audio.volume = 0.1
        }
    }
    checkGameOver(gBoard)
}

// reveal cells which are not a mine, when user clicks on an empty cell that is connected to the non-mine cells
function expandShown(board, row, col) {
    for (var i = row - 1; i <= row + 1; i++) {
        for (var j = col - 1; j <= col + 1; j++) {
            // skip out of bounds indexes and the clicked cell
            if (i === row && j === col) continue
            if (i < 0 || i >= board.length
                || j < 0 || j >= board[i].length) continue

            var cell = board[i][j]

            if (cell.isMine || cell.isShown || cell.isMarked) continue
            cell.isShown = true

            var elNeighbor = document.querySelector(`.board-container td[data-row="${i}"][data-col="${j}"]`)
            if (elNeighbor) {
                elNeighbor.classList.remove('cover')
                if (cell.minesAroundCount > 0) {
                    elNeighbor.textContent = cell.minesAroundCount
                }
            }
            if (cell.minesAroundCount === 0) {
                expandShown(board, i, j)
            }
        }
    }
}

// handle time function, start after user opens his first cell
function startGameTime() {
    if (gFirstClick) {
        var startTime = Date.now()

        if (gGameInterval) {
            clearInterval(gGameInterval)
        }
        gGameInterval = setInterval(function () {
            if (!gGame.isOn) {
                clearInterval(gGameInterval)
                return
            }
            var elapsedTime = Math.floor((Date.now() - startTime) / 1000)

            var elSecondsCounter = document.querySelector('.seconds-counter')
            elSecondsCounter.innerText = elapsedTime
        }, 1000)
    }
}

// handle marking a suspected mine cell, and if the marked cell truly hides a mine
function onCellMarked(elCell, i, j) {
    var cell = gBoard[i][j]

    if (cell.isShown) return
    if (!gGame.isOn) return

    if (!cell.isMarked) {
        elCell.classList.add('mark')
        elCell.classList.remove('cover')
        cell.isMarked = true
    } else {
        elCell.classList.remove('mark')
        elCell.classList.add('cover')
        cell.isMarked = false
    }
    if (cell.isMarked && cell.isMine) {
        gMinesLeft--
        var elMummiesCounter = document.querySelector('.mummies-counter')
        elMummiesCounter.innerText = gMinesLeft

        checkGameOver(gBoard)

        gTotalMinesSweeped[gLevelIDx]++
        updateHighScore(gTotalMinesSweeped[gLevelIDx])

        var audio = new Audio('sound/mummymark.mp3')
        audio.play()
        audio.volume = 0.3
    }
    if (!cell.isMarked && cell.isMine) {
        gMinesLeft++
        var elMummiesCounter = document.querySelector('.mummies-counter')
        elMummiesCounter.innerText = gMinesLeft
    }
    if (cell.isMarked && !cell.isMine) {
        var audio = new Audio('sound/safemark.mp3')
        audio.play()
        audio.volume = 0.1
    }
}

// check if user has won the game, by either mine count of cells revealed
function checkGameOver(board) {
    var totalCells = board.length * board[0].length
    var revealedCount = 0
    var nonMineCellsCount = totalCells - gCurrLevel.MINES

    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            var cell = board[i][j]
            if (cell.isShown && !cell.isMine) {
                revealedCount++
            }
        }
    }
    if (revealedCount === nonMineCellsCount || gMinesLeft < 1) onVictory()
}

// handle when user reveals a mined cell
function onStepMine() {
    var audio = new Audio('sound/mummy.mp3')
    audio.play()
    audio.volume = 0.1

    if (gLives === 2) {
        var elLifeStatus = document.querySelector('.life-status-info')
        elLifeStatus.innerText = TWOHEALTH
    }
    else if (gLives === 1) {
        var elLifeStatus = document.querySelector('.life-status-info')
        elLifeStatus.innerText = ONEHEALTH
    }
    else if (gLives === 0) {
        var elLifeStatus = document.querySelector('.life-status-info')
        elLifeStatus.innerText = NOHEALTH
        onLose()
    }
    gMinesLeft--

    var elMummiesCounter = document.querySelector('.mummies-counter')
    elMummiesCounter.innerText = gMinesLeft

    var elLivesInfo = document.querySelector('.lives-info')
    elLivesInfo.innerText = 'Lives left: ' + gLives
}

// handle Mummy Sweeper option, remove 3 random hidden mined cells, render the board again
function onMineExterminator() {
    if (gFirstClick) alert('start the game first')

    if (!gFirstClick && !gMineExterminatorUsed) {
        var mines = []

        for (var i = 0; i < gBoard.length; i++) {
            for (var j = 0; j < gBoard[i].length; j++) {
                if (gBoard[i][j].isMine && !gBoard[i][j].isShown) {
                    mines.push({ row: i, col: j })
                }
            }
        }
        var minesToRemove = Math.min(3, mines.length)

        for (var i = 0; i < minesToRemove; i++) {
            var mineIndex = Math.floor(Math.random() * mines.length)
            var mine = mines[mineIndex]

            gBoard[mine.row][mine.col].isMine = false

            mines.splice(mineIndex, 1)
        }
        setMinesNegsCount(gBoard)
        renderBoard(gBoard)

        gMinesLeft -= minesToRemove
        var elMummiesCounter = document.querySelector('.mummies-counter')
        elMummiesCounter.innerText = gMinesLeft

        checkGameOver(gBoard)

        gMineExterminatorUsed = true

        var audio = new Audio('sound/mummysweeped.mp3')
        audio.play()
        audio.volume = 0.1
    }
}

// handle Safe Click option, temporarily mark a cell that is not a mine to the user
function onSafeClick() {
    console.log('greet')
    if (gFirstClick) alert('start the game first')

    if (gSafeClicks > 0 && !gFirstClick) {
        var safeCell = getRandomSafeCell()

        if (safeCell) {
            var cellElement = document.querySelector(`[data-row='${safeCell.i}'][data-col='${safeCell.j}']`)
            cellElement.classList.add('safemark')
            cellElement.classList.remove('cover')

            setTimeout(function () {
                cellElement.classList.add('cover')
                cellElement.classList.remove('safemark')
            }, 3000)
        }
        gSafeClicks--

        var audio = new Audio('sound/safeclicksound.mp3')
        audio.play()
        audio.volume = 0.1
    }
    var elSafeClicksCounter = document.querySelector('.safe-click-info')
    elSafeClicksCounter.innerText = gSafeClicks + ' clicks remaining'
}

// search for a random cell that is not a mine, and not revealed yet
function getRandomSafeCell() {
    var safeCells = []

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            if (!gBoard[i][j].isShown && !gBoard[i][j].isMine) {
                safeCells.push({ i, j })
            }
        }
    }
    if (safeCells.length === 0) return null

    var randomIndex = Math.floor(Math.random() * safeCells.length)
    return safeCells[randomIndex]
}

// update user's high score, regarding mummies marked on map
function updateHighScore(newScore) {
    var totalMinesSweeped = JSON.parse(localStorage.getItem('totalMinesSweeped'))
    if (newScore > totalMinesSweeped[gLevelIDx]) {
        totalMinesSweeped[gLevelIDx] = newScore
        localStorage.setItem('totalMinesSweeped', JSON.stringify(totalMinesSweeped))
        document.querySelector('.mummy-high-score-info').innerText = newScore
    }
}

// handle restart of the game
function onRestart() {
    onSelectLevel(gLevelIDx + 1)
    clearInterval(gGameInterval)
}

// handle victory scenario, show victory pop-up, update user's high scores
function onVictory() {
    gGame.isOn = false

    var elLifeStatus = document.querySelector('.life-status-info')
    elLifeStatus.innerText = WINNER

    var elWinnerScreen = document.querySelector('.win-screen')
    elWinnerScreen.style.display = 'block'

    var elapsedTime = document.querySelector('.seconds-counter').innerText
    var bestTimes = JSON.parse(localStorage.getItem('bestTimes'))
    var totalMinesSweeped = JSON.parse(localStorage.getItem('totalMinesSweeped'))

    if (!bestTimes[gLevelIDx] || elapsedTime < bestTimes[gLevelIDx]) {
        bestTimes[gLevelIDx] = elapsedTime
        localStorage.setItem('bestTimes', JSON.stringify(bestTimes))
    }
    if (!totalMinesSweeped[gLevelIDx] || gTotalMinesSweeped[gLevelIDx] > totalMinesSweeped[gLevelIDx]) {
        totalMinesSweeped[gLevelIDx] = gTotalMinesSweeped[gLevelIDx]
        localStorage.setItem('totalMinesSweeped', JSON.stringify(totalMinesSweeped))
    }
    document.querySelector('.best-time-score').innerText = (bestTimes[gLevelIDx] + ' seconds') || 'N/A'
    document.querySelector('.mummy-high-score-info').innerText = gTotalMinesSweeped[gLevelIDx]
}

// handle closing victory pop-up
function onCloseVictory() {
    var elWinnerScreen = document.querySelector('.win-screen')
    elWinnerScreen.style.display = 'none'

    if (gLevelIDx < 2) onSelectLevel(gLevelIDx + 2)
}

//handle lose scenario, show lose pop-up
function onLose() {
    gGame.isOn = false

    var elLoserScreen = document.querySelector('.lose-screen')
    elLoserScreen.style.display = 'block'
}

// handle closing lose pop-up
function onCloseLose() {
    var elLoserScreen = document.querySelector('.lose-screen')
    elLoserScreen.style.display = 'none'

    onSelectLevel(gLevelIDx + 1)
}
