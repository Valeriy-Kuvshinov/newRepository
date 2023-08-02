'use strict'

var gLives = 3
var gHints = 3
var gSafeClicks = 3

var gLevelIDx = 2
var gCurrLevel
var gLevels
var gBoard
var gGame

const EMPTY = ' '
const MINE = '💣'
const oneMineNeg = '1'
const twoMineNeg = '2'
const threeMineNeg = '3'
const fourMineNeg = '4'
const fiveMineNeg = '5'
const sixMineNeg = '6'
const sevenMineNeg = '7'
const eightMineNeg = '8'

function onInit() {
    console.log('hello!')
    gLevels = createLevels()
    gBoard = buildBoard()
    gGame = {
        isOn: true,
        shownCount: 0,
        markedCount: 0,
        secondsPassed: 0
    }
    setupRandomMines(gBoard, gCurrLevel)
    setMinesNegsCount(gBoard)
    renderBoard(gBoard)
}

function createLevels() {
    const readyLevels = [
        { id: 1, SIZE: 4, MINES: 2 },
        { id: 2, SIZE: 8, MINES: 14 },
        { id: 3, SIZE: 12, MINES: 32 }
    ]
    return readyLevels
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
    // board[0][1].isMine = true
    // board[0][2].isMine = true

    return board
}

function setupRandomMines(board, currLevel) {
    const minesPerLevel = currLevel.MINES
    const SIZE = currLevel.SIZE

    for (let i = 0; i < minesPerLevel; i++) {
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
            var className = cell.isShown ? 'cell' : 'cell cover'; // Add 'hidden' class if the cell is not shown

            var cellContent
            if (cell.isMine) cellContent = MINE
            else if (cell.minesAroundCount === 0) cellContent = EMPTY
            else cellContent = cell.minesAroundCount

            strHTML += `<td class="${className}" onclick="onCellClicked(this, ${i}, ${j})">${cellContent}</td>`
        }
        strHTML += '</tr>'
    }
    strHTML += '</table>'

    var elBoardContainer = document.querySelector('.board-container')
    elBoardContainer.innerHTML = strHTML
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
                    cell.minesAroundCount = oneMineNeg
                    break
                case 2:
                    cell.minesAroundCount = twoMineNeg
                    break
                case 3:
                    cell.minesAroundCount = threeMineNeg
                    break
                case 4:
                    cell.minesAroundCount = fourMineNeg
                    break
                case 5:
                    cell.minesAroundCount = fiveMineNeg
                    break
                case 6:
                    cell.minesAroundCount = sixMineNeg
                    break
                case 7:
                    cell.minesAroundCount = sevenMineNeg
                    break
                case 8:
                    cell.minesAroundCount = eightMineNeg
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

    if (cell.isShown) return

    elCell.classList.toggle('cover')

    if (cell.isMine) alert('game over')
    
    cell.isShown = true;
    console.log(cell.isShown)
}

function expandShown(board, elCell, i, j) {

}

function checkGameOver() {

}

function onStepMine() {

}