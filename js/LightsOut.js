////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////    UTIL FUNCTIONS    /////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

//Clamps the value num between min and max.
function clamp(num, min, max)
{
    if(num < min)
    {
        return min;
    }

    if(num > max)
    {
        return max;
    }

    return num;
}

//Extended Euclid algorithm for inverting (num) modulo (domainSize)
//Returns a number T such that (num * T) % domainSize = 1
function invModGcdEx(num, domainSize)
{
    if(num === 1)
    {
        return 1;
    }
    else
    {
        if(num === 0 || domainSize % num === 0)
        {
            return 0;
        }
        else
        {
            let tCurr = 0;
            let rCurr = domainSize;
            let tNext = 1;
            let rNext = num;

            while(rNext !== 0)
            {
                let quotR = Math.floor(rCurr / rNext);
                let tPrev = tCurr;
                let rPrev = rCurr;

                tCurr = tNext;
                rCurr = rNext;

                tNext = Math.floor(tPrev - quotR * tCurr);
                rNext = Math.floor(rPrev - quotR * rCurr);
            }

            tCurr = (tCurr + domainSize) % domainSize;
            return tCurr;
        }
    }
}

//Computes a flat cell index from x and y for the given board size (gameSize x gameSize)
function flatCellIndex(gameSize, x, y)
{
    return y * gameSize + x;
}

//Computes the size of the canvas for the given board size (gameSize x gameSize). 
//The size is calculated in a way such that every cell is of the same size cellSize.
//If grid is used, the size of the canvas adjusts to fit the grid
function canvasSizeFromGameSize(gameSize, cellSize, useGrid)
{
    let res = {width: 0, height: 0};

    if(useGrid)
    {
        //Grid is used: each cell has 1 pixel wide border on left and top edges. This border is included in cellSize.
        //Cells don't have the right and bottom borders - instead, left border of the right cell and top border of the bottom cell is used.
        //The only exception is the rightmost and bottommost cells - they need explicit 1 pixel wide border.
        res.width  = gameSize * cellSize + 1;
        res.height = gameSize * cellSize + 1;       
    }
    else
    {
        //Grid is not used - canvas is just the multiple of the cell size
        res.width  = gameSize * cellSize;
        res.height = gameSize * cellSize; 
    }

    return res;
}

//Gets 2-dimensional cell index from a canvas point (x, y) for the given board size gameSize and canvas size canvasWidth x canvasHeight.
//Since the actual board has dynamic size and is centered on a statically sized canvas, offsets: (canvasOffsetX, canvasOffsetY) are added.
function boardPointFromCanvasPoint(x, y, gameSize, canvasOffsetX, canvasOffsetY, canvasWidth, canvasHeight, useGrid)
{
    let res = {xBoard: -1, yBoard: -1};
    if((x - canvasOffsetX) > canvasWidth || (y - canvasOffsetY) > canvasHeight)
    {
        return res;
    }

    let stepX = 1;
    let stepY = 1;

    if(useGrid)
    {
        stepX = Math.floor((canvasWidth  + 1) / gameSize);
        stepY = Math.floor((canvasHeight + 1) / gameSize);
    }
    else
    {
        stepX = Math.floor(canvasWidth  / gameSize);
        stepY = Math.floor(canvasHeight / gameSize);
    }

    res.xBoard = Math.floor((x - canvasOffsetX) / stepX);
    res.yBoard = Math.floor((y - canvasOffsetY) / stepY);

    return res;
}

//Returns the position in string "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-+"
function decodeBase64Char(charCode)
{
    //A-Z
    if(charCode >= 65 && charCode <= 90)
    {
        return charCode - 65;
    }

    //a-z
    if(charCode >= 97 && charCode <= 122)
    {
        return (charCode - 97) + 26;
    }

    //0-9
    if(charCode >= 48 && charCode <= 57)
    {
        return (charCode - 48) + 52;
    }

    //+
    if(charCode === 43)
    {
        return 62;
    }

    //-
    if(charCode === 45)
    {
        return 63;
    }

    return -1;
}

function encodeBase64ClickRule(clickRule, isToroid)
{
    let encodeStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-+";

    let base64Str = "";
    if(isToroid) //Encode toroid flag in the first character
    {
        base64Str += "T";
    }
    else
    {
        base64Str += "C";
    }

    let remainder = clickRule.length % 3;
    for(let i = 0; i < clickRule.length - remainder; i += 3) //Encode each 3 bytes into 4 base64 characters
    {
        //Little-endian encoding
        let base64Char1 =                                            (clickRule[i + 0] & 0b00111111);       //First 6 bits of the first byte
        let base64Char2 = (((clickRule[i + 0] >> 6) & 0b00000011) | ((clickRule[i + 1] & 0b00001111) << 2)) //Last 2 bits of the first byte and first 4 bits of the second one
        let base64Char3 = (((clickRule[i + 1] >> 4) & 0b00001111) | ((clickRule[i + 2] & 0b00000011) << 4)) //Last 4 bits of the second byte and first 2 bits of the third one
        let base64Char4 =  ((clickRule[i + 2] >> 2) & 0b00111111);                                          //Last 6 bits of the third byte
        
        base64Str += encodeStr[base64Char1];
        base64Str += encodeStr[base64Char2];
        base64Str += encodeStr[base64Char3];
        base64Str += encodeStr[base64Char4];
    }

    if(remainder > 0)
    {
        //Last padding bytes
        let lastByte1 = 0;
        let lastByte2 = 0;
        let lastByte3 = 0;

        if(remainder == 1)
        {
            lastByte1 = clickRule[clickRule.length - 1];
            lastByte2 = 0;
            lastByte3 = 0;
        }
        else if(remainder == 2)
        {
            lastByte1 = clickRule[clickRule.length - 2];
            lastByte2 = clickRule[clickRule.length - 1];
            lastByte3 = 0;
        }

        //Little-endian encoding
        let base64Char1 =                                     (lastByte1 & 0b00111111);       //First 6 bits of the first byte
        let base64Char2 = (((lastByte1 >> 6) & 0b00000011) | ((lastByte2 & 0b00001111) << 2)) //Last 2 bits of the first byte and first 4 bits of the second one
        let base64Char3 = (((lastByte2 >> 4) & 0b00001111) | ((lastByte3 & 0b00000011) << 4)) //Last 4 bits of the second byte and first 2 bits of the third one
        let base64Char4 =  ((lastByte3 >> 2) & 0b00111111);                                   //Last 6 bits of the third byte
        
        base64Str += encodeStr[base64Char1];
        base64Str += encodeStr[base64Char2];
        base64Str += encodeStr[base64Char3];
        base64Str += encodeStr[base64Char4];
    }

    return base64Str;
}

function decodeBase64ClickRule(base64Str, domainSize, minSize, maxSize)
{
    let clickRuleArray = [];
    let isToroid       = false;
    let clickRuleSize  = 0;

    if(base64Str.length == 0 || (base64Str[0] != 'C' && base64Str[0] != 'T'))
    {
        //Return default values
        let defaultClickRule = new Uint8Array([0, 1, 0, 1, 1, 1, 0, 1, 0]);
        return {clickrule: defaultClickRule, clickrulesize: 3, istoroid: false};
    }

    if(base64Str[0] == 'C')
    {
        isToroid = false;
    }
    else if(base64Str[0] == 'T')
    {
        isToroid = true;
    }

    //The remainder of the base64 string should be divisible by 4
    if(((base64Str.length - 1) % 4) != 0)
    {
        //Return default values
        let defaultClickRule = new Uint8Array([0, 1, 0, 1, 1, 1, 0, 1, 0]);
        return {clickrule: defaultClickRule, clickrulesize: 3, istoroid: false};
    }

    for(let i = 1; i < base64Str.length; i += 4)
    {
        let base64Char1 = decodeBase64Char(base64Str.charCodeAt(i + 0));
        let base64Char2 = decodeBase64Char(base64Str.charCodeAt(i + 1));
        let base64Char3 = decodeBase64Char(base64Str.charCodeAt(i + 2));
        let base64Char4 = decodeBase64Char(base64Str.charCodeAt(i + 3));

        let byte1 =  ((base64Char1       & 0b00111111) | ((base64Char2 & 0b00000011) << 6));
        let byte2 = (((base64Char2 >> 2) & 0b00001111) | ((base64Char3 & 0b00001111) << 4));
        let byte3 = (((base64Char3 >> 4) & 0b00000011) | ((base64Char4 & 0b00111111) << 2));

        clickRuleArray.push(byte1);
        clickRuleArray.push(byte2);
        clickRuleArray.push(byte3);
    }

    //Click rule size should be a full square
    clickRuleSize = Math.floor(Math.sqrt(clickRuleArray.length)); //Even if there's some extra bytes, just ignore them
    let cellCount = clickRuleSize * clickRuleSize;
    
    //Only odd-sized click rules are acceptable
    if(clickRuleSize < minSize || clickRuleSize > maxSize || clickRuleSize % 2 == 0)
    {
        //Return default values
        let defaultClickRule = new Uint8Array([0, 1, 0, 1, 1, 1, 0, 1, 0]);
        return {clickrule: defaultClickRule, clickrulesize: 3, istoroid: false};
    }

    for(let i = 0; i < cellCount; i++)
    {
        //Click rule should be valid for the domain
        if(clickRuleArray[i] >= domainSize)
        {
            //Return default values
            let defaultClickRule = new Uint8Array([0, 1, 0, 1, 1, 1, 0, 1, 0]);
            return {clickrule: defaultClickRule, clickrulesize: 3, istoroid: false};   
        }
    }

    let clickRule = new Uint8Array(clickRuleArray.slice(0, cellCount));
    return {clickrule: clickRule, clickrulesize: clickRuleSize, istoroid: isToroid};
}

//Returns (num % domainSize) with regard to the sign of num
function wholeMod(num, domainSize)
{
    return ((num % domainSize) + domainSize) % domainSize;
}

//////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////    CLICK RULE FUNCTIONS    /////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////

//Makes a turn at (cellX, cellY) cell of the board board with regard to click rule clickRule
function makeTurn(board, clickRule, clickRuleSize, gameSize, domainSize, cellX, cellY, isToroid)
{
    if(isToroid)
    {
        let populatedClickRuleT = populateClickRuleToroid(clickRule, clickRuleSize, gameSize, cellX, cellY);
        return addBoard(board, populatedClickRuleT, domainSize);
    }
    else
    {
        let populatedClickRuleP = populateClickRulePlane(clickRule, clickRuleSize, gameSize, cellX, cellY);
        return addBoard(board, populatedClickRuleP, domainSize);
    }
}

//Flips the state of the (cellX, cellY) cell 
function makeConstructTurn(board, gameSize, domainSize, cellX, cellY)
{
    let cellIndex = flatCellIndex(gameSize, cellX, cellY);
    board[cellIndex] = (board[cellIndex] + 1) % domainSize;
}

//Fast in-place version for making turns in batch provided in turnListBoard, without populating click rules
function makeTurns(board, clickRule, clickRuleSize, gameSize, domainSize, turnListBoard, isToroid) 
{
    let newBoard = board.slice();

    let clickSizeHalf = Math.floor(clickRuleSize / 2);
    for(let yBoard = 0; yBoard < gameSize; yBoard++)
    {
        for(let xBoard = 0; xBoard < gameSize; xBoard++)
        {
            let left = xBoard - clickSizeHalf;
            let top  = yBoard - clickSizeHalf;

            let clickPoint = flatCellIndex(gameSize, xBoard, yBoard);
            let turnValue  = turnListBoard[clickPoint];

            for(let yClick = 0; yClick < clickRuleSize; yClick++)
            {
                let yBig = yClick + top;
                if(!isToroid)
                {
                    if(yBig < 0 || yBig >= gameSize)
                    {
                        continue;
                    }
                }
                else
                {
                    yBig = wholeMod(yBig, gameSize);
                }

                for(let xClick = 0; xClick < clickRuleSize; xClick++)
                {
                    let xBig = xClick + left;
                    if(!isToroid)
                    {
                        if(xBig < 0 || xBig >= gameSize)
                        {
                            continue;
                        }
                    }
                    else
                    {
                        xBig = wholeMod(xBig, gameSize);
                    }

                    let bigClickIndex = flatCellIndex(gameSize, xBig, yBig);
                    let smlClickIndex = flatCellIndex(clickRuleSize, xClick, yClick);

                    newBoard[bigClickIndex] = (newBoard[bigClickIndex] + turnValue * clickRule[smlClickIndex]) % domainSize;
                }
            }
        }
    }

    return newBoard;
}

//Fast in-place version for making turns in batch provided in turnListBoard, without populating click rules. Default click rule version
function makeTurnsDefault(board, gameSize, domainSize, turnListBoard, isToroid)
{
    let newBoard = board.slice();

    if(isToroid)
    {
        for(let y = 0; y < gameSize; y++)
        {
            let topY    = wholeMod(y - 1, gameSize);
            let bottomY = wholeMod(y + 1, gameSize);

            for(let x = 0; x < gameSize; x++)
            {
                let leftX   = wholeMod(x - 1, gameSize);
                let rightX  = wholeMod(x + 1, gameSize);

                let thisCellIndex   = flatCellIndex(gameSize,      x,       y);
                let leftCellIndex   = flatCellIndex(gameSize,  leftX,       y);
                let rightCellIndex  = flatCellIndex(gameSize, rightX,       y);
                let topCellIndex    = flatCellIndex(gameSize,      x,    topY);
                let bottomCellIndex = flatCellIndex(gameSize,      x, bottomY);

                let turnValue = turnListBoard[thisCellIndex];

                newBoard[thisCellIndex]   = (newBoard[thisCellIndex]   + turnValue) % domainSize;
                newBoard[leftCellIndex]   = (newBoard[leftCellIndex]   + turnValue) % domainSize;
                newBoard[rightCellIndex]  = (newBoard[rightCellIndex]  + turnValue) % domainSize;
                newBoard[topCellIndex]    = (newBoard[topCellIndex]    + turnValue) % domainSize;
                newBoard[bottomCellIndex] = (newBoard[bottomCellIndex] + turnValue) % domainSize;
            }
        }
    }
    else
    {
        for(let y = 0; y < gameSize; y++)
        {
            for(let x = 0; x < gameSize; x++)
            {
                let thisCellIndex = flatCellIndex(gameSize, x, y);
                let turnValue     = turnListBoard[thisCellIndex];

                newBoard[thisCellIndex] = (newBoard[thisCellIndex] + turnValue) % domainSize;

                if(x > 0)
                {
                    let leftCellIndex       = flatCellIndex(gameSize, x - 1, y);
                    newBoard[leftCellIndex] = (newBoard[leftCellIndex] + turnValue) % domainSize;
                }

                if(x < gameSize - 1)
                {
                    let rightCellIndex       = flatCellIndex(gameSize, x + 1, y);
                    newBoard[rightCellIndex] = (newBoard[rightCellIndex] + turnValue) % domainSize;
                }

                if(y > 0)
                {
                    let topCellIndex       = flatCellIndex(gameSize, x, y - 1);
                    newBoard[topCellIndex] = (newBoard[topCellIndex] + turnValue) % domainSize;
                }

                if(y < gameSize - 1)
                {
                    let bottomCellIndex       = flatCellIndex(gameSize, x, y + 1);
                    newBoard[bottomCellIndex] = (newBoard[bottomCellIndex] + turnValue) % domainSize;
                }
            }
        }
    }

    return newBoard;
}

//Translates the click rule from click rule space to the board space (regular version)
function populateClickRulePlane(clickRule, clickRuleSize, gameSize, cellX, cellY)
{
    let populatedClickRule = new Uint8Array(gameSize * gameSize);
    populatedClickRule.fill(0);

    let clickSizeHalf = Math.floor(clickRuleSize / 2);

    let left = cellX - clickSizeHalf;
    let top  = cellY - clickSizeHalf;
    
    for(let y = 0; y < clickRuleSize; y++)
    {
        let yBig = y + top;
        if(yBig < 0 || yBig >= gameSize)
        {
            continue;
        }

        for(let x = 0; x < clickRuleSize; x++)
        {
            let xBig = x + left;
            if(xBig < 0 || xBig >= gameSize)
            {
                continue;
            }

            let bigClickIndex = flatCellIndex(gameSize, xBig, yBig);
            let smlClickIndex = flatCellIndex(clickRuleSize, x, y);

            populatedClickRule[bigClickIndex] = clickRule[smlClickIndex];
        }
    }

    return populatedClickRule;
}

//Translates the click rule from click rule space to the board space (toroidal version)
function populateClickRuleToroid(clickRule, clickRuleSize, gameSize, cellX, cellY)
{
    let populatedClickRule = new Uint8Array(gameSize * gameSize);
    populatedClickRule.fill(0);

    let clickSizeHalf = Math.floor(clickRuleSize / 2);

    let left = cellX - clickSizeHalf;
    let top  = cellY - clickSizeHalf;
    
    for(let y = 0; y < clickRuleSize; y++)
    {
        let yBig    = y + top;
        let yBigMod = wholeMod(yBig, gameSize);

        for(let x = 0; x < clickRuleSize; x++)
        {
            let xBig    = x + left;
            let xBigMod = wholeMod(xBig, gameSize); 

            let bigClickIndex = flatCellIndex(gameSize, xBigMod, yBigMod);
            let smlClickIndex = flatCellIndex(clickRuleSize, x, y);

            populatedClickRule[bigClickIndex] = clickRule[smlClickIndex];
        }
    }

    return populatedClickRule;
}

//Calculates the solution given the solution matrix
function calculateSolution(board, gameSize, domainSize, solutionMatrix)
{
    let matrixSize = gameSize * gameSize;
    let solution   = new Uint8Array(matrixSize);

    for(let cellIndex = 0; cellIndex < matrixSize; cellIndex++)
    {
        solution[cellIndex] = dotProductBoard(board, solutionMatrix[cellIndex], domainSize);
    }

    solution = domainInverseBoard(solution, domainSize);
    return solution;
}

//Calculates the inverse solution
function calculateInverseSolution(board, gameSize, domainSize, clickRule, clickRuleSize, isToroidBoard, isDefaultClickRule)
{
    let invSolution = new Uint8Array(gameSize * gameSize);
    invSolution.fill(0);

    if(isDefaultClickRule)
    {
        invSolution = makeTurnsDefault(invSolution, gameSize, domainSize, board, isToroidBoard);
    }
    else
    {
        invSolution = makeTurns(invSolution, clickRule, clickRuleSize, gameSize, domainSize, board, isToroidBoard);
    }

    invSolution = domainInverseBoard(invSolution, domainSize);
    return invSolution;
}

/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////    BOARD FUNCTIONS    /////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////

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

//Invalidates all elements of the board modulo domainSize, in-place
function invalidateBoardDomainInPlace(board, domainSize)
{
    if(domainSize === 0)
    {
        return;
    }

    for(let i = 0; i < board.length; i++)
    {
        board[i] = Math.min(board[i], domainSize - 1);
    }
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

//Returns true if all values of boardLeft are equal to corresponding values of boardRight, multiplied by some number
function equalsMultipliedBoard(boardLeft, boardRight, domainSize)
{
    if(boardLeft.length !== boardRight.length)
    {
        return false;
    }

    if(boardLeft.length ===0 && boardRight.length === 0)
    {
        return true;
    }

    let firstNonZeroElement = -1;
    for(let i = 0; i < boardLeft.length; i++)
    {
        if(boardLeft[i] !== 0)
        {
            firstNonZeroElement = i;
            break;
        }
    }

    if(firstNonZeroElement === -1)
    {
        for(let i = 0; i < boardLeft.length; i++)
        {
            if(boardLeft[i] !== boardRight[i])
            {
                return false;
            }
        }

        return true;
    }
    else
    {
        if(boardRight[firstNonZeroElement] === 0)
        {
            return false;
        }

        let multiplier = (invModGcdEx(boardLeft[firstNonZeroElement], domainSize) * boardRight[firstNonZeroElement]) % domainSize;
        for(let i = 0; i < boardLeft.length; i++)
        {
            if(((boardLeft[i] * multiplier) % domainSize) !== boardRight[i])
            {
                return false;
            }
        }
    
        return true;
    }
}

//////////////////////////////////////////////////////////////////////////////
/////////////////////////////////    MAIN    /////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

// eslint-disable-next-line no-unused-vars
function main()
{
    const canvas          = document.getElementById("LightsOutCanvas");
    const canvasContainer = document.getElementById("LightsOutCanvasContainer");

    const infoText = document.getElementById("LightsOutPuzzleInfo");
    const qpText   = document.getElementById("QuietPatternsInfo");
    const spText   = document.getElementById("SolutionPeriodInfo");

    const solutionMatrixBlock        = document.getElementById("SolutionMatrixBlock");
    const solutionMatrixProgress     = document.getElementById("SolutionMatrixProgress");
    const solutionMatrixProgressInfo = document.getElementById("SolutionMatrixProgressInfo");
    const solutionMatrixCancelButton = document.getElementById("SolutionMatrixCancel");

    const renderModeSelect = document.getElementById("RenderModeSel");
    const colorThemeSelect = document.getElementById("ColorThemeSel");

    const gridCheckBox = document.getElementById("GridCheckBox");

    const saveBoardButton = document.getElementById("SaveBoardButton");

    const rulesSidebar = document.getElementById("RulesSidebar");

    const increaseDomainHints      = document.getElementById("IncreaseDomainHints");
    const changeClickRuleHints     = document.getElementById("ClickRuleHints");
    const acceptClickRuleHints     = document.getElementById("ClickRuleAcceptanceHints");
    const solutionPeriodHints      = document.getElementById("SolutionPeriodHints");
    const solutionInterchangeHints = document.getElementById("SolutionInterchangeHints");
    const boardSolveHints          = document.getElementById("BoardSolveHints"); 
    const metaBoardHints           = document.getElementById("MetaBoardHints");
    const miscellaneousHints       = document.getElementById("MiscellaneousHints");

    const constructModeButton                  = document.getElementById("ConstructModeButton");
    const increaseSizeButton                   = document.getElementById("IncreaseSizeButton");
    const decreaseSizeButton                   = document.getElementById("DecreaseSizeButton");
    const increaseDomainButton                 = document.getElementById("IncreaseDomainButton");
    const decreaseDomainButton                 = document.getElementById("DecreaseDomainButton");
    const regularClickRuleButton               = document.getElementById("RegularClickRuleButton");
    const toroidalClickRuleButton              = document.getElementById("ToroidalClickRuleButton");
    const constructClickRuleButton             = document.getElementById("ConstructClickRuleButton");
    const constructToroidalClickRuleButton     = document.getElementById("ConstructToroidalClickRuleButton");
    const acceptClickRuleButton                = document.getElementById("AcceptClickRuleButton");
    const cancelClickRuleButton                = document.getElementById("CancelClickRuleButton");
    const moveBoardLeftButton                  = document.getElementById("MoveBoardLeftButton");
    const moveBoardRightButton                 = document.getElementById("MoveBoardRightButton");
    const moveBoardUpButton                    = document.getElementById("MoveBoardUpButton");
    const moveBoardDownButton                  = document.getElementById("MoveBoardDownButton");
    const invertBoardButton                    = document.getElementById("InvertBoardButton");
    const domainRotateBoardButton              = document.getElementById("DomainRotateBoardButton");
    const solveRandomButton                    = document.getElementById("SolveRandomButton");
    const solveSequentionalButton              = document.getElementById("SolveSequentionalButton");
    const calculateSolutionPeriodButton        = document.getElementById("CalculateSolutionPeriodButton");
    const calculateSolutionPerio4Button        = document.getElementById("CalculateSolutionPerio4Button");
    const calculateInverseSolutionPeriodButton = document.getElementById("CalculateInverseSolutionPeriodButton");
    const calculateEigenvectorButton           = document.getElementById("CalculateEigenvectorButton");
    const solutionInterchangesButton           = document.getElementById("SolutionInterchangesButton");
    const solution4xInterchangesButton         = document.getElementById("Solution4xInterchangesButton");
    const solutionInverseInterchangesButton    = document.getElementById("SolutionInverseInterchangesButton");
    const citybuilderInterchangesButton        = document.getElementById("CitybuilderInterchangesButton");
    const showSolutionButton                   = document.getElementById("ShowSolutionButton");
    const showInverseSolutionButton            = document.getElementById("ShowInverseSolutionButton");
    const showStabilityButton                  = document.getElementById("ShowStabilityButton");
    const showLitStabilityButton               = document.getElementById("ShowLitStabilityButton");
    const singleInterchangeButton              = document.getElementById("SingleInterchangeButton");
    const quietPatternsButton                  = document.getElementById("QuietPatternsButton");
    const randomBoardButton                    = document.getElementById("RandomBoardButton");
    const solvableRandomBoardButton            = document.getElementById("SolvableRandomBoardButton");
    const litBoardButton                       = document.getElementById("LitBoardButton");
    const unlitBoardButton                     = document.getElementById("UnlitBoardButton");
    const cornersBoardButton                   = document.getElementById("CornersBoardButton");
    const borderBoardButton                    = document.getElementById("BorderBoardButton");
    const checkersBoardButton                  = document.getElementById("CheckersBoardButton");
    const chessboardBoardButton                = document.getElementById("ChessboardBoardButton");

    const menuAccordion = document.getElementsByClassName("accordion"); 
    const menuPanels    = document.getElementsByClassName("panel"); 

    let touchStartX = null;                                                        
    let touchStartY = null;
    let touchEndX   = null;                                                        
    let touchEndY   = null;

    const gl = canvas.getContext("webgl2");
    if (!gl)
    {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    canvas.onmousedown = function(e)
    {
        let x = e.pageX - canvas.offsetLeft;
        let y = e.pageY - canvas.offsetTop;

        clickAtPoint(x, y, flagConstructClicks);
    };

    document.onkeydown = function (e)
    {
        if(document.activeElement === renderModeSelect || document.activeElement === colorThemeSelect)
        {
            return;
        }

        switch (e.code)
        {
        case "Equal": //Actually +
        {
            if(e.shiftKey)
            {
                increaseDomainButton.className = "hotkeyenabled";
                changeDomainSize(currentDomainSize + 1);
            }
            else
            {
                increaseSizeButton.className = "hotkeyenabled";
                incrementGameSize();
            }
            break;
        }
        case "Minus":
        {
            if(e.shiftKey)
            {
                decreaseDomainButton.className = "hotkeyenabled";
                changeDomainSize(currentDomainSize - 1);
            }
            else
            {
                decreaseSizeButton.className = "hotkeyenabled";
                decrementGameSize();
            }
            break;
        }
        case "Digit0":
        {
            unlitBoardButton.className = "hotkeyenabled";
            resetGameBoard(resetModes.RESET_ZERO, currentGameSize, currentDomainSize);
            break;
        }
        case "Digit1":
        {
            litBoardButton.className = "hotkeyenabled";
            resetGameBoard(resetModes.RESET_ONE, currentGameSize, currentDomainSize);
            break;
        }
        case "Digit4":
        {
            cornersBoardButton.className = "hotkeyenabled";
            resetGameBoard(resetModes.RESET_FOUR_CORNERS, currentGameSize, currentDomainSize);
            break;
        }
        case "KeyO":
        {
            if(e.shiftKey)
            {
                constructToroidalClickRuleButton.className = "hotkeyenabled";
                changeWorkingMode(workingModes.CONSTRUCT_CLICKRULE_TOROID);
            }  
            else
            {
                borderBoardButton.className = "hotkeyenabled";
                resetGameBoard(resetModes.RESET_BORDER, currentGameSize, currentDomainSize);
            }
            break;
        }
        case "KeyB":
        {
            chessboardBoardButton.className = "hotkeyenabled";
            resetGameBoard(resetModes.RESET_BLATNOY, currentGameSize, currentDomainSize);
            break;
        }
        case "KeyP":
        {
            checkersBoardButton.className = "hotkeyenabled";
            resetGameBoard(resetModes.RESET_PIETIA, currentGameSize, currentDomainSize);
            break;
        }
        case "KeyF":
        {
            randomBoardButton.className = "hotkeyenabled";
            resetGameBoard(resetModes.RESET_FULL_RANDOM, currentGameSize, currentDomainSize);
            break;
        }
        case "KeyR":
        {
            if(e.shiftKey)
            {
                regularClickRuleButton.className = "hotkeyenabled";
                enableDefaultClickRule();
                requestRedraw();
            }
            else
            {
                solvableRandomBoardButton.className = "hotkeyenabled";
                resetGameBoard(resetModes.RESET_SOLVABLE_RANDOM, currentGameSize, currentDomainSize);
            }
            break;
        }
        case "KeyI":
        {
            if(e.shiftKey)
            {
                domainRotateBoardButton.className = "hotkeyenabled";
                resetGameBoard(resetModes.RESET_DOMAIN_ROTATE_NONZERO, currentGameSize, currentDomainSize);
            }
            else
            {
                invertBoardButton.className = "hotkeyenabled";
                resetGameBoard(resetModes.RESET_INVERTO, currentGameSize, currentDomainSize);
            }
            break;
        }
        case "KeyE":
        {
            singleInterchangeButton.className = "hotkeyenabled";
            resetGameBoard(resetModes.RESET_SOLUTION, currentGameSize, currentDomainSize);
            break;
        }
        case "KeyQ":
        {
            quietPatternsButton.className = "hotkeyenabled";
            updateSolutionMatrixIfNeeded(afterCalculationOperations.CALC_NO_OP);
            break;
        }
        case "ArrowLeft":
        {
            moveBoardLeftButton.className = "hotkeyenabled";
            resetGameBoard(resetModes.RESET_LEFT, currentGameSize, currentDomainSize);
            e.preventDefault();
            break;
        }
        case "ArrowRight":
        {
            moveBoardRightButton.className = "hotkeyenabled";
            resetGameBoard(resetModes.RESET_RIGHT, currentGameSize, currentDomainSize);
            e.preventDefault();
            break;
        }
        case "ArrowUp":
        {
            moveBoardUpButton.className = "hotkeyenabled";
            resetGameBoard(resetModes.RESET_UP, currentGameSize, currentDomainSize);
            e.preventDefault();
            break;
        }
        case "ArrowDown":
        {
            moveBoardDownButton.className = "hotkeyenabled";
            resetGameBoard(resetModes.RESET_DOWN, currentGameSize, currentDomainSize);
            e.preventDefault();
            break;
        }
        case "Enter":
        {
            acceptClickRuleButton.className = "hotkeyenabled";
            acceptClickRule(); 
            break;
        }
        case "Escape":
        {
            cancelClickRuleButton.className = "hotkeyenabled";
            rejectClickRule();
            break;
        }
        case "KeyW":
        {
            showInverseSolutionButton.className = "hotkeyenabled";
            showInverseSolution(!flagShowInverseSolution);
            break;
        }
        case "KeyT":
        {
            if(e.shiftKey)
            {
                toroidalClickRuleButton.className = "hotkeyenabled";
                enableDefaultToroidClickRule();
                requestRedraw();
            }
            else
            {
                showSolutionButton.className = "hotkeyenabled";
                updateSolutionMatrixIfNeeded(afterCalculationOperations.CALC_SHOW_SOLUTION);
            }
            break;
        }
        case "KeyM":
        {
            if(e.shiftKey)
            {
                constructClickRuleButton.className = "hotkeyenabled";
                changeWorkingMode(workingModes.CONSTRUCT_CLICKRULE);
            }
            break;
        }
        case "KeyA":
        {
            if(e.shiftKey)
            {
                showLitStabilityButton.className = "hotkeyenabled";
                showLitStability(!flagShowLitStability && !flagShowStability);
            }
            else
            {
                showStabilityButton.className = "hotkeyenabled";
                showStability(!flagShowLitStability && !flagShowStability);
            }
            break;
        }
        case "KeyS":
        {
            solveRandomButton.className = "hotkeyenabled";
            toggleSolveBoard(afterCalculationOperations.CALC_SOLVE_RANDOM);
            break;
        }
        case "KeyC":
        {
            solveSequentionalButton.className = "hotkeyenabled";
            toggleSolveBoard(afterCalculationOperations.CALC_SOLVE_SEQUENTIAL);
            break;
        }
        case "KeyG":
        {
            if(e.shiftKey)
            {
                calculateEigenvectorButton.className = "hotkeyenabled";
            }
            else
            {
                citybuilderInterchangesButton.className = "hotkeyenabled";
            }

            if(flagPeriodBackCounting || flagPeriodCounting || flagPerio4Counting || flagEigvecCounting)
            {
                changeCountingMode(countingModes.COUNT_NONE, false);
            }
            else
            {
                changeCountingMode(countingModes.COUNT_EIGENVECTOR, e.shiftKey);
            }
            break;
        }    
        case "KeyV":
        {
            if(e.shiftKey)
            {
                calculateSolutionPeriodButton.className = "hotkeyenabled";
            }
            else
            {
                solutionInterchangesButton.className = "hotkeyenabled";
            }

            if(flagPeriodBackCounting || flagPeriodCounting || flagPerio4Counting || flagEigvecCounting)
            {
                changeCountingMode(countingModes.COUNT_NONE, false);
            }
            else
            {
                if(e.shiftKey)
                {
                    updateSolutionMatrixIfNeeded(afterCalculationOperations.CALC_SOULTION_PERIOD_WITH_STOP);
                }
                else
                {
                    updateSolutionMatrixIfNeeded(afterCalculationOperations.CALC_SOULTION_PERIOD);
                }
            }
            break;
        }
        case "KeyX":
        {
            if(e.shiftKey)
            {
                calculateSolutionPerio4Button.className = "hotkeyenabled";
            }
            else
            {
                solution4xInterchangesButton.className = "hotkeyenabled";
            }

            if(flagPeriodBackCounting || flagPeriodCounting || flagPerio4Counting || flagEigvecCounting)
            {
                changeCountingMode(countingModes.COUNT_NONE, false);
            }
            else
            {
                if(e.shiftKey)
                {
                    updateSolutionMatrixIfNeeded(afterCalculationOperations.CALC_SOULTION_PERIO4_WITH_STOP);
                }
                else
                {
                    updateSolutionMatrixIfNeeded(afterCalculationOperations.CALC_SOULTION_PERIO4);
                }
            }
            break;
        } 
        case "KeyZ":
        {
            if(e.shiftKey)
            {
                calculateInverseSolutionPeriodButton.className = "hotkeyenabled";
            }
            else
            {
                solutionInverseInterchangesButton.className = "hotkeyenabled";
            }

            if(flagPeriodBackCounting || flagPeriodCounting || flagPerio4Counting || flagEigvecCounting)
            {
                changeCountingMode(countingModes.COUNT_NONE, false);
            }
            else
            {
                changeCountingMode(countingModes.COUNT_INVERSE_SOLUTION_PERIOD, e.shiftKey);
            }
            break;
        }
        case "ControlLeft":
        {
            constructModeButton.className = "hotkeyenabled";
            flagConstructClicks = true;
            break;
        }
        default:
        {
            break;
        }
        }
    };

    document.onkeyup = function(e)
    {
        if(document.activeElement === renderModeSelect || document.activeElement === colorThemeSelect)
        {
            return;
        }

        switch(e.code)
        {
        case "Equal": //Actually +
        {
            increaseDomainButton.className = "hotkeydisabled";
            increaseSizeButton.className = "hotkeydisabled";
            break;
        }
        case "Minus":
        {
            decreaseDomainButton.className = "hotkeydisabled";
            decreaseSizeButton.className   = "hotkeydisabled";
            break;
        }
        case "ControlLeft":
        {
            flagConstructClicks = false;
            constructModeButton.className = "hotkeydisabled";
            break;
        }
        case "Digit0":
        {
            unlitBoardButton.className = "hotkeydisabled";
            break;
        }
        case "Digit1":
        {
            litBoardButton.className = "hotkeydisabled";
            break;
        }
        case "Digit4":
        {
            cornersBoardButton.className = "hotkeydisabled";
            break;
        }
        case "KeyO":
        {
            constructToroidalClickRuleButton.className = "hotkeydisabled";
            borderBoardButton.className                = "hotkeydisabled";
            break;
        }
        case "KeyB":
        {
            chessboardBoardButton.className = "hotkeydisabled";
            break;
        }
        case "KeyP":
        {
            checkersBoardButton.className = "hotkeydisabled";
            break;
        }
        case "KeyF":
        {
            randomBoardButton.className = "hotkeydisabled";
            break;
        }
        case "KeyR":
        {
            regularClickRuleButton.className    = "hotkeydisabled";
            solvableRandomBoardButton.className = "hotkeydisabled";
            break;
        }
        case "KeyI":
        {
            domainRotateBoardButton.className = "hotkeydisabled";
            invertBoardButton.className       = "hotkeydisabled";
            break;
        }
        case "KeyE":
        {
            singleInterchangeButton.className = "hotkeydisabled";
            break;
        }
        case "KeyQ":
        {
            quietPatternsButton.className = "hotkeydisabled";
            break;
        }
        case "ArrowLeft":
        {
            moveBoardLeftButton.className = "hotkeydisabled";
            break;
        }
        case "ArrowRight":
        {
            moveBoardRightButton.className = "hotkeydisabled";
            break;
        }
        case "ArrowUp":
        {
            moveBoardUpButton.className = "hotkeydisabled";
            break;
        }
        case "ArrowDown":
        {
            moveBoardDownButton.className = "hotkeydisabled";
            break;
        }
        case "Enter":
        {
            acceptClickRuleButton.className = "hotkeydisabled";
            break;
        }
        case "Escape":
        {
            cancelClickRuleButton.className = "hotkeydisabled";
            break;
        }
        case "KeyW":
        {
            showInverseSolutionButton.className = "hotkeydisabled";
            break;
        }
        case "KeyT":
        {
            toroidalClickRuleButton.className = "hotkeydisabled";
            showSolutionButton.className      = "hotkeydisabled";
            break;
        }
        case "KeyM":
        {
            constructClickRuleButton.className = "hotkeydisabled";
            break;
        }
        case "KeyA":
        {
            showLitStabilityButton.className = "hotkeydisabled";
            showStabilityButton.className    = "hotkeydisabled";
            break;
        }
        case "KeyS":
        {
            solveRandomButton.className = "hotkeydisabled";
            break;
        }
        case "KeyC":
        {
            solveSequentionalButton.className = "hotkeydisabled";
            break;
        }
        case "KeyG":
        {
            calculateEigenvectorButton.className    = "hotkeydisabled";
            citybuilderInterchangesButton.className = "hotkeydisabled";
            break;
        }    
        case "KeyV":
        {
            calculateSolutionPeriodButton.className = "hotkeydisabled";
            solutionInterchangesButton.className    = "hotkeydisabled";
            break;
        }
        case "KeyX":
        {
            calculateSolutionPerio4Button.className = "hotkeydisabled";
            solution4xInterchangesButton.className  = "hotkeydisabled";
            break;
        } 
        case "KeyZ":
        {
            calculateInverseSolutionPeriodButton.className = "hotkeydisabled";
            solutionInverseInterchangesButton.className    = "hotkeydisabled";
            break;
        }
        case "ShiftLeft":
        {
            increaseDomainButton.className                 = "hotkeydisabled";
            decreaseDomainButton.className                 = "hotkeydisabled";
            regularClickRuleButton.className               = "hotkeydisabled";
            toroidalClickRuleButton.className              = "hotkeydisabled";
            constructClickRuleButton.className             = "hotkeydisabled";
            constructToroidalClickRuleButton.className     = "hotkeydisabled";
            showLitStabilityButton.className               = "hotkeydisabled";
            domainRotateBoardButton.className              = "hotkeydisabled";
            calculateSolutionPeriodButton.className        = "hotkeydisabled";
            calculateSolutionPerio4Button.className        = "hotkeydisabled";
            calculateInverseSolutionPeriodButton.className = "hotkeydisabled";
            calculateEigenvectorButton.className           = "hotkeydisabled";
            break;
        }
        default:
        {
            break;
        }
        }
    }

    document.ontouchstart = function(e)
    {
        if(e.touches.length == 1)
        {
            const touch = e.touches[0];                                
            touchStartX = touch.clientX;                                      
            touchStartY = touch.clientY;
        }
    };
    
    document.ontouchmove = function(e)
    {
        if(e.touches.length == 1)
        {
            if(!touchStartX || !touchStartY) 
            {
                return;
            }

            const touch = e.touches[0];
            touchEndX = touch.clientX;
            touchEndY = touch.clientY;
        }
    }

    document.ontouchend = function(e) 
    {
        if(!touchStartX || !touchStartY || !touchEndX || !touchEndY) 
        {
            return;
        }

        let diffX = touchEndX - touchStartX;
        let diffY = touchEndY - touchStartY;
        if(Math.abs(diffX) > Math.abs(diffY)) 
        {
            let currentIndex = 0;
            for(let i = 0; i < menuPanels.length; i++) 
            {
                if(menuPanels[i].classList.contains("active"))
                {
                    currentIndex = i;
                    break;
                }
            }
            
            menuPanels[currentIndex].classList.toggle("active");
            if(diffX > 0) 
            {
                let prevIndex = (currentIndex + menuPanels.length - 1) % menuPanels.length; 
                menuPanels[prevIndex].classList.toggle("active");
            }
            else 
            {
                let nextIndex = (currentIndex + 1) % menuPanels.length; 
                menuPanels[nextIndex].classList.toggle("active");
            }
        }
        else
        {
            if(diffY > 0)
            {
                rulesSidebar.classList.remove("active");
            }
            else
            {
                rulesSidebar.classList.add("active");
            }
        }                                                         

        touchStartX = null;
        touchStartY = null;                                             
        touchEndX   = null;
        touchEndY   = null;
    };

    //Can change to do it on button click 
    for (let i = 0; i < menuAccordion.length; i++) 
    {
        menuAccordion[i].addEventListener("click", function() 
        {
            this.classList.toggle("active");

            let panel = this.nextElementSibling;
            if(panel.style.maxHeight)
            {
                panel.style.maxHeight = null;
            }
            else 
            {
                panel.style.maxHeight = panel.scrollHeight + "px";
            } 
        });

        //TODO: Swipe exactly here
    }

    renderModeSelect.onchange = function()
    {
        setRenderMode(renderModeSelect.value);
        renderModeSelect.blur(); //Blur - Beetlebum
        canvas.focus();
    };

    colorThemeSelect.onchange = function()
    {
        setColorTheme(colorThemeSelect.value);
        colorThemeSelect.blur(); //Blur - Charmless Man
        canvas.focus();
    }

    gridCheckBox.onclick = function()
    {
        setGridVisible(gridCheckBox.checked);
        updateAddressBar(20);
    };

    //solutionMatrixProgress and solutionMatrixCancelButton should act as a whole
    solutionMatrixProgressInfo.onclick = function()
    {
        recreateSolutionMatrixWorker(); //This cancels the calculation
        currentSolutionMatrixCalculated = false;
    }

    solutionMatrixCancelButton.onclick = function()
    {
        recreateSolutionMatrixWorker(); //This cancels the calculation
        currentSolutionMatrixCalculated = false;
    }

    saveBoardButton.onclick = function()
    {
        flagNeedToSaveBoard = true;
        requestRedraw();
    }

    constructModeButton.onclick = function()
    {
        flagConstructClicks = !flagConstructClicks;
        if(flagConstructClicks)
        {
            constructModeButton.className = "hotkeyenabled";
        }
        else
        {
            constructModeButton.className = "hotkeydisabled";
        }
    }

    increaseSizeButton.onclick = function()
    {
        incrementGameSize();
    }
    
    decreaseSizeButton.onclick = function()
    {
        decrementGameSize();
    }

    increaseDomainButton.onclick = function()
    {
        changeDomainSize(currentDomainSize + 1);
    }

    decreaseDomainButton.onclick = function()
    {
        changeDomainSize(currentDomainSize - 1);
    }

    unlitBoardButton.onclick = function()
    {
        resetGameBoard(resetModes.RESET_ZERO, currentGameSize, currentDomainSize);
    }

    litBoardButton.onclick = function()
    {
        resetGameBoard(resetModes.RESET_ONE, currentGameSize, currentDomainSize);
    }

    cornersBoardButton.onclick = function()
    {
        resetGameBoard(resetModes.RESET_FOUR_CORNERS, currentGameSize, currentDomainSize);
    }

    constructToroidalClickRuleButton.onclick = function()
    {
        changeWorkingMode(workingModes.CONSTRUCT_CLICKRULE_TOROID);
    }  

    borderBoardButton.onclick = function()
    {
        resetGameBoard(resetModes.RESET_BORDER, currentGameSize, currentDomainSize);
    }

    chessboardBoardButton.onclick = function()
    {
        resetGameBoard(resetModes.RESET_BLATNOY, currentGameSize, currentDomainSize);
    }

    checkersBoardButton.onclick = function()
    {
        resetGameBoard(resetModes.RESET_PIETIA, currentGameSize, currentDomainSize);
    }

    randomBoardButton.onclick = function()
    {
        resetGameBoard(resetModes.RESET_FULL_RANDOM, currentGameSize, currentDomainSize);
    }

    regularClickRuleButton.onclick = function()
    {
        enableDefaultClickRule();
        requestRedraw();
    }

    solvableRandomBoardButton.onclick = function()
    {
        resetGameBoard(resetModes.RESET_SOLVABLE_RANDOM, currentGameSize, currentDomainSize);
    }

    domainRotateBoardButton.onclick = function()
    {
        resetGameBoard(resetModes.RESET_DOMAIN_ROTATE_NONZERO, currentGameSize, currentDomainSize);
    }

    invertBoardButton.onclick = function()
    {
        resetGameBoard(resetModes.RESET_INVERTO, currentGameSize, currentDomainSize);
    }

    singleInterchangeButton.onclick = function()
    {
        resetGameBoard(resetModes.RESET_SOLUTION, currentGameSize, currentDomainSize);
    }

    quietPatternsButton.onclick = function()
    {
        updateSolutionMatrixIfNeeded(afterCalculationOperations.CALC_NO_OP);
    }

    moveBoardLeftButton.onclick = function()
    {
        resetGameBoard(resetModes.RESET_LEFT, currentGameSize, currentDomainSize);
    }

    moveBoardRightButton.onclick = function()
    {
        resetGameBoard(resetModes.RESET_RIGHT, currentGameSize, currentDomainSize);
    }

    moveBoardUpButton.onclick = function()
    {
        resetGameBoard(resetModes.RESET_UP, currentGameSize, currentDomainSize);
    }

    moveBoardDownButton.onclick = function()
    {
        resetGameBoard(resetModes.RESET_DOWN, currentGameSize, currentDomainSize);
    }

    acceptClickRuleButton.onclick = function()
    {
        acceptClickRule(); 
    }

    cancelClickRuleButton.onclick = function()
    {
        rejectClickRule();
    }

    showInverseSolutionButton.onclick = function()
    {
        showInverseSolution(!flagShowInverseSolution);
    }

    toroidalClickRuleButton.onclick = function()
    {
        enableDefaultToroidClickRule();
        requestRedraw();
    }

    showSolutionButton.onclick = function()
    {
        updateSolutionMatrixIfNeeded(afterCalculationOperations.CALC_SHOW_SOLUTION);
    }

    constructClickRuleButton.onclick = function()
    {
        changeWorkingMode(workingModes.CONSTRUCT_CLICKRULE);
    }

    showLitStabilityButton.onclick = function()
    {
        showLitStability(!flagShowLitStability && !flagShowStability);
    }

    showStabilityButton.onclick = function()
    {
        showStability(!flagShowLitStability && !flagShowStability);
    }

    solveRandomButton.onclick = function()
    {
        toggleSolveBoard(afterCalculationOperations.CALC_SOLVE_RANDOM);
    }

    solveSequentionalButton.onclick = function()
    {
        toggleSolveBoard(afterCalculationOperations.CALC_SOLVE_SEQUENTIAL);
    }

    calculateEigenvectorButton.onclick = function()
    {
        if(flagPeriodBackCounting || flagPeriodCounting || flagPerio4Counting || flagEigvecCounting)
        {
            changeCountingMode(countingModes.COUNT_NONE, false);
        }
        else
        {
            changeCountingMode(countingModes.COUNT_EIGENVECTOR, true);
        }
    }

    citybuilderInterchangesButton.onclick = function()
    {
        if(flagPeriodBackCounting || flagPeriodCounting || flagPerio4Counting || flagEigvecCounting)
        {
            changeCountingMode(countingModes.COUNT_NONE, false);
        }
        else
        {
            changeCountingMode(countingModes.COUNT_EIGENVECTOR, false);
        }
    }

    calculateSolutionPeriodButton.onclick = function()
    {
        if(flagPeriodBackCounting || flagPeriodCounting || flagPerio4Counting || flagEigvecCounting)
        {
            changeCountingMode(countingModes.COUNT_NONE, false);
        }
        else
        {
            updateSolutionMatrixIfNeeded(afterCalculationOperations.CALC_SOULTION_PERIOD_WITH_STOP);
        }
    }
    
    solutionInterchangesButton.onclick = function()
    {
        if(flagPeriodBackCounting || flagPeriodCounting || flagPerio4Counting || flagEigvecCounting)
        {
            changeCountingMode(countingModes.COUNT_NONE, false);
        }
        else
        {
            updateSolutionMatrixIfNeeded(afterCalculationOperations.CALC_SOULTION_PERIOD);
        }
    }
    
    calculateSolutionPerio4Button.onclick = function()
    {
        if(flagPeriodBackCounting || flagPeriodCounting || flagPerio4Counting || flagEigvecCounting)
        {
            changeCountingMode(countingModes.COUNT_NONE, false);
        }
        else
        {
            updateSolutionMatrixIfNeeded(afterCalculationOperations.CALC_SOULTION_PERIO4_WITH_STOP);
        }
    }
    
    solution4xInterchangesButton.onclick = function()
    {
        if(flagPeriodBackCounting || flagPeriodCounting || flagPerio4Counting || flagEigvecCounting)
        {
            changeCountingMode(countingModes.COUNT_NONE, false);
        }
        else
        {
            updateSolutionMatrixIfNeeded(afterCalculationOperations.CALC_SOULTION_PERIO4);
        }
    }

    calculateInverseSolutionPeriodButton.onclick = function()
    {
        if(flagPeriodBackCounting || flagPeriodCounting || flagPerio4Counting || flagEigvecCounting)
        {
            changeCountingMode(countingModes.COUNT_NONE, false);
        }
        else
        {
            changeCountingMode(countingModes.COUNT_INVERSE_SOLUTION_PERIOD, true);
        }
    }

    solutionInverseInterchangesButton.onclick = function()
    {
        if(flagPeriodBackCounting || flagPeriodCounting || flagPerio4Counting || flagEigvecCounting)
        {
            changeCountingMode(countingModes.COUNT_NONE, false);
        }
        else
        {
            changeCountingMode(countingModes.COUNT_INVERSE_SOLUTION_PERIOD, false);
        }
    }

    let boardGenModes =
    {
        BOARDGEN_FULL_RANDOM:  1, //Generate a random board
        BOARDGEN_ZERO_ELEMENT: 2, //Generate a fully unlit board
        BOARDGEN_ONE_ELEMENT:  3, //Generate a fully lit board
        BOARDGEN_BLATNOY:      4, //Generate a chessboard pattern board
        BOARDGEN_PIETIA_STYLE: 5, //Generate a checkers pattern board
        BOARDGEN_BORDER:       6, //Generate a border board
        BOARDGEN_4_CORNERS:    7  //Generate a four corners board
    };

    let resetModes =
    {
        RESET_ONE:                    1, //Fully lit board
        RESET_ZERO:                   2, //Fully unlit board
        RESET_BORDER:                 3, //Border board
        RESET_PIETIA:                 4, //Checkers board
        RESET_BLATNOY:                5, //Chessboard board
        RESET_FOUR_CORNERS:           6, //4 lit corners
        RESET_SOLVABLE_RANDOM:        7, //Random board, always solvable
        RESET_FULL_RANDOM:            8, //Random board
        RESET_SOLUTION:               9, //Current board -> Current solution/Current stability
        RESET_INVERTO:               10, //Current board -> Inverted current board
        RESET_DOMAIN_ROTATE_NONZERO: 11, //Current board -> Nonzero domain rotated current board
        RESET_LEFT:                  12, //Current board -> Current board moved left
        RESET_RIGHT:                 13, //Current board -> Current board moved right
        RESET_UP:                    14, //Current board -> Current board moved up
        RESET_DOWN:                  15  //Current board -> Current board moved down
    };

    let workingModes =
    {
        LIT_BOARD:                  1,
        CONSTRUCT_CLICKRULE:        2,
        CONSTRUCT_CLICKRULE_TOROID: 3
    };

    let countingModes =
    {
        COUNT_NONE:                    1,
        COUNT_SOLUTION_PERIOD:         2,
        COUNT_INVERSE_SOLUTION_PERIOD: 3,
        COUNT_SOLUTION_PERIOD_4X:      4,
        COUNT_EIGENVECTOR:             5
    };

    let afterCalculationOperations =
    {
        CALC_NO_OP:                     1,
        CALC_SHOW_SOLUTION:             2,
        CALC_SOULTION_PERIOD:           3,
        CALC_SOULTION_PERIOD_WITH_STOP: 4,
        CALC_SOULTION_PERIO4:           5,
        CALC_SOULTION_PERIO4_WITH_STOP: 6,
        CALC_SOLVE_RANDOM:              7,
        CALC_SOLVE_SEQUENTIAL:          8
    }

    const minimumBoardSize = 1;
    const maximumBoardSize = 256;

    const minimumDomainSize = 2;
    const maximumDomainSize = 255;

    const canvasContainerWidth  = canvasContainer.clientWidth;
    const canvasContainerHeight = canvasContainer.clientHeight;

    const canvasSize = Math.max(canvasContainerWidth, canvasContainerHeight);

    let currentViewportWidth  = canvasContainerWidth;
    let currentViewportHeight = canvasContainerHeight;

    let currentViewportOffsetX = 0;
    let currentViewportOffsetY = 0;

    let currentAnimationFrame = 0;

    let flagRandomSolving           = false;
    let flagShowSolution            = false;
    let flagShowInverseSolution     = false;
    let flagShowStability           = false;
    let flagShowLitStability        = false;
    let flagNoGrid                  = false;
    let flagPeriodCounting          = false;
    let flagEigvecCounting          = false;
    let flagPerio4Counting          = false;
    let flagPeriodBackCounting      = false;
    let flagStopCountingWhenFound   = false;
    let flagToroidBoard             = false;
    let flagTickLoop                = false;
    let flagDefaultClickRule        = false;
    let flagConstructClicks         = false;
    let flagNeedToSaveBoard         = false;

    let currentGameClickRule    = null;
    let currentGameBoard        = null;
    let currentGameSolution     = null;
    let currentGameStability    = null;
    let currentGameLitStability = null;
    let currentCountedBoard     = null;
    let currentSavedBoard       = null;

    let currentClickRuleSize = 3;
    let currentGameSize      = 15;
    let currentSavedGameSize = 15;
    let currentDomainSize    = 2;

    let currentCellSize = Math.ceil(canvasSize / currentGameSize) - 1;

    let currentColorLit     = [0.0, 1.0, 0.0, 1.0];
    let currentColorUnlit   = [0.0, 0.0, 0.0, 1.0];
    let currentColorSolved  = [0.0, 0.0, 1.0, 1.0];
    let currentColorBetween = [0.0, 0.0, 0.0, 1.0];

    let currentWorkingMode  = workingModes.LIT_BOARD;

    let currentSolutionMatrix = [];

    let currentSolutionMatrixCalculating = false;
    let currentSolutionMatrixCalculated  = false;

    let currentQuietPatterns = 0;

    let currentTurnList = [];

    let currentPeriodCount = 0;

    let currentShaderProgram = null;

    let squaresShaderProgram   = null;
    let circlesShaderProgram   = null;
    let diamondsShaderProgram  = null;
    let beamsShaderProgram     = null;
    let raindropsShaderProgram = null;
    let chainsShaderProgram    = null;

    let boardTexture     = null;
    let solutionTexture  = null;
    let stabilityTexture = null;

    let boardTextureUniformLocation     = null;
    let solutionTextureUniformLocation  = null;
    let stabilityTextureUniformLocation = null;

    let boardSizeUniformLocation  = null;
    let cellSizeUniformLocation   = null;
    let domainSizeUniformLocation = null;
    let flagsUniformLocation      = null;

    let canvasWidthUniformLocation     = null;
    let canvasHeightUniformLocation    = null;
    let viewportXOffsetUniformLocation = null;
    let viewportYOffsetUniformLocation = null;

    let colorNoneUniformLocation    = null;
    let colorEnabledUniformLocation = null;
    let colorSolvedUniformLocation  = null;
    let colorBetweenUniformLocation = null;

    let drawVertexBuffer = null; //Still don't know about WebGL gl_VertexID support :/

    let drawVertexBufferAttribLocation = null;

    let solutionMatrixWorker = null;

    let updateAddressBarTimeout = null;
    let currentEncodedClickRule = "Default";

    let queryString = new URLSearchParams(window.location.search);

    solutionMatrixBlock.hidden  = true; //Only show it during solution matrix calculation
    acceptClickRuleHints.hidden = true; //Only show it when click rule is constructed

    createTextures();
    createShaders();

    initPuzzleContents();
    updateViewport();

    //==========================================================================================================================================================================

    function incrementGameSize()
    {
        if(currentWorkingMode === workingModes.LIT_BOARD)
        {
            changeGameSize(currentGameSize + 1);
        }
        else
        {
            changeGameSize(currentGameSize + 2);
        }
    }

    function decrementGameSize()
    {
        if(currentWorkingMode === workingModes.LIT_BOARD)
        {
            changeGameSize(currentGameSize - 1);
        }
        else
        {
            changeGameSize(currentGameSize - 2);
        }
    }

    function changeGameSize(newSize)
    {
        showStability(false);
        showLitStability(false);
        showSolution(false);
        showInverseSolution(false);

        if(currentWorkingMode == workingModes.LIT_BOARD)
        {
            recreateSolutionMatrixWorker();
            currentSolutionMatrixCalculated = false;
        }

        changeCountingMode(countingModes.COUNT_NONE, false);
        currentTurnList.length = 0;
        flagRandomSolving = false;
        
        currentGameSize = clamp(newSize, minimumBoardSize, maximumBoardSize);

        qpText.textContent = "Quiet patterns: ";

        if(currentWorkingMode === workingModes.LIT_BOARD)
        {
            resetGameBoard(resetModes.RESET_SOLVABLE_RANDOM, currentGameSize, currentDomainSize);
            infoText.textContent = "Lights Out " + currentGameSize + "x" + currentGameSize + " DOMAIN " + currentDomainSize;

            updateAddressBar(500); //Update the address bar with 1000ms delay
        }
        else
        {
            currentGameBoard = generateNewBoard(currentGameSize, currentDomainSize, boardGenModes.BOARDGEN_ZERO_ELEMENT);

            resetStability();
            updateStabilityTexture();

            currentGameBoard = makeTurn(currentGameBoard, currentGameClickRule, currentClickRuleSize, currentGameSize, currentDomainSize, Math.floor(currentGameSize / 2), Math.floor(currentGameSize / 2), false);
            infoText.textContent = "Lights Out click rule " + currentGameSize + "x" + currentGameSize + " DOMAIN " + currentDomainSize;
        }

        currentCellSize = Math.ceil(canvasSize / currentGameSize) - 1;

        let newCanvasSize = canvasSizeFromGameSize(currentGameSize, currentCellSize, !flagNoGrid);
        currentViewportWidth  = newCanvasSize.width;
        currentViewportHeight = newCanvasSize.height;

        canvas.width        = currentViewportWidth;
        canvas.height       = currentViewportHeight;
        canvas.clientWidth  = currentViewportWidth;
        canvas.clientHeight = currentViewportHeight;

        updateBoardTexture();

        updateViewport();
        requestRedraw();
    }

    function changeDomainSize(newSize)
    {
        if(currentWorkingMode != workingModes.LIT_BOARD)
        {
            return;
        }

        showStability(false);
        showLitStability(false);
        showSolution(false);
        showInverseSolution(false);

        recreateSolutionMatrixWorker();
        currentSolutionMatrixCalculated = false;

        changeCountingMode(countingModes.COUNT_NONE, false);
        currentTurnList.length = 0;
        flagRandomSolving = false;

        currentDomainSize = clamp(newSize, minimumDomainSize, maximumDomainSize);

        updateAddressBar(500); //Update the address bar with 1000ms delay

        resetGameBoard(resetModes.RESET_SOLVABLE_RANDOM, currentGameSize, currentDomainSize);
        invalidateBoardDomainInPlace(currentGameClickRule, currentDomainSize); //Click rule invalidation

        infoText.textContent = "Lights Out  " + currentGameSize + "x" + currentGameSize + " DOMAIN " + currentDomainSize;
        updateBoardTexture();

        requestRedraw();
    }

    function clickAtPoint(x, y, isConstruct)
    {
        let boardPoint = boardPointFromCanvasPoint(x, y, currentGameSize, currentViewportOffsetX, currentViewportOffsetY, currentViewportWidth, currentViewportHeight, !flagNoGrid);

        let modX = boardPoint.xBoard;
        let modY = boardPoint.yBoard;

        if(currentWorkingMode === workingModes.LIT_BOARD)
        {
            if(isConstruct)
            {
                makeConstructTurn(currentGameBoard, currentGameSize, currentDomainSize, modX, modY);
            }
            else
            {
                currentGameBoard = makeTurn(currentGameBoard, currentGameClickRule, currentClickRuleSize, currentGameSize, currentDomainSize, modX, modY, flagToroidBoard);
            }
        }
        else if(currentWorkingMode === workingModes.CONSTRUCT_CLICKRULE || currentWorkingMode === workingModes.CONSTRUCT_CLICKRULE_TOROID)
        {
            makeConstructTurn(currentGameBoard, currentGameSize, currentDomainSize, modX, modY);
        }

        resetStability();

        if(flagShowSolution)
        {
            currentGameSolution = calculateSolution(currentGameBoard, currentGameSize, currentDomainSize, currentSolutionMatrix);
            updateSolutionTexture();
        }
        else if(flagShowInverseSolution)
        {
            currentGameSolution = calculateInverseSolution(currentGameBoard, currentGameSize, currentDomainSize, currentGameClickRule, currentClickRuleSize, flagToroidBoard, flagDefaultClickRule);
            updateSolutionTexture();
        }

        if(flagShowStability)
        {
            updateStabilityTexture();
        }
        else if(flagShowLitStability)
        {
            calculateLitStability();
            updateStabilityTexture();
        }

        updateBoardTexture();
        requestRedraw();
    }

    function enableDefaultClickRule()
    {   
        recreateSolutionMatrixWorker();
        currentSolutionMatrixCalculated = false;

        let clickRuleValues = [0, 1, 0, //eslint-disable-next-line indent
                               1, 1, 1, //eslint-disable-next-line indent
                               0, 1, 0];

        currentClickRuleSize = 3;
        currentGameClickRule = new Uint8Array(clickRuleValues);

        flagToroidBoard      = false;
        flagDefaultClickRule = true;

        currentEncodedClickRule = "Default";
        updateAddressBar(50);
    }

    function enableDefaultToroidClickRule()
    {   
        recreateSolutionMatrixWorker();
        currentSolutionMatrixCalculated = false;

        let clickRuleValues = [0, 1, 0, // eslint-disable-next-line indent
                               1, 1, 1, // eslint-disable-next-line indent
                               0, 1, 0];

        currentClickRuleSize = 3;
        currentGameClickRule = new Uint8Array(clickRuleValues);

        flagToroidBoard      = true;
        flagDefaultClickRule = true;

        currentEncodedClickRule = "Toroid";
        updateAddressBar(50);
    }

    function enableCustomClickRule(clickRule, clickRuleSize, isToroid)
    {
        recreateSolutionMatrixWorker();
        currentSolutionMatrixCalculated = false;

        currentGameClickRule = clickRule;
        currentClickRuleSize = clickRuleSize;

        flagToroidBoard      = isToroid;
        flagDefaultClickRule = false;

        currentEncodedClickRule = encodeBase64ClickRule(clickRule, isToroid);
        updateAddressBar(50);
    }

    function resetStability()
    {
        currentGameStability = new Uint8Array(currentGameSize * currentGameSize);
        currentGameStability.fill(currentDomainSize - 1);
    }

    function updateSolutionMatrixIfNeeded(operationAfter)
    {
        //Only if it's not calculated already AND isn't being calculated now
        if(!currentSolutionMatrixCalculating && !currentSolutionMatrixCalculated)
        {
            currentSolutionMatrixCalculating = true;
            solutionMatrixBlock.hidden       = false;

            solutionMatrixWorker.postMessage({command: "CalcSolutionMatrix", params: {clickRule: currentGameClickRule, gameSize: currentGameSize, domainSize: currentDomainSize, clickRuleSize: currentClickRuleSize, isToroid: flagToroidBoard, opAfter: operationAfter}});
        }
        else if(currentSolutionMatrixCalculated) //Matrix already calculated, do the operation specified
        {
            operationAfterInverseMatrix(operationAfter);
        }
    }

    function recreateSolutionMatrixWorker()
    {
        if(solutionMatrixWorker == null || currentSolutionMatrixCalculating)
        {
            if(solutionMatrixWorker != null)
            {
                solutionMatrixWorker.terminate();
            }

            solutionMatrixProgressInfo.textContent = "Solution matrix: 0%";

            solutionMatrixWorker = new Worker(URL.createObjectURL(new Blob(["("+solutionMatrixWorkerFunction.toString()+")()"], {type: 'text/javascript'})));
            solutionMatrixWorker.addEventListener("message", function(e)
            {
                switch(e.data.command)
                {
                    case "Progress":
                    {
                        let nextValue = e.data.params.progress;

                        let solutionCalcWidthPercent           = Math.floor(100 * nextValue) + "%";
                        solutionMatrixProgressInfo.textContent = "Solution matrix: " + solutionCalcWidthPercent;
                        solutionMatrixProgress.style.width     = solutionCalcWidthPercent;
                        break;
                    }
                    case "Finish":
                    {
                        currentSolutionMatrix = e.data.params.matrix;
                        currentQuietPatterns  = e.data.params.qp;

                        qpText.textContent = "Quiet patterns: " + currentQuietPatterns;

                        solutionMatrixBlock.hidden             = true;
                        solutionMatrixProgressInfo.textContent = "Solution matrix: 0%";

                        currentSolutionMatrixCalculating = false;
                        currentSolutionMatrixCalculated  = true;

                        operationAfterInverseMatrix(e.data.params.opAfter);
                    }
                }
            });
        }
        
        solutionMatrixBlock.hidden       = true;
        currentSolutionMatrixCalculating = false;
    }
    
    function operationAfterInverseMatrix(operationAfter)
    {
        switch(operationAfter)
        {
            case afterCalculationOperations.CALC_NO_OP:
            {
                break;
            }
            case afterCalculationOperations.CALC_SHOW_SOLUTION:
            {
                showSolution(!flagShowSolution);
                break;
            }
            case afterCalculationOperations.CALC_SOULTION_PERIOD:
            {
                changeCountingMode(countingModes.COUNT_SOLUTION_PERIOD, false);
                break;
            }
            case afterCalculationOperations.CALC_SOULTION_PERIOD_WITH_STOP:
            {
                changeCountingMode(countingModes.COUNT_SOLUTION_PERIOD, true);
                break;
            }
            case afterCalculationOperations.CALC_SOULTION_PERIO4:
            {
                changeCountingMode(countingModes.COUNT_SOLUTION_PERIOD_4X, false);
                break;
            }
            case afterCalculationOperations.CALC_SOULTION_PERIO4_WITH_STOP:
            {
                changeCountingMode(countingModes.COUNT_SOLUTION_PERIOD_4X, true);
                break;
            }
            case afterCalculationOperations.CALC_SOLVE_RANDOM:
            {
                if(currentWorkingMode == workingModes.LIT_BOARD)
                {
                    currentGameSolution = calculateSolution(currentGameBoard, currentGameSize, currentDomainSize, currentSolutionMatrix);
                    updateSolutionTexture();
    
                    currentTurnList = buildTurnList(currentGameSolution, currentGameSize);
    
                    flagRandomSolving = true;
    
                    flagTickLoop = true;
                    currentAnimationFrame = window.requestAnimationFrame(nextTick);
                }

                break;
            }
            case afterCalculationOperations.CALC_SOLVE_SEQUENTIAL:
            {
                if(currentWorkingMode == workingModes.LIT_BOARD)
                {
                    currentGameSolution = calculateSolution(currentGameBoard, currentGameSize, currentDomainSize, currentSolutionMatrix);
                    updateSolutionTexture();
    
                    currentTurnList = buildTurnList(currentGameSolution, currentGameSize);
    
                    flagRandomSolving = false;
    
                    flagTickLoop = true;
                    currentAnimationFrame = window.requestAnimationFrame(nextTick);
                }

                break;
            }
        }
    }

    function calculateNewStabilityValue(boardToCompare)
    {
        return incDifBoard(currentGameStability, currentGameBoard, boardToCompare, currentDomainSize);
    }

    function calculateLitStability()
    {
        return mulComponentWiseBoard(currentGameStability, currentGameBoard, currentDomainSize);
    }

    function resetGameBoard(resetMode)
    {
        currentTurnList.length = 0;
        flagRandomSolving = false;

        if(resetMode === resetModes.RESET_LEFT || resetMode === resetModes.RESET_RIGHT || resetMode === resetModes.RESET_UP || resetMode === resetModes.RESET_DOWN)
        {
            showStability(false);
            showLitStability(false);

            switch(resetMode)
            {
            case resetModes.RESET_LEFT:
            {
                currentGameBoard = moveBoardLeft(currentGameBoard, currentGameSize);
                break;
            }
            case resetModes.RESET_RIGHT:
            {
                currentGameBoard = moveBoardRight(currentGameBoard, currentGameSize);
                break;
            }
            case resetModes.RESET_UP:
            {
                currentGameBoard = moveBoardUp(currentGameBoard, currentGameSize);
                break;
            }
            case resetModes.RESET_DOWN:
            {
                currentGameBoard = moveBoardDown(currentGameBoard, currentGameSize);
                break;
            }
            default:
            {
                break;
            }
            }

            resetStability();
            updateStabilityTexture();

            if(flagShowSolution)
            {
                currentGameSolution = calculateSolution(currentGameBoard, currentGameSize, currentDomainSize, currentSolutionMatrix);
                updateSolutionTexture();
            }
            else if(flagShowInverseSolution)
            {
                currentGameSolution = calculateInverseSolution(currentGameBoard, currentGameSize, currentDomainSize, currentGameClickRule, currentClickRuleSize, flagToroidBoard, flagDefaultClickRule);
                updateSolutionTexture();
            }
        }
        else if(resetMode === resetModes.RESET_SOLUTION)
        {
            if(currentWorkingMode !== workingModes.LIT_BOARD)
            {
                return;
            }

            if(flagShowSolution || flagShowInverseSolution)
            {
                currentGameStability = calculateNewStabilityValue(currentGameSolution);
                currentGameBoard = currentGameSolution;

                if(flagShowLitStability)
                {
                    currentGameLitStability = calculateLitStability();
                    updateStabilityTexture();
                }
                else if(flagShowStability)
                {
                    updateStabilityTexture();
                }

                showSolution(false);
                showInverseSolution(false);
            }
            else if(flagShowStability)
            {
                currentGameBoard = currentGameStability;

                showStability(false);
                resetStability();

                updateStabilityTexture();
            }
            else if(flagShowLitStability)
            {
                currentGameBoard = currentGameLitStability;

                showLitStability(false);
                resetStability();

                updateStabilityTexture();
            }
        }
        else if(resetMode === resetModes.RESET_INVERTO || resetMode === resetModes.RESET_DOMAIN_ROTATE_NONZERO)
        {
            showStability(false);
            showLitStability(false);

            switch(resetMode)
            {
            case resetModes.RESET_INVERTO:
            {
                currentGameBoard = domainShiftBoard(currentGameBoard, currentDomainSize);
                break;
            }
            case resetModes.RESET_DOMAIN_ROTATE_NONZERO:
            {
                currentGameBoard = domainRotateNonZeroBoard(currentGameBoard, currentDomainSize);
                break;
            }
            default:
            {
                break;
            }
            }

            resetStability();
            updateStabilityTexture();

            if(flagShowSolution)
            {
                currentGameSolution = calculateSolution(currentGameBoard, currentGameSize, currentDomainSize, currentSolutionMatrix);
                updateSolutionTexture();
            }
            else if(flagShowInverseSolution)
            {
                currentGameSolution = calculateInverseSolution(currentGameBoard, currentGameSize, currentDomainSize, currentGameClickRule, currentClickRuleSize, flagToroidBoard, flagDefaultClickRule);
                updateSolutionTexture();
            }
        }
        else if(resetMode === resetModes.RESET_SOLVABLE_RANDOM)
        {
            if(currentWorkingMode !== workingModes.LIT_BOARD)
            {
                return;
            }

            showStability(false);
            showLitStability(false);
            showSolution(false);
            showInverseSolution(false);

            currentGameBoard = generateNewBoard(currentGameSize, currentDomainSize, boardGenModes.BOARDGEN_FULL_RANDOM);
            currentGameBoard = calculateInverseSolution(currentGameBoard, currentGameSize, currentDomainSize, currentGameClickRule, currentClickRuleSize, flagToroidBoard, flagDefaultClickRule);

            resetStability();
            updateStabilityTexture();
        }
        else
        {
            showStability(false);
            showLitStability(false);
            showSolution(false);
            showInverseSolution(false);

            let modeBgen = boardGenModes.BOARDGEN_ONE_ELEMENT;
            switch(resetMode)
            {
            case resetModes.RESET_ONE:
            {
                modeBgen = boardGenModes.BOARDGEN_ONE_ELEMENT;
                break;
            }
            case resetModes.RESET_ZERO:
            {
                modeBgen = boardGenModes.BOARDGEN_ZERO_ELEMENT; 
                break;
            }
            case resetModes.RESET_FOUR_CORNERS:
            {
                modeBgen = boardGenModes.BOARDGEN_4_CORNERS;
                break;
            }
            case resetModes.RESET_BORDER:
            {
                modeBgen = boardGenModes.BOARDGEN_BORDER;
                break;
            }
            case resetModes.RESET_PIETIA:
            {
                modeBgen = boardGenModes.BOARDGEN_PIETIA_STYLE;
                break;
            }
            case resetModes.RESET_BLATNOY:
            {
                modeBgen = boardGenModes.BOARDGEN_BLATNOY;
                break;
            }
            case resetModes.RESET_FULL_RANDOM:
            {
                modeBgen = boardGenModes.BOARDGEN_FULL_RANDOM;
                break;
            }
            default:
            {
                break;    
            }
            }

            currentGameBoard = generateNewBoard(currentGameSize, currentDomainSize, modeBgen);

            resetStability();
            updateStabilityTexture();
        }

        updateBoardTexture();
        requestRedraw();
    }

    function generateNewBoard(gameSize, domainSize, bgenMode)
    {
        let generatedBoard = new Uint8Array(gameSize * gameSize);

        let minVal = 0;
        let maxVal = domainSize - 1;

        for(let y = 0; y < gameSize; y++) 
        {
            for(let x = 0; x < gameSize; x++)
            {
                let cellNumber = y * gameSize + x;

                switch (bgenMode)
                {
                case boardGenModes.BOARDGEN_FULL_RANDOM:
                {
                    let randomCellValue = minVal + Math.floor(Math.random() * (maxVal - minVal + 1));
                    generatedBoard[cellNumber] = randomCellValue;
                    break;
                }
                case boardGenModes.BOARDGEN_ZERO_ELEMENT:
                {
                    generatedBoard[cellNumber] = minVal;
                    break;
                }
                case boardGenModes.BOARDGEN_ONE_ELEMENT:
                {
                    generatedBoard[cellNumber] = maxVal;
                    break;
                }
                case boardGenModes.BOARDGEN_BLATNOY:
                {
                    if(x % 2 === y % 2)
                    {
                        generatedBoard[cellNumber] = minVal;
                    }
                    else
                    {
                        generatedBoard[cellNumber] = maxVal;
                    }
                    break;
                }
                case boardGenModes.BOARDGEN_PIETIA_STYLE:
                {
                    if(y % 2 !== 0)
                    {
                        if(x % 2 === 0)
                        {
                            generatedBoard[cellNumber] = maxVal;
                        }
                        else
                        {
                            generatedBoard[cellNumber] = minVal;
                        }
                    }
                    else
                    {
                        generatedBoard[cellNumber] = minVal;
                    }
                    break;
                }
                case boardGenModes.BOARDGEN_BORDER:
                {
                    if(y === 0 || y === (gameSize - 1) || x === 0 || x === (gameSize - 1))
                    {
                        generatedBoard[cellNumber] = maxVal;
                    }
                    else
                    {
                        generatedBoard[cellNumber] = minVal;
                    }
                    break;
                }
                case boardGenModes.BOARDGEN_4_CORNERS:
                {
                    if((y === 0 && x === 0) || (y === (gameSize - 1) && x === 0) || (y === 0 && x === (gameSize - 1)) || (y === (gameSize - 1) && x === (gameSize - 1)))
                    {
                        generatedBoard[cellNumber] = maxVal;
                    }
                    else
                    {
                        generatedBoard[cellNumber] = minVal;
                    }
                    break;
                }
                }
            }
        }

        return generatedBoard;
    }

    function toggleSolveBoard(type)
    {
        if(currentTurnList.length == 0)
        {
            updateSolutionMatrixIfNeeded(type);
        }
        else
        {
            currentTurnList.length = 0;
            window.cancelAnimationFrame(currentAnimationFrame);
            flagTickLoop = false;
        }
    }

    function changeCountingMode(newCountingMode, stopWhenReturned)
    {
        if(currentWorkingMode !== workingModes.LIT_BOARD)
        {
            return;
        }

        if(!currentSolutionMatrixCalculated && (newCountingMode == countingModes.COUNT_SOLUTION_PERIOD || newCountingMode == countingModes.COUNT_SOLUTION_PERIOD_4X))
        {
            return;
        }

        flagPeriodCounting     = false;
        flagPeriodBackCounting = false;
        flagPerio4Counting     = false;
        flagEigvecCounting     = false;

        showSolution(false);
        showInverseSolution(false);

        currentTurnList.length = 0;
        flagRandomSolving = false;

        switch(newCountingMode)
        {
        case countingModes.COUNT_NONE:
        {
            if(currentPeriodCount !== 0 && flagStopCountingWhenFound)
            {
                spText.textContent = "Solution period so far is " + currentPeriodCount;
            }
            break;
        }
        case countingModes.COUNT_SOLUTION_PERIOD:
        {
            if(currentSolutionMatrixCalculated)
            {
                flagPeriodCounting = true;
            }
            break;
        }
        case countingModes.COUNT_SOLUTION_PERIOD_4X:
        {
            if(currentSolutionMatrixCalculated)
            {
                flagPerio4Counting = true;
            }
            break;
        }
        case countingModes.COUNT_INVERSE_SOLUTION_PERIOD:
        {
            flagPeriodBackCounting = true;
            break;
        }
        case countingModes.COUNT_EIGENVECTOR:
        {
            flagEigvecCounting = true;
            break;
        }
        }

        flagStopCountingWhenFound = stopWhenReturned;

        if(flagPeriodBackCounting || flagPeriodCounting || flagPerio4Counting)
        {
            currentPeriodCount = 0;
            currentCountedBoard = currentGameBoard.slice();

            flagTickLoop = true;
            currentAnimationFrame = window.requestAnimationFrame(nextTick);
        }
        else if(flagEigvecCounting)
        {
            currentPeriodCount = 0;
            currentCountedBoard = currentGameBoard.slice();
            currentGameBoard    = calculateInverseSolution(currentGameBoard, currentGameSize, currentDomainSize, currentGameClickRule, currentClickRuleSize, flagToroidBoard, flagDefaultClickRule);

            currentGameBoard = domainInverseBoard(currentGameBoard, currentDomainSize);

            flagTickLoop = true;
            currentAnimationFrame = window.requestAnimationFrame(nextTick);
        }
        else
        {
            cancelAnimationFrame(currentAnimationFrame);
            flagTickLoop = false;
        }
    }

    function changeWorkingMode(workingMode)
    {
        //First problem: flags. There are A LOL of them
        showSolution(false);
        showInverseSolution(false);
        showStability(false);
        showLitStability(false);

        //We can change for normal mode here too!
        flagRandomSolving           = false;
        flagPeriodCounting          = false;
        flagEigvecCounting          = false;
        flagPerio4Counting          = false;
        flagPeriodBackCounting      = false;
        flagStopCountingWhenFound   = false;
        flagTickLoop                = false;

        currentWorkingMode = workingMode;
        
        if(workingMode == workingModes.CONSTRUCT_CLICKRULE || workingMode == workingModes.CONSTRUCT_CLICKRULE_TOROID)
        {
            currentSavedBoard    = currentGameBoard.slice();
            currentSavedGameSize = currentGameSize; 

            changeGameSize(currentClickRuleSize);
            currentGameBoard = currentGameClickRule;
            updateBoardTexture();

           infoText.textContent = "Lights Out click rule " + currentGameSize + "x" + currentGameSize + " DOMAIN " + currentDomainSize;

           acceptClickRuleHints.hidden     = false;
           increaseDomainHints.hidden      = true;
           changeClickRuleHints.hidden     = true;
           solutionPeriodHints.hidden      = true;
           solutionInterchangeHints.hidden = true;
           boardSolveHints.hidden          = true;
           metaBoardHints.hidden           = true;
           miscellaneousHints.hidden       = true;
        }
        else
        {
            acceptClickRuleHints.hidden     = true;
            increaseDomainHints.hidden      = false;
            changeClickRuleHints.hidden     = false;
            solutionPeriodHints.hidden      = false;
            solutionInterchangeHints.hidden = false;
            boardSolveHints.hidden          = false;
            metaBoardHints.hidden           = false;
            miscellaneousHints.hidden       = false;
        }

        requestRedraw();
    }

    function acceptClickRule()
    {
        if(currentWorkingMode === workingModes.CONSTRUCT_CLICKRULE || currentWorkingMode === workingModes.CONSTRUCT_CLICKRULE_TOROID)
        {
            let isToroid = false;
            if(currentWorkingMode == workingModes.CONSTRUCT_CLICKRULE_TOROID)
            {
                isToroid = true;
            }

            enableCustomClickRule(currentGameBoard.slice(), currentGameSize, isToroid);

            changeGameSize(currentSavedGameSize);
            currentGameBoard = currentSavedBoard.slice();

            updateBoardTexture();

            requestRedraw();
            changeWorkingMode(workingModes.LIT_BOARD);

            infoText.textContent = "Lights Out " + currentGameSize + "x" + currentGameSize + " DOMAIN " + currentDomainSize;
        }
    }

    function rejectClickRule()
    {
        if(currentWorkingMode === workingModes.CONSTRUCT_CLICKRULE || currentWorkingMode === workingModes.CONSTRUCT_CLICKRULE_TOROID)
        {
            changeGameSize(currentSavedGameSize);
            currentGameBoard = currentSavedBoard.slice();

            updateBoardTexture();

            requestRedraw();
            changeWorkingMode(workingModes.LIT_BOARD);

            infoText.textContent = "Lights Out " + currentGameSize + "x" + currentGameSize + " DOMAIN " + currentDomainSize;
        }
    }

    function buildTurnList(board, gameSize)
    {
        let turnList = [];

        for(let y = 0; y < gameSize; y++)
        {
            for(let x = 0; x < gameSize; x++)
            {
                let cellIndex = flatCellIndex(gameSize, x, y);
                for(let i = 0; i < board[cellIndex]; i++)
                {
                    turnList.push({cellX: x, cellY: y});
                }
            }
        }

        return turnList.reverse(); //Turn lists are oriented bottom-up
    }

    function showSolution(showFlag)
    {
        if(currentWorkingMode !== workingModes.LIT_BOARD)
        {
            flagShowSolution        = false;
            flagShowInverseSolution = false;
            return;
        }

        currentTurnList.length = 0;
        flagRandomSolving = false;

        flagShowInverseSolution = false;
        if(showFlag)
        {
            flagShowSolution = true;

            currentGameSolution = calculateSolution(currentGameBoard, currentGameSize, currentDomainSize, currentSolutionMatrix);
            updateSolutionTexture();
        }
        else
        {
            flagShowSolution = false;
        }

        requestRedraw();
    }

    function showInverseSolution(showFlag)
    {
        if(currentWorkingMode !== workingModes.LIT_BOARD)
        {
            flagShowSolution        = false;
            flagShowInverseSolution = false;
            return;
        }

        currentTurnList.length = 0;
        flagRandomSolving = false;

        flagShowSolution = false;
        if(showFlag)
        {
            flagShowInverseSolution = true;

            currentGameSolution = calculateInverseSolution(currentGameBoard, currentGameSize, currentDomainSize, currentGameClickRule, currentClickRuleSize, flagToroidBoard, flagDefaultClickRule);
            updateSolutionTexture();
        }
        else
        {
            flagShowInverseSolution = false;
        }

        requestRedraw();
    }

    function showStability(showFlag)
    {
        if(currentWorkingMode !== workingModes.LIT_BOARD || currentDomainSize > 2)
        {
            flagShowStability    = false;
            flagShowLitStability = false;
            return;
        }

        currentTurnList.length = 0;
        flagRandomSolving = false;

        flagShowLitStability = false;
        if(showFlag)
        {
            flagShowStability = true;
            showSolution(false);

            updateStabilityTexture();
        }
        else
        {
            flagShowStability = false;
        }

        requestRedraw();
    }

    function showLitStability(showFlag)
    {
        if(currentWorkingMode !== workingModes.LIT_BOARD || currentDomainSize > 2)
        {
            flagShowStability    = false;
            flagShowLitStability = false;
            return;
        }

        currentTurnList.length = 0;
        flagRandomSolving = false;

        flagShowStability = false;
        if(showFlag)
        {
            flagShowLitStability = true;
            showSolution(false);

            currentGameLitStability = calculateLitStability();
            updateStabilityTexture();
        }
        else
        {
            flagShowLitStability = false;
        }

        requestRedraw();
    }

    function setRenderMode(renderMode)
    {
        let valueSelect = renderMode;
        switch(renderMode)
        {
        case "Squares":
        {
            currentShaderProgram = squaresShaderProgram;
            break;
        }
        case "Circles":
        {
            currentShaderProgram = circlesShaderProgram;
            break;
        }
        case "Diamonds":
        {
            currentShaderProgram = diamondsShaderProgram;
            break;
        }
        case "BEAMS":
        {
            currentShaderProgram = beamsShaderProgram;
            break;
        }
        case "Raindrops":
        {
            currentShaderProgram = raindropsShaderProgram;
            break;
        }
        case "Chains":
        {
            currentShaderProgram = chainsShaderProgram;
            break;
        }
        default:
        {
            currentShaderProgram = squaresShaderProgram;
            valueSelect          = "Squares";
            break;
        }
        }

        renderModeSelect.value = valueSelect;
        
        updateAddressBar(50);

        boardSizeUniformLocation  = gl.getUniformLocation(currentShaderProgram, "gBoardSize");
        cellSizeUniformLocation   = gl.getUniformLocation(currentShaderProgram, "gCellSize");
        domainSizeUniformLocation = gl.getUniformLocation(currentShaderProgram, "gDomainSize");
        flagsUniformLocation      = gl.getUniformLocation(currentShaderProgram, "gFlags");

        canvasWidthUniformLocation     = gl.getUniformLocation(currentShaderProgram, "gImageWidth");
        canvasHeightUniformLocation    = gl.getUniformLocation(currentShaderProgram, "gImageHeight");
        viewportXOffsetUniformLocation = gl.getUniformLocation(currentShaderProgram, "gViewportOffsetX");
        viewportYOffsetUniformLocation = gl.getUniformLocation(currentShaderProgram, "gViewportOffsetY");

        colorNoneUniformLocation    = gl.getUniformLocation(currentShaderProgram, "gColorNone");
        colorEnabledUniformLocation = gl.getUniformLocation(currentShaderProgram, "gColorEnabled");
        colorSolvedUniformLocation  = gl.getUniformLocation(currentShaderProgram, "gColorSolved");
        colorBetweenUniformLocation = gl.getUniformLocation(currentShaderProgram, "gColorBetween");

        boardTextureUniformLocation     = gl.getUniformLocation(currentShaderProgram, "gBoard");
        solutionTextureUniformLocation  = gl.getUniformLocation(currentShaderProgram, "gSolution");
        stabilityTextureUniformLocation = gl.getUniformLocation(currentShaderProgram, "gStability");
                
        drawVertexBufferAttribLocation = gl.getAttribLocation(currentShaderProgram, "vScreenPos");

        const posArray = new Float32Array([-1.0,  1.0, 0.0, 1.0, // eslint-disable-next-line indent
                                            1.0,  1.0, 0.0, 1.0, // eslint-disable-next-line indent
                                           -1.0, -1.0, 0.0, 1.0, // eslint-disable-next-line indent
                                            1.0, -1.0, 0.0, 1.0]);

        let posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, posArray, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        drawVertexBuffer = gl.createVertexArray();
        gl.bindVertexArray(drawVertexBuffer);
        gl.enableVertexAttribArray(drawVertexBufferAttribLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.vertexAttribPointer(drawVertexBufferAttribLocation, 4, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.bindVertexArray(null);

        requestRedraw();
    }

    function setColorTheme(colorTheme)
    {
        let valueSelect = colorTheme;
        switch(colorTheme)
        {
        case "Neon":
        {
            currentColorLit     = [0.0, 1.0, 0.0, 1.0];
            currentColorUnlit   = [0.0, 0.0, 0.0, 1.0];
            currentColorSolved  = [0.0, 0.0, 1.0, 1.0];
            currentColorBetween = [0.0, 0.0, 0.0, 1.0];
            break;
        }
        case "Autumn":
        {
            currentColorLit     = [1.0,   1.0,   0.0,   1.0];
            currentColorUnlit   = [0.153, 0.086, 0.078, 1.0];
            currentColorSolved  = [0.133, 0.545, 0.133, 1.0];
            currentColorBetween = [0.153, 0.086, 0.078, 1.0];
            break;
        }
        case "Strawberry":
        {
            currentColorLit     = [1.0,   0.412, 0.706, 1.0];
            currentColorUnlit   = [1.0,   0.894, 0.769, 1.0];
            currentColorSolved  = [0.824, 0.412, 0.118, 1.0];
            currentColorBetween = [1.0,   0.894, 0.769, 1.0];
            break;
        }
        case "HardToSee":
        {
            currentColorLit     = [0.0,   0.0,   0.502, 1.0];
            currentColorUnlit   = [0.0,   0.0,   0.545, 1.0];
            currentColorSolved  = [0.098, 0.098, 0.439, 1.0];
            currentColorBetween = [0.0,   0.0,   0.545, 1.0];
            break;
        }
        case "Pietia":
        {
            currentColorLit     = [0.980, 0.984, 0.988, 1.0];
            currentColorUnlit   = [0.459, 0.733, 0.992, 1.0];
            currentColorSolved  = [0.639, 0.694, 0.745, 1.0];
            currentColorBetween = [0.459, 0.733, 0.992, 1.0];
            break;
        }
        default:
        {
            currentColorLit     = [0.0, 1.0, 0.0, 1.0];
            currentColorUnlit   = [0.0, 0.0, 0.0, 1.0];
            currentColorSolved  = [0.0, 0.0, 1.0, 1.0];
            currentColorBetween = [0.0, 0.0, 0.0, 1.0];
            valueSelect          = "Neon";
            break;
        }
        }

        colorThemeSelect.value = valueSelect;

        updateAddressBar(50);

        requestRedraw();
    }

    function setGridVisible(visible)
    {
        flagNoGrid = !visible;

        let newCanvasSize = canvasSizeFromGameSize(currentGameSize, currentCellSize, visible);
        currentCellSize   = Math.ceil(canvasSize / currentGameSize) - 1;

        currentViewportWidth  = newCanvasSize.width;
        currentViewportHeight = newCanvasSize.height;

        canvas.width        = currentViewportWidth;
        canvas.height       = currentViewportHeight;
        canvas.clientWidth  = currentViewportWidth;
        canvas.clientHeight = currentViewportHeight;

        updateViewport();
        requestRedraw();
    }

    function updateViewport()
    {
        currentViewportOffsetY = (canvas.height - currentViewportHeight);                                         //If I don't do this, the image will be from bottom to top
        gl.viewport(currentViewportOffsetX, currentViewportOffsetY, currentViewportWidth, currentViewportHeight); //Very careful here. 
    }

    function nextTick()
    {
        if(currentTurnList.length !== 0)
        {
            let turn = (-1, -1);
            if(flagRandomSolving)
            {
                let randomIndex = Math.floor(Math.random() * currentTurnList.length);

                turn                                        = currentTurnList[randomIndex];
                currentTurnList[randomIndex]                = currentTurnList[currentTurnList.length - 1];
                currentTurnList[currentTurnList.length - 1] = turn;

                currentTurnList.pop();
            }
            else
            {
                turn = currentTurnList.pop();
            }

            currentGameBoard = makeTurn(currentGameBoard, currentGameClickRule, currentClickRuleSize, currentGameSize, currentDomainSize, turn.cellX, turn.cellY, flagToroidBoard);
            updateBoardTexture();

            resetStability();
            if(flagShowStability || flagShowLitStability)
            {
                updateStabilityTexture();
            }

            if(currentTurnList.length === 0)
            {
                flagTickLoop = false; //No need for the next tick
            }
        }

        if(flagPeriodBackCounting)
        {
            currentPeriodCount++;

            currentGameSolution = calculateInverseSolution(currentGameBoard, currentGameSize, currentDomainSize, currentGameClickRule, currentClickRuleSize, flagToroidBoard, flagDefaultClickRule);
            
            currentGameStability = calculateNewStabilityValue(currentGameSolution);
            currentGameBoard     = currentGameSolution;

            updateBoardTexture();

            if(flagShowLitStability)
            {
                currentGameLitStability = calculateLitStability();
                updateStabilityTexture();
            }
            else if(flagShowStability)
            {
                updateStabilityTexture();
            }

            if(flagStopCountingWhenFound && equalsBoard(currentGameBoard, currentCountedBoard))
            {
                flagStopCountingWhenFound = false;
                changeCountingMode(countingModes.COUNT_NONE, false);
                flagTickLoop = false;
            }

            if(!flagTickLoop) //Just stopped, period is found
            {
                spText.textContent = "Solution period: " + currentPeriodCount;
            }
            else
            {
                spText.textContent = "Interchanges: " + currentPeriodCount;
            }
        }

        if(flagPeriodCounting)
        {
            currentPeriodCount++;

            currentGameSolution = calculateSolution(currentGameBoard, currentGameSize, currentDomainSize, currentSolutionMatrix);
            
            currentGameStability = calculateNewStabilityValue(currentGameSolution);
            currentGameBoard     = currentGameSolution;

            updateBoardTexture();

            if(flagShowLitStability)
            {
                currentGameLitStability = calculateLitStability();
                updateStabilityTexture();
            }
            else if(flagShowStability)
            {
                updateStabilityTexture();
            }

            if(flagStopCountingWhenFound && equalsBoard(currentGameBoard, currentCountedBoard))
            {
                flagStopCountingWhenFound = false;
                changeCountingMode(countingModes.COUNT_NONE, false);
                flagTickLoop = false;
            }

            if(!flagTickLoop) //Just stopped, period is found
            {
                spText.textContent = "Solution period: " + currentPeriodCount;
            }
            else
            {
                spText.textContent = "Interchanges: " + currentPeriodCount;
            }
        }

        if(flagPerio4Counting)
        {
            currentGameSolution = currentGameBoard.slice();
            for(let i = 0; i < 4; i++)
            {
                currentPeriodCount++;
                currentGameSolution = calculateSolution(currentGameSolution, currentGameSize, currentDomainSize, currentSolutionMatrix);
                if(flagStopCountingWhenFound && equalsBoard(currentGameSolution, currentCountedBoard))
                {
                    flagStopCountingWhenFound = false;
                    changeCountingMode(countingModes.COUNT_NONE, false);
                    flagTickLoop = false;
                    
                    break;
                } 
            }
            
            currentGameStability = calculateNewStabilityValue(currentGameSolution);
            currentGameBoard     = currentGameSolution;

            updateBoardTexture();

            if(flagShowLitStability)
            {
                currentGameLitStability = calculateLitStability();
                updateStabilityTexture();
            }
            else if(flagShowStability)
            {
                updateStabilityTexture();
            }

            if(!flagTickLoop) //Just stopped, period is found
            {
                spText.textContent = "Solution period: " + currentPeriodCount;
            }
            else
            {
                spText.textContent = "Interchanges: " + currentPeriodCount;
            }
        }

        if(flagEigvecCounting)
        {
            currentPeriodCount++;

            let citybuilderBoard = addBoard(currentGameBoard, currentCountedBoard, currentDomainSize);

            currentGameSolution = calculateInverseSolution(citybuilderBoard, currentGameSize, currentDomainSize, currentGameClickRule, currentClickRuleSize, flagToroidBoard, flagDefaultClickRule);
            if(flagStopCountingWhenFound && equalsMultipliedBoard(currentGameSolution, citybuilderBoard, currentDomainSize)) //Solution is the current board multiplied by a number => we found an eigenvector
            {
                flagStopCountingWhenFound = false;
                changeCountingMode(countingModes.COUNT_NONE, false);
                flagTickLoop = false;
            }

            currentGameStability = calculateNewStabilityValue(currentGameSolution);
            currentGameBoard     = currentGameSolution;

            currentGameBoard = domainInverseBoard(currentGameBoard, currentDomainSize);

            updateBoardTexture();

            if(flagShowLitStability)
            {
                currentGameLitStability = calculateLitStability();
                updateStabilityTexture();
            }
            else if(flagShowStability)
            {
                updateStabilityTexture();
            }

            if(!flagTickLoop) //Just stopped, period is found
            {
                spText.textContent = "Solution period: " + currentPeriodCount;
            }
            else
            {
                spText.textContent = "Interchanges: " + currentPeriodCount;
            }
        }

        requestRedraw();
        
        if(flagTickLoop)
        {
            currentAnimationFrame = window.requestAnimationFrame(nextTick);
        }
    }

    function saveBoardToImage()
    {
        let link      = document.createElement("a");
        link.href     = canvas.toDataURL("image/png");
        link.download = "LightsOut.png";

        link.click();
        link.remove();
    }

    function initPuzzleContents()
    {
        let gameSize         = 15;
        let domainSize       = 2;
        let renderMode       = "Squares";
        let colorTheme       = "Neon";
        let encodedClickRule = "";
        let showGrid         = true;

        const gameSizeStr = queryString.get("size");
        if(gameSizeStr !== null && gameSizeStr !== "")
        {
            let gameSizeVal = parseInt(gameSizeStr, 10);
            if(!isNaN(gameSizeVal))
            {
                gameSize = Math.floor(gameSizeVal);
            }
        }

        const domainSizeStr = queryString.get("domain");
        if(domainSizeStr !== null && domainSizeStr !== "")
        {
            let domainSizeVal = parseInt(domainSizeStr, 10);
            if(!isNaN(domainSizeVal))
            {
                domainSize = Math.floor(domainSizeVal);
            }
        }

        const renderModeOptions = [...renderModeSelect.options];
        const allRenderModes = renderModeOptions.map(opt => opt.value);
        const renderModeStr  = queryString.get("renderMode");
        if(renderModeStr !== null && allRenderModes.includes(renderModeStr))
        {
            renderMode = renderModeStr;
        }

        const colorThemeOptions = [...colorThemeSelect.options];
        const allColorThemes = colorThemeOptions.map(opt => opt.value);
        const colorThemeStr  = queryString.get("colorTheme");
        if(colorThemeStr !== null && allColorThemes.includes(colorThemeStr))
        {
            colorTheme = colorThemeStr;
        }

        const clickRuleStr = queryString.get("clickRule");
        if(clickRuleStr !== null)
        {
            encodedClickRule = clickRuleStr;
        }

        const showGridStr = queryString.get("showGrid");
        if(showGridStr !== null)
        {
            showGrid = !(showGridStr === "false");
        }

        //-----------------------Everything is read, initialize it-----------------------

        if(encodedClickRule === "" || encodedClickRule.toUpperCase() === "Default".toUpperCase())
        {
            enableDefaultClickRule(); //For initialization we should already have a click rule
        }
        else if(encodedClickRule.toUpperCase() === "Toroid".toUpperCase())
        {
            enableDefaultToroidClickRule();
        }
        else
        {
            let decodedClickRuleData = decodeBase64ClickRule(encodedClickRule, domainSize, minimumBoardSize, maximumBoardSize);
            enableCustomClickRule(decodedClickRuleData.clickrule, decodedClickRuleData.clickrulesize, decodedClickRuleData.istoroid);
        }

        changeGameSize(gameSize);
        changeDomainSize(domainSize);

        setRenderMode(renderMode);
        setColorTheme(colorTheme);

        gridCheckBox.checked = showGrid;
        setGridVisible(showGrid);
        
        requestRedraw();
    }

    function updateAddressBar(delay)
    {
        clearTimeout(updateAddressBarTimeout);

        updateAddressBarTimeout = setTimeout(function()
        {
            let gameSize = 0;
            if(currentWorkingMode == workingModes.LIT_BOARD)
            {
                gameSize = currentGameSize;
            }
            else
            {
                gameSize = currentSavedGameSize;
            }            

            queryString.set("size",       gameSize);
            queryString.set("domain",     currentDomainSize);
            queryString.set("renderMode", renderModeSelect.value);
            queryString.set("colorTheme", colorThemeSelect.value);
            queryString.set("showGrid",   gridCheckBox.checked);
            queryString.set("clickRule",  currentEncodedClickRule);

            window.history.replaceState({}, '', window.location.pathname + "?" + queryString);
        }, delay);
    }

    function requestRedraw()
    {
        mainDraw();
    }

    function createTextures()
    {
        let emptyTexData = new Uint8Array(maximumBoardSize * maximumBoardSize);
        emptyTexData.fill(0);

        boardTexture     = gl.createTexture();
        solutionTexture  = gl.createTexture();
        stabilityTexture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, boardTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8UI, maximumBoardSize, maximumBoardSize, 0, gl.RED_INTEGER, gl.UNSIGNED_BYTE, emptyTexData);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,     gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,     gl.CLAMP_TO_EDGE);

        gl.bindTexture(gl.TEXTURE_2D, solutionTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8UI, maximumBoardSize, maximumBoardSize, 0, gl.RED_INTEGER, gl.UNSIGNED_BYTE, emptyTexData);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,     gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,     gl.CLAMP_TO_EDGE);

        gl.bindTexture(gl.TEXTURE_2D, stabilityTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8UI, maximumBoardSize, maximumBoardSize, 0, gl.RED_INTEGER, gl.UNSIGNED_BYTE, emptyTexData);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,     gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,     gl.CLAMP_TO_EDGE);
    }

    function createShaders()
    {
        const vsSource = 
        `#version 300 es

        layout(location = 0) in mediump vec4 vScreenPos;
        void main(void)
        {
            gl_Position = vScreenPos;
        }
        `;

        const squaresFsSource = 
        `#version 300 es

        #define FLAG_SHOW_SOLUTION  0x01
        #define FLAG_SHOW_STABILITY 0x02
        #define FLAG_TOROID_RENDER  0x04
        #define FLAG_NO_GRID        0x08

        uniform int gBoardSize;
        uniform int gCellSize;
        uniform int gDomainSize;
        uniform int gFlags;

        uniform int gImageWidth;
        uniform int gImageHeight;
        uniform int gViewportOffsetX;
        uniform int gViewportOffsetY;
 
        uniform lowp vec4 gColorNone;
        uniform lowp vec4 gColorEnabled;
        uniform lowp vec4 gColorSolved;
        uniform lowp vec4 gColorBetween;

        uniform highp usampler2D gBoard;
        uniform highp usampler2D gSolution;
        uniform highp usampler2D gStability;

        layout(location = 0) out lowp vec4 outColor;

        void main(void)
        {
            ivec2 screenPos = ivec2(int(gl_FragCoord.x) - gViewportOffsetX, gImageHeight - int(gl_FragCoord.y) - 1 + gViewportOffsetY);

            if(((gFlags & FLAG_NO_GRID) != 0) || ((screenPos.x % gCellSize != 0) && (screenPos.y % gCellSize != 0))) //Inside the cell
            {
                highp ivec2 cellNumber = screenPos.xy / ivec2(gCellSize, gCellSize);

		        uint          cellValue = texelFetch(gBoard, cellNumber, 0).x;
		        mediump float cellPower = float(cellValue) / float(gDomainSize - 1);

                outColor = mix(gColorNone, gColorEnabled, cellPower);

                if((gFlags & FLAG_SHOW_SOLUTION) != 0)
                {
		            uint          solutionValue = texelFetch(gSolution, cellNumber, 0).x;
		            mediump float solutionPower = float(solutionValue) / float(gDomainSize - 1);

                    outColor = mix(outColor, gColorSolved, solutionPower);
                }
                else if((gFlags & FLAG_SHOW_STABILITY) != 0)
                {
        			uint          stableValue = texelFetch(gStability, cellNumber, 0).x;
			        mediump float stablePower = float(stableValue) / float(gDomainSize - 1);

			        lowp vec4 colorStable = vec4(1.0f, 1.0f, 1.0f, 1.0f) - gColorEnabled;
                    colorStable.a = 1.0f;

                    outColor = mix(outColor, colorStable, stablePower);
                }
            }
            else
            {
                outColor = gColorBetween;
            }
        }`;

        //https://lightstrout.com/blog/2019/05/21/circles-render-mode/
        const circlesFsSource = 
        `#version 300 es

        #define FLAG_SHOW_SOLUTION  0x01
        #define FLAG_SHOW_STABILITY 0x02
        #define FLAG_TOROID_RENDER  0x04
        #define FLAG_NO_GRID        0x08

        uniform int gBoardSize;
        uniform int gCellSize;
        uniform int gDomainSize;
        uniform int gFlags;

        uniform int gImageWidth;
        uniform int gImageHeight;
        uniform int gViewportOffsetX;
        uniform int gViewportOffsetY;
 
        uniform lowp vec4 gColorNone;
        uniform lowp vec4 gColorEnabled;
        uniform lowp vec4 gColorSolved;
        uniform lowp vec4 gColorBetween;

        uniform highp usampler2D gBoard;
        uniform highp usampler2D gSolution;
        uniform highp usampler2D gStability;

        layout(location = 0) out lowp vec4 outColor;

        void main(void)
        {
            ivec2 screenPos = ivec2(int(gl_FragCoord.x) - gViewportOffsetX, gImageHeight - int(gl_FragCoord.y) - 1 + gViewportOffsetY);

            if(((gFlags & FLAG_NO_GRID) != 0) || ((screenPos.x % gCellSize != 0) && (screenPos.y % gCellSize != 0))) //Inside the cell
            {
                highp ivec2 cellNumber = screenPos / ivec2(gCellSize);

                uint          cellValue = texelFetch(gBoard, cellNumber, 0).x;
                mediump float cellPower = float(cellValue) / float(gDomainSize - 1);

                int cellSizeCorrected = gCellSize - int((gFlags & FLAG_NO_GRID) == 0);

                mediump vec2  cellCoord    = (vec2(screenPos.xy) - vec2(cellNumber * ivec2(gCellSize)) - vec2(gCellSize - int((gFlags & FLAG_NO_GRID) != 0)) / 2.0f);
                mediump float circleRadius = float(cellSizeCorrected - 1) / 2.0f;
                
                ivec2 leftCell   = cellNumber + ivec2(-1,  0);
                ivec2 rightCell  = cellNumber + ivec2( 1,  0);
                ivec2 topCell    = cellNumber + ivec2( 0, -1);
                ivec2 bottomCell = cellNumber + ivec2( 0,  1);
        
                bool insideCircle = (dot(cellCoord, cellCoord) <= circleRadius * circleRadius);
        
                bool nonLeftEdge   = cellNumber.x > 0;
                bool nonRightEdge  = cellNumber.x < gBoardSize - 1;
                bool nonTopEdge    = cellNumber.y > 0;
                bool nonBottomEdge = cellNumber.y < gBoardSize - 1;

                if((gFlags & FLAG_TOROID_RENDER) != 0)
                {
                    nonLeftEdge   = true;
                    nonRightEdge  = true;
                    nonTopEdge    = true;
                    nonBottomEdge = true;
        
                    const uint maxCheckDistance = 1u; //Different for different render modes
        
                    uvec2 leftCellU   = uvec2(leftCell)   + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 rightCellU  = uvec2(rightCell)  + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 topCellU    = uvec2(topCell)    + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 bottomCellU = uvec2(bottomCell) + uvec2(gBoardSize) * maxCheckDistance;
        
                    leftCell   = ivec2(leftCellU   % uvec2(gBoardSize));
                    rightCell  = ivec2(rightCellU  % uvec2(gBoardSize));
                    topCell    = ivec2(topCellU    % uvec2(gBoardSize));
                    bottomCell = ivec2(bottomCellU % uvec2(gBoardSize));
                }

                uint leftPartValue   = uint(nonLeftEdge)   * texelFetch(gBoard, leftCell,   0).x;
                uint rightPartValue  = uint(nonRightEdge)  * texelFetch(gBoard, rightCell,  0).x;
                uint topPartValue    = uint(nonTopEdge)    * texelFetch(gBoard, topCell,    0).x;
                uint bottomPartValue = uint(nonBottomEdge) * texelFetch(gBoard, bottomCell, 0).x;

                bool circleRuleColored = insideCircle || ((leftPartValue   == cellValue && cellCoord.x <= 0.0f) 
                                                      ||  (topPartValue    == cellValue && cellCoord.y <= 0.0f) 
                                                      ||  (rightPartValue  == cellValue && cellCoord.x >= 0.0f) 
                                                      ||  (bottomPartValue == cellValue && cellCoord.y >= 0.0f));

                cellPower = cellPower * float(circleRuleColored);
                outColor  = mix(gColorNone, gColorEnabled, cellPower);

                if((gFlags & FLAG_SHOW_SOLUTION) != 0)
                {
		            uint          solutionValue = texelFetch(gSolution, cellNumber, 0).x;
		            mediump float solutionPower = float(solutionValue) / float(gDomainSize - 1);

                    uint leftPartSolvedValue   = uint(nonLeftEdge)   * texelFetch(gSolution, leftCell,   0).x;
                    uint rightPartSolvedValue  = uint(nonRightEdge)  * texelFetch(gSolution, rightCell,  0).x;
                    uint topPartSolvedValue    = uint(nonTopEdge)    * texelFetch(gSolution, topCell,    0).x;
                    uint bottomPartSolvedValue = uint(nonBottomEdge) * texelFetch(gSolution, bottomCell, 0).x;
        
                    bool circleRuleSolved = insideCircle || ((leftPartSolvedValue   == solutionValue && cellCoord.x <= 0.0f) 
                                                         ||  (topPartSolvedValue    == solutionValue && cellCoord.y <= 0.0f) 
                                                         ||  (rightPartSolvedValue  == solutionValue && cellCoord.x >= 0.0f) 
                                                         ||  (bottomPartSolvedValue == solutionValue && cellCoord.y >= 0.0f));
        
                    solutionPower = solutionPower * float(circleRuleSolved);
                    outColor      = mix(outColor, gColorSolved, solutionPower);
                }
                else if((gFlags & FLAG_SHOW_STABILITY) != 0)
                {
        			uint          stableValue = texelFetch(gStability, cellNumber, 0).x;
			        mediump float stablePower = float(stableValue) / float(gDomainSize - 1);

			        lowp vec4 colorStable = vec4(1.0f, 1.0f, 1.0f, 1.0f) - gColorEnabled;
                    colorStable.a = 1.0f;

                    uint leftPartStableValue   = uint(nonLeftEdge)   * texelFetch(gStability, leftCell,   0).x;
                    uint rightPartStableValue  = uint(nonRightEdge)  * texelFetch(gStability, rightCell,  0).x;
                    uint topPartStableValue    = uint(nonTopEdge)    * texelFetch(gStability, topCell,    0).x;
                    uint bottomPartStableValue = uint(nonBottomEdge) * texelFetch(gStability, bottomCell, 0).x;
        
                    bool circleRuleStable = insideCircle || ((leftPartStableValue  == stableValue && cellCoord.x <= 0.0f) 
                                                         || (topPartStableValue    == stableValue && cellCoord.y <= 0.0f) 
                                                         || (rightPartStableValue  == stableValue && cellCoord.x >= 0.0f) 
                                                         || (bottomPartStableValue == stableValue && cellCoord.y >= 0.0f));
        
                    stablePower = stablePower * float(circleRuleStable);
                    outColor    = mix(outColor, colorStable, stablePower);
                }
            }
            else
            {
                outColor = gColorBetween;
            }
        }`;

        //http://lightstrout.com/blog/2019/12/09/diamonds-render-mode/
        const diamondsFsSource = 
        `#version 300 es

        #define FLAG_SHOW_SOLUTION  0x01
        #define FLAG_SHOW_STABILITY 0x02
        #define FLAG_TOROID_RENDER  0x04
        #define FLAG_NO_GRID        0x08

        uniform int gBoardSize;
        uniform int gCellSize;
        uniform int gDomainSize;
        uniform int gFlags;

        uniform int gImageWidth;
        uniform int gImageHeight;
        uniform int gViewportOffsetX;
        uniform int gViewportOffsetY;
 
        uniform lowp vec4 gColorNone;
        uniform lowp vec4 gColorEnabled;
        uniform lowp vec4 gColorSolved;
        uniform lowp vec4 gColorBetween;

        uniform highp usampler2D gBoard;
        uniform highp usampler2D gSolution;
        uniform highp usampler2D gStability;

        layout(location = 0) out lowp vec4 outColor;

        bvec4 emptyCornerRule(uvec4 edgeValue)
        {
            return equal(edgeValue.xyzw, edgeValue.yzwx);
        }

        bvec4 cornerRule(uint cellValue, uvec4 cornerValue)
        {
            return equal(uvec4(cellValue), cornerValue.xyzw);
        }

        void main(void)
        {
            ivec2 screenPos = ivec2(int(gl_FragCoord.x) - gViewportOffsetX, gImageHeight - int(gl_FragCoord.y) - 1 + gViewportOffsetY);

            if(((gFlags & FLAG_NO_GRID) != 0) || ((screenPos.x % gCellSize != 0) && (screenPos.y % gCellSize != 0))) //Inside the cell
            {
                highp ivec2 cellNumber = screenPos.xy / ivec2(gCellSize);
                uint        cellValue  = texelFetch(gBoard, cellNumber, 0).x;

                int cellSizeCorrected = gCellSize - int((gFlags & FLAG_NO_GRID) == 0);

                mediump vec2  cellCoord     = (vec2(screenPos.xy) - vec2(cellNumber * ivec2(gCellSize)) - vec2(gCellSize - int((gFlags & FLAG_NO_GRID) != 0)) / 2.0f);
                mediump float diamondRadius = float(cellSizeCorrected - 1) / 2.0f;
                
                mediump float domainFactor = 1.0f / float(gDomainSize - 1);

                bool insideDiamond     = (abs(cellCoord.x) + abs(cellCoord.y) <= diamondRadius);
                bool insideTopLeft     = !insideDiamond && cellCoord.x <= 0.0f && cellCoord.y <= 0.0f;
                bool insideTopRight    = !insideDiamond && cellCoord.x >= 0.0f && cellCoord.y <= 0.0f;
                bool insideBottomRight = !insideDiamond && cellCoord.x >= 0.0f && cellCoord.y >= 0.0f;
                bool insideBottomLeft  = !insideDiamond && cellCoord.x <= 0.0f && cellCoord.y >= 0.0f;

                bvec4 insideCorner = bvec4(insideTopLeft, insideTopRight, insideBottomRight, insideBottomLeft);

                ivec2 leftCell        = cellNumber + ivec2(-1,  0);
                ivec2 rightCell       = cellNumber + ivec2( 1,  0);
                ivec2 topCell         = cellNumber + ivec2( 0, -1);
                ivec2 bottomCell      = cellNumber + ivec2( 0,  1);
                ivec2 leftTopCell     = cellNumber + ivec2(-1, -1);
                ivec2 rightTopCell    = cellNumber + ivec2( 1, -1);
                ivec2 leftBottomCell  = cellNumber + ivec2(-1,  1);
                ivec2 rightBottomCell = cellNumber + ivec2( 1,  1);
        
                bool nonLeftEdge        = cellNumber.x > 0;
                bool nonRightEdge       = cellNumber.x < gBoardSize - 1;
                bool nonTopEdge         =                                  cellNumber.y > 0;
                bool nonBottomEdge      =                                  cellNumber.y < gBoardSize - 1;
                bool nonLeftTopEdge     = cellNumber.x > 0              && cellNumber.y > 0;
                bool nonRightTopEdge    = cellNumber.x < gBoardSize - 1 && cellNumber.y > 0;
                bool nonLeftBottomEdge  = cellNumber.x > 0              && cellNumber.y < gBoardSize - 1;
                bool nonRightBottomEdge = cellNumber.x < gBoardSize - 1 && cellNumber.y < gBoardSize - 1;

                if((gFlags & FLAG_TOROID_RENDER) != 0)
                {
                    nonLeftEdge        = true;
                    nonRightEdge       = true;
                    nonTopEdge         = true;
                    nonBottomEdge      = true;
                    nonLeftTopEdge     = true;
                    nonRightTopEdge    = true;
                    nonLeftBottomEdge  = true;
                    nonRightBottomEdge = true;
        
                    const uint maxCheckDistance = 1u; //Different for different render modes

                    uvec2 leftCellU        = uvec2(leftCell)        + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 rightCellU       = uvec2(rightCell)       + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 topCellU         = uvec2(topCell)         + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 bottomCellU      = uvec2(bottomCell)      + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 leftTopCellU     = uvec2(leftTopCell)     + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 rightTopCellU    = uvec2(rightTopCell)    + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 leftBottomCellU  = uvec2(leftBottomCell)  + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 rightBottomCellU = uvec2(rightBottomCell) + uvec2(gBoardSize) * maxCheckDistance;

                    leftCell        = ivec2(leftCellU        % uvec2(gBoardSize));
                    rightCell       = ivec2(rightCellU       % uvec2(gBoardSize));
                    topCell         = ivec2(topCellU         % uvec2(gBoardSize));
                    bottomCell      = ivec2(bottomCellU      % uvec2(gBoardSize));
                    leftTopCell     = ivec2(leftTopCellU     % uvec2(gBoardSize));
                    rightTopCell    = ivec2(rightTopCellU    % uvec2(gBoardSize));
                    leftBottomCell  = ivec2(leftBottomCellU  % uvec2(gBoardSize));
                    rightBottomCell = ivec2(rightBottomCellU % uvec2(gBoardSize));
                }

                uint leftPartValue        = uint(nonLeftEdge)        * texelFetch(gBoard, leftCell,        0).x;
                uint rightPartValue       = uint(nonRightEdge)       * texelFetch(gBoard, rightCell,       0).x;
                uint topPartValue         = uint(nonTopEdge)         * texelFetch(gBoard, topCell,         0).x;
                uint bottomPartValue      = uint(nonBottomEdge)      * texelFetch(gBoard, bottomCell,      0).x;
                uint leftTopPartValue     = uint(nonLeftTopEdge)     * texelFetch(gBoard, leftTopCell,     0).x;
                uint rightTopPartValue    = uint(nonRightTopEdge)    * texelFetch(gBoard, rightTopCell,    0).x;
                uint leftBottomPartValue  = uint(nonLeftBottomEdge)  * texelFetch(gBoard, leftBottomCell,  0).x;
                uint rightBottomPartValue = uint(nonRightBottomEdge) * texelFetch(gBoard, rightBottomCell, 0).x;

                uvec4 edgeValue   = uvec4(leftPartValue,    topPartValue,      rightPartValue,       bottomPartValue);
                uvec4 cornerValue = uvec4(leftTopPartValue, rightTopPartValue, rightBottomPartValue, leftBottomPartValue);

                uvec4 emptyCornerCandidate = uvec4(emptyCornerRule(edgeValue)        ) * edgeValue;
                uvec4 cornerCandidate      = uvec4(cornerRule(cellValue, cornerValue)) * cellValue;

                uvec4 resCorner = max(emptyCornerCandidate, cornerCandidate);

                mediump float  cellPower = float(cellValue) * domainFactor;		
                mediump vec4 cornerPower =  vec4(resCorner) * domainFactor;

                mediump float enablePower = cellPower * float(insideDiamond) + dot(cornerPower, vec4(insideCorner));
                outColor                  = mix(gColorNone, gColorEnabled, enablePower);

                if((gFlags & FLAG_SHOW_SOLUTION) != 0)
                {
		            uint solutionValue = texelFetch(gSolution, cellNumber, 0).x;
        
                    uint leftPartSolved        = uint(nonLeftEdge)        * texelFetch(gSolution, leftCell,        0).x;
                    uint rightPartSolved       = uint(nonRightEdge)       * texelFetch(gSolution, rightCell,       0).x;
                    uint topPartSolved         = uint(nonTopEdge)         * texelFetch(gSolution, topCell,         0).x;
                    uint bottomPartSolved      = uint(nonBottomEdge)      * texelFetch(gSolution, bottomCell,      0).x;
                    uint leftTopPartSolved     = uint(nonLeftTopEdge)     * texelFetch(gSolution, leftTopCell,     0).x;
                    uint rightTopPartSolved    = uint(nonRightTopEdge)    * texelFetch(gSolution, rightTopCell,    0).x;
                    uint leftBottomPartSolved  = uint(nonLeftBottomEdge)  * texelFetch(gSolution, leftBottomCell,  0).x;
                    uint rightBottomPartSolved = uint(nonRightBottomEdge) * texelFetch(gSolution, rightBottomCell, 0).x;

                    uvec4 edgeSolved   = uvec4(leftPartSolved,    topPartSolved,      rightPartSolved,       bottomPartSolved);
                    uvec4 cornerSolved = uvec4(leftTopPartSolved, rightTopPartSolved, rightBottomPartSolved, leftBottomPartSolved);

                    uvec4 emptyCornerSolutionCandidate = uvec4(emptyCornerRule(edgeSolved)            ) * edgeSolved;
                    uvec4 cornerSolutionCandidate      = uvec4(cornerRule(solutionValue, cornerSolved)) * solutionValue;

                    uvec4 resCornerSolved = max(emptyCornerSolutionCandidate, cornerSolutionCandidate);
        
                    mediump float      solutionPower =  float(solutionValue) * domainFactor;		
                    mediump vec4 cornerSolutionPower = vec4(resCornerSolved) * domainFactor;

                    mediump float solvedPower = solutionPower * float(insideDiamond) + dot(cornerSolutionPower, vec4(insideCorner));
                    outColor                  = mix(outColor, gColorSolved, solvedPower);
                }
                else if((gFlags & FLAG_SHOW_STABILITY) != 0)
                {
        			uint stableValue = texelFetch(gStability, cellNumber, 0).x;

			        lowp vec4 colorStable = vec4(1.0f, 1.0f, 1.0f, 1.0f) - gColorEnabled;
                    colorStable.a = 1.0f;

                    uint leftPartStable        = uint(nonLeftEdge)        * texelFetch(gStability, leftCell,        0).x;
                    uint rightPartStable       = uint(nonRightEdge)       * texelFetch(gStability, rightCell,       0).x;
                    uint topPartStable         = uint(nonTopEdge)         * texelFetch(gStability, topCell,         0).x;
                    uint bottomPartStable      = uint(nonBottomEdge)      * texelFetch(gStability, bottomCell,      0).x;
                    uint leftTopPartStable     = uint(nonLeftTopEdge)     * texelFetch(gStability, leftTopCell,     0).x;
                    uint rightTopPartStable    = uint(nonRightTopEdge)    * texelFetch(gStability, rightTopCell,    0).x;
                    uint leftBottomPartStable  = uint(nonLeftBottomEdge)  * texelFetch(gStability, leftBottomCell,  0).x;
                    uint rightBottomPartStable = uint(nonRightBottomEdge) * texelFetch(gStability, rightBottomCell, 0).x;

                    uvec4 edgeStable   = uvec4(leftPartStable,    topPartStable,      rightPartStable,       bottomPartStable);
                    uvec4 cornerStable = uvec4(leftTopPartStable, rightTopPartStable, rightBottomPartStable, leftBottomPartStable);
        
                    uvec4 emptyCornerStabilityCandidate = uvec4(emptyCornerRule(edgeStable)          ) * edgeStable;
                    uvec4 cornerStabilityCandidate      = uvec4(cornerRule(stableValue, cornerStable)) * stableValue;
        
                    uvec4 resCornerStable = max(emptyCornerStabilityCandidate, cornerStabilityCandidate);
        
                    mediump float      stabilityPower =    float(stableValue) * domainFactor;		
                    mediump vec4 cornerStabilityPower = vec4(resCornerStable) * domainFactor;
        
                    mediump float stablePower = stabilityPower * float(insideDiamond) + dot(cornerStabilityPower, vec4(insideCorner));
                    outColor                  = mix(outColor, colorStable, stablePower);
                }
            }
            else
            {
                outColor = gColorBetween;
            }
        }`;

        //https://lightstrout.com/blog/2019/12/18/beams-render-mode/
        const beamsFsSource = 
        `#version 300 es

        #define FLAG_SHOW_SOLUTION  0x01
        #define FLAG_SHOW_STABILITY 0x02
        #define FLAG_TOROID_RENDER  0x04
        #define FLAG_NO_GRID        0x08

        uniform int gBoardSize;
        uniform int gCellSize;
        uniform int gDomainSize;
        uniform int gFlags;

        uniform int gImageWidth;
        uniform int gImageHeight;
        uniform int gViewportOffsetX;
        uniform int gViewportOffsetY;
 
        uniform lowp vec4 gColorNone;
        uniform lowp vec4 gColorEnabled;
        uniform lowp vec4 gColorSolved;
        uniform lowp vec4 gColorBetween;

        uniform highp usampler2D gBoard;
        uniform highp usampler2D gSolution;
        uniform highp usampler2D gStability;

        layout(location = 0) out lowp vec4 outColor;

        //GLSL operator && doesn't work on per-component basis :(
        bvec4 b4nd(bvec4 a, bvec4 b)
        {
            return bvec4(a.x && b.x, a.y && b.y, a.z && b.z, a.w && b.w);
        }

        bvec4 b4nd(bvec4 a, bvec4 b, bvec4 c)
        {
            return bvec4(a.x && b.x && c.x, a.y && b.y && c.y, a.z && b.z && c.z, a.w && b.w && c.w);
        }

        bvec4 b4nd(bvec4 a, bvec4 b, bvec4 c, bvec4 d)
        {
            return bvec4(a.x && b.x && c.x && d.x, a.y && b.y && c.y && d.y, a.z && b.z && c.z && d.z, a.w && b.w && c.w && d.w);
        }

        bvec4 b4nd(bvec4 a, bvec4 b, bvec4 c, bvec4 d, bvec4 e)
        {
            return bvec4(a.x && b.x && c.x && d.x && e.x, a.y && b.y && c.y && d.y && e.y, a.z && b.z && c.z && d.z && e.z, a.w && b.w && c.w && d.w && e.w);
        }

        bvec4 b4or(bvec4 a, bvec4 b)
        {
            return bvec4(a.x || b.x, a.y || b.y, a.z || b.z, a.w || b.w);
        }

        bvec4 emptyCornerRule(uint cellValue, uvec4 edgeValue, uvec4 cornerValue)
        {
            bvec4 res = bvec4(true);

            res = b4nd(res,    equal(edgeValue.xyzw, edgeValue.yzwx));
            res = b4nd(res, notEqual(edgeValue.xyzw, cornerValue.xyzw));
            res = b4nd(res, notEqual(edgeValue.xyzw, uvec4(cellValue)));

            return res;
        }

        bvec4 regBRule(uint cellValue, uvec4 edgeValue, uvec4 cornerValue)
        {
            bvec4 res = bvec4(false);
            
            uvec4 cellValueVec = uvec4(cellValue);

            res = b4or(res,      equal(cellValueVec, edgeValue.xyzw  )                                                                                                                                                                     ); //B#1
            res = b4or(res,      equal(cellValueVec, edgeValue.yzwx  )                                                                                                                                                                     ); //B#2
            res = b4or(res,      equal(cellValueVec, cornerValue.xyzw)                                                                                                                                                                     ); //B#3
            res = b4or(res, b4nd(equal(cellValueVec, edgeValue.zwxy  ),    equal(cellValueVec, edgeValue.wxyz  )                                                                                                                          )); //B#4
            res = b4or(res, b4nd(equal(cellValueVec, cornerValue.zwxy), notEqual(cellValueVec, cornerValue.wxyz), notEqual(cellValueVec, edgeValue.wxyz), notEqual(cellValueVec, edgeValue.zwxy), notEqual(cellValueVec, cornerValue.yzwx))); //B#5

            return res;
        }

        bvec4 regIRule(uint cellValue, uvec4 edgeValue, uvec4 cornerValue)
        {
            bvec4 res = bvec4(false);
            
            bool loneDiamond = cellValue != edgeValue.x   && cellValue != edgeValue.y   && cellValue != edgeValue.z   && cellValue != edgeValue.w 
                            && cellValue != cornerValue.x && cellValue != cornerValue.y && cellValue != cornerValue.z && cellValue != cornerValue.w;

            uvec4 cellValueVec   = uvec4(cellValue);
            bvec4 loneDiamondVec = bvec4(loneDiamond);

            res = b4or(res,      equal(cellValueVec,   edgeValue.xyzw  )                                                                                                                           ); //I#1
            res = b4or(res, b4nd(equal(cellValueVec,   cornerValue.xyzw), notEqual(cellValueVec,   edgeValue.yzwx)                                                                                )); //I#2
            res = b4or(res, b4nd(equal(cellValueVec,   cornerValue.wxyz), notEqual(cellValueVec,   edgeValue.wxyz)                                                                                )); //I#3
            res = b4or(res, b4nd(equal(cellValueVec,   cornerValue.zwxy),    equal(cellValueVec, cornerValue.yzwx), notEqual(cellValueVec, edgeValue.wxyz), notEqual(cellValueVec, edgeValue.yzwx))); //I#4
            res = b4or(res, b4nd(equal(cellValueVec,   edgeValue.zwxy  ), notEqual(cellValueVec,   edgeValue.wxyz), notEqual(cellValueVec, edgeValue.yzwx)                                        )); //I#5
            res = b4or(res,           loneDiamondVec                                                                                                                                               ); //I#6

            return res;
        }

        bvec4 regYTopRightRule(uint cellValue, uvec4 edgeValue, uvec4 cornerValue)
        {
            bvec4 res = bvec4(false);

            uvec4 cellValueVec = uvec4(cellValue);
            
            res = b4or(res,      equal(cellValueVec, edgeValue.yyzz  )                                         ); //Y#1
            res = b4or(res, b4nd(equal(cellValueVec, cornerValue.xyyz), notEqual(cellValueVec, edgeValue.xzyw))); //Y#2

            return res;
        }

        bvec4 regYBottomLeftRule(uint cellValue, uvec4 edgeValue, uvec4 cornerValue)
        {
            bvec4 res = bvec4(false);

            uvec4 cellValueVec = uvec4(cellValue);
            
            res = b4or(res,      equal(cellValueVec, edgeValue.wwxx  )                                         ); //Y#1
            res = b4or(res, b4nd(equal(cellValueVec, cornerValue.zwwx), notEqual(cellValueVec, edgeValue.zxwy))); //Y#2

            return res;
        }

        bvec4 regVRule(uint cellValue, uvec4 edgeValue, uvec4 cornerValue)
        {
            uvec4 cellValueVec = uvec4(cellValue);
            return b4nd(equal(cellValueVec, cornerValue.xyzw), notEqual(cellValueVec, edgeValue.xyzw), notEqual(cellValueVec, edgeValue.yzwx)); //V#1
        }

        void main(void)
        {
            ivec2 screenPos = ivec2(int(gl_FragCoord.x) - gViewportOffsetX, gImageHeight - int(gl_FragCoord.y) - 1 + gViewportOffsetY);

            if(((gFlags & FLAG_NO_GRID) != 0) || ((screenPos.x % gCellSize != 0) && (screenPos.y % gCellSize != 0))) //Inside the cell
            {
                highp ivec2 cellNumber = screenPos.xy / ivec2(gCellSize);
                uint        cellValue  = texelFetch(gBoard, cellNumber, 0).x;

                int cellSizeCorrected = gCellSize - int((gFlags & FLAG_NO_GRID) == 0);

                mediump vec2  cellCoord     = (vec2(screenPos.xy) - vec2(cellNumber * ivec2(gCellSize)) - vec2(gCellSize - int((gFlags & FLAG_NO_GRID) != 0)) / 2.0f);
                mediump float diamondRadius = float(cellSizeCorrected) / 2.0f;

                mediump float domainFactor = 1.0f / float(gDomainSize - 1);
                mediump vec2 absCellCoord = abs(cellCoord);

                //Fix for 1 pixel off. To make it work, x == 0 and y == 0 pixels shouldn't be considered part of beam (or else single pixel artifacts will appear)
                //For even cell sizes, region inside diamond should be a bit smaller to compensate
                bool insideCentralDiamond   = (absCellCoord.x + absCellCoord.y <= diamondRadius - 1.0f * float((gCellSize % 2 == 0) && ((gFlags & FLAG_NO_GRID) != 0)));
                bool outsideCentralDiamond  = (absCellCoord.x + absCellCoord.y >= diamondRadius + 1.0f * float(gCellSize % 2 == 0));

                bool insideHorizontalBeamLeft  = (absCellCoord.y <= 0.707f * float(cellSizeCorrected) / 2.0f && cellCoord.x <= 0.0f);
                bool insideHorizontalBeamRight = (absCellCoord.y <= 0.707f * float(cellSizeCorrected) / 2.0f && cellCoord.x >= 0.0f);
                bool insideVerticalBeamTop     = (absCellCoord.x <= 0.707f * float(cellSizeCorrected) / 2.0f && cellCoord.y <= 0.0f);
                bool insideVerticalBeamBottom  = (absCellCoord.x <= 0.707f * float(cellSizeCorrected) / 2.0f && cellCoord.y >= 0.0f);

                bvec4 insideSide = bvec4(cellCoord.x <= 0.0f, cellCoord.y <= 0.0f, cellCoord.x >= 0.0f, cellCoord.y >= 0.0f);
                bvec4 insideBeam = bvec4(insideHorizontalBeamLeft, insideVerticalBeamTop, insideHorizontalBeamRight, insideVerticalBeamBottom);

                bool insideG = insideCentralDiamond && (insideHorizontalBeamLeft || insideHorizontalBeamRight) && (insideVerticalBeamTop || insideVerticalBeamBottom); //G

                bvec4 insideB = b4nd(insideBeam.xzzx,     insideBeam.yyww ,                       bvec4(!insideCentralDiamond)); //B-A, B-B, B-C, B-D
                bvec4 insideI = b4nd(insideBeam.xyzw, not(insideBeam.yxwz), not(insideBeam.wzyx), bvec4( insideCentralDiamond)); //I-A, I-B, I-C, I-D

                bvec4 insideYTopRight   = b4nd(insideBeam.yyzz, not(insideBeam.xzyw), bvec4(!insideCentralDiamond), insideSide.xzyw); //Y-A, Y-B, Y-C, Y-D
                bvec4 insideYBottomLeft = b4nd(insideBeam.wwxx, not(insideBeam.zxwy), bvec4(!insideCentralDiamond), insideSide.zxwy); //Y-E, Y-F, Y-G, Y-H

                bvec4 insideV = b4nd(not(insideBeam.xyzw), not(insideBeam.yzwx), insideSide.xyzw, insideSide.yzwx); //V-A, V-B, V-C, V-D

                ivec2 leftCell        = cellNumber + ivec2(-1,  0);
                ivec2 rightCell       = cellNumber + ivec2( 1,  0);
                ivec2 topCell         = cellNumber + ivec2( 0, -1);
                ivec2 bottomCell      = cellNumber + ivec2( 0,  1);
                ivec2 leftTopCell     = cellNumber + ivec2(-1, -1);
                ivec2 rightTopCell    = cellNumber + ivec2( 1, -1);
                ivec2 leftBottomCell  = cellNumber + ivec2(-1,  1);
                ivec2 rightBottomCell = cellNumber + ivec2( 1,  1);
        
                bool nonLeftEdge        = cellNumber.x > 0;
                bool nonRightEdge       = cellNumber.x < gBoardSize - 1;
                bool nonTopEdge         =                                  cellNumber.y > 0;
                bool nonBottomEdge      =                                  cellNumber.y < gBoardSize - 1;
                bool nonLeftTopEdge     = cellNumber.x > 0              && cellNumber.y > 0;
                bool nonRightTopEdge    = cellNumber.x < gBoardSize - 1 && cellNumber.y > 0;
                bool nonLeftBottomEdge  = cellNumber.x > 0              && cellNumber.y < gBoardSize - 1;
                bool nonRightBottomEdge = cellNumber.x < gBoardSize - 1 && cellNumber.y < gBoardSize - 1;

                if((gFlags & FLAG_TOROID_RENDER) != 0)
                {
                    nonLeftEdge        = true;
                    nonRightEdge       = true;
                    nonTopEdge         = true;
                    nonBottomEdge      = true;
                    nonLeftTopEdge     = true;
                    nonRightTopEdge    = true;
                    nonLeftBottomEdge  = true;
                    nonRightBottomEdge = true;
        
                    const uint maxCheckDistance = 1u; //Different for different render modes

                    uvec2 leftCellU        = uvec2(leftCell)        + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 rightCellU       = uvec2(rightCell)       + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 topCellU         = uvec2(topCell)         + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 bottomCellU      = uvec2(bottomCell)      + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 leftTopCellU     = uvec2(leftTopCell)     + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 rightTopCellU    = uvec2(rightTopCell)    + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 leftBottomCellU  = uvec2(leftBottomCell)  + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 rightBottomCellU = uvec2(rightBottomCell) + uvec2(gBoardSize) * maxCheckDistance;

                    leftCell        = ivec2(leftCellU        % uvec2(gBoardSize));
                    rightCell       = ivec2(rightCellU       % uvec2(gBoardSize));
                    topCell         = ivec2(topCellU         % uvec2(gBoardSize));
                    bottomCell      = ivec2(bottomCellU      % uvec2(gBoardSize));
                    leftTopCell     = ivec2(leftTopCellU     % uvec2(gBoardSize));
                    rightTopCell    = ivec2(rightTopCellU    % uvec2(gBoardSize));
                    leftBottomCell  = ivec2(leftBottomCellU  % uvec2(gBoardSize));
                    rightBottomCell = ivec2(rightBottomCellU % uvec2(gBoardSize));
                }

                uint leftPartValue        = uint(nonLeftEdge)        * texelFetch(gBoard, leftCell,        0).x;
                uint rightPartValue       = uint(nonRightEdge)       * texelFetch(gBoard, rightCell,       0).x;
                uint topPartValue         = uint(nonTopEdge)         * texelFetch(gBoard, topCell,         0).x;
                uint bottomPartValue      = uint(nonBottomEdge)      * texelFetch(gBoard, bottomCell,      0).x;
                uint leftTopPartValue     = uint(nonLeftTopEdge)     * texelFetch(gBoard, leftTopCell,     0).x;
                uint rightTopPartValue    = uint(nonRightTopEdge)    * texelFetch(gBoard, rightTopCell,    0).x;
                uint leftBottomPartValue  = uint(nonLeftBottomEdge)  * texelFetch(gBoard, leftBottomCell,  0).x;
                uint rightBottomPartValue = uint(nonRightBottomEdge) * texelFetch(gBoard, rightBottomCell, 0).x;

                uvec4 edgeValue   = uvec4(leftPartValue,    topPartValue,      rightPartValue,       bottomPartValue);
                uvec4 cornerValue = uvec4(leftTopPartValue, rightTopPartValue, rightBottomPartValue, leftBottomPartValue);

                uvec4 emptyCornerCandidate = uvec4(emptyCornerRule(cellValue, edgeValue, cornerValue)) * edgeValue;
                emptyCornerCandidate      *= uint(outsideCentralDiamond); //Fix for 1 pixel offset beforehand 

                uvec4 regionBCandidate = uvec4(regBRule(cellValue, edgeValue, cornerValue)) * cellValue;
                uvec4 regionICandidate = uvec4(regIRule(cellValue, edgeValue, cornerValue)) * cellValue;

                uvec4 regionYTopRightCandidate   = uvec4(regYTopRightRule(cellValue, edgeValue, cornerValue))   * cellValue;
                uvec4 regionYBottomLeftCandidate = uvec4(regYBottomLeftRule(cellValue, edgeValue, cornerValue)) * cellValue;

                uvec4 regionVCandidate = uvec4(regVRule(cellValue, edgeValue, cornerValue)) * cellValue;

                uvec4 resB           = max(regionBCandidate,           emptyCornerCandidate.xyzw);
                uvec4 resYTopRight   = max(regionYTopRightCandidate,   emptyCornerCandidate.xyyz);
                uvec4 resYBottomLeft = max(regionYBottomLeftCandidate, emptyCornerCandidate.zwwx);
                uvec4 resV           = max(regionVCandidate,           emptyCornerCandidate.xyzw);

                mediump float regGPower           = float(cellValue       ) *      domainFactor;
                mediump vec4  regIPower           = vec4( regionICandidate) * vec4(domainFactor);
                mediump vec4  regBPower           = vec4( resB            ) * vec4(domainFactor);
                mediump vec4  regYTopRightPower   = vec4( resYTopRight    ) * vec4(domainFactor);
                mediump vec4  regYBottomLeftPower = vec4( resYBottomLeft  ) * vec4(domainFactor);
                mediump vec4  regVPower           = vec4( resV            ) * vec4(domainFactor);

                mediump float enablePower =    float(insideG)      *     regGPower;
                enablePower              += dot(vec4(insideB),           regBPower);
                enablePower              += dot(vec4(insideI),           regIPower); 
                enablePower              += dot(vec4(insideYTopRight),   regYTopRightPower);
                enablePower              += dot(vec4(insideYBottomLeft), regYBottomLeftPower); 
                enablePower              += dot(vec4(insideV),           regVPower);

                outColor = mix(gColorNone, gColorEnabled, enablePower);

                //outColor += vec4(float(insideCentralDiamond), 0.0f, float(outsideCentralDiamond), 0.0f);

                if((gFlags & FLAG_SHOW_SOLUTION) != 0)
                {
		            uint solutionValue = texelFetch(gSolution, cellNumber, 0).x;
        
                    uint leftPartSolved        = uint(nonLeftEdge)        * texelFetch(gSolution, leftCell,        0).x;
                    uint rightPartSolved       = uint(nonRightEdge)       * texelFetch(gSolution, rightCell,       0).x;
                    uint topPartSolved         = uint(nonTopEdge)         * texelFetch(gSolution, topCell,         0).x;
                    uint bottomPartSolved      = uint(nonBottomEdge)      * texelFetch(gSolution, bottomCell,      0).x;
                    uint leftTopPartSolved     = uint(nonLeftTopEdge)     * texelFetch(gSolution, leftTopCell,     0).x;
                    uint rightTopPartSolved    = uint(nonRightTopEdge)    * texelFetch(gSolution, rightTopCell,    0).x;
                    uint leftBottomPartSolved  = uint(nonLeftBottomEdge)  * texelFetch(gSolution, leftBottomCell,  0).x;
                    uint rightBottomPartSolved = uint(nonRightBottomEdge) * texelFetch(gSolution, rightBottomCell, 0).x;

                    uvec4 edgeSolved   = uvec4(leftPartSolved,    topPartSolved,      rightPartSolved,       bottomPartSolved);
                    uvec4 cornerSolved = uvec4(leftTopPartSolved, rightTopPartSolved, rightBottomPartSolved, leftBottomPartSolved);
    
                    uvec4 emptyCornerSolutionCandidate = uvec4(emptyCornerRule(solutionValue, edgeSolved, cornerSolved)) * edgeSolved;
    
                    uvec4 regionBSolutionCandidate = uvec4(regBRule(solutionValue, edgeSolved, cornerSolved)) * solutionValue;
                    uvec4 regionISolutionCandidate = uvec4(regIRule(solutionValue, edgeSolved, cornerSolved)) * solutionValue;
    
                    uvec4 regionYTopRightSolutionCandidate   = uvec4(regYTopRightRule(solutionValue, edgeSolved, cornerSolved))   * solutionValue;
                    uvec4 regionYBottomLeftSolutionCandidate = uvec4(regYBottomLeftRule(solutionValue, edgeSolved, cornerSolved)) * solutionValue;
    
                    uvec4 regionVSolutionCandidate = uvec4(regVRule(solutionValue, edgeSolved, cornerSolved)) * solutionValue;
    
                    uvec4 resBSolution           = max(regionBSolutionCandidate,           emptyCornerSolutionCandidate.xyzw);
                    uvec4 resYTopRightSolution   = max(regionYTopRightSolutionCandidate,   emptyCornerSolutionCandidate.xyyz);
                    uvec4 resYBottomLeftSolution = max(regionYBottomLeftSolutionCandidate, emptyCornerSolutionCandidate.zwwx);
                    uvec4 resVSolution           = max(regionVSolutionCandidate,           emptyCornerSolutionCandidate.xyzw);
    
                    mediump float regGSolutionPower           = float(solutionValue           ) *      domainFactor;
                    mediump vec4  regISolutionPower           = vec4( regionISolutionCandidate) * vec4(domainFactor);
                    mediump vec4  regBSolutionPower           = vec4( resBSolution            ) * vec4(domainFactor);
                    mediump vec4  regYTopRightSolutionPower   = vec4( resYTopRightSolution    ) * vec4(domainFactor);
                    mediump vec4  regYBottomLeftSolutionPower = vec4( resYBottomLeftSolution  ) * vec4(domainFactor);
                    mediump vec4  regVSolutionPower           = vec4( resVSolution            ) * vec4(domainFactor);
    
                    mediump float solvedPower =    float(insideG)      *     regGSolutionPower;
                    solvedPower              += dot(vec4(insideB),           regBSolutionPower);
                    solvedPower              += dot(vec4(insideI),           regISolutionPower); 
                    solvedPower              += dot(vec4(insideYTopRight),   regYTopRightSolutionPower);
                    solvedPower              += dot(vec4(insideYBottomLeft), regYBottomLeftSolutionPower); 
                    solvedPower              += dot(vec4(insideV),           regVSolutionPower);
                    
                    outColor = mix(outColor, gColorSolved, solvedPower);
                }
                else if((gFlags & FLAG_SHOW_STABILITY) != 0)
                {
        			uint stabilityValue = texelFetch(gStability, cellNumber, 0).x;

			        lowp vec4 colorStable = vec4(1.0f, 1.0f, 1.0f, 1.0f) - gColorEnabled;
                    colorStable.a = 1.0f;

                    uint leftPartStable        = uint(nonLeftEdge)        * texelFetch(gStability, leftCell,        0).x;
                    uint rightPartStable       = uint(nonRightEdge)       * texelFetch(gStability, rightCell,       0).x;
                    uint topPartStable         = uint(nonTopEdge)         * texelFetch(gStability, topCell,         0).x;
                    uint bottomPartStable      = uint(nonBottomEdge)      * texelFetch(gStability, bottomCell,      0).x;
                    uint leftTopPartStable     = uint(nonLeftTopEdge)     * texelFetch(gStability, leftTopCell,     0).x;
                    uint rightTopPartStable    = uint(nonRightTopEdge)    * texelFetch(gStability, rightTopCell,    0).x;
                    uint leftBottomPartStable  = uint(nonLeftBottomEdge)  * texelFetch(gStability, leftBottomCell,  0).x;
                    uint rightBottomPartStable = uint(nonRightBottomEdge) * texelFetch(gStability, rightBottomCell, 0).x;

                    uvec4 edgeStable   = uvec4(leftPartStable,    topPartStable,      rightPartStable,       bottomPartStable);
                    uvec4 cornerStable = uvec4(leftTopPartStable, rightTopPartStable, rightBottomPartStable, leftBottomPartStable);
    
                    uvec4 emptyCornerStabilityCandidate = uvec4(emptyCornerRule(stabilityValue, edgeStable, cornerStable)) * edgeStable;
    
                    uvec4 regionBStabilityCandidate = uvec4(regBRule(stabilityValue, edgeStable, cornerStable)) * stabilityValue;
                    uvec4 regionIStabilityCandidate = uvec4(regIRule(stabilityValue, edgeStable, cornerStable)) * stabilityValue;
    
                    uvec4 regionYTopRightStabilityCandidate   = uvec4(regYTopRightRule(stabilityValue, edgeStable, cornerStable))   * stabilityValue;
                    uvec4 regionYBottomLeftStabilityCandidate = uvec4(regYBottomLeftRule(stabilityValue, edgeStable, cornerStable)) * stabilityValue;
    
                    uvec4 regionVStabilityCandidate = uvec4(regVRule(stabilityValue, edgeStable, cornerStable)) * stabilityValue;
    
                    uvec4 resBStability           = max(regionBStabilityCandidate,           emptyCornerStabilityCandidate.xyzw);
                    uvec4 resYTopRightStability   = max(regionYTopRightStabilityCandidate,   emptyCornerStabilityCandidate.xyyz);
                    uvec4 resYBottomLeftStability = max(regionYBottomLeftStabilityCandidate, emptyCornerStabilityCandidate.zwwx);
                    uvec4 resVStability           = max(regionVStabilityCandidate,           emptyCornerStabilityCandidate.xyzw);
    
                    mediump float regGStabilityPower           = float(stabilityValue           ) *      domainFactor;
                    mediump vec4  regIStabilityPower           = vec4( regionIStabilityCandidate) * vec4(domainFactor);
                    mediump vec4  regBStabilityPower           = vec4( resBStability            ) * vec4(domainFactor);
                    mediump vec4  regYTopRightStabilityPower   = vec4( resYTopRightStability    ) * vec4(domainFactor);
                    mediump vec4  regYBottomLeftStabilityPower = vec4( resYBottomLeftStability  ) * vec4(domainFactor);
                    mediump vec4  regVStabilityPower           = vec4( resVStability            ) * vec4(domainFactor);
    
                    mediump float stablePower =    float(insideG)      *     regGStabilityPower;
                    stablePower              += dot(vec4(insideB),           regBStabilityPower);
                    stablePower              += dot(vec4(insideI),           regIStabilityPower); 
                    stablePower              += dot(vec4(insideYTopRight),   regYTopRightStabilityPower);
                    stablePower              += dot(vec4(insideYBottomLeft), regYBottomLeftStabilityPower); 
                    stablePower              += dot(vec4(insideV),           regVStabilityPower);
                    
                    outColor = mix(outColor, colorStable, stablePower);
                }
            }
            else
            {
                outColor = gColorBetween;
            }
        }`;

        //https://lightstrout.com/blog/2019/05/21/raindrops-render-mode/
        const raindropsFsSource = 
        `#version 300 es

        #define FLAG_SHOW_SOLUTION  0x01
        #define FLAG_SHOW_STABILITY 0x02
        #define FLAG_TOROID_RENDER  0x04
        #define FLAG_NO_GRID        0x08

        uniform int gBoardSize;
        uniform int gCellSize;
        uniform int gDomainSize;
        uniform int gFlags;

        uniform int gImageWidth;
        uniform int gImageHeight;
        uniform int gViewportOffsetX;
        uniform int gViewportOffsetY;
 
        uniform lowp vec4 gColorNone;
        uniform lowp vec4 gColorEnabled;
        uniform lowp vec4 gColorSolved;
        uniform lowp vec4 gColorBetween;

        uniform highp usampler2D gBoard;
        uniform highp usampler2D gSolution;
        uniform highp usampler2D gStability;

        layout(location = 0) out lowp vec4 outColor;

        bvec4 b4or(bvec4 a, bvec4 b) //Yet another thing that doesn't require writing functions in hlsl
        {
            return bvec4(a.x || b.x, a.y || b.y, a.z || b.z, a.w || b.w);
        }

        bvec4 emptyCornerRule(uvec4 edgeValue)
        {
            return equal(edgeValue.xyzw, edgeValue.yzwx);
        }

        bvec4 cornerRule(uint cellValue, uvec4 edgeValue, uvec4 cornerValue)
        {
            bvec4 res = bvec4(false);

            uvec4 cellValueVec = uvec4(cellValue);
            
            res = b4or(res, equal(cellValueVec, cornerValue.xyzw));
            res = b4or(res, equal(cellValueVec,   edgeValue.xyzw));
            res = b4or(res, equal(cellValueVec,   edgeValue.yzwx));

            return res;
        }

        void main(void)
        {
            ivec2 screenPos = ivec2(int(gl_FragCoord.x) - gViewportOffsetX, gImageHeight - int(gl_FragCoord.y) - 1 + gViewportOffsetY);

            if(((gFlags & FLAG_NO_GRID) != 0) || ((screenPos.x % gCellSize != 0) && (screenPos.y % gCellSize != 0))) //Inside the cell
            {
                highp ivec2 cellNumber = screenPos.xy / ivec2(gCellSize);
                uint        cellValue  = texelFetch(gBoard, cellNumber, 0).x;

                int cellSizeCorrected = gCellSize - int((gFlags & FLAG_NO_GRID) == 0);

                mediump vec2  cellCoord    = (vec2(screenPos.xy) - vec2(cellNumber * ivec2(gCellSize)) - vec2(gCellSize - int((gFlags & FLAG_NO_GRID) != 0)) / 2.0f);
                mediump float circleRadius = float(cellSizeCorrected - 1) / 2.0f;
                
                mediump float domainFactor = 1.0f / float(gDomainSize - 1);

                ivec2 leftCell        = cellNumber + ivec2(-1,  0);
                ivec2 rightCell       = cellNumber + ivec2( 1,  0);
                ivec2 topCell         = cellNumber + ivec2( 0, -1);
                ivec2 bottomCell      = cellNumber + ivec2( 0,  1);
                ivec2 leftTopCell     = cellNumber + ivec2(-1, -1);
                ivec2 rightTopCell    = cellNumber + ivec2( 1, -1);
                ivec2 leftBottomCell  = cellNumber + ivec2(-1,  1);
                ivec2 rightBottomCell = cellNumber + ivec2( 1,  1);
        
                bool insideCircle  = (dot(cellCoord, cellCoord) < (circleRadius * circleRadius));
                bool outsideCircle = (dot(cellCoord, cellCoord) > (circleRadius + 1.0f) * (circleRadius + 1.0f));

                bool insideTopLeft     = !insideCircle && cellCoord.x <= 0.0f && cellCoord.y <= 0.0f;
                bool insideTopRight    = !insideCircle && cellCoord.x >= 0.0f && cellCoord.y <= 0.0f;
                bool insideBottomRight = !insideCircle && cellCoord.x >= 0.0f && cellCoord.y >= 0.0f;
                bool insideBottomLeft  = !insideCircle && cellCoord.x <= 0.0f && cellCoord.y >= 0.0f;
        
                bvec4 insideCorner = bvec4(insideTopLeft, insideTopRight, insideBottomRight, insideBottomLeft);

                bool nonLeftEdge        = cellNumber.x > 0;
                bool nonRightEdge       = cellNumber.x < gBoardSize - 1;
                bool nonTopEdge         =                                  cellNumber.y > 0;
                bool nonBottomEdge      =                                  cellNumber.y < gBoardSize - 1;
                bool nonLeftTopEdge     = cellNumber.x > 0              && cellNumber.y > 0;
                bool nonRightTopEdge    = cellNumber.x < gBoardSize - 1 && cellNumber.y > 0;
                bool nonLeftBottomEdge  = cellNumber.x > 0              && cellNumber.y < gBoardSize - 1;
                bool nonRightBottomEdge = cellNumber.x < gBoardSize - 1 && cellNumber.y < gBoardSize - 1;

                if((gFlags & FLAG_TOROID_RENDER) != 0)
                {
                    nonLeftEdge        = true;
                    nonRightEdge       = true;
                    nonTopEdge         = true;
                    nonBottomEdge      = true;
                    nonLeftTopEdge     = true;
                    nonRightTopEdge    = true;
                    nonLeftBottomEdge  = true;
                    nonRightBottomEdge = true;
        
                    const uint maxCheckDistance = 1u; //Different for different render modes

                    uvec2 leftCellU        = uvec2(leftCell)        + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 rightCellU       = uvec2(rightCell)       + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 topCellU         = uvec2(topCell)         + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 bottomCellU      = uvec2(bottomCell)      + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 leftTopCellU     = uvec2(leftTopCell)     + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 rightTopCellU    = uvec2(rightTopCell)    + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 leftBottomCellU  = uvec2(leftBottomCell)  + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 rightBottomCellU = uvec2(rightBottomCell) + uvec2(gBoardSize) * maxCheckDistance;

                    leftCell        = ivec2(leftCellU        % uvec2(gBoardSize));
                    rightCell       = ivec2(rightCellU       % uvec2(gBoardSize));
                    topCell         = ivec2(topCellU         % uvec2(gBoardSize));
                    bottomCell      = ivec2(bottomCellU      % uvec2(gBoardSize));
                    leftTopCell     = ivec2(leftTopCellU     % uvec2(gBoardSize));
                    rightTopCell    = ivec2(rightTopCellU    % uvec2(gBoardSize));
                    leftBottomCell  = ivec2(leftBottomCellU  % uvec2(gBoardSize));
                    rightBottomCell = ivec2(rightBottomCellU % uvec2(gBoardSize));
                }

                uint leftPartValue        = uint(nonLeftEdge)        * texelFetch(gBoard, leftCell,        0).x;
                uint rightPartValue       = uint(nonRightEdge)       * texelFetch(gBoard, rightCell,       0).x;
                uint topPartValue         = uint(nonTopEdge)         * texelFetch(gBoard, topCell,         0).x;
                uint bottomPartValue      = uint(nonBottomEdge)      * texelFetch(gBoard, bottomCell,      0).x;
                uint leftTopPartValue     = uint(nonLeftTopEdge)     * texelFetch(gBoard, leftTopCell,     0).x;
                uint rightTopPartValue    = uint(nonRightTopEdge)    * texelFetch(gBoard, rightTopCell,    0).x;
                uint leftBottomPartValue  = uint(nonLeftBottomEdge)  * texelFetch(gBoard, leftBottomCell,  0).x;
                uint rightBottomPartValue = uint(nonRightBottomEdge) * texelFetch(gBoard, rightBottomCell, 0).x;

                uvec4 edgeValue   = uvec4(leftPartValue,    topPartValue,      rightPartValue,       bottomPartValue);
                uvec4 cornerValue = uvec4(leftTopPartValue, rightTopPartValue, rightBottomPartValue, leftBottomPartValue);

                uvec4 emptyCornerCandidate = uvec4(emptyCornerRule(edgeValue))                    * edgeValue;
                uvec4 cornerCandidate      = uvec4(cornerRule(cellValue, edgeValue, cornerValue)) * cellValue;

                emptyCornerCandidate = uint(outsideCircle) * emptyCornerCandidate;

                uvec4 resCorner = max(emptyCornerCandidate, cornerCandidate);

                mediump float  cellPower = float(cellValue) * domainFactor;		
                mediump vec4 cornerPower =  vec4(resCorner) * domainFactor;

                mediump float enablePower = cellPower * float(insideCircle) + dot(cornerPower, vec4(insideCorner));
                outColor                  = mix(gColorNone, gColorEnabled, enablePower);

                if((gFlags & FLAG_SHOW_SOLUTION) != 0)
                {
		            uint solutionValue = texelFetch(gSolution, cellNumber, 0).x;
        
                    uint leftPartSolved        = uint(nonLeftEdge)        * texelFetch(gSolution, leftCell,        0).x;
                    uint rightPartSolved       = uint(nonRightEdge)       * texelFetch(gSolution, rightCell,       0).x;
                    uint topPartSolved         = uint(nonTopEdge)         * texelFetch(gSolution, topCell,         0).x;
                    uint bottomPartSolved      = uint(nonBottomEdge)      * texelFetch(gSolution, bottomCell,      0).x;
                    uint leftTopPartSolved     = uint(nonLeftTopEdge)     * texelFetch(gSolution, leftTopCell,     0).x;
                    uint rightTopPartSolved    = uint(nonRightTopEdge)    * texelFetch(gSolution, rightTopCell,    0).x;
                    uint leftBottomPartSolved  = uint(nonLeftBottomEdge)  * texelFetch(gSolution, leftBottomCell,  0).x;
                    uint rightBottomPartSolved = uint(nonRightBottomEdge) * texelFetch(gSolution, rightBottomCell, 0).x;

                    uvec4 edgeSolved   = uvec4(leftPartSolved,    topPartSolved,      rightPartSolved,       bottomPartSolved);
                    uvec4 cornerSolved = uvec4(leftTopPartSolved, rightTopPartSolved, rightBottomPartSolved, leftBottomPartSolved);

                    uvec4 emptyCornerSolutionCandidate = uvec4(emptyCornerRule(edgeSolved))                         * edgeSolved;
                    uvec4 cornerSolutionCandidate      = uvec4(cornerRule(solutionValue, edgeSolved, cornerSolved)) * solutionValue;

                    uvec4 resCornerSolved = max(emptyCornerSolutionCandidate, cornerSolutionCandidate);
        
                    mediump float      solutionPower =  float(solutionValue) * domainFactor;		
                    mediump vec4 cornerSolutionPower = vec4(resCornerSolved) * domainFactor;

                    mediump float solvedPower = solutionPower * float(insideCircle) + dot(cornerSolutionPower, vec4(insideCorner));
                    outColor                  = mix(outColor, gColorSolved, solvedPower);
                }
                else if((gFlags & FLAG_SHOW_STABILITY) != 0)
                {
        			uint stableValue = texelFetch(gStability, cellNumber, 0).x;

			        lowp vec4 colorStable = vec4(1.0f, 1.0f, 1.0f, 1.0f) - gColorEnabled;
                    colorStable.a = 1.0f;

                    uint leftPartStable        = uint(nonLeftEdge)        * texelFetch(gStability, leftCell,        0).x;
                    uint rightPartStable       = uint(nonRightEdge)       * texelFetch(gStability, rightCell,       0).x;
                    uint topPartStable         = uint(nonTopEdge)         * texelFetch(gStability, topCell,         0).x;
                    uint bottomPartStable      = uint(nonBottomEdge)      * texelFetch(gStability, bottomCell,      0).x;
                    uint leftTopPartStable     = uint(nonLeftTopEdge)     * texelFetch(gStability, leftTopCell,     0).x;
                    uint rightTopPartStable    = uint(nonRightTopEdge)    * texelFetch(gStability, rightTopCell,    0).x;
                    uint leftBottomPartStable  = uint(nonLeftBottomEdge)  * texelFetch(gStability, leftBottomCell,  0).x;
                    uint rightBottomPartStable = uint(nonRightBottomEdge) * texelFetch(gStability, rightBottomCell, 0).x;

                    uvec4 edgeStable   = uvec4(leftPartStable,    topPartStable,      rightPartStable,       bottomPartStable);
                    uvec4 cornerStable = uvec4(leftTopPartStable, rightTopPartStable, rightBottomPartStable, leftBottomPartStable);
        
                    uvec4 emptyCornerStabilityCandidate = uvec4(emptyCornerRule(edgeStable))                       * edgeStable;
                    uvec4 cornerStabilityCandidate      = uvec4(cornerRule(stableValue, edgeStable, cornerStable)) * stableValue;
        
                    uvec4 resCornerStable = max(emptyCornerStabilityCandidate, cornerStabilityCandidate);
        
                    mediump float      stabilityPower =    float(stableValue) * domainFactor;		
                    mediump vec4 cornerStabilityPower = vec4(resCornerStable) * domainFactor;
        
                    mediump float stablePower = stabilityPower * float(insideCircle) + dot(cornerStabilityPower, vec4(insideCorner));
                    outColor                  = mix(outColor, colorStable, stablePower);
                }
            }
            else
            {
                outColor = gColorBetween;
            }
        }`;

        //https://lightstrout.com/blog/2019/05/21/chains-render-mode/
        const chainsFsSource = 
        `#version 300 es

        #define FLAG_SHOW_SOLUTION  0x01
        #define FLAG_SHOW_STABILITY 0x02
        #define FLAG_TOROID_RENDER  0x04
        #define FLAG_NO_GRID        0x08

        uniform int gBoardSize;
        uniform int gCellSize;
        uniform int gDomainSize;
        uniform int gFlags;

        uniform int gImageWidth;
        uniform int gImageHeight;
        uniform int gViewportOffsetX;
        uniform int gViewportOffsetY;
 
        uniform lowp vec4 gColorNone;
        uniform lowp vec4 gColorEnabled;
        uniform lowp vec4 gColorSolved;
        uniform lowp vec4 gColorBetween;

        uniform highp usampler2D gBoard;
        uniform highp usampler2D gSolution;
        uniform highp usampler2D gStability;

        layout(location = 0) out lowp vec4 outColor;

        bvec4 b4or(bvec4 a, bvec4 b) //Yet another thing that doesn't require writing functions in hlsl
        {
            return bvec4(a.x || b.x, a.y || b.y, a.z || b.z, a.w || b.w);
        }

        bvec4 b4nd(bvec4 a, bvec4 b) //Yet another thing that doesn't require writing functions in hlsl
        {
            return bvec4(a.x && b.x, a.y && b.y, a.z && b.z, a.w && b.w);
        }

        bvec2 b2nd(bvec2 a, bvec2 b) //Yet another thing that doesn't require writing functions in hlsl
        {
            return bvec2(a.x && b.x, a.y && b.y);
        }

        bvec4 b4nd(bvec4 a, bvec4 b, bvec4 c) //No, they are not kidding
        {
            return bvec4(a.x && b.x && c.x, a.y && b.y && c.y, a.z && b.z && c.z, a.w && b.w && c.w);
        }

        bvec2 b2nd(bvec2 a, bvec2 b, bvec2 c) //For Christ's sake
        {
            return bvec2(a.x && b.x && c.x, a.y && b.y && c.y);
        }

        bool b1nd(bool a, bool b, bool c) //And that's what happens when you want the code which is both uniform-looking and working
        {
            return a && b && c;
        }

        bvec4 emptyCornerRule(uvec4 edgeValue)
        {
            return equal(edgeValue.xyzw, edgeValue.yzwx);
        }

        bvec4 cornerRule(uint cellValue, uvec4 edgeValue, uvec4 cornerValue)
        {
            bvec4 res = bvec4(false);
            
            uvec4 cellValueVec = uvec4(cellValue);

            res = b4or(res, equal(cellValueVec, cornerValue.xyzw));
            res = b4or(res, equal(cellValueVec,   edgeValue.xyzw));
            res = b4or(res, equal(cellValueVec,   edgeValue.yzwx));

            return res;
        }

        bvec2 linkRule(uvec4 edgeValue)
        {
            return equal(edgeValue.xy, edgeValue.zw);
        }

        bvec4 slimEdgeRule(uint cellValue, uvec4 edge2Value)
        {
            uvec4 cellValueVec = uvec4(cellValue);
            return equal(cellValueVec, edge2Value.xyzw);
        }

        void main(void)
        {
            ivec2 screenPos = ivec2(int(gl_FragCoord.x) - gViewportOffsetX, gImageHeight - int(gl_FragCoord.y) - 1 + gViewportOffsetY);

            if(((gFlags & FLAG_NO_GRID) != 0) || ((screenPos.x % gCellSize != 0) && (screenPos.y % gCellSize != 0))) //Inside the cell
            {
                highp ivec2 cellNumber = screenPos.xy / ivec2(gCellSize);
                uint        cellValue  = texelFetch(gBoard, cellNumber, 0).x;

                int cellSizeCorrected = gCellSize - int((gFlags & FLAG_NO_GRID) == 0);

                mediump vec2  cellCoord       = (vec2(screenPos.xy) - vec2(cellNumber * ivec2(gCellSize)) - vec2(gCellSize - int((gFlags & FLAG_NO_GRID) != 0)) / 2.0f);
                mediump float circleRadius    = float(cellSizeCorrected) / 2.0f;
                mediump float circleRadiusBig = float(cellSizeCorrected - 1);
                mediump float domainFactor    = 1.0f / float(gDomainSize - 1);

                mediump vec2 cellCoordLeft        = cellCoord + vec2(float( cellSizeCorrected),              0.0f);
                mediump vec2 cellCoordRight       = cellCoord + vec2(float(-cellSizeCorrected),              0.0f);
                mediump vec2 cellCoordTop         = cellCoord + vec2(             0.0f, float( cellSizeCorrected));
                mediump vec2 cellCoordBottom      = cellCoord + vec2(             0.0f, float(-cellSizeCorrected));

                bool insideCircle     = (dot(      cellCoord,       cellCoord) < circleRadius          * circleRadius);
                bool outsideCircle    = (dot(      cellCoord,       cellCoord) > (circleRadius + 1.0f) * (circleRadius + 1.0f));
                bool insideCircleBigL = (dot(  cellCoordLeft,   cellCoordLeft) < (circleRadiusBig)     * (circleRadiusBig));
                bool insideCircleBigR = (dot( cellCoordRight,  cellCoordRight) < (circleRadiusBig)     * (circleRadiusBig));
                bool insideCircleBigT = (dot(   cellCoordTop,    cellCoordTop) < (circleRadiusBig)     * (circleRadiusBig));
                bool insideCircleBigB = (dot(cellCoordBottom, cellCoordBottom) < (circleRadiusBig)     * (circleRadiusBig));

                bool insideTopLeft     = !insideCircle && cellCoord.x <= 0.0f && cellCoord.y <= 0.0f;
                bool insideTopRight    = !insideCircle && cellCoord.x >= 0.0f && cellCoord.y <= 0.0f;
                bool insideBottomRight = !insideCircle && cellCoord.x >= 0.0f && cellCoord.y >= 0.0f;
                bool insideBottomLeft  = !insideCircle && cellCoord.x <= 0.0f && cellCoord.y >= 0.0f;

                bvec4 insideCircleBig = bvec4(insideCircleBigL, insideCircleBigT, insideCircleBigR,  insideCircleBigB);
                bvec4 insideCorner    = bvec4(insideTopLeft,    insideTopRight,   insideBottomRight, insideBottomLeft);

                bool insideLinkH = !insideCircleBigT && !insideCircleBigB;
                bool insideLinkV = !insideCircleBigL && !insideCircleBigR;

                bvec2 insideLink      = bvec2(insideLinkH, insideLinkV);
                bool  insideBothLinks = insideLinkV && insideLinkH;

                bvec4 insideSlimEdgeTopRightPart   = b4nd(insideLink.xyyx, insideCorner.xxyy);
                bvec4 insideSlimEdgeBottomLeftPart = b4nd(insideLink.xyyx, insideCorner.zzww);

                bvec2 insideCenterLink = b2nd(insideLink,   bvec2( insideCircle), bvec2(!insideBothLinks));
                bool  insideFreeCircle = b1nd(insideCircle,       !insideLinkV  ,       !insideLinkH);
                bvec4 insideFreeCorner = b4nd(insideCorner, bvec4(!insideLinkH ), bvec4(!insideLinkV));

                ivec2 leftCell        = cellNumber + ivec2(-1,  0);
                ivec2 rightCell       = cellNumber + ivec2( 1,  0);
                ivec2 topCell         = cellNumber + ivec2( 0, -1);
                ivec2 bottomCell      = cellNumber + ivec2( 0,  1);
                ivec2 leftTopCell     = cellNumber + ivec2(-1, -1);
                ivec2 rightTopCell    = cellNumber + ivec2( 1, -1);
                ivec2 leftBottomCell  = cellNumber + ivec2(-1,  1);
                ivec2 rightBottomCell = cellNumber + ivec2( 1,  1);
                ivec2 left2Cell       = cellNumber + ivec2(-2,  0);
                ivec2 right2Cell      = cellNumber + ivec2( 2,  0);
                ivec2 top2Cell        = cellNumber + ivec2( 0, -2);
                ivec2 bottom2Cell     = cellNumber + ivec2( 0,  2);

                bool nonLeftEdge        = cellNumber.x > 0;
                bool nonRightEdge       = cellNumber.x < gBoardSize - 1;
                bool nonTopEdge         =                                  cellNumber.y > 0;
                bool nonBottomEdge      =                                  cellNumber.y < gBoardSize - 1;
                bool nonLeftTopEdge     = cellNumber.x > 0              && cellNumber.y > 0;
                bool nonRightTopEdge    = cellNumber.x < gBoardSize - 1 && cellNumber.y > 0;
                bool nonLeftBottomEdge  = cellNumber.x > 0              && cellNumber.y < gBoardSize - 1;
                bool nonRightBottomEdge = cellNumber.x < gBoardSize - 1 && cellNumber.y < gBoardSize - 1;
                bool nonLeft2Edge       = cellNumber.x > 1;
                bool nonRight2Edge      = cellNumber.x < gBoardSize - 2;
                bool nonTop2Edge        =                                  cellNumber.y > 1;
                bool nonBottom2Edge     =                                  cellNumber.y < gBoardSize - 2;

                if((gFlags & FLAG_TOROID_RENDER) != 0)
                {
                    nonLeftEdge        = true;
                    nonRightEdge       = true;
                    nonTopEdge         = true;
                    nonBottomEdge      = true;
                    nonLeftTopEdge     = true;
                    nonRightTopEdge    = true;
                    nonLeftBottomEdge  = true;
                    nonRightBottomEdge = true;
                    nonLeft2Edge       = true;
                    nonRight2Edge      = true;
                    nonTop2Edge        = true;
                    nonBottom2Edge     = true;
        
                    const uint maxCheckDistance = 2u; //Different for different render modes

                    uvec2 leftCellU        = uvec2(leftCell)        + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 rightCellU       = uvec2(rightCell)       + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 topCellU         = uvec2(topCell)         + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 bottomCellU      = uvec2(bottomCell)      + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 leftTopCellU     = uvec2(leftTopCell)     + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 rightTopCellU    = uvec2(rightTopCell)    + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 leftBottomCellU  = uvec2(leftBottomCell)  + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 rightBottomCellU = uvec2(rightBottomCell) + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 left2CellU       = uvec2(left2Cell)       + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 right2CellU      = uvec2(right2Cell)      + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 top2CellU        = uvec2(top2Cell)        + uvec2(gBoardSize) * maxCheckDistance;
                    uvec2 bottom2CellU     = uvec2(bottom2Cell)     + uvec2(gBoardSize) * maxCheckDistance;

                    leftCell        = ivec2(leftCellU        % uvec2(gBoardSize));
                    rightCell       = ivec2(rightCellU       % uvec2(gBoardSize));
                    topCell         = ivec2(topCellU         % uvec2(gBoardSize));
                    bottomCell      = ivec2(bottomCellU      % uvec2(gBoardSize));
                    leftTopCell     = ivec2(leftTopCellU     % uvec2(gBoardSize));
                    rightTopCell    = ivec2(rightTopCellU    % uvec2(gBoardSize));
                    leftBottomCell  = ivec2(leftBottomCellU  % uvec2(gBoardSize));
                    rightBottomCell = ivec2(rightBottomCellU % uvec2(gBoardSize));
                    left2Cell       = ivec2(left2CellU       % uvec2(gBoardSize));
                    right2Cell      = ivec2(right2CellU      % uvec2(gBoardSize));
                    top2Cell        = ivec2(top2CellU        % uvec2(gBoardSize));
                    bottom2Cell     = ivec2(bottom2CellU     % uvec2(gBoardSize));
                }

                uint leftPartValue        = uint(nonLeftEdge)        * texelFetch(gBoard, leftCell,        0).x;
                uint rightPartValue       = uint(nonRightEdge)       * texelFetch(gBoard, rightCell,       0).x;
                uint topPartValue         = uint(nonTopEdge)         * texelFetch(gBoard, topCell,         0).x;
                uint bottomPartValue      = uint(nonBottomEdge)      * texelFetch(gBoard, bottomCell,      0).x;
                uint leftTopPartValue     = uint(nonLeftTopEdge)     * texelFetch(gBoard, leftTopCell,     0).x;
                uint rightTopPartValue    = uint(nonRightTopEdge)    * texelFetch(gBoard, rightTopCell,    0).x;
                uint leftBottomPartValue  = uint(nonLeftBottomEdge)  * texelFetch(gBoard, leftBottomCell,  0).x;
                uint rightBottomPartValue = uint(nonRightBottomEdge) * texelFetch(gBoard, rightBottomCell, 0).x;
                uint left2PartValue       = uint(nonLeft2Edge)       * texelFetch(gBoard, left2Cell,       0).x;
                uint right2PartValue      = uint(nonRight2Edge)      * texelFetch(gBoard, right2Cell,      0).x;
                uint top2PartValue        = uint(nonTop2Edge)        * texelFetch(gBoard, top2Cell,        0).x;
                uint bottom2PartValue     = uint(nonBottom2Edge)     * texelFetch(gBoard, bottom2Cell,     0).x;

                uvec4 edgeValue   = uvec4(leftPartValue,    topPartValue,      rightPartValue,       bottomPartValue);
                uvec4 cornerValue = uvec4(leftTopPartValue, rightTopPartValue, rightBottomPartValue, leftBottomPartValue);
                uvec4 edge2Value  = uvec4(left2PartValue,   top2PartValue,     right2PartValue,      bottom2PartValue);

                uint centerCandidate = cellValue;

                uvec4 emptyCornerCandidate = uvec4(emptyCornerRule(edgeValue)                   ) * edgeValue;
                uvec4 cornerCandidate      = uvec4(cornerRule(cellValue, edgeValue, cornerValue)) * cellValue;

                emptyCornerCandidate = uint(outsideCircle) * emptyCornerCandidate;

                uvec2 linkCandidate     = uvec2(linkRule(edgeValue)                ) *       edgeValue.xy;
                uvec4 slimEdgeCandidate = uvec4(slimEdgeRule(cellValue, edge2Value)) * uvec4(cellValue);

                uvec4 resCorner                  = max(cornerCandidate, emptyCornerCandidate);
                uvec4 resSlimCornerTopRightPart  = max(resCorner.xxyy, slimEdgeCandidate.xyyz);
                uvec4 resSlimCornerBotomLeftPart = max(resCorner.zzww, slimEdgeCandidate.zwwx);

                uvec2 resLink     = max(linkCandidate, uvec2(centerCandidate));
                uint  resMidLinks = max(resLink.x,     resLink.y);

                mediump float cellPower           = float(cellValue                 ) *      domainFactor;
                mediump vec4  cornerPower         = vec4( resCorner                 ) * vec4(domainFactor);
                mediump vec4  slimTopRightPower   = vec4( resSlimCornerTopRightPart ) * vec4(domainFactor);
                mediump vec4  slimBottomLeftPower = vec4( resSlimCornerBotomLeftPart) * vec4(domainFactor);
                mediump vec2  linkPower           = vec2( resLink                   ) * vec2(domainFactor);
                mediump float midPower            = float(resMidLinks               ) *      domainFactor;

                mediump float enablePower =    float(insideFreeCircle)      *       cellPower;
                enablePower              += dot(vec4(insideFreeCorner),             cornerPower);
                enablePower              += dot(vec4(insideSlimEdgeTopRightPart),   slimTopRightPower); 
                enablePower              += dot(vec4(insideSlimEdgeBottomLeftPart), slimBottomLeftPower);
                enablePower              += dot(vec2(insideCenterLink),             linkPower); 
                enablePower              +=    float(insideBothLinks)       *       midPower;

                outColor = mix(gColorNone, gColorEnabled, enablePower);

                if((gFlags & FLAG_SHOW_SOLUTION) != 0)
                {
		            uint solutionValue = texelFetch(gSolution, cellNumber, 0).x;
        
                    uint leftPartSolved        = uint(nonLeftEdge)        * texelFetch(gSolution, leftCell,        0).x;
                    uint rightPartSolved       = uint(nonRightEdge)       * texelFetch(gSolution, rightCell,       0).x;
                    uint topPartSolved         = uint(nonTopEdge)         * texelFetch(gSolution, topCell,         0).x;
                    uint bottomPartSolved      = uint(nonBottomEdge)      * texelFetch(gSolution, bottomCell,      0).x;
                    uint leftTopPartSolved     = uint(nonLeftTopEdge)     * texelFetch(gSolution, leftTopCell,     0).x;
                    uint rightTopPartSolved    = uint(nonRightTopEdge)    * texelFetch(gSolution, rightTopCell,    0).x;
                    uint leftBottomPartSolved  = uint(nonLeftBottomEdge)  * texelFetch(gSolution, leftBottomCell,  0).x;
                    uint rightBottomPartSolved = uint(nonRightBottomEdge) * texelFetch(gSolution, rightBottomCell, 0).x;
                    uint left2PartSolved       = uint(nonLeft2Edge)       * texelFetch(gSolution, left2Cell,       0).x;
                    uint right2PartSolved      = uint(nonRight2Edge)      * texelFetch(gSolution, right2Cell,      0).x;
                    uint top2PartSolved        = uint(nonTop2Edge)        * texelFetch(gSolution, top2Cell,        0).x;
                    uint bottom2PartSolved     = uint(nonBottom2Edge)     * texelFetch(gSolution, bottom2Cell,     0).x;

                    uvec4 edgeSolved   = uvec4(leftPartSolved,    topPartSolved,      rightPartSolved,       bottomPartSolved);
                    uvec4 cornerSolved = uvec4(leftTopPartSolved, rightTopPartSolved, rightBottomPartSolved, leftBottomPartSolved);
                    uvec4 edge2Solved  = uvec4(left2PartSolved,   top2PartSolved,     right2PartSolved,      bottom2PartSolved);

                    uint centerSolutionCandidate = solutionValue;

                    uvec4 emptyCornerSolutionCandidate = uvec4(emptyCornerRule(edgeSolved)                        ) * edgeSolved;
                    uvec4 cornerSolutionCandidate      = uvec4(cornerRule(solutionValue, edgeSolved, cornerSolved)) * solutionValue;
        
                    uvec2 linkSolutionCandidate     = uvec2(linkRule(edgeSolved)                    ) *       edgeSolved.xy;
                    uvec4 slimEdgeSolutionCandidate = uvec4(slimEdgeRule(solutionValue, edge2Solved)) * uvec4(solutionValue);
        
                    uvec4 resCornerSolution                  = max(cornerSolutionCandidate, emptyCornerSolutionCandidate);
                    uvec4 resSlimCornerTopRightPartSolution  = max(resCornerSolution.xxyy,  slimEdgeSolutionCandidate.xyyz);
                    uvec4 resSlimCornerBotomLeftPartSolution = max(resCornerSolution.zzww,  slimEdgeSolutionCandidate.zwwx);
        
                    uvec2 resLinkSolution     = max(linkSolutionCandidate, uvec2(centerSolutionCandidate));
                    uint  resMidLinksSolution = max(resLinkSolution.x,     resLinkSolution.y);
        
                    mediump float cellSolutionPower           = float(solutionValue                     ) *      domainFactor;
                    mediump vec4  cornerSolutionPower         = vec4( resCornerSolution                 ) * vec4(domainFactor);
                    mediump vec4  slimTopRightSolutionPower   = vec4( resSlimCornerTopRightPartSolution ) * vec4(domainFactor);
                    mediump vec4  slimBottomLeftSolutionPower = vec4( resSlimCornerBotomLeftPartSolution) * vec4(domainFactor);
                    mediump vec2  linkSolutionPower           = vec2( resLinkSolution                   ) * vec2(domainFactor);
                    mediump float midSolutionPower            = float(resMidLinksSolution               ) *      domainFactor;

                    mediump float solvedPower =    float(insideFreeCircle)      *       cellSolutionPower;
                    solvedPower              += dot(vec4(insideFreeCorner),             cornerSolutionPower);
                    solvedPower              += dot(vec4(insideSlimEdgeTopRightPart),   slimTopRightSolutionPower); 
                    solvedPower              += dot(vec4(insideSlimEdgeBottomLeftPart), slimBottomLeftSolutionPower);
                    solvedPower              += dot(vec2(insideCenterLink),             linkSolutionPower); 
                    solvedPower              +=    float(insideBothLinks)       *       midSolutionPower;

                    outColor = mix(outColor, gColorSolved, solvedPower);
                }
                else if((gFlags & FLAG_SHOW_STABILITY) != 0)
                {
        			uint stabilityValue = texelFetch(gStability, cellNumber, 0).x;

			        lowp vec4 colorStable = vec4(1.0f, 1.0f, 1.0f, 1.0f) - gColorEnabled;
                    colorStable.a = 1.0f;

                    uint leftPartStable        = uint(nonLeftEdge)        * texelFetch(gStability, leftCell,        0).x;
                    uint rightPartStable       = uint(nonRightEdge)       * texelFetch(gStability, rightCell,       0).x;
                    uint topPartStable         = uint(nonTopEdge)         * texelFetch(gStability, topCell,         0).x;
                    uint bottomPartStable      = uint(nonBottomEdge)      * texelFetch(gStability, bottomCell,      0).x;
                    uint leftTopPartStable     = uint(nonLeftTopEdge)     * texelFetch(gStability, leftTopCell,     0).x;
                    uint rightTopPartStable    = uint(nonRightTopEdge)    * texelFetch(gStability, rightTopCell,    0).x;
                    uint leftBottomPartStable  = uint(nonLeftBottomEdge)  * texelFetch(gStability, leftBottomCell,  0).x;
                    uint rightBottomPartStable = uint(nonRightBottomEdge) * texelFetch(gStability, rightBottomCell, 0).x;
                    uint left2PartStable       = uint(nonLeft2Edge)       * texelFetch(gStability, left2Cell,       0).x;
                    uint right2PartStable      = uint(nonRight2Edge)      * texelFetch(gStability, right2Cell,      0).x;
                    uint top2PartStable        = uint(nonTop2Edge)        * texelFetch(gStability, top2Cell,        0).x;
                    uint bottom2PartStable     = uint(nonBottom2Edge)     * texelFetch(gStability, bottom2Cell,     0).x;

                    uvec4 edgeStable   = uvec4(leftPartStable,    topPartStable,      rightPartStable,       bottomPartStable);
                    uvec4 cornerStable = uvec4(leftTopPartStable, rightTopPartStable, rightBottomPartStable, leftBottomPartStable);
                    uvec4 edge2Stable  = uvec4(left2PartStable,   top2PartStable,     right2PartStable,      bottom2PartStable);
        
                    uint centerStabilityCandidate = stabilityValue;
        
                    uvec4 emptyCornerStabilityCandidate = uvec4(emptyCornerRule(edgeStable)                         ) * edgeStable;
                    uvec4 cornerStabilityCandidate      = uvec4(cornerRule(stabilityValue, edgeStable, cornerStable)) * stabilityValue;
        
                    uvec2 linkStabilityCandidate     = uvec2(linkRule(edgeStable)                     ) *       edgeStable.xy;
                    uvec4 slimEdgeStabilityCandidate = uvec4(slimEdgeRule(stabilityValue, edge2Stable)) * uvec4(stabilityValue);
        
                    uvec4 resCornerStability                  = max(cornerStabilityCandidate, emptyCornerStabilityCandidate);
                    uvec4 resSlimCornerTopRightPartStability  = max(resCornerStability.xxyy,  slimEdgeStabilityCandidate.xyyz);
                    uvec4 resSlimCornerBotomLeftPartStability = max(resCornerStability.zzww,  slimEdgeStabilityCandidate.zwwx);
        
                    uvec2 resLinkStability     = max(linkStabilityCandidate, uvec2(centerStabilityCandidate));
                    uint  resMidLinksStability = max(resLinkStability.x,     resLinkStability.y);
        
                    mediump float cellStabilityPower           = float(stabilityValue                     ) *      domainFactor;
                    mediump vec4  cornerStabilityPower         = vec4( resCornerStability                 ) * vec4(domainFactor);
                    mediump vec4  slimTopRightStabilityPower   = vec4( resSlimCornerTopRightPartStability ) * vec4(domainFactor);
                    mediump vec4  slimBottomLeftStabilityPower = vec4( resSlimCornerBotomLeftPartStability) * vec4(domainFactor);
                    mediump vec2  linkStabilityPower           = vec2( resLinkStability                   ) * vec2(domainFactor);
                    mediump float midStabilityPower            = float(resMidLinksStability               ) *      domainFactor;

                    mediump float stablePower =    float(insideFreeCircle)      *       cellStabilityPower;
                    stablePower              += dot(vec4(insideFreeCorner),             cornerStabilityPower);
                    stablePower              += dot(vec4(insideSlimEdgeTopRightPart),   slimTopRightStabilityPower); 
                    stablePower              += dot(vec4(insideSlimEdgeBottomLeftPart), slimBottomLeftStabilityPower);
                    stablePower              += dot(vec2(insideCenterLink),             linkStabilityPower); 
                    stablePower              +=    float(insideBothLinks)       *       midStabilityPower;

                    outColor = mix(outColor, colorStable, stablePower);
                }
            }
            else
            {
                outColor = gColorBetween;
            }
        }`;
        
        let defaultVS = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(defaultVS, vsSource);
        gl.compileShader(defaultVS);

        if(!gl.getShaderParameter(defaultVS, gl.COMPILE_STATUS))
        {
            alert(gl.getShaderInfoLog(defaultVS));
        }

        let squaresFS = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(squaresFS, squaresFsSource);
        gl.compileShader(squaresFS);

        if(!gl.getShaderParameter(squaresFS, gl.COMPILE_STATUS))
        {
            alert(gl.getShaderInfoLog(squaresFS));
        }

        let circlesFS = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(circlesFS, circlesFsSource);
        gl.compileShader(circlesFS);

        if(!gl.getShaderParameter(circlesFS, gl.COMPILE_STATUS))
        {
            alert(gl.getShaderInfoLog(circlesFS));
        }

        let diamondsFS = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(diamondsFS, diamondsFsSource);
        gl.compileShader(diamondsFS);

        if(!gl.getShaderParameter(diamondsFS, gl.COMPILE_STATUS))
        {
            alert(gl.getShaderInfoLog(diamondsFS));
        }

        let beamsFS = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(beamsFS, beamsFsSource);
        gl.compileShader(beamsFS);

        if(!gl.getShaderParameter(beamsFS, gl.COMPILE_STATUS))
        {
            alert(gl.getShaderInfoLog(beamsFS));
        }

        let raindropsFS = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(raindropsFS, raindropsFsSource);
        gl.compileShader(raindropsFS);

        if(!gl.getShaderParameter(raindropsFS, gl.COMPILE_STATUS))
        {
            alert(gl.getShaderInfoLog(raindropsFS));
        }

        let chainsFS = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(chainsFS, chainsFsSource);
        gl.compileShader(chainsFS);

        if(!gl.getShaderParameter(chainsFS, gl.COMPILE_STATUS))
        {
            alert(gl.getShaderInfoLog(chainsFS));
        }

        squaresShaderProgram = gl.createProgram();
        gl.attachShader(squaresShaderProgram, defaultVS);
        gl.attachShader(squaresShaderProgram, squaresFS);
        gl.linkProgram(squaresShaderProgram);

        if(!gl.getProgramParameter(squaresShaderProgram, gl.LINK_STATUS))
        {
            alert(gl.getProgramInfoLog(squaresShaderProgram));
        }

        circlesShaderProgram = gl.createProgram();
        gl.attachShader(circlesShaderProgram, defaultVS);
        gl.attachShader(circlesShaderProgram, circlesFS);
        gl.linkProgram(circlesShaderProgram);

        if(!gl.getProgramParameter(circlesShaderProgram, gl.LINK_STATUS))
        {
            alert(gl.getProgramInfoLog(circlesShaderProgram));
        }

        diamondsShaderProgram = gl.createProgram();
        gl.attachShader(diamondsShaderProgram, defaultVS);
        gl.attachShader(diamondsShaderProgram, diamondsFS);
        gl.linkProgram(diamondsShaderProgram);

        if(!gl.getProgramParameter(diamondsShaderProgram, gl.LINK_STATUS))
        {
            alert(gl.getProgramInfoLog(diamondsShaderProgram));
        }

        beamsShaderProgram = gl.createProgram();
        gl.attachShader(beamsShaderProgram, defaultVS);
        gl.attachShader(beamsShaderProgram, beamsFS);
        gl.linkProgram(beamsShaderProgram);

        if(!gl.getProgramParameter(beamsShaderProgram, gl.LINK_STATUS))
        {
            alert(gl.getProgramInfoLog(beamsShaderProgram));
        }

        raindropsShaderProgram = gl.createProgram();
        gl.attachShader(raindropsShaderProgram, defaultVS);
        gl.attachShader(raindropsShaderProgram, raindropsFS);
        gl.linkProgram(raindropsShaderProgram);

        if(!gl.getProgramParameter(raindropsShaderProgram, gl.LINK_STATUS))
        {
            alert(gl.getProgramInfoLog(raindropsShaderProgram));
        }

        chainsShaderProgram = gl.createProgram();
        gl.attachShader(chainsShaderProgram, defaultVS);
        gl.attachShader(chainsShaderProgram, chainsFS);
        gl.linkProgram(chainsShaderProgram);

        if(!gl.getProgramParameter(chainsShaderProgram, gl.LINK_STATUS))
        {
            alert(gl.getProgramInfoLog(chainsShaderProgram));
        }
    }

    function updateBoardTexture()
    {
        if(currentGameBoard === null)
        {
            return;
        }

        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.bindTexture(gl.TEXTURE_2D, boardTexture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, currentGameSize, currentGameSize, gl.RED_INTEGER, gl.UNSIGNED_BYTE, currentGameBoard);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    function updateSolutionTexture()
    {
        if(currentGameSolution === null)
        {
            return;
        }

        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.bindTexture(gl.TEXTURE_2D, solutionTexture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, currentGameSize, currentGameSize, gl.RED_INTEGER, gl.UNSIGNED_BYTE, currentGameSolution);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    function updateStabilityTexture()
    {
        if(currentGameStability === null && currentGameLitStability === null)
        {
            return;
        }

        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.bindTexture(gl.TEXTURE_2D, stabilityTexture);
        if(flagShowLitStability && currentGameLitStability !== null)
        {
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, currentGameSize, currentGameSize, gl.RED_INTEGER, gl.UNSIGNED_BYTE, currentGameLitStability);
        }
        else if(currentGameStability !== null)
        {
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, currentGameSize, currentGameSize, gl.RED_INTEGER, gl.UNSIGNED_BYTE, currentGameStability);
        }
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    function mainDraw()
    {
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        let drawFlags = 0;
        if(flagShowSolution || flagShowInverseSolution)
        {
            drawFlags = drawFlags | 1;
        }
        if(flagShowStability || flagShowLitStability)
        {
            drawFlags = drawFlags | 2;
        }
        if(flagToroidBoard)
        {
            drawFlags = drawFlags | 4;
        }
        if(flagNoGrid)
        {
            drawFlags = drawFlags | 8;
        }

        gl.bindVertexArray(drawVertexBuffer);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(currentShaderProgram);

        gl.uniform1i(boardSizeUniformLocation,  currentGameSize);
        gl.uniform1i(cellSizeUniformLocation,   currentCellSize);
        gl.uniform1i(domainSizeUniformLocation, currentDomainSize);
        gl.uniform1i(flagsUniformLocation,      drawFlags);

        gl.uniform1i(canvasWidthUniformLocation,     currentViewportWidth);
        gl.uniform1i(canvasHeightUniformLocation,    currentViewportHeight);
        gl.uniform1i(viewportXOffsetUniformLocation, currentViewportOffsetX);
        gl.uniform1i(viewportYOffsetUniformLocation, currentViewportOffsetY);

        gl.uniform4f(colorNoneUniformLocation,    currentColorUnlit[0],   currentColorUnlit[1],   currentColorUnlit[2],   currentColorUnlit[3]);
        gl.uniform4f(colorEnabledUniformLocation, currentColorLit[0],     currentColorLit[1],     currentColorLit[2],     currentColorLit[3]);
        gl.uniform4f(colorSolvedUniformLocation,  currentColorSolved[0],  currentColorSolved[1],  currentColorSolved[2],  currentColorSolved[3]);
        gl.uniform4f(colorBetweenUniformLocation, currentColorBetween[0], currentColorBetween[1], currentColorBetween[2], currentColorBetween[3]);

        gl.uniform1i(boardTextureUniformLocation,     0);
        gl.uniform1i(solutionTextureUniformLocation,  1);
        gl.uniform1i(stabilityTextureUniformLocation, 2);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, boardTexture);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, solutionTexture);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, stabilityTexture);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        gl.bindVertexArray(null);

        gl.uniform1i(boardSizeUniformLocation,  null);
        gl.uniform1i(cellSizeUniformLocation,   null);
        gl.uniform1i(domainSizeUniformLocation, null);
        gl.uniform1i(flagsUniformLocation,      null);

        gl.uniform1i(canvasWidthUniformLocation,     null);
        gl.uniform1i(canvasHeightUniformLocation,    null);
        gl.uniform1i(viewportXOffsetUniformLocation, null);
        gl.uniform1i(viewportYOffsetUniformLocation, null);

        gl.uniform4f(colorNoneUniformLocation,    0, 0, 0, 0);
        gl.uniform4f(colorEnabledUniformLocation, 0, 0, 0, 0);
        gl.uniform4f(colorSolvedUniformLocation,  0, 0, 0, 0);
        gl.uniform4f(colorBetweenUniformLocation, 0, 0, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, null);

        if(flagNeedToSaveBoard) //Can only save immediately after drawing, saving in other places will save black screen
        {
            saveBoardToImage();
            flagNeedToSaveBoard = false;
        }
    }
}