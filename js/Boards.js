//Returns a new board with every cell moved left, wrapping around the left edge
function moveBoardLeft(board, gameSize)
{
    let resBoard = new Uint8Array(board.length);
    for(let y = 0; y < gameSize; y++)
    {
        for (let x = 0; x < gameSize; x++)
        {
            let leftX = wholeMod(x - 1, gameSize);

            let cellIndex     = flatCellIndex(gameSize, x,     y);
            let cellIndexLeft = flatCellIndex(gameSize, leftX, y);

            resBoard[cellIndexLeft] = board[cellIndex];
        }
    }
    
    return resBoard;
}

//Returns a new board with every cell moved right, wrapping around the right edge
function moveBoardRight(board, gameSize)
{
    let resBoard = new Uint8Array(board.length);
    for(let y = 0; y < gameSize; y++)
    {
        for (let x = 0; x < gameSize; x++)
        {
            let rightX = wholeMod(x + 1, gameSize);

            let cellIndex      = flatCellIndex(gameSize, x,      y);
            let cellIndexRight = flatCellIndex(gameSize, rightX, y);

            resBoard[cellIndexRight] = board[cellIndex];
        }
    }
    
    return resBoard;
}

//Returns a new board with every cell moved up, wrapping around the top edge
function moveBoardUp(board, gameSize)
{
    let resBoard = new Uint8Array(board.length);
    for(let y = 0; y < gameSize; y++)
    {
        for (let x = 0; x < gameSize; x++)
        {
            let upY = wholeMod(y - 1, gameSize);

            let cellIndex   = flatCellIndex(gameSize, x, y  );
            let cellIndexUp = flatCellIndex(gameSize, x, upY);

            resBoard[cellIndexUp] = board[cellIndex];
        }
    }
    
    return resBoard;
}

//Returns a new board with every cell moved down, wrapping around the bottom edge
function moveBoardDown(board, gameSize)
{
    let resBoard = new Uint8Array(board.length);
    for(let y = 0; y < gameSize; y++)
    {
        for (let x = 0; x < gameSize; x++)
        {
            let downY = wholeMod(y + 1, gameSize);

            let cellIndex     = flatCellIndex(gameSize, x, y    );
            let cellIndexDown = flatCellIndex(gameSize, x, downY);

            resBoard[cellIndexDown] = board[cellIndex];
        }
    }
    
    return resBoard;
}

//Returns a new board with every cell value domain-shifted by 1
function domainShiftBoard(board, domainSize)
{
    let resBoard = new Uint8Array(board.length);
    for(let i = 0; i < board.length; i++)
    {
        resBoard[i] = (board[i] + 1) % domainSize;
    }

    return resBoard;
}

//Returns a new board with every cell value domain-inverted
function domainInverseBoard(board, domainSize)
{
    if(domainSize === 2)
    {
        return board;
    }

    let resBoard = new Uint8Array(board.length);
    for(let i = 0; i < board.length; i++)
    {
        resBoard[i] = (domainSize - board[i]) % domainSize;
    }

    return resBoard;
}

//Returns a new board with every non-zero cell value domain-shifted by 1, ignoring value 0
function domainRotateNonZeroBoard(board, domainSize)
{
    if(domainSize === 2)
    {
        return board;
    }

    let resBoard = new Uint8Array(board.length);
    for(let i = 0; i < board.length; i++)
    {
        if(board[i] != 0)
        {
            resBoard[i] = board[i] % (domainSize - 1) + 1;
        }
    }

    return resBoard;
}

//Adds boardLeft to boardRight component-wise and returns a new board containing the result
function addBoard(boardLeft, boardRight, domainSize)
{
    if(boardLeft.length !== boardRight.length)
    {
        return boardLeft;
    }

    let resBoard = new Uint8Array(boardLeft.length);
    for(let i = 0; i < boardLeft.length; i++)
    {
        resBoard[i] = (boardLeft[i] + boardRight[i]) % domainSize;
    }

    return resBoard;
}

//Adds boardRight to boardLeft component-wise in-place, without allocating new memory
function addBoardInPlace(boardLeft, boardRight, domainSize)
{
    if(boardLeft.length !== boardRight.length)
    {
        return;
    }

    for(let i = 0; i < boardLeft.length; i++)
    {
        boardLeft[i] = (boardLeft[i] + boardRight[i]) % domainSize;
    }
}

//Multiplies boardLeft by a fixed value component-wise and returns a new board containing the result
function mulBoard(board, mulValue, domainSize)
{
    //ZERO IS EXCLUDED
    if(board.length !== board.length || mulValue === 0)
    {
        return board;
    }

    let resBoard = new Uint8Array(board.length);
    for(let i = 0; i < board.length; i++)
    {
        resBoard[i] = (board[i] * mulValue) % domainSize;
    }

    return resBoard;
}

//Multiplies boardLeft by a fixed value component-wise in-place, without allocating new memory
function mulBoardInPlace(board, mulValue, domainSize)
{
    //ZERO IS EXCLUDED
    if(board.length !== board.length || mulValue === 0)
    {
        return;
    }

    for(let i = 0; i < board.length; i++)
    {
        board[i] = (board[i] * mulValue) % domainSize;
    }
}

//Multiplies boardLeft by boardRight component-wise and returns a new board containing the result
function mulComponentWiseBoard(boardLeft, boardRight, domainSize)
{
    if(boardLeft.length !== boardRight.length)
    {
        return boardLeft;
    }

    let resBoard = new Uint8Array(boardLeft.length);
    for(let i = 0; i < boardLeft.length; i++)
    {
        resBoard[i] = (boardLeft[i] * boardRight[i]) % domainSize;
    }

    return resBoard;
}

//Multiplies boardLeft by boardRight component-wise in-place, without allocating new memory
function mulComponentWiseBoardInPlace(boardLeft, boardRight, domainSize)
{
    if(boardLeft.length !== boardRight.length)
    {
        return;
    }

    for(let i = 0; i < boardLeft.length; i++)
    {
        boardLeft[i] = (boardLeft[i] * boardRight[i]) % domainSize;
    }
}

//Calculates (boardLeft - mulValue * boardRight) component-wise and returns a new board containing the result
function mulSubBoard(boardLeft, boardRight, mulValue, domainSize)
{
    if(boardLeft.length !== boardRight.length || mulValue === 0)
    {
        return boardLeft;
    }

    let resBoard = new Uint8Array(boardLeft.length);
    for(let i = 0; i < resBoard.length; i++)
    {
        resBoard[i] = wholeMod(boardLeft[i] - mulValue * boardRight[i], domainSize);
    }

    return resBoard;
}

//Calculates (boardLeft - mulValue * boardRight) component-wise in-place, without allocating new memory
function mulSubBoardInPlace(boardLeft, boardRight, mulValue, domainSize)
{
    if(boardLeft.length !== boardRight.length || mulValue === 0)
    {
        return;
    }

    for(let i = 0; i < boardLeft.length; i++)
    {
        boardLeft[i] = wholeMod(boardLeft[i] - mulValue * boardRight[i], domainSize);
    }
}

//For domainSize == 2 calculates this binary function:
// (board & (boardCompLeft == boardCompRight))
// component-wise. Returns a new board containing the result
function incDifBoard(board, boardCompLeft, boardCompRight, domainSize)
{
    if(boardCompLeft.length !== boardCompRight.length || board.length !== boardCompLeft.length)
    {
        return board;
    }

    let resBoard = new Uint8Array(board.length);
    for(let i = 0; i < board.length; i++)
    {
        if(boardCompLeft[i] === boardCompRight[i])
        {
            resBoard[i] = (board[i] * (domainSize - 1)) % domainSize; //Only works in domain 2, of course
        }
        else
        {
            resBoard[i] = 0;
        }
    }

    return resBoard;
}

//Returns a dot product of boardLeft and boardRight
function dotProductBoard(boardLeft, boardRight, domainSize)
{
    if(boardLeft.length !== boardRight.length)
    {
        return 0;
    }

    let sum = 0;
    for(let i = 0; i < boardLeft.length; i++)
    {
        sum += boardLeft[i] * boardRight[i];
    }

    return sum % domainSize;
}

//Returns true if all values of boardLeft are equal to corresponding values of boardRight
function equalsBoard(boardLeft, boardRight)
{
    if(boardLeft.length !== boardRight.length)
    {
        return false;
    }

    for(let i = 0; i < boardLeft.length; i++)
    {
        if(boardLeft[i] !== boardRight[i])
        {
            return false;
        }
    }

    return true;
}