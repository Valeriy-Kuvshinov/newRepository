'use strict'

var gLives = 3
var gHints = 3
var gSafeClicks = 3

var gLevelIDx = -1
var gFirstClick
var gCurrLevel
var gLevels
var gBoard
var gGame

const FULLHEALTH = '🤠'
const TWOHEALTH = '😨'
const ONEHEALTH = '😱'
const NOHEALTH = '💀'
const WINNER = '😎'

const EMPTY = ' '
const MINE = '💣'

function onInit() {
    console.log('hello!')
    gLevels = createLevels()

    // var audio = new Audio('sound/nebuchadnezzar.mp3')
    // audio.play()
    // audio.volume = 0.3
}

function createLevels() {
    const readyLevels = [
        { id: 1, SIZE: 4, MINES: 2 },
        { id: 2, SIZE: 8, MINES: 14 },
        { id: 3, SIZE: 12, MINES: 32 }
    ]
    return readyLevels
}

function onSelectLevel(difficulty) {
    if (difficulty === 1) gLevelIDx = 0
    if (difficulty === 2) gLevelIDx = 1
    if (difficulty === 3) gLevelIDx = 2
    gFirstClick = false

    gBoard = buildBoard()
    gGame = {
        isOn: true,
        shownCount: 0,
        markedCount: 0,
        secondsPassed: 0
    }
    if (gLevelIDx === 0) gLives = 2
    else gLives = 3

    setupRandomMines(gBoard, gCurrLevel)
    setMinesNegsCount(gBoard)
    renderBoard(gBoard)

    var elWinnerScreen = document.querySelector('.win-screen')
    elWinnerScreen.style.display = 'none'
    var elLoserScreen = document.querySelector('.lose-screen')
    elLoserScreen.style.display = 'none'
}

function buildBoard() {
    gCurrLevel = gLevels[gLevelIDx]
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
            };
        }
    }
    return board
}

function setupRandomMines(board, currLevel) {
    const minesPerLevel = currLevel.MINES
    const SIZE = currLevel.SIZE

    for (var i = 0; i < minesPerLevel; i++) {
        const row = getRandomInt(0, SIZE)
        const col = getRandomInt(0, SIZE)

        if (board[row][col].isMine) {
            i--
            continue
        }
        board[row][col].isMine = true
    }
}

function renderBoard(board) {
    var strHTML = '<table border="8">'

    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < board[i].length; j++) {
            var cell = board[i][j]
            var className = cell.isShown ? 'cell' : 'cell cover'

            var cellContent

            if (cell.isMine) cellContent = MINE
            else if (cell.minesAroundCount === 0) cellContent = EMPTY
            else cellContent = cell.minesAroundCount

            strHTML += `<td class="${className}" onclick="onCellClicked(this, ${i}, ${j})" oncontextmenu="event.preventDefault(); onCellMarked(this, ${i}, ${j})">${cellContent}</td>`
        }
        strHTML += '</tr>'
    }
    strHTML += '</table>'

    var elBoardContainer = document.querySelector('.board-container')
    elBoardContainer.innerHTML = strHTML

    var elLifeStatus = document.querySelector('.life-status-info')
    elLifeStatus.innerText = FULLHEALTH

    var elLivesInfo = document.querySelector('.lives-info')
    elLivesInfo.innerText = 'Lives left: ' + gLives

    var elMummiesInfo = document.querySelector('.mummies-info')
    elMummiesInfo.innerText = 'Mummies:'
    var elMummiesCounter = document.querySelector('.mummies-counter')
    elMummiesCounter.innerText = gCurrLevel.MINES

    var elTimeInfo = document.querySelector('.time-info')
    elTimeInfo.innerText = 'Seconds:'
    var elSecondsCounter = document.querySelector('.seconds-counter')
    elSecondsCounter.innerText = '0'
}

function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            var cell = board[i][j]
            if (cell.isMine) continue
            cell.minesAroundCount = countNeighborMines(board, i, j)
            console.log(cell.minesAroundCount)

            switch (cell.minesAroundCount) {
                case 1:
                    cell.minesAroundCount = 1
                    break
                case 2:
                    cell.minesAroundCount = 2
                    break
                case 3:
                    cell.minesAroundCount = 3
                    break
                case 4:
                    cell.minesAroundCount = 4
                    break
                case 5:
                    cell.minesAroundCount = 5
                    break
                case 6:
                    cell.minesAroundCount = 6
                    break
                case 7:
                    cell.minesAroundCount = 7
                    break
                case 8:
                    cell.minesAroundCount = 8
                    break
            }
        }
    }
}

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

function onCellClicked(elCell, i, j) {
    var cell = gBoard[i][j]
    if (cell.isMarked) return
    if (cell.isShown) return
    if (!gGame.isOn) return

    cell.isShown = true
    elCell.classList.remove('cover')

    if (cell.isMine) {
        gLives--
        onStepMine()
    } else if (cell.minesAroundCount === 0) expandShown(gBoard, i, j)

    checkGameOver(gBoard)
}

function expandShown(board, i, j) {
    for (var row = i - 1; row <= i + 1; row++) {
        for (var col = j - 1; col <= j + 1; col++) {
            if (row === i && col === j) continue

            if (row >= 0 && row < board.length && col >= 0 && col < board[0].length) {
                var neighborCell = board[row][col]

                if (!neighborCell.isMine && !neighborCell.isShown) {
                    neighborCell.isShown = true
                    var neighborCellElement = document.querySelector(`.cell[data-i="${row}"][data-j="${col}"]`)
                    if (neighborCellElement) {
                        neighborCellElement.classList.remove('cover')

                        if (neighborCell.minesAroundCount === 0) {
                            expandShown(board, row, col)
                        }
                    }
                }
            }
        }
    }
}

// function expandShown(board, i, j) {
//     for (var row = i - 1; row <= i + 1; row++) {
//         for (var col = j - 1; col <= j + 1; col++) {
//             if (row === i && col === j) continue

//             if (row >= 0 && row < board.length && col >= 0 && col < board[0].length) {
//                 var neighborCell = board[row][col]

//                 if (!neighborCell.isMine && !neighborCell.isShown) {
//                     neighborCell.isShown = true
//                     var neighborCellElement = document.querySelector(`.cell[data-i="${row}"][data-j="${col}"]`)
//                     neighborCellElement.classList.remove('cover')

//                     if (neighborCell.minesAroundCount === 0) {
//                         expandShown(board, row, col)
//                     }
//                 }
//             }
//         }
//     }
// }

function onCellMarked(elCell, i, j) {
    var cell = gBoard[i][j]

    if (cell.isShown) return
    if (!gGame.isOn) return

    if (!cell.isMarked) {
        elCell.classList.toggle('mark')
        elCell.classList.toggle('cover')
        cell.isMarked = true
    }
    else {
        elCell.classList.toggle('mark')
        elCell.classList.toggle('cover')
        cell.isMarked = false
    }
}

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
    if (revealedCount === nonMineCellsCount) {
        onVictory()
    }
}

function onStepMine() {
    // var audio = new Audio('sound/mummy.mp3')
    // audio.play()
    // audio.volume = 0.05

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
    var elLivesInfo = document.querySelector('.lives-info')
    elLivesInfo.innerText = 'Lives left: ' + gLives
}

function onVictory() {
    gGame.isOn = false

    var elLifeStatus = document.querySelector('.life-status-info')
    elLifeStatus.innerText = WINNER

    var elWinnerScreen = document.querySelector('.win-screen')
    elWinnerScreen.style.display = 'block'
}

function onCloseVictory() {
    var elWinnerScreen = document.querySelector('.win-screen')
    elWinnerScreen.style.display = 'none'
}

function onLose() {
    gGame.isOn = false

    var elLoserScreen = document.querySelector('.lose-screen')
    elLoserScreen.style.display = 'block'
}

function onCloseLose() {
    var elLoserScreen = document.querySelector('.lose-screen')
    elLoserScreen.style.display = 'none'
}