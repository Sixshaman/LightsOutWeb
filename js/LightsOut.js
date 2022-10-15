////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////    UTIL FUNCTIONS    /////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

let Topologies = 
{
    SquareTopology:          0,
    TorusTopology:           1,
    ProjectivePlaneTopology: 2,
    UndefinedTopology:       3
}

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

//Gets 2-dimensional cell index from a canvas point (x, y) for the given board size (gameSize x gameSize) and canvas size (canvasWidth x canvasHeight).
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

function encodeBase64ClickRule(clickRule, boardTopology)
{
    let encodeStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-+";

    let base64Str = "";
    if(boardTopology == Topologies.TorusTopology) //Encode topology in the first character
    {
        base64Str += "T";
    }
    else if(boardTopology == Topologies.ProjectivePlaneTopology)
    {
        base64Str += "P";
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
    let boardTopology  = Topologies.SquareTopology;
    let clickRuleSize  = 0;

    if(base64Str.length == 0 || (base64Str[0] != 'C' && base64Str[0] != 'T' && base64Str[0] != 'P'))
    {
        //Return default values
        let defaultClickRule = new Uint8Array([0, 1, 0, 1, 1, 1, 0, 1, 0]);
        return {clickrule: defaultClickRule, clickrulesize: 3, topology: Topologies.SquareTopology};
    }

    if(base64Str[0] == 'C')
    {
        boardTopology = Topologies.SquareTopology;
    }
    else if(base64Str[0] == 'T')
    {
        boardTopology = Topologies.TorusTopology;
    }
    else if(base64Str[0] == 'P')
    {
        boardTopology = Topologies.ProjectivePlaneTopology;
    }

    //The remainder of the base64 string should be divisible by 4
    if(((base64Str.length - 1) % 4) != 0)
    {
        //Return default values
        let defaultClickRule = new Uint8Array([0, 1, 0, 1, 1, 1, 0, 1, 0]);
        return {clickrule: defaultClickRule, clickrulesize: 3, topology: boardTopology};
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
        return {clickrule: defaultClickRule, clickrulesize: 3, topology: boardTopology};
    }

    for(let i = 0; i < cellCount; i++)
    {
        //Click rule should be valid for the domain
        if(clickRuleArray[i] >= domainSize)
        {
            //Return default values
            let defaultClickRule = new Uint8Array([0, 1, 0, 1, 1, 1, 0, 1, 0]);
            return {clickrule: defaultClickRule, clickrulesize: 3, topology: boardTopology};   
        }
    }

    let clickRule = new Uint8Array(clickRuleArray.slice(0, cellCount));
    return {clickrule: clickRule, clickrulesize: clickRuleSize, topology: boardTopology};
}

function labF(t) 
{
    let delta = 6.0 / 29.0;
    if(t > delta * delta * delta)
    {
        return Math.pow(t, 1 / 3.0);
    }
    else
    {
        return t / (3 * delta * delta) + 4.0 / 29.0;
    }
}

function rgbToLab(R, G, B)
{
    let X = (0.49000 * R + 0.31000 * G + 0.20000 * B) / 0.17697;
    let Y = (0.19697 * R + 0.81240 * G + 0.01063 * B) / 0.17697;
    let Z = (0.00000 * R + 0.01000 * G + 0.99000 * B) / 0.17697;

    let L = 116 * labF(Y / 100.0)    - 16;
    let a = 500 * (labF(X / 95.0489) - labF(Y / 100.0));
    let b = 200 * (labF(Y / 100.0)   - labF(Z / 108.8840));

    return [L, a, b];
}

//CIEDE2000
function ciede2000(L1, a1, b1, L2, a2, b2)
{
    let C1 = Math.sqrt(a1 * a1 + b1 * b1);
    let C2 = Math.sqrt(a2 * a2 + b2 * b2);

    let L_ = (L1 + L2) / 2;
    let C_ = (C1 + C2) / 2;

    let C7        = C_ * C_ * C_ * C_ * C_ * C_ * C_;
    let twenty57_ = 25 * 25 * 25 * 25 * 25 * 25 * 25;

    let a1q = a1 + (a1 / 2) * (1 - Math.sqrt(C7 / (C7 + twenty57_)));
    let a2q = a2 + (a2 / 2) * (1 - Math.sqrt(C7 / (C7 + twenty57_)));

    let C1q = Math.sqrt(a1q * a1q + b1 * b1);
    let C2q = Math.sqrt(a2q * a2q + b2 * b2);

    let h1 = (Math.atan2(b1, a1q) + Math.PI) * 180.0 / Math.PI;
    let h2 = (Math.atan2(b2, a2q) + Math.PI) * 180.0 / Math.PI;

    let deltahq = 0.0;
    if(Math.abs(C1q) < 0.0000001 || Math.abs(C2q) < 0.0000001)
    {
        deltahq = 0.0;
    }
    else if(Math.abs(h1 - h2) <= 180)
    {
        deltahq = h1 - h2;
    }
    else if(Math.abs(h1 - h2) > 180 && h2 <= h1)
    {
        deltahq = h2 - h1 + 360;
    }
    else if(Math.abs(h1 - h2) > 180 && h2 > h1)
    {
        deltahq = h2 - h1 - 360;
    }

    let H_ = 0.0;
    if(Math.abs(C1q) < 0.0000001 || Math.abs(C2q) < 0.0000001)
    {
        H_ = h1 + h2;
    }
    else if(Math.abs(h1 - h2) <= 180)
    {
        H_ = (h1 + h2) / 2;
    }
    else if(Math.abs(h1 - h2) > 180 && (h1 + h2 < 360))
    {
        H_ = (h1 + h2 + 360) / 2;
    }
    else if(Math.abs(h1 - h2) > 180 && (h1 + h2 >= 360))
    {
        H_ = (h1 + h2 - 360) / 2;
    }

    let deltaL = L2  - L1;
    let deltaC = C2q - C1q;
    let deltaH = 2 * Math.sqrt(C1q * C2q) * Math.sin(deltahq * Math.PI / 360.0);
    
    let T = 1 - 0.17 * Math.cos((H_ - 30) * Math.PI / 180) + 0.24 * Math.cos((2 * H_) * Math.PI / 180) + 0.32 * Math.cos((3 * H_ + 6) * Math.PI / 180) - 0.20 * Math.cos((4 * H_ - 63) * Math.PI / 180);

    let SL = 1 + 0.015 * (L_ - 50) * (L_ - 50) / Math.sqrt(20 + (L_ - 50) * (L_ - 50));
    let SC = 1 + 0.045 * C_;
    let SH = 1 + 0.015 * C_ * T;

    let RT = -2 * Math.sqrt(C7 / (C7 + twenty57_)) * Math.sin(60 * Math.exp(-(H_ - 275) * (H_ - 275) / 625) * Math.PI / 180);

    let deltaLTerm = (deltaL / SL) * (deltaL / SL);
    let deltaCTerm = (deltaC / SC) * (deltaC / SC);
    let deltaHTerm = (deltaH / SH) * (deltaH / SH);
    let RTTerm     = RT * (deltaC / SC) * (deltaH / SH);

    return Math.sqrt(deltaLTerm + deltaCTerm + deltaHTerm + RTTerm);
}

//Returns (num % modulo) with regard to the sign of num
function wholeMod(num, modulo)
{
    return ((num % modulo) + modulo) % modulo;
}

//////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////    CLICK RULE FUNCTIONS    /////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////

//Makes a turn at (cellX, cellY) cell of the board board with regard to click rule clickRule
function makeTurn(board, clickRule, clickRuleSize, gameSize, domainSize, cellX, cellY, boardTopology)
{
    if(boardTopology == Topologies.TorusTopology)
    {
        let populatedClickRuleT = populateClickRuleTorus(clickRule, clickRuleSize, gameSize, domainSize, cellX, cellY);
        return addBoard(board, populatedClickRuleT, domainSize);
    }
    else if(boardTopology == Topologies.ProjectivePlaneTopology)
    {
        let populatedClickRuleP = populateClickRuleProjectivePlane(clickRule, clickRuleSize, gameSize, domainSize, cellX, cellY);
        return addBoard(board, populatedClickRuleP, domainSize); 
    }
    else
    {
        let populatedClickRuleS = populateClickRuleSquare(clickRule, clickRuleSize, gameSize, domainSize, cellX, cellY);
        return addBoard(board, populatedClickRuleS, domainSize);
    }
}

//Makes a turn at (cellX, cellY) using explicit matrix
function makeTurnMatrix(board, matrix, gameSize, domainSize, cellX, cellY)
{
    let cellIndex = flatCellIndex(gameSize, cellX, cellY);
    return addBoard(board, matrix[cellIndex], domainSize);
}

//Flips the state of the (cellX, cellY) cell 
function makeConstructTurn(board, gameSize, domainSize, cellX, cellY)
{
    let cellIndex = flatCellIndex(gameSize, cellX, cellY);
    board[cellIndex] = (board[cellIndex] + 1) % domainSize;
}

//Fast in-place version for making turns in batch provided in turnListBoard, without populating click rules
function makeTurns(board, clickRule, clickRuleSize, gameSize, domainSize, turnListBoard, boardTopology) 
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
                let yOdd = false;
                
                if(boardTopology == Topologies.SquareTopology)
                {
                    if(yBig < 0 || yBig >= gameSize)
                    {
                        continue;
                    }
                }
                else
                {
                    if(boardTopology == Topologies.ProjectivePlaneTopology)
                    {
                        yOdd = Math.floor(yBig / gameSize) % 2 != 0;
                    }

                    yBig = wholeMod(yBig, gameSize);
                }

                for(let xClick = 0; xClick < clickRuleSize; xClick++)
                {
                    let xBig = xClick + left;
                    let xOdd = false;
                    
                    if(boardTopology == Topologies.SquareTopology)
                    {
                        if(xBig < 0 || xBig >= gameSize)
                        {
                            continue;
                        }
                    }
                    else
                    {
                        if(boardTopology == Topologies.ProjectivePlaneTopology)
                        {
                            xOdd = Math.floor(xBig / gameSize) % 2 != 0;
                        }

                        xBig = wholeMod(xBig, gameSize);
                    }

                    let xBigClick = yOdd ? (gameSize - xBig - 1) : xBig;
                    let yBigClick = xOdd ? (gameSize - yBig - 1) : yBig;

                    let bigClickIndex = flatCellIndex(gameSize,      xBigClick, yBigClick);
                    let smlClickIndex = flatCellIndex(clickRuleSize, xClick,    yClick);

                    newBoard[bigClickIndex] = (newBoard[bigClickIndex] + turnValue * clickRule[smlClickIndex]) % domainSize;
                }
            }
        }
    }

    return newBoard;
}

//Fast in-place version for making turns in batch provided in turnListBoard, without populating click rules. Default click rule version
function makeTurnsDefault(board, gameSize, domainSize, turnListBoard, boardTopology)
{
    let newBoard = board.slice();

    if(boardTopology == Topologies.TorusTopology)
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
    else if(boardTopology == Topologies.ProjectivePlaneTopology)
    {
        for(let y = 0; y < gameSize; y++)
        {
            for(let x = 0; x < gameSize; x++)
            {
                let thisCellIndex = flatCellIndex(gameSize, x, y);
                let turnValue     = turnListBoard[thisCellIndex];

                newBoard[thisCellIndex] = (newBoard[thisCellIndex] + turnValue) % domainSize;

                if(x == 0)
                {
                    let leftCellIndex       = flatCellIndex(gameSize, gameSize - 1, gameSize - y - 1);
                    newBoard[leftCellIndex] = (newBoard[leftCellIndex] + turnValue) % domainSize;
                }
                else
                {
                    let leftCellIndex       = flatCellIndex(gameSize, x - 1, y);
                    newBoard[leftCellIndex] = (newBoard[leftCellIndex] + turnValue) % domainSize;
                }

                if(x == gameSize - 1)
                {
                    let rightCellIndex       = flatCellIndex(gameSize, 0, gameSize - y - 1);
                    newBoard[rightCellIndex] = (newBoard[rightCellIndex] + turnValue) % domainSize;
                }
                else
                {
                    let rightCellIndex       = flatCellIndex(gameSize, x + 1, y);
                    newBoard[rightCellIndex] = (newBoard[rightCellIndex] + turnValue) % domainSize;
                }

                if(y == 0)
                {
                    let topCellIndex       = flatCellIndex(gameSize, gameSize - x - 1, gameSize - 1);
                    newBoard[topCellIndex] = (newBoard[topCellIndex] + turnValue) % domainSize;
                }
                else
                {
                    let topCellIndex       = flatCellIndex(gameSize, x, y - 1);
                    newBoard[topCellIndex] = (newBoard[topCellIndex] + turnValue) % domainSize;
                }

                if(y == gameSize - 1)
                {
                    let bottomCellIndex       = flatCellIndex(gameSize, gameSize - x - 1, 0);
                    newBoard[bottomCellIndex] = (newBoard[bottomCellIndex] + turnValue) % domainSize;
                }
                else
                {
                    let bottomCellIndex       = flatCellIndex(gameSize, x, y + 1);
                    newBoard[bottomCellIndex] = (newBoard[bottomCellIndex] + turnValue) % domainSize;
                }
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

function makeTurnsMatrix(board, matrix, gameSize, turnlistBoard, domainSize)
{
    let boardToAdd   = board.slice();
    const matrixSize = gameSize * gameSize;

    for(let i = 0; i < matrixSize; i++)
    {
        boardToAdd[i] = dotProductBoard(turnlistBoard, matrix[i], domainSize);
    }

    return addBoard(board, boardToAdd, domainSize);
}

//Translates the click rule from the click rule space to the board space (regular version)
function populateClickRuleSquare(clickRule, clickRuleSize, gameSize, domainSize, cellX, cellY)
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

//Translates the click rule from the click rule space to the board space (torus version)
function populateClickRuleTorus(clickRule, clickRuleSize, gameSize, domainSize, cellX, cellY)
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

            populatedClickRule[bigClickIndex] = (populatedClickRule[bigClickIndex] + clickRule[smlClickIndex]) % domainSize;
        }
    }

    return populatedClickRule;
}

//Translates the click rule from the click rule space to the board space (projective plane version)
function populateClickRuleProjectivePlane(clickRule, clickRuleSize, gameSize, domainSize, cellX, cellY)
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
        let yBigOdd = Math.floor(yBig / gameSize) % 2 != 0;
        
        for(let x = 0; x < clickRuleSize; x++)
        {
            let xBig    = x + left;
            let xBigMod = wholeMod(xBig, gameSize);
            let xBigOdd = Math.floor(xBig / gameSize) % 2 != 0;

            let yBigCorrected = xBigOdd ? (gameSize - yBigMod - 1) : yBigMod;
            let xBigCorrected = yBigOdd ? (gameSize - xBigMod - 1) : xBigMod;

            let bigClickIndex = flatCellIndex(gameSize, xBigCorrected, yBigCorrected);
            let smlClickIndex = flatCellIndex(clickRuleSize, x, y);

            populatedClickRule[bigClickIndex] = (populatedClickRule[bigClickIndex] + clickRule[smlClickIndex]) % domainSize;
        }
    }

    return populatedClickRule;
}

//Calculates the Lights Out matrix for the given click rule and game size
function calculateGameMatrix(clickRule, gameSize, clickRuleSize, domainSize, boardTopology)
{
    //Generate a regular Lights Out matrix for the click rule
    let lightsOutMatrix = [];
    for(let yL = 0; yL < gameSize; yL++)
    {
        for(let xL = 0; xL < gameSize; xL++)
        {
            let matrixRow = {};
            if(boardTopology == Topologies.TorusTopology)
            {
                matrixRow = populateClickRuleTorus(clickRule, clickRuleSize, gameSize, domainSize, xL, yL);
            }
            else if(boardTopology == Topologies.ProjectivePlaneTopology)
            {
                matrixRow = populateClickRuleProjectivePlane(clickRule, clickRuleSize, gameSize, domainSize, xL, yL);
            }
            else
            {
                matrixRow = populateClickRuleSquare(clickRule, clickRuleSize, gameSize, domainSize, xL, yL);
            }

            lightsOutMatrix.push(matrixRow);
        }
    }

    return lightsOutMatrix;
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
function calculateInverseSolution(board, gameSize, domainSize, clickRule, clickRuleSize, boardTopology, isDefaultClickRule)
{
    let invSolution = new Uint8Array(gameSize * gameSize);
    invSolution.fill(0);

    if(isDefaultClickRule)
    {
        invSolution = makeTurnsDefault(invSolution, gameSize, domainSize, board, boardTopology);
    }
    else
    {
        invSolution = makeTurns(invSolution, clickRule, clickRuleSize, gameSize, domainSize, board, boardTopology);
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

//Invalidates all elements of the board modulo domainSize, in-place
function invalidateMatrixDomainInPlace(matrix, domainSize)
{
    if(domainSize === 0)
    {
        return;
    }

    for(let i = 0; i < matrix.length; i++)
    {
        let matrixRow = matrix[i];
        for(let j = 0; j < matrixRow.length; j++)
        {
            matrixRow[j] = Math.min(matrixRow[j], domainSize - 1);
        }
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

//////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////    SHADER FUNCTIONS    /////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

//Common start for all render mode fragment shaders.
//Contains basic declarations and helper functions.
const ShaderCommonStart = 
`#version 300 es

#define FLAG_SHOW_SOLUTION  0x01
#define FLAG_SHOW_STABILITY 0x02
#define FLAG_NO_GRID        0x04
#define MASK_TOPOLOGY       0x38 //3 bits for topology mask

uniform highp usampler2D gBoard;
uniform highp usampler2D gSolution;
uniform highp usampler2D gStability;

uniform lowp vec4 gColorNone;
uniform lowp vec4 gColorEnabled;
uniform lowp vec4 gColorSolved;
uniform lowp vec4 gColorBetween;

uniform int gImageWidth;
uniform int gImageHeight;
uniform int gViewportOffsetX;
uniform int gViewportOffsetY;

uniform int gBoardSize;
uniform int gCellSize;
uniform int gDomainSize;
uniform int gFlags;

layout(location = 0) out lowp vec4 outColor;

const uint SquareTopology          = 0u;
const uint TorusTopology           = 1u;
const uint ProjectivePlaneTopology = 2u;

uint GetTopology()
{
    return uint((gFlags & MASK_TOPOLOGY) >> 3);
}

//GLSL operator && doesn't work on per-component basis :(
bvec4 b4nd(bvec4 a, bvec4 b)
{
    return bvec4(a.x && b.x, a.y && b.y, a.z && b.z, a.w && b.w);
}

bvec4 b4or(bvec4 a, bvec4 b) //Yet another thing that doesn't require writing functions in hlsl
{
    return bvec4(a.x || b.x, a.y || b.y, a.z || b.z, a.w || b.w);
}

bvec2 b2nd(bvec2 a, bvec2 b) //Yet another thing that doesn't require writing functions in hlsl
{
    return bvec2(a.x && b.x, a.y && b.y);
}

bvec4 b4nd(bvec4 a, bvec4 b, bvec4 c) //No, they are not kidding
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

bvec2 b2nd(bvec2 a, bvec2 b, bvec2 c) //For Christ's sake
{
    return bvec2(a.x && b.x && c.x, a.y && b.y && c.y);
}

bool b1nd(bool a, bool b, bool c) //And that's what happens when you want the code which is both uniform-looking and working
{
    return a && b && c;
}
`;

function createDefaultVertexShader(context)
{
    let defaultVSSource = 
    `#version 300 es

    layout(location = 0) in mediump vec4 vScreenPos;
    void main(void)
    {
        gl_Position = vScreenPos;
    }
    `;

    let defaultVS = context.createShader(context.VERTEX_SHADER);
    context.shaderSource(defaultVS, defaultVSSource);
    context.compileShader(defaultVS);

    if(!context.getShaderParameter(defaultVS, context.COMPILE_STATUS))
    {
        alert(context.getShaderInfoLog(defaultVS));
    }

    return defaultVS;
}

function createSquaresShaderProgram(context, vertexShader)
{
    const squaresFSSource = ShaderCommonStart +
    `
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

    return createShaderProgram(context, squaresFSSource, vertexShader);
}

function createCirclesShaderProgam(context, vertexShader)
{
    //https://lightstrout.com/blog/2019/05/21/circles-render-mode/
    const circlesFSSource = ShaderCommonStart +
    `
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

            if(GetTopology() != SquareTopology)
            {
                nonLeftEdge   = true;
                nonRightEdge  = true;
                nonTopEdge    = true;
                nonBottomEdge = true;

                const uint maxCheckDistance = 1u; //Different for different render modes

                ivec2 boardSizeWrap = ivec2(gBoardSize) * int(maxCheckDistance);

                uvec2 leftCellWrapped   = uvec2(leftCell   + boardSizeWrap);
                uvec2 rightCellWrapped  = uvec2(rightCell  + boardSizeWrap);
                uvec2 topCellWrapped    = uvec2(topCell    + boardSizeWrap);
                uvec2 bottomCellWrapped = uvec2(bottomCell + boardSizeWrap);

                leftCell   = ivec2(leftCellWrapped   % uvec2(gBoardSize));
                rightCell  = ivec2(rightCellWrapped  % uvec2(gBoardSize));
                topCell    = ivec2(topCellWrapped    % uvec2(gBoardSize));
                bottomCell = ivec2(bottomCellWrapped % uvec2(gBoardSize));

                if(GetTopology() == ProjectivePlaneTopology)
                {
                    bool leftCellFlipped   = (leftCellWrapped.x   / uint(gBoardSize) + maxCheckDistance) % 2u != 0u;
                    bool rightCellFlipped  = (rightCellWrapped.x  / uint(gBoardSize) + maxCheckDistance) % 2u != 0u;
                    bool topCellFlipped    = (topCellWrapped.y    / uint(gBoardSize) + maxCheckDistance) % 2u != 0u;
                    bool bottomCellFlipped = (bottomCellWrapped.y / uint(gBoardSize) + maxCheckDistance) % 2u != 0u;

                    if(leftCellFlipped)
                    {
                        leftCell.y = gBoardSize - leftCell.y - 1;
                    }

                    if(rightCellFlipped)
                    {
                        rightCell.y = gBoardSize - rightCell.y - 1;
                    }

                    if(topCellFlipped)
                    {
                        topCell.x = gBoardSize - topCell.x - 1;
                    }

                    if(bottomCellFlipped)
                    {
                        bottomCell.x = gBoardSize - bottomCell.x - 1;
                    }
                }
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

    return createShaderProgram(context, circlesFSSource, vertexShader);
}

function createDiamondsShaderProgram(context, vertexShader)
{
    //http://lightstrout.com/blog/2019/12/09/diamonds-render-mode/
    const diamondsFSSource = ShaderCommonStart +
    `
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

            if(GetTopology() != SquareTopology)
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

                ivec2 boardSizeWrap = ivec2(gBoardSize) * int(maxCheckDistance);

                uvec2 leftCellWrapped        = uvec2(leftCell        + boardSizeWrap);
                uvec2 rightCellWrapped       = uvec2(rightCell       + boardSizeWrap);
                uvec2 topCellWrapped         = uvec2(topCell         + boardSizeWrap);
                uvec2 bottomCellWrapped      = uvec2(bottomCell      + boardSizeWrap);
                uvec2 leftTopCellWrapped     = uvec2(leftTopCell     + boardSizeWrap);
                uvec2 rightTopCellWrapped    = uvec2(rightTopCell    + boardSizeWrap);
                uvec2 leftBottomCellWrapped  = uvec2(leftBottomCell  + boardSizeWrap);
                uvec2 rightBottomCellWrapped = uvec2(rightBottomCell + boardSizeWrap);

                leftCell        = ivec2(leftCellWrapped        % uvec2(gBoardSize));
                rightCell       = ivec2(rightCellWrapped       % uvec2(gBoardSize));
                topCell         = ivec2(topCellWrapped         % uvec2(gBoardSize));
                bottomCell      = ivec2(bottomCellWrapped      % uvec2(gBoardSize));
                leftTopCell     = ivec2(leftTopCellWrapped     % uvec2(gBoardSize));
                rightTopCell    = ivec2(rightTopCellWrapped    % uvec2(gBoardSize));
                leftBottomCell  = ivec2(leftBottomCellWrapped  % uvec2(gBoardSize));
                rightBottomCell = ivec2(rightBottomCellWrapped % uvec2(gBoardSize));

                if(GetTopology() == ProjectivePlaneTopology)
                {
                    bool  leftCellFlipped        =          (leftCellWrapped.x      /  uint(gBoardSize) +       maxCheckDistance)  %       2u  !=     0u;
                    bool  rightCellFlipped       =          (rightCellWrapped.x     /  uint(gBoardSize) +       maxCheckDistance)  %       2u  !=     0u;
                    bool  topCellFlipped         =          (topCellWrapped.y       /  uint(gBoardSize) +       maxCheckDistance)  %       2u  !=     0u;
                    bool  bottomCellFlipped      =          (bottomCellWrapped.y    /  uint(gBoardSize) +       maxCheckDistance)  %       2u  !=     0u;
                    bvec2 leftTopCellFlipped     = notEqual((leftTopCellWrapped     / uvec2(gBoardSize) + uvec2(maxCheckDistance)) % uvec2(2u), uvec2(0u));
                    bvec2 rightTopCellFlipped    = notEqual((rightTopCellWrapped    / uvec2(gBoardSize) + uvec2(maxCheckDistance)) % uvec2(2u), uvec2(0u));
                    bvec2 leftBottomCellFlipped  = notEqual((leftBottomCellWrapped  / uvec2(gBoardSize) + uvec2(maxCheckDistance)) % uvec2(2u), uvec2(0u));
                    bvec2 rightBottomCellFlipped = notEqual((rightBottomCellWrapped / uvec2(gBoardSize) + uvec2(maxCheckDistance)) % uvec2(2u), uvec2(0u));

                    if(leftCellFlipped)
                    {
                        leftCell.y = gBoardSize - leftCell.y - 1;
                    }

                    if(rightCellFlipped)
                    {
                        rightCell.y = gBoardSize - rightCell.y - 1;
                    }

                    if(topCellFlipped)
                    {
                        topCell.x = gBoardSize - topCell.x - 1;
                    }

                    if(bottomCellFlipped)
                    {
                        bottomCell.x = gBoardSize - bottomCell.x - 1;
                    }

                    if(leftTopCellFlipped.x)
                    {
                        leftTopCell.y = gBoardSize - leftTopCell.y - 1;
                    }

                    if(leftTopCellFlipped.y)
                    {
                        leftTopCell.x = gBoardSize - leftTopCell.x - 1;
                    }

                    if(rightTopCellFlipped.x)
                    {
                        rightTopCell.y = gBoardSize - rightTopCell.y - 1;
                    }

                    if(rightTopCellFlipped.y)
                    {
                        rightTopCell.x = gBoardSize - rightTopCell.x - 1;
                    }

                    if(leftBottomCellFlipped.x)
                    {
                        leftBottomCell.y = gBoardSize - leftBottomCell.y - 1;
                    }

                    if(leftBottomCellFlipped.y)
                    {
                        leftBottomCell.x = gBoardSize - leftBottomCell.x - 1;
                    }

                    if(rightBottomCellFlipped.x)
                    {
                        rightBottomCell.y = gBoardSize - rightBottomCell.y - 1;
                    }

                    if(rightBottomCellFlipped.y)
                    {
                        rightBottomCell.x = gBoardSize - rightBottomCell.x - 1;
                    }
                }
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

    return createShaderProgram(context, diamondsFSSource, vertexShader);
}

function createBeamsShaderProgram(context, vertexShader)
{
    //https://lightstrout.com/blog/2019/12/18/beams-render-mode/
    const beamsFSSource = ShaderCommonStart +
    `
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

            if(GetTopology() != SquareTopology)
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

                ivec2 boardSizeWrap = ivec2(gBoardSize) * int(maxCheckDistance);

                uvec2 leftCellWrapped        = uvec2(leftCell        + boardSizeWrap);
                uvec2 rightCellWrapped       = uvec2(rightCell       + boardSizeWrap);
                uvec2 topCellWrapped         = uvec2(topCell         + boardSizeWrap);
                uvec2 bottomCellWrapped      = uvec2(bottomCell      + boardSizeWrap);
                uvec2 leftTopCellWrapped     = uvec2(leftTopCell     + boardSizeWrap);
                uvec2 rightTopCellWrapped    = uvec2(rightTopCell    + boardSizeWrap);
                uvec2 leftBottomCellWrapped  = uvec2(leftBottomCell  + boardSizeWrap);
                uvec2 rightBottomCellWrapped = uvec2(rightBottomCell + boardSizeWrap);

                leftCell        = ivec2(leftCellWrapped        % uvec2(gBoardSize));
                rightCell       = ivec2(rightCellWrapped       % uvec2(gBoardSize));
                topCell         = ivec2(topCellWrapped         % uvec2(gBoardSize));
                bottomCell      = ivec2(bottomCellWrapped      % uvec2(gBoardSize));
                leftTopCell     = ivec2(leftTopCellWrapped     % uvec2(gBoardSize));
                rightTopCell    = ivec2(rightTopCellWrapped    % uvec2(gBoardSize));
                leftBottomCell  = ivec2(leftBottomCellWrapped  % uvec2(gBoardSize));
                rightBottomCell = ivec2(rightBottomCellWrapped % uvec2(gBoardSize));

                if(GetTopology() == ProjectivePlaneTopology)
                {
                    bool  leftCellFlipped        =          (leftCellWrapped.x      /  uint(gBoardSize) +       maxCheckDistance)  %       2u  !=     0u;
                    bool  rightCellFlipped       =          (rightCellWrapped.x     /  uint(gBoardSize) +       maxCheckDistance)  %       2u  !=     0u;
                    bool  topCellFlipped         =          (topCellWrapped.y       /  uint(gBoardSize) +       maxCheckDistance)  %       2u  !=     0u;
                    bool  bottomCellFlipped      =          (bottomCellWrapped.y    /  uint(gBoardSize) +       maxCheckDistance)  %       2u  !=     0u;
                    bvec2 leftTopCellFlipped     = notEqual((leftTopCellWrapped     / uvec2(gBoardSize) + uvec2(maxCheckDistance)) % uvec2(2u), uvec2(0u));
                    bvec2 rightTopCellFlipped    = notEqual((rightTopCellWrapped    / uvec2(gBoardSize) + uvec2(maxCheckDistance)) % uvec2(2u), uvec2(0u));
                    bvec2 leftBottomCellFlipped  = notEqual((leftBottomCellWrapped  / uvec2(gBoardSize) + uvec2(maxCheckDistance)) % uvec2(2u), uvec2(0u));
                    bvec2 rightBottomCellFlipped = notEqual((rightBottomCellWrapped / uvec2(gBoardSize) + uvec2(maxCheckDistance)) % uvec2(2u), uvec2(0u));

                    if(leftCellFlipped)
                    {
                        leftCell.y = gBoardSize - leftCell.y - 1;
                    }

                    if(rightCellFlipped)
                    {
                        rightCell.y = gBoardSize - rightCell.y - 1;
                    }

                    if(topCellFlipped)
                    {
                        topCell.x = gBoardSize - topCell.x - 1;
                    }

                    if(bottomCellFlipped)
                    {
                        bottomCell.x = gBoardSize - bottomCell.x - 1;
                    }

                    if(leftTopCellFlipped.x)
                    {
                        leftTopCell.y = gBoardSize - leftTopCell.y - 1;
                    }

                    if(leftTopCellFlipped.y)
                    {
                        leftTopCell.x = gBoardSize - leftTopCell.x - 1;
                    }

                    if(rightTopCellFlipped.x)
                    {
                        rightTopCell.y = gBoardSize - rightTopCell.y - 1;
                    }

                    if(rightTopCellFlipped.y)
                    {
                        rightTopCell.x = gBoardSize - rightTopCell.x - 1;
                    }

                    if(leftBottomCellFlipped.x)
                    {
                        leftBottomCell.y = gBoardSize - leftBottomCell.y - 1;
                    }

                    if(leftBottomCellFlipped.y)
                    {
                        leftBottomCell.x = gBoardSize - leftBottomCell.x - 1;
                    }

                    if(rightBottomCellFlipped.x)
                    {
                        rightBottomCell.y = gBoardSize - rightBottomCell.y - 1;
                    }

                    if(rightBottomCellFlipped.y)
                    {
                        rightBottomCell.x = gBoardSize - rightBottomCell.x - 1;
                    }
                }
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

    return createShaderProgram(context, beamsFSSource, vertexShader);
}

function createRaindropsShaderProgram(context, vertexShader)
{
    //https://lightstrout.com/blog/2019/05/21/raindrops-render-mode/
    const raindropsFSSource = ShaderCommonStart +
    `
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

            if(GetTopology() != SquareTopology)
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

                ivec2 boardSizeWrap = ivec2(gBoardSize) * int(maxCheckDistance);

                uvec2 leftCellWrapped        = uvec2(leftCell        + boardSizeWrap);
                uvec2 rightCellWrapped       = uvec2(rightCell       + boardSizeWrap);
                uvec2 topCellWrapped         = uvec2(topCell         + boardSizeWrap);
                uvec2 bottomCellWrapped      = uvec2(bottomCell      + boardSizeWrap);
                uvec2 leftTopCellWrapped     = uvec2(leftTopCell     + boardSizeWrap);
                uvec2 rightTopCellWrapped    = uvec2(rightTopCell    + boardSizeWrap);
                uvec2 leftBottomCellWrapped  = uvec2(leftBottomCell  + boardSizeWrap);
                uvec2 rightBottomCellWrapped = uvec2(rightBottomCell + boardSizeWrap);

                leftCell        = ivec2(leftCellWrapped        % uvec2(gBoardSize));
                rightCell       = ivec2(rightCellWrapped       % uvec2(gBoardSize));
                topCell         = ivec2(topCellWrapped         % uvec2(gBoardSize));
                bottomCell      = ivec2(bottomCellWrapped      % uvec2(gBoardSize));
                leftTopCell     = ivec2(leftTopCellWrapped     % uvec2(gBoardSize));
                rightTopCell    = ivec2(rightTopCellWrapped    % uvec2(gBoardSize));
                leftBottomCell  = ivec2(leftBottomCellWrapped  % uvec2(gBoardSize));
                rightBottomCell = ivec2(rightBottomCellWrapped % uvec2(gBoardSize));

                if(GetTopology() == ProjectivePlaneTopology)
                {
                    bool  leftCellFlipped        =          (leftCellWrapped.x      /  uint(gBoardSize) +       maxCheckDistance)  %       2u  !=     0u;
                    bool  rightCellFlipped       =          (rightCellWrapped.x     /  uint(gBoardSize) +       maxCheckDistance)  %       2u  !=     0u;
                    bool  topCellFlipped         =          (topCellWrapped.y       /  uint(gBoardSize) +       maxCheckDistance)  %       2u  !=     0u;
                    bool  bottomCellFlipped      =          (bottomCellWrapped.y    /  uint(gBoardSize) +       maxCheckDistance)  %       2u  !=     0u;
                    bvec2 leftTopCellFlipped     = notEqual((leftTopCellWrapped     / uvec2(gBoardSize) + uvec2(maxCheckDistance)) % uvec2(2u), uvec2(0u));
                    bvec2 rightTopCellFlipped    = notEqual((rightTopCellWrapped    / uvec2(gBoardSize) + uvec2(maxCheckDistance)) % uvec2(2u), uvec2(0u));
                    bvec2 leftBottomCellFlipped  = notEqual((leftBottomCellWrapped  / uvec2(gBoardSize) + uvec2(maxCheckDistance)) % uvec2(2u), uvec2(0u));
                    bvec2 rightBottomCellFlipped = notEqual((rightBottomCellWrapped / uvec2(gBoardSize) + uvec2(maxCheckDistance)) % uvec2(2u), uvec2(0u));

                    if(leftCellFlipped)
                    {
                        leftCell.y = gBoardSize - leftCell.y - 1;
                    }

                    if(rightCellFlipped)
                    {
                        rightCell.y = gBoardSize - rightCell.y - 1;
                    }

                    if(topCellFlipped)
                    {
                        topCell.x = gBoardSize - topCell.x - 1;
                    }

                    if(bottomCellFlipped)
                    {
                        bottomCell.x = gBoardSize - bottomCell.x - 1;
                    }

                    if(leftTopCellFlipped.x)
                    {
                        leftTopCell.y = gBoardSize - leftTopCell.y - 1;
                    }

                    if(leftTopCellFlipped.y)
                    {
                        leftTopCell.x = gBoardSize - leftTopCell.x - 1;
                    }

                    if(rightTopCellFlipped.x)
                    {
                        rightTopCell.y = gBoardSize - rightTopCell.y - 1;
                    }

                    if(rightTopCellFlipped.y)
                    {
                        rightTopCell.x = gBoardSize - rightTopCell.x - 1;
                    }

                    if(leftBottomCellFlipped.x)
                    {
                        leftBottomCell.y = gBoardSize - leftBottomCell.y - 1;
                    }

                    if(leftBottomCellFlipped.y)
                    {
                        leftBottomCell.x = gBoardSize - leftBottomCell.x - 1;
                    }

                    if(rightBottomCellFlipped.x)
                    {
                        rightBottomCell.y = gBoardSize - rightBottomCell.y - 1;
                    }

                    if(rightBottomCellFlipped.y)
                    {
                        rightBottomCell.x = gBoardSize - rightBottomCell.x - 1;
                    }
                }
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

    return createShaderProgram(context, raindropsFSSource, vertexShader);
}

function createChainsShaderProgram(context, vertexShader)
{
    //https://lightstrout.com/blog/2019/05/21/chains-render-mode/
    const chainsFSSource = ShaderCommonStart +
    `
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

            if(GetTopology() != SquareTopology)
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

                ivec2 boardSizeWrap = ivec2(gBoardSize) * int(maxCheckDistance);

                uvec2 leftCellWrapped        = uvec2(leftCell        + boardSizeWrap);
                uvec2 rightCellWrapped       = uvec2(rightCell       + boardSizeWrap);
                uvec2 topCellWrapped         = uvec2(topCell         + boardSizeWrap);
                uvec2 bottomCellWrapped      = uvec2(bottomCell      + boardSizeWrap);
                uvec2 leftTopCellWrapped     = uvec2(leftTopCell     + boardSizeWrap);
                uvec2 rightTopCellWrapped    = uvec2(rightTopCell    + boardSizeWrap);
                uvec2 leftBottomCellWrapped  = uvec2(leftBottomCell  + boardSizeWrap);
                uvec2 rightBottomCellWrapped = uvec2(rightBottomCell + boardSizeWrap);
                uvec2 left2CellWrapped       = uvec2(left2Cell       + boardSizeWrap);
                uvec2 right2CellWrapped      = uvec2(right2Cell      + boardSizeWrap);
                uvec2 top2CellWrapped        = uvec2(top2Cell        + boardSizeWrap);
                uvec2 bottom2CellWrapped     = uvec2(bottom2Cell     + boardSizeWrap);

                leftCell        = ivec2(leftCellWrapped        % uvec2(gBoardSize));
                rightCell       = ivec2(rightCellWrapped       % uvec2(gBoardSize));
                topCell         = ivec2(topCellWrapped         % uvec2(gBoardSize));
                bottomCell      = ivec2(bottomCellWrapped      % uvec2(gBoardSize));
                leftTopCell     = ivec2(leftTopCellWrapped     % uvec2(gBoardSize));
                rightTopCell    = ivec2(rightTopCellWrapped    % uvec2(gBoardSize));
                leftBottomCell  = ivec2(leftBottomCellWrapped  % uvec2(gBoardSize));
                rightBottomCell = ivec2(rightBottomCellWrapped % uvec2(gBoardSize));
                left2Cell       = ivec2(left2CellWrapped       % uvec2(gBoardSize));
                right2Cell      = ivec2(right2CellWrapped      % uvec2(gBoardSize));
                top2Cell        = ivec2(top2CellWrapped        % uvec2(gBoardSize));
                bottom2Cell     = ivec2(bottom2CellWrapped     % uvec2(gBoardSize));

                if(GetTopology() == ProjectivePlaneTopology)
                {
                    bool  leftCellFlipped        =          (leftCellWrapped.x      /  uint(gBoardSize) +       maxCheckDistance)  %       2u  !=     0u;
                    bool  rightCellFlipped       =          (rightCellWrapped.x     /  uint(gBoardSize) +       maxCheckDistance)  %       2u  !=     0u;
                    bool  topCellFlipped         =          (topCellWrapped.y       /  uint(gBoardSize) +       maxCheckDistance)  %       2u  !=     0u;
                    bool  bottomCellFlipped      =          (bottomCellWrapped.y    /  uint(gBoardSize) +       maxCheckDistance)  %       2u  !=     0u;
                    bvec2 leftTopCellFlipped     = notEqual((leftTopCellWrapped     / uvec2(gBoardSize) + uvec2(maxCheckDistance)) % uvec2(2u), uvec2(0u));
                    bvec2 rightTopCellFlipped    = notEqual((rightTopCellWrapped    / uvec2(gBoardSize) + uvec2(maxCheckDistance)) % uvec2(2u), uvec2(0u));
                    bvec2 leftBottomCellFlipped  = notEqual((leftBottomCellWrapped  / uvec2(gBoardSize) + uvec2(maxCheckDistance)) % uvec2(2u), uvec2(0u));
                    bvec2 rightBottomCellFlipped = notEqual((rightBottomCellWrapped / uvec2(gBoardSize) + uvec2(maxCheckDistance)) % uvec2(2u), uvec2(0u));
                    bool left2CellFlipped        =          (left2CellWrapped.x     /  uint(gBoardSize) +       maxCheckDistance)  %       2u  !=     0u;
                    bool right2CellFlipped       =          (right2CellWrapped.x    /  uint(gBoardSize) +       maxCheckDistance)  %       2u  !=     0u;
                    bool top2CellFlipped         =          (top2CellWrapped.y      /  uint(gBoardSize) +       maxCheckDistance)  %       2u  !=     0u;
                    bool bottom2CellFlipped      =          (bottom2CellWrapped.y   /  uint(gBoardSize) +       maxCheckDistance)  %       2u  !=     0u;

                    if(leftCellFlipped)
                    {
                        leftCell.y = gBoardSize - leftCell.y - 1;
                    }

                    if(rightCellFlipped)
                    {
                        rightCell.y = gBoardSize - rightCell.y - 1;
                    }

                    if(topCellFlipped)
                    {
                        topCell.x = gBoardSize - topCell.x - 1;
                    }

                    if(bottomCellFlipped)
                    {
                        bottomCell.x = gBoardSize - bottomCell.x - 1;
                    }

                    if(leftTopCellFlipped.x)
                    {
                        leftTopCell.y = gBoardSize - leftTopCell.y - 1;
                    }

                    if(leftTopCellFlipped.y)
                    {
                        leftTopCell.x = gBoardSize - leftTopCell.x - 1;
                    }

                    if(rightTopCellFlipped.x)
                    {
                        rightTopCell.y = gBoardSize - rightTopCell.y - 1;
                    }

                    if(rightTopCellFlipped.y)
                    {
                        rightTopCell.x = gBoardSize - rightTopCell.x - 1;
                    }

                    if(leftBottomCellFlipped.x)
                    {
                        leftBottomCell.y = gBoardSize - leftBottomCell.y - 1;
                    }

                    if(leftBottomCellFlipped.y)
                    {
                        leftBottomCell.x = gBoardSize - leftBottomCell.x - 1;
                    }

                    if(rightBottomCellFlipped.x)
                    {
                        rightBottomCell.y = gBoardSize - rightBottomCell.y - 1;
                    }

                    if(rightBottomCellFlipped.y)
                    {
                        rightBottomCell.x = gBoardSize - rightBottomCell.x - 1;
                    }

                    if(left2CellFlipped)
                    {
                        left2Cell.y = gBoardSize - left2Cell.y - 1;
                    }

                    if(right2CellFlipped)
                    {
                        right2Cell.y = gBoardSize - right2Cell.y - 1;
                    }

                    if(top2CellFlipped)
                    {
                        top2Cell.x = gBoardSize - top2Cell.x - 1;
                    }

                    if(bottom2CellFlipped)
                    {
                        bottom2Cell.x = gBoardSize - bottom2Cell.x - 1;
                    }
                }
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

    return createShaderProgram(context, chainsFSSource, vertexShader);
}

function createShaderProgram(context, fragmentShaderSource, vertexShader)
{
    let fragmentShader = context.createShader(context.FRAGMENT_SHADER);
    context.shaderSource(fragmentShader, fragmentShaderSource);
    context.compileShader(fragmentShader);

    if(!context.getShaderParameter(fragmentShader, context.COMPILE_STATUS))
    {
        alert(context.getShaderInfoLog(fragmentShader));
    }

    let shaderProgram = context.createProgram();
    context.attachShader(shaderProgram, vertexShader);
    context.attachShader(shaderProgram, fragmentShader);
    context.linkProgram(shaderProgram);

    if(!context.getProgramParameter(shaderProgram, context.LINK_STATUS))
    {
        alert(context.getProgramInfoLog(shaderProgram));
    }

    return shaderProgram;
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

    const increaseSizeHints        = document.getElementById("IncreaseSizeHints");
    const increaseDomainHints      = document.getElementById("IncreaseDomainHints");
    const changeClickRuleHints     = document.getElementById("ClickRuleHints");
    const acceptClickRuleHints     = document.getElementById("ClickRuleAcceptanceHints");
    const solutionPeriodHints      = document.getElementById("SolutionPeriodHints");
    const solutionInterchangeHints = document.getElementById("SolutionInterchangeHints");
    const boardSolveHints          = document.getElementById("BoardSolveHints"); 
    const metaBoardHints           = document.getElementById("MetaBoardHints");
    const miscellaneousHints       = document.getElementById("MiscellaneousHints");
    const saveMatrixHints          = document.getElementById("SaveMatrixHints");

    const constructModeButton                  = document.getElementById("ConstructModeButton");
    const increaseSizeButton                   = document.getElementById("IncreaseSizeButton");
    const decreaseSizeButton                   = document.getElementById("DecreaseSizeButton");
    const increaseDomainButton                 = document.getElementById("IncreaseDomainButton");
    const decreaseDomainButton                 = document.getElementById("DecreaseDomainButton");
    const defaultClickRuleButton               = document.getElementById("DefaultClickRuleButton");
    const constructClickRuleButton             = document.getElementById("ConstructClickRuleButton");
    const clickRuleFileUploadInput             = document.getElementById("ClickRuleFileInput");
    const squareTopologyButton                 = document.getElementById("EnableSquareTopologyButton");
    const torusTopologyButton                  = document.getElementById("EnableTorusTopologyButton");
    const projectivePlaneTopologyButton        = document.getElementById("EnableProjectivePlaneTopologyButton");
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
    const saveRegularMatrixButton              = document.getElementById("SaveLOMatrixNoEdges");
    const saveRegularMatrixEdgesButton         = document.getElementById("SaveLOMatrix");
    const saveRegularMatrixRenderModeButton    = document.getElementById("SaveLOMatrixRenderMode");
    const saveInverseMatrixButton              = document.getElementById("SaveInverseMatrixNoEdges");
    const saveInverseMatrixEdgesButton         = document.getElementById("SaveInverseMatrix");
    const saveInverseMatrixRenderModeButton    = document.getElementById("SaveInverseMatrixRenderMode");
    const matrixFileUploadInput                = document.getElementById("MatrixFileInput");

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
            resetGameBoard(ResetModes.AllUnlit, currentGameSize, currentDomainSize);
            break;
        }
        case "Digit1":
        {
            litBoardButton.className = "hotkeyenabled";
            resetGameBoard(ResetModes.AllLit, currentGameSize, currentDomainSize);
            break;
        }
        case "Digit4":
        {
            cornersBoardButton.className = "hotkeyenabled";
            resetGameBoard(ResetModes.FourCorners, currentGameSize, currentDomainSize);
            break;
        }
        case "KeyO":
        {
            borderBoardButton.className = "hotkeyenabled";
            resetGameBoard(ResetModes.Border, currentGameSize, currentDomainSize);
            break;
        }
        case "KeyB":
        {
            chessboardBoardButton.className = "hotkeyenabled";
            resetGameBoard(ResetModes.Blatnoy, currentGameSize, currentDomainSize);
            break;
        }
        case "KeyP":
        {
            if(e.shiftKey)
            {
                projectivePlaneTopologyButton.className = "hotkeyenabled";
                setTopology(Topologies.ProjectivePlaneTopology);
                requestRedraw();
            }
            else
            {
                checkersBoardButton.className = "hotkeyenabled";
                resetGameBoard(ResetModes.Pietia, currentGameSize, currentDomainSize);
            }
            break;
        }
        case "KeyF":
        {
            randomBoardButton.className = "hotkeyenabled";
            resetGameBoard(ResetModes.FullRandom, currentGameSize, currentDomainSize);
            break;
        }
        case "KeyR":
        {
            if(e.shiftKey)
            {
                squareTopologyButton.className = "hotkeyenabled";
                setTopology(Topologies.SquareTopology);
                requestRedraw();
            }
            else
            {
                solvableRandomBoardButton.className = "hotkeyenabled";
                resetGameBoard(ResetModes.SolvableRandom, currentGameSize, currentDomainSize);
            }
            break;
        }
        case "KeyI":
        {
            if(e.shiftKey)
            {
                domainRotateBoardButton.className = "hotkeyenabled";
                resetGameBoard(ResetModes.DomainRotate, currentGameSize, currentDomainSize);
            }
            else
            {
                invertBoardButton.className = "hotkeyenabled";
                resetGameBoard(ResetModes.Inverto, currentGameSize, currentDomainSize);
            }
            break;
        }
        case "KeyE":
        {
            singleInterchangeButton.className = "hotkeyenabled";
            resetGameBoard(ResetModes.Solution, currentGameSize, currentDomainSize);
            break;
        }
        case "KeyQ":
        {
            quietPatternsButton.className = "hotkeyenabled";
            updateSolutionMatrixIfNeeded(AfterCalculationOperations.NoOp);
            break;
        }
        case "ArrowLeft":
        {
            moveBoardLeftButton.className = "hotkeyenabled";
            resetGameBoard(ResetModes.MoveLeft, currentGameSize, currentDomainSize);
            e.preventDefault();
            break;
        }
        case "ArrowRight":
        {
            moveBoardRightButton.className = "hotkeyenabled";
            resetGameBoard(ResetModes.MoveRight, currentGameSize, currentDomainSize);
            e.preventDefault();
            break;
        }
        case "ArrowUp":
        {
            moveBoardUpButton.className = "hotkeyenabled";
            resetGameBoard(ResetModes.MoveUp, currentGameSize, currentDomainSize);
            e.preventDefault();
            break;
        }
        case "ArrowDown":
        {
            moveBoardDownButton.className = "hotkeyenabled";
            resetGameBoard(ResetModes.MoveDown, currentGameSize, currentDomainSize);
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
                torusTopologyButton.className = "hotkeyenabled";
                setTopology(Topologies.TorusTopology);
                requestRedraw();
            }
            else
            {
                showSolutionButton.className = "hotkeyenabled";
                updateSolutionMatrixIfNeeded(AfterCalculationOperations.ShowSolution);
            }
            break;
        }
        case "KeyM":
        {
            if(e.shiftKey)
            {
                constructClickRuleButton.className = "hotkeyenabled";
                changeWorkingMode(WorkingModes.ConstructClickRule);
            }
            break;
        }
        case "KeyD":
        {
            if(e.shiftKey)
            {
                defaultClickRuleButton.className = "hotkeyenabled";
                enableDefaultClickRule();
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
            toggleSolveBoard(AfterCalculationOperations.SolveWithRandomTurns);
            break;
        }
        case "KeyC":
        {
            solveSequentionalButton.className = "hotkeyenabled";
            toggleSolveBoard(AfterCalculationOperations.SolveWithSequentionalTurns);
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
                changeCountingMode(CountingModes.CountNone, false);
            }
            else
            {
                changeCountingMode(CountingModes.CountEigenVector, e.shiftKey);
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
                changeCountingMode(CountingModes.CountNone, false);
            }
            else
            {
                if(e.shiftKey)
                {
                    updateSolutionMatrixIfNeeded(AfterCalculationOperations.CalcSolutionPeriodAndStop);
                }
                else
                {
                    updateSolutionMatrixIfNeeded(AfterCalculationOperations.CalcSolutionPeriod);
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
                changeCountingMode(CountingModes.CountNone, false);
            }
            else
            {
                if(e.shiftKey)
                {
                    updateSolutionMatrixIfNeeded(AfterCalculationOperations.CalcSolutionPeriod4xAndStop);
                }
                else
                {
                    updateSolutionMatrixIfNeeded(AfterCalculationOperations.CalcSolutionPeriod4x);
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
                changeCountingMode(CountingModes.CountNone, false);
            }
            else
            {
                changeCountingMode(CountingModes.CountInverseSolutionPeriod, e.shiftKey);
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
            borderBoardButton.className = "hotkeydisabled";
            break;
        }
        case "KeyB":
        {
            chessboardBoardButton.className = "hotkeydisabled";
            break;
        }
        case "KeyP":
        {
            projectivePlaneTopologyButton.className = "hotkeydisabled";
            checkersBoardButton.className           = "hotkeydisabled";
            break;
        }
        case "KeyF":
        {
            randomBoardButton.className = "hotkeydisabled";
            break;
        }
        case "KeyR":
        {
            squareTopologyButton.className      = "hotkeydisabled";
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
            torusTopologyButton.className = "hotkeydisabled";
            showSolutionButton.className  = "hotkeydisabled";
            break;
        }
        case "KeyM":
        {
            constructClickRuleButton.className = "hotkeydisabled";
            break;
        }
        case "KeyD":
        {
            defaultClickRuleButton.className = "hotkeydisabled";
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
            defaultClickRuleButton.className               = "hotkeydisabled";
            constructClickRuleButton.className             = "hotkeydisabled";
            squareTopologyButton.className                 = "hotkeydisabled";
            torusTopologyButton.className                  = "hotkeydisabled";
            projectivePlaneTopologyButton.className        = "hotkeydisabled";
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
    }

    renderModeSelect.onchange = function()
    {
        setRenderMode(renderModeSelect.value);
        renderModeSelect.blur(); //Blur - Beetlebum
        canvas.focus();

        requestRedraw();
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
        resetGameBoard(ResetModes.AllUnlit, currentGameSize, currentDomainSize);
    }

    litBoardButton.onclick = function()
    {
        resetGameBoard(ResetModes.AllLit, currentGameSize, currentDomainSize);
    }

    cornersBoardButton.onclick = function()
    {
        resetGameBoard(ResetModes.FourCorners, currentGameSize, currentDomainSize);
    }

    defaultClickRuleButton.onclick = function()
    {
        enableDefaultClickRule();
    }

    constructClickRuleButton.onclick = function()
    {
        changeWorkingMode(WorkingModes.ConstructClickRule);
    }

    clickRuleFileUploadInput.onchange = function()
    {
        if(currentWorkingMode == WorkingModes.LitBoardClickRule || currentWorkingMode == WorkingModes.LitBoardMatrix)
        {
            uploadClickRule(clickRuleFileUploadInput.files[0]);
        }   
    }

    borderBoardButton.onclick = function()
    {
        resetGameBoard(ResetModes.Border, currentGameSize, currentDomainSize);
    }

    chessboardBoardButton.onclick = function()
    {
        resetGameBoard(ResetModes.Blatnoy, currentGameSize, currentDomainSize);
    }

    checkersBoardButton.onclick = function()
    {
        resetGameBoard(ResetModes.Pietia, currentGameSize, currentDomainSize);
    }

    randomBoardButton.onclick = function()
    {
        resetGameBoard(ResetModes.FullRandom, currentGameSize, currentDomainSize);
    }

    solvableRandomBoardButton.onclick = function()
    {
        resetGameBoard(ResetModes.SolvableRandom, currentGameSize, currentDomainSize);
    }

    domainRotateBoardButton.onclick = function()
    {
        resetGameBoard(ResetModes.DomainRotate, currentGameSize, currentDomainSize);
    }

    invertBoardButton.onclick = function()
    {
        resetGameBoard(ResetModes.Inverto, currentGameSize, currentDomainSize);
    }

    singleInterchangeButton.onclick = function()
    {
        resetGameBoard(ResetModes.Solution, currentGameSize, currentDomainSize);
    }

    quietPatternsButton.onclick = function()
    {
        updateSolutionMatrixIfNeeded(AfterCalculationOperations.NoOp);
    }

    moveBoardLeftButton.onclick = function()
    {
        resetGameBoard(ResetModes.MoveLeft, currentGameSize, currentDomainSize);
    }

    moveBoardRightButton.onclick = function()
    {
        resetGameBoard(ResetModes.MoveRight, currentGameSize, currentDomainSize);
    }

    moveBoardUpButton.onclick = function()
    {
        resetGameBoard(ResetModes.MoveUp, currentGameSize, currentDomainSize);
    }

    moveBoardDownButton.onclick = function()
    {
        resetGameBoard(ResetModes.MoveDown, currentGameSize, currentDomainSize);
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

    squareTopologyButton.onclick = function()
    {
        setTopology(Topologies.SquareTopology);
        requestRedraw();
    }

    torusTopologyButton.onclick = function()
    {
        setTopology(Topologies.TorusTopology);
        requestRedraw();
    }

    projectivePlaneTopologyButton.onclick = function()
    {
        setTopology(Topologies.ProjectivePlaneTopology);
        requestRedraw();
    }

    showSolutionButton.onclick = function()
    {
        updateSolutionMatrixIfNeeded(AfterCalculationOperations.ShowSolution);
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
        toggleSolveBoard(AfterCalculationOperations.SolveWithRandomTurns);
    }

    solveSequentionalButton.onclick = function()
    {
        toggleSolveBoard(AfterCalculationOperations.SolveWithSequentionalTurns);
    }

    calculateEigenvectorButton.onclick = function()
    {
        if(flagPeriodBackCounting || flagPeriodCounting || flagPerio4Counting || flagEigvecCounting)
        {
            changeCountingMode(CountingModes.CountNone, false);
        }
        else
        {
            changeCountingMode(CountingModes.CountEigenVector, true);
        }
    }

    citybuilderInterchangesButton.onclick = function()
    {
        if(flagPeriodBackCounting || flagPeriodCounting || flagPerio4Counting || flagEigvecCounting)
        {
            changeCountingMode(CountingModes.CountNone, false);
        }
        else
        {
            changeCountingMode(CountingModes.CountEigenVector, false);
        }
    }

    calculateSolutionPeriodButton.onclick = function()
    {
        if(flagPeriodBackCounting || flagPeriodCounting || flagPerio4Counting || flagEigvecCounting)
        {
            changeCountingMode(CountingModes.CountNone, false);
        }
        else
        {
            updateSolutionMatrixIfNeeded(AfterCalculationOperations.CalcSolutionPeriodAndStop);
        }
    }
    
    solutionInterchangesButton.onclick = function()
    {
        if(flagPeriodBackCounting || flagPeriodCounting || flagPerio4Counting || flagEigvecCounting)
        {
            changeCountingMode(CountingModes.CountNone, false);
        }
        else
        {
            updateSolutionMatrixIfNeeded(AfterCalculationOperations.CalcSolutionPeriod);
        }
    }
    
    calculateSolutionPerio4Button.onclick = function()
    {
        if(flagPeriodBackCounting || flagPeriodCounting || flagPerio4Counting || flagEigvecCounting)
        {
            changeCountingMode(CountingModes.CountNone, false);
        }
        else
        {
            updateSolutionMatrixIfNeeded(AfterCalculationOperations.CalcSolutionPeriod4xAndStop);
        }
    }
    
    solution4xInterchangesButton.onclick = function()
    {
        if(flagPeriodBackCounting || flagPeriodCounting || flagPerio4Counting || flagEigvecCounting)
        {
            changeCountingMode(CountingModes.CountNone, false);
        }
        else
        {
            updateSolutionMatrixIfNeeded(AfterCalculationOperations.CalcSolutionPeriod4x);
        }
    }

    calculateInverseSolutionPeriodButton.onclick = function()
    {
        if(flagPeriodBackCounting || flagPeriodCounting || flagPerio4Counting || flagEigvecCounting)
        {
            changeCountingMode(CountingModes.CountNone, false);
        }
        else
        {
            changeCountingMode(CountingModes.CountInverseSolutionPeriod, true);
        }
    }

    solutionInverseInterchangesButton.onclick = function()
    {
        if(flagPeriodBackCounting || flagPeriodCounting || flagPerio4Counting || flagEigvecCounting)
        {
            changeCountingMode(CountingModes.CountNone, false);
        }
        else
        {
            changeCountingMode(CountingModes.CountInverseSolutionPeriod, false);
        }
    }

    saveRegularMatrixButton.onclick = function()
    {
        if(currentWorkingMode == WorkingModes.LitBoardClickRule)
        {
            let lightsOutMatrix = calculateGameMatrix(currentGameClickRule, currentGameSize, currentClickRuleSize, currentDomainSize, currentTopology);
            saveMatrixToImage(lightsOutMatrix);
        }
        else if(currentWorkingMode == WorkingModes.LitBoardMatrix)
        {
            saveMatrixToImage(currentGameMatrix);
        }
    }

    saveRegularMatrixEdgesButton.onclick = function()
    {
        let matrixCellSize = 5;

        if(currentWorkingMode == WorkingModes.LitBoardClickRule)
        {
            let lightsOutMatrix = calculateGameMatrix(currentGameClickRule, currentGameSize, currentClickRuleSize, currentDomainSize, currentTopology);
            saveMatrixWithEdgesToImage(lightsOutMatrix, matrixCellSize);
        }   
        else if(currentWorkingMode == WorkingModes.LitBoardMatrix)
        {
            saveMatrixWithEdgesToImage(currentGameMatrix, matrixCellSize);
        }    
    }

    saveRegularMatrixRenderModeButton.onclick = function()
    {
        let matrixCellSize = 15;

        if(currentWorkingMode == WorkingModes.LitBoardClickRule)
        {
            let lightsOutMatrix = calculateGameMatrix(currentGameClickRule, currentGameSize, currentClickRuleSize, currentDomainSize, currentTopology);
            saveMatrixWithRenderModeToImage(lightsOutMatrix, matrixCellSize, renderModeSelect.value, gridCheckBox.checked, currentTopology);
        }   
        else if(currentWorkingMode == WorkingModes.LitBoardMatrix)
        {
            saveMatrixWithRenderModeToImage(currentGameMatrix, matrixCellSize, renderModeSelect.value, gridCheckBox.checked, currentTopology);
        }    
    }

    saveInverseMatrixButton.onclick = function()
    {
        if(currentWorkingMode == WorkingModes.LitBoardClickRule || currentWorkingMode == WorkingModes.LitBoardMatrix)
        {
            updateSolutionMatrixIfNeeded(AfterCalculationOperations.SaveInverseMatrix);
        }
    }

    saveInverseMatrixEdgesButton.onclick = function()
    {
        if(currentWorkingMode == WorkingModes.LitBoardClickRule || currentWorkingMode == WorkingModes.LitBoardMatrix)
        {
            updateSolutionMatrixIfNeeded(AfterCalculationOperations.SaveInverseMatrixWithEdges);
        }
    }

    saveInverseMatrixRenderModeButton.onclick = function()
    {
        if(currentWorkingMode == WorkingModes.LitBoardClickRule || currentWorkingMode == WorkingModes.LitBoardMatrix)
        {
            updateSolutionMatrixIfNeeded(AfterCalculationOperations.SaveInverseMatrixWithRenderMode);
        }
    }

    matrixFileUploadInput.onchange = function()
    {
        if(currentWorkingMode == WorkingModes.LitBoardClickRule || currentWorkingMode == WorkingModes.LitBoardMatrix)
        {
            loadMatrix(matrixFileUploadInput.files[0]);
        }
    }

    let BoardGenModes =
    {
        GenFullRandom: 1, //Generate a random board
        GenAllUnlit:   2, //Generate a fully unlit board
        GenAllLit:     3, //Generate a fully lit board
        GenBlatnoy:    4, //Generate a chessboard pattern board
        GenPietia:     5, //Generate a checkers pattern board
        GenBorder:     6, //Generate a border board
        Gen4Corners:   7  //Generate a four corners board
    };

    let ResetModes =
    {
        AllLit:         1,  //Fully lit board
        AllUnlit:       2,  //Fully unlit board
        Border:         3,  //Border board
        Pietia:         4,  //Checkers board
        Blatnoy:        5,  //Chessboard board
        FourCorners:    6,  //4 lit corners
        SolvableRandom: 7,  //Random board, always solvable
        FullRandom:     8,  //Random board
        Solution:       9,  //Current board -> Current solution/Current stability
        Inverto:        10, //Current board -> Inverted current board
        DomainRotate:   11, //Current board -> Nonzero domain rotated current board
        MoveLeft:       12, //Current board -> Current board moved left
        MoveRight:      13, //Current board -> Current board moved right
        MoveUp:         14, //Current board -> Current board moved up
        MoveDown:       15  //Current board -> Current board moved down
    };

    let WorkingModes =
    {
        LitBoardClickRule:  0,
        LitBoardMatrix:     1,
        ConstructClickRule: 2
    };

    let CountingModes =
    {
        CountNone:                  1,
        CountSolutionPeriod:        2,
        CountInverseSolutionPeriod: 3,
        CountSolutionPeriod4x:      4,
        CountEigenVector:           5
    };

    let AfterCalculationOperations =
    {
        NoOp:                            1,
        ShowSolution:                    2,
        CalcSolutionPeriod:              3,
        CalcSolutionPeriodAndStop:       4,
        CalcSolutionPeriod4x:            5,
        CalcSolutionPeriod4xAndStop:     6,
        SolveWithRandomTurns:            7,
        SolveWithSequentionalTurns:      8,
        SaveInverseMatrix:               9,
        SaveInverseMatrixWithEdges:      10,
        SaveInverseMatrixWithRenderMode: 11
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
    let flagPeriodCounting          = false;
    let flagEigvecCounting          = false;
    let flagPerio4Counting          = false;
    let flagPeriodBackCounting      = false;
    let flagStopCountingWhenFound   = false;
    let flagTickLoop                = false;
    let flagDefaultClickRule        = false;
    let flagConstructClicks         = false;
    let flagNeedToSaveBoard         = false;

    let currentGameClickRule    = null;
    let currentGameMatrix       = null;
    let currentGameBoard        = null;
    let currentGameSolution     = null;
    let currentGameStability    = null;
    let currentGameLitStability = null;
    let currentCountedBoard     = null;
    let currentSavedBoard       = null;
    let currentSavedMatrix      = null;
    let currentSavedWorkingMode = null;

    let currentClickRuleSize = 3;
    let currentGameSize      = 15;
    let currentSavedGameSize = 15;
    let currentDomainSize    = 2;

    let currentCellSize = Math.ceil(canvasSize / currentGameSize) - 1;

    let currentColorLit     = [0.0, 1.0, 0.0, 1.0];
    let currentColorUnlit   = [0.0, 0.0, 0.0, 1.0];
    let currentColorSolved  = [0.0, 0.0, 1.0, 1.0];
    let currentColorBetween = [0.0, 0.0, 0.0, 1.0];

    let currentTopology    = Topologies.SquareTopology;
    let currentWorkingMode = WorkingModes.LitBoardClickRule;

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

    let drawShaderVariables = null;
    let drawVertexArray     = null;

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
        //Can't change sizes with custom matrix, so no branch for LitBoardMatrix
        if(currentWorkingMode === WorkingModes.LitBoardClickRule)
        {
            changeGameSize(currentGameSize + 1);
        }
        else if(currentWorkingMode == WorkingModes.ConstructClickRule)
        {
            changeGameSize(currentGameSize + 2);
        }
    }

    function decrementGameSize()
    {
        //Can't change sizes with custom matrix, so no branch for LitBoardMatrix
        if(currentWorkingMode === WorkingModes.LitBoardClickRule)
        {
            changeGameSize(currentGameSize - 1);
        }
        else if(currentWorkingMode == WorkingModes.ConstructClickRule)
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

        if(currentWorkingMode == WorkingModes.LitBoardClickRule || currentWorkingMode == WorkingModes.LitBoardMatrix)
        {
            recreateSolutionMatrixWorker();
            currentSolutionMatrixCalculated = false;
        }

        changeCountingMode(CountingModes.CountNone, false);
        currentTurnList.length = 0;
        flagRandomSolving = false;
        
        currentGameSize = clamp(newSize, minimumBoardSize, maximumBoardSize);

        qpText.textContent = "Quiet patterns: ";

        if(currentWorkingMode === WorkingModes.LitBoardClickRule || currentWorkingMode == WorkingModes.LitBoardMatrix)
        {
            resetGameBoard(ResetModes.SolvableRandom, currentGameSize, currentDomainSize);
            infoText.textContent = "Lights Out " + currentGameSize + "x" + currentGameSize + " DOMAIN " + currentDomainSize;

            updateAddressBar(500); //Update the address bar with 1000ms delay
        }
        else
        {
            currentGameBoard = generateNewBoard(currentGameSize, currentDomainSize, BoardGenModes.GenAllUnlit);

            resetStability();
            if(flagShowLitStability)
            {
                updateBoardLikeTexture(gl, currentGameLitStability, currentGameSize, stabilityTexture);
            }
            else if(flagShowStability)
            {
                updateBoardLikeTexture(gl, currentGameStability, currentGameSize, stabilityTexture);
            }

            currentGameBoard = makeTurn(currentGameBoard, currentGameClickRule, currentClickRuleSize, currentGameSize, currentDomainSize, Math.floor(currentGameSize / 2), Math.floor(currentGameSize / 2), currentTopology);
            infoText.textContent = "Lights Out click rule " + currentGameSize + "x" + currentGameSize + " DOMAIN " + currentDomainSize;
        }

        currentCellSize = Math.ceil(canvasSize / currentGameSize) - 1;

        let newCanvasSize = canvasSizeFromGameSize(currentGameSize, currentCellSize, gridCheckBox.checked);
        currentViewportWidth  = newCanvasSize.width;
        currentViewportHeight = newCanvasSize.height;

        canvas.width        = currentViewportWidth;
        canvas.height       = currentViewportHeight;
        canvas.clientWidth  = currentViewportWidth;
        canvas.clientHeight = currentViewportHeight;

        updateBoardLikeTexture(gl, currentGameBoard, currentGameSize, boardTexture);

        updateViewport();
        requestRedraw();
    }

    function changeDomainSize(newSize)
    {
        if(currentWorkingMode != WorkingModes.LitBoardClickRule && currentWorkingMode !== WorkingModes.LitBoardMatrix)
        {
            return;
        }

        showStability(false);
        showLitStability(false);
        showSolution(false);
        showInverseSolution(false);

        recreateSolutionMatrixWorker();
        currentSolutionMatrixCalculated = false;

        changeCountingMode(CountingModes.CountNone, false);
        currentTurnList.length = 0;
        flagRandomSolving = false;

        currentDomainSize = clamp(newSize, minimumDomainSize, maximumDomainSize);

        updateAddressBar(500); //Update the address bar with 1000ms delay

        //Click rule/matrix invalidation
        if(currentWorkingMode == WorkingModes.LitBoardClickRule)
        {
            invalidateBoardDomainInPlace(currentGameClickRule, currentDomainSize);
        }
        else if(currentWorkingMode == WorkingModes.LitBoardMatrix)
        {
            invalidateMatrixDomainInPlace(currentGameMatrix, currentDomainSize);
        }

        resetGameBoard(ResetModes.SolvableRandom, currentGameSize, currentDomainSize);

        infoText.textContent = "Lights Out  " + currentGameSize + "x" + currentGameSize + " DOMAIN " + currentDomainSize;
        updateBoardLikeTexture(gl, currentGameBoard, currentGameSize, boardTexture);

        requestRedraw();
    }

    function clickAtPoint(x, y, isConstruct)
    {
        let boardPoint = boardPointFromCanvasPoint(x, y, currentGameSize, currentViewportOffsetX, currentViewportOffsetY, currentViewportWidth, currentViewportHeight, gridCheckBox.checked);

        let modX = boardPoint.xBoard;
        let modY = boardPoint.yBoard;

        if(isConstruct)
        {
            makeConstructTurn(currentGameBoard, currentGameSize, currentDomainSize, modX, modY);
        }
        else
        {
            if(currentWorkingMode === WorkingModes.LitBoardClickRule)
            {
                currentGameBoard = makeTurn(currentGameBoard, currentGameClickRule, currentClickRuleSize, currentGameSize, currentDomainSize, modX, modY, currentTopology);
            }
            else if(currentWorkingMode == WorkingModes.LitBoardMatrix)
            {
                currentGameBoard = makeTurnMatrix(currentGameBoard, currentGameMatrix, currentGameSize, currentDomainSize, modX, modY);
            }
            else if(currentWorkingMode === WorkingModes.ConstructClickRule)
            {
                makeConstructTurn(currentGameBoard, currentGameSize, currentDomainSize, modX, modY);
            }
        }

        resetStability();

        if(flagShowSolution)
        {
            currentGameSolution = calculateSolution(currentGameBoard, currentGameSize, currentDomainSize, currentSolutionMatrix);
            updateBoardLikeTexture(gl, currentGameSolution, currentGameSize, solutionTexture);
        }
        else if(flagShowInverseSolution)
        {
            if(currentWorkingMode == WorkingModes.LitBoardClickRule)
            {
                currentGameSolution = calculateInverseSolution(currentGameBoard, currentGameSize, currentDomainSize, currentGameClickRule, currentClickRuleSize, currentTopology, flagDefaultClickRule);
            }
            else if(currentWorkingMode == WorkingModes.LitBoardMatrix)
            {
                currentGameSolution = calculateSolution(currentGameBoard, currentGameSize, currentDomainSize, currentGameMatrix);
            }

            updateBoardLikeTexture(gl, currentGameSolution, currentGameSize, solutionTexture);
        }

        if(flagShowStability)
        {
            updateBoardLikeTexture(gl, currentGameStability, currentGameSize, stabilityTexture);
        }
        else if(flagShowLitStability)
        {
            calculateLitStability();
            updateBoardLikeTexture(gl, currentGameLitStability, currentGameSize, stabilityTexture);
        }

        updateBoardLikeTexture(gl, currentGameBoard, currentGameSize, boardTexture);
        requestRedraw();
    }

    function enableDefaultClickRule()
    {   
        if(currentWorkingMode == WorkingModes.LitBoardMatrix)
        {
            changeWorkingMode(WorkingModes.LitBoardClickRule);
        }

        recreateSolutionMatrixWorker();
        currentSolutionMatrixCalculated = false;

        let clickRuleValues = [0, 1, 0, //eslint-disable-next-line indent
                               1, 1, 1, //eslint-disable-next-line indent
                               0, 1, 0];

        currentClickRuleSize = 3;
        currentGameClickRule = new Uint8Array(clickRuleValues);

        flagDefaultClickRule = true;

        if(currentTopology == Topologies.SquareTopology)
        {
            currentEncodedClickRule = "Default";
        }
        else if(currentTopology == Topologies.TorusTopology)
        {
            currentEncodedClickRule = "Torus";
        }
        else if(currentTopology == Topologies.ProjectivePlaneTopology)
        {
            currentEncodedClickRule = "ProjectivePlane";
        }

        updateAddressBar(50);
    }

    function enableCustomClickRule(clickRule, clickRuleSize)
    {
        if(currentWorkingMode == WorkingModes.LitBoardMatrix)
        {
            changeWorkingMode(WorkingModes.LitBoardClickRule);
        }

        recreateSolutionMatrixWorker();
        currentSolutionMatrixCalculated = false;

        currentGameClickRule = clickRule;
        currentClickRuleSize = clickRuleSize;

        flagDefaultClickRule = false;

        currentEncodedClickRule = encodeBase64ClickRule(clickRule, currentTopology);
        updateAddressBar(50);
    }

    function enableCustomMatrix(lightsOutMatrix, gameSize)
    {
        changeWorkingMode(WorkingModes.LitBoardMatrix);

        currentGameClickRule = null;
        currentClickRuleSize = 0;

        recreateSolutionMatrixWorker();
        currentSolutionMatrixCalculated = false;

        flagDefaultClickRule = false;
        currentTopology      = Topologies.UndefinedTopology;

        currentGameMatrix = lightsOutMatrix;

        changeGameSize(gameSize);
    }

    function setTopology(boardTopology)
    {
        if(currentWorkingMode == WorkingModes.LitBoardMatrix)
        {
            changeWorkingMode(WorkingModes.LitBoardClickRule);
        }

        recreateSolutionMatrixWorker();
        currentSolutionMatrixCalculated = false;

        currentTopology = boardTopology;
        if(flagDefaultClickRule)
        {
            if(currentTopology == Topologies.SquareTopology)
            {
                currentEncodedClickRule = "Default";
            }
            else if(currentTopology == Topologies.TorusTopology)
            {
                currentEncodedClickRule = "Torus";
            }
            else if(currentTopology == Topologies.ProjectivePlaneTopology)
            {
                currentEncodedClickRule = "ProjectivePlane";
            }
        }

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

            if(currentWorkingMode == WorkingModes.LitBoardClickRule)
            {
                solutionMatrixWorker.postMessage({command: "CalcSolutionMatrixFromClickRule", params: {clickRule: currentGameClickRule, gameSize: currentGameSize, domainSize: currentDomainSize, clickRuleSize: currentClickRuleSize, topology: currentTopology, opAfter: operationAfter}});
            }
            else if(currentWorkingMode == WorkingModes.LitBoardMatrix)
            {
                solutionMatrixWorker.postMessage({command: "CalcSolutionMatrixFromMatrix", params: {matrix: currentGameMatrix, gameSize: currentGameSize, domainSize: currentDomainSize, opAfter: operationAfter}});
            }
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
            case AfterCalculationOperations.NoOp:
            {
                break;
            }
            case AfterCalculationOperations.ShowSolution:
            {
                showSolution(!flagShowSolution);
                break;
            }
            case AfterCalculationOperations.CalcSolutionPeriod:
            {
                changeCountingMode(CountingModes.CountSolutionPeriod, false);
                break;
            }
            case AfterCalculationOperations.CalcSolutionPeriodAndStop:
            {
                changeCountingMode(CountingModes.CountSolutionPeriod, true);
                break;
            }
            case AfterCalculationOperations.CalcSolutionPeriod4x:
            {
                changeCountingMode(CountingModes.CountSolutionPeriod4x, false);
                break;
            }
            case AfterCalculationOperations.CalcSolutionPeriod4xAndStop:
            {
                changeCountingMode(CountingModes.CountSolutionPeriod4x, true);
                break;
            }
            case AfterCalculationOperations.SolveWithRandomTurns:
            {
                if(currentWorkingMode == WorkingModes.LitBoardClickRule || currentWorkingMode == WorkingModes.LitBoardMatrix)
                {
                    currentGameSolution = calculateSolution(currentGameBoard, currentGameSize, currentDomainSize, currentSolutionMatrix);
                    updateBoardLikeTexture(gl, currentGameSolution, currentGameSize, solutionTexture);
    
                    currentTurnList = buildTurnList(currentGameSolution, currentGameSize);
    
                    flagRandomSolving = true;
    
                    flagTickLoop = true;
                    currentAnimationFrame = window.requestAnimationFrame(nextTick);
                }

                break;
            }
            case AfterCalculationOperations.SolveWithSequentionalTurns:
            {
                if(currentWorkingMode == WorkingModes.LitBoardClickRule || currentWorkingMode == WorkingModes.LitBoardMatrix)
                {
                    currentGameSolution = calculateSolution(currentGameBoard, currentGameSize, currentDomainSize, currentSolutionMatrix);
                    updateBoardLikeTexture(gl, currentGameSolution, currentGameSize, solutionTexture);
    
                    currentTurnList = buildTurnList(currentGameSolution, currentGameSize);
    
                    flagRandomSolving = false;
    
                    flagTickLoop = true;
                    currentAnimationFrame = window.requestAnimationFrame(nextTick);
                }

                break;
            }
            case AfterCalculationOperations.SaveInverseMatrix:
            {
                if(currentWorkingMode == WorkingModes.LitBoardClickRule || currentWorkingMode == WorkingModes.LitBoardMatrix)
                {
                    saveMatrixToImage(currentSolutionMatrix);
                }

                break;
            }
            case AfterCalculationOperations.SaveInverseMatrixWithEdges:
            {
                if(currentWorkingMode == WorkingModes.LitBoardClickRule || currentWorkingMode == WorkingModes.LitBoardMatrix)
                {
                    const matrixCellSize = 5;

                    saveMatrixWithEdgesToImage(currentSolutionMatrix, matrixCellSize);
                }

                break;
            }
            case AfterCalculationOperations.SaveInverseMatrixWithRenderMode:
            {
                if(currentWorkingMode == WorkingModes.LitBoardClickRule || currentWorkingMode == WorkingModes.LitBoardMatrix)
                {
                    const matrixCellSize = 15;

                    saveMatrixWithRenderModeToImage(currentSolutionMatrix, matrixCellSize, renderModeSelect.value, gridCheckBox.checked, currentTopology);
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

        if(resetMode === ResetModes.MoveLeft || resetMode === ResetModes.MoveRight || resetMode === ResetModes.MoveUp || resetMode === ResetModes.MoveDown)
        {
            showStability(false);
            showLitStability(false);

            switch(resetMode)
            {
            case ResetModes.MoveLeft:
            {
                currentGameBoard = moveBoardLeft(currentGameBoard, currentGameSize);
                break;
            }
            case ResetModes.MoveRight:
            {
                currentGameBoard = moveBoardRight(currentGameBoard, currentGameSize);
                break;
            }
            case ResetModes.MoveUp:
            {
                currentGameBoard = moveBoardUp(currentGameBoard, currentGameSize);
                break;
            }
            case ResetModes.MoveDown:
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
            if(flagShowLitStability)
            {
                updateBoardLikeTexture(gl, currentGameLitStability, currentGameSize, stabilityTexture);
            }
            else if(flagShowStability)
            {
                updateBoardLikeTexture(gl, currentGameStability, currentGameSize, stabilityTexture);
            }

            if(flagShowSolution)
            {
                currentGameSolution = calculateSolution(currentGameBoard, currentGameSize, currentDomainSize, currentSolutionMatrix);
                updateBoardLikeTexture(gl, currentGameSolution, currentGameSize, solutionTexture);
            }
            else if(flagShowInverseSolution)
            {
                if(currentWorkingMode == WorkingModes.LitBoardClickRule)
                {
                    currentGameSolution = calculateInverseSolution(currentGameBoard, currentGameSize, currentDomainSize, currentGameClickRule, currentClickRuleSize, currentTopology, flagDefaultClickRule);
                }
                else if(currentWorkingMode == WorkingModes.LitBoardMatrix)
                {
                    currentGameSolution = calculateSolution(currentGameBoard, currentGameSize, currentDomainSize, currentGameMatrix);
                }

                updateBoardLikeTexture(gl, currentGameSolution, currentGameSize, solutionTexture);
            }
        }
        else if(resetMode === ResetModes.Solution)
        {
            if(currentWorkingMode !== WorkingModes.LitBoardClickRule && currentWorkingMode !== WorkingModes.LitBoardMatrix)
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
                    updateBoardLikeTexture(gl, currentGameLitStability, currentGameSize, stabilityTexture);
                }
                else if(flagShowStability)
                {
                    updateBoardLikeTexture(gl, currentGameStability, currentGameSize, stabilityTexture);
                }

                showSolution(false);
                showInverseSolution(false);
            }
            else if(flagShowStability)
            {
                currentGameBoard = currentGameStability;

                showStability(false);
                resetStability();

                updateBoardLikeTexture(gl, currentGameStability, currentGameSize, stabilityTexture);
            }
            else if(flagShowLitStability)
            {
                currentGameBoard = currentGameLitStability;

                showLitStability(false);
                resetStability();

                updateBoardLikeTexture(gl, currentGameLitStability, currentGameSize, stabilityTexture);
            }
        }
        else if(resetMode === ResetModes.Inverto || resetMode === ResetModes.DomainRotate)
        {
            showStability(false);
            showLitStability(false);

            switch(resetMode)
            {
            case ResetModes.Inverto:
            {
                currentGameBoard = domainShiftBoard(currentGameBoard, currentDomainSize);
                break;
            }
            case ResetModes.DomainRotate:
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
            if(flagShowLitStability)
            {
                updateBoardLikeTexture(gl, currentGameLitStability, currentGameSize, stabilityTexture);
            }
            else if(flagShowStability)
            {
                updateBoardLikeTexture(gl, currentGameStability, currentGameSize, stabilityTexture);
            }

            if(flagShowSolution)
            {
                currentGameSolution = calculateSolution(currentGameBoard, currentGameSize, currentDomainSize, currentSolutionMatrix);
                updateBoardLikeTexture(gl, currentGameSolution, currentGameSize, solutionTexture);
            }
            else if(flagShowInverseSolution)
            {
                if(currentWorkingMode == WorkingModes.LitBoardClickRule)
                {
                    currentGameSolution = calculateInverseSolution(currentGameBoard, currentGameSize, currentDomainSize, currentGameClickRule, currentClickRuleSize, currentTopology, flagDefaultClickRule);
                }
                else if(currentWorkingMode == WorkingModes.LitBoardMatrix)
                {
                    currentGameSolution = calculateSolution(currentGameBoard, currentGameSize, currentDomainSize, currentGameMatrix);
                }

                updateBoardLikeTexture(gl, currentGameSolution, currentGameSize, solutionTexture);
            }
        }
        else if(resetMode === ResetModes.SolvableRandom)
        {
            if(currentWorkingMode !== WorkingModes.LitBoardClickRule && currentWorkingMode !== WorkingModes.LitBoardMatrix)
            {
                return;
            }

            showStability(false);
            showLitStability(false);
            showSolution(false);
            showInverseSolution(false);

            currentGameBoard = generateNewBoard(currentGameSize, currentDomainSize, BoardGenModes.GenFullRandom);
 
            if(currentWorkingMode == WorkingModes.LitBoardClickRule)
            {
                currentGameBoard = calculateInverseSolution(currentGameBoard, currentGameSize, currentDomainSize, currentGameClickRule, currentClickRuleSize, currentTopology, flagDefaultClickRule);
            }
            else if(currentWorkingMode == WorkingModes.LitBoardMatrix)
            {
                currentGameBoard = calculateSolution(currentGameBoard, currentGameSize, currentDomainSize, currentGameMatrix);
            }

            resetStability();
            if(flagShowLitStability)
            {
                updateBoardLikeTexture(gl, currentGameLitStability, currentGameSize, stabilityTexture);
            }
            else if(flagShowStability)
            {
                updateBoardLikeTexture(gl, currentGameStability, currentGameSize, stabilityTexture);
            }
        }
        else
        {
            showStability(false);
            showLitStability(false);
            showSolution(false);
            showInverseSolution(false);

            let modeBgen = BoardGenModes.GenAllLit;
            switch(resetMode)
            {
            case ResetModes.AllLit:
            {
                modeBgen = BoardGenModes.GenAllLit;
                break;
            }
            case ResetModes.AllUnlit:
            {
                modeBgen = BoardGenModes.GenAllUnlit; 
                break;
            }
            case ResetModes.FourCorners:
            {
                modeBgen = BoardGenModes.Gen4Corners;
                break;
            }
            case ResetModes.Border:
            {
                modeBgen = BoardGenModes.GenBorder;
                break;
            }
            case ResetModes.Pietia:
            {
                modeBgen = BoardGenModes.GenPietia;
                break;
            }
            case ResetModes.Blatnoy:
            {
                modeBgen = BoardGenModes.GenBlatnoy;
                break;
            }
            case ResetModes.FullRandom:
            {
                modeBgen = BoardGenModes.GenFullRandom;
                break;
            }
            default:
            {
                break;    
            }
            }

            currentGameBoard = generateNewBoard(currentGameSize, currentDomainSize, modeBgen);

            resetStability();
            if(flagShowLitStability)
            {
                updateBoardLikeTexture(gl, currentGameLitStability, currentGameSize, stabilityTexture);
            }
            else if(flagShowStability)
            {
                updateBoardLikeTexture(gl, currentGameStability, currentGameSize, stabilityTexture);
            }
        }

        updateBoardLikeTexture(gl, currentGameBoard, currentGameSize, boardTexture);
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
                case BoardGenModes.GenFullRandom:
                {
                    let randomCellValue = minVal + Math.floor(Math.random() * (maxVal - minVal + 1));
                    generatedBoard[cellNumber] = randomCellValue;
                    break;
                }
                case BoardGenModes.GenAllUnlit:
                {
                    generatedBoard[cellNumber] = minVal;
                    break;
                }
                case BoardGenModes.GenAllLit:
                {
                    generatedBoard[cellNumber] = maxVal;
                    break;
                }
                case BoardGenModes.GenBlatnoy:
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
                case BoardGenModes.GenPietia:
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
                case BoardGenModes.GenBorder:
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
                case BoardGenModes.Gen4Corners:
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
        if(currentWorkingMode !== WorkingModes.LitBoardClickRule && currentWorkingMode !== WorkingModes.LitBoardMatrix)
        {
            return;
        }

        if(!currentSolutionMatrixCalculated && (newCountingMode == CountingModes.CountSolutionPeriod || newCountingMode == CountingModes.CountSolutionPeriod4x))
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
        case CountingModes.CountNone:
        {
            if(currentPeriodCount !== 0 && flagStopCountingWhenFound)
            {
                spText.textContent = "Solution period so far is " + currentPeriodCount;
            }
            break;
        }
        case CountingModes.CountSolutionPeriod:
        {
            if(currentSolutionMatrixCalculated)
            {
                flagPeriodCounting = true;
            }
            break;
        }
        case CountingModes.CountSolutionPeriod4x:
        {
            if(currentSolutionMatrixCalculated)
            {
                flagPerio4Counting = true;
            }
            break;
        }
        case CountingModes.CountInverseSolutionPeriod:
        {
            flagPeriodBackCounting = true;
            break;
        }
        case CountingModes.CountEigenVector:
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

            if(currentWorkingMode == WorkingModes.LitBoardClickRule)
            {
                currentGameBoard = calculateInverseSolution(currentGameBoard, currentGameSize, currentDomainSize, currentGameClickRule, currentClickRuleSize, currentTopology, flagDefaultClickRule);
            }
            else if(currentWorkingMode == WorkingModes.LitBoardMatrix)
            {
                currentGameBoard = calculateSolution(currentGameBoard, currentGameSize, currentDomainSize, currentGameMatrix);
            }

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

        currentSavedWorkingMode = currentWorkingMode;
        currentWorkingMode      = workingMode;
        
        if(workingMode == WorkingModes.ConstructClickRule)
        {
            if(currentSavedWorkingMode === WorkingModes.LitBoardClickRule)
            {
                currentSavedMatrix = null;
            }
            else if(currentSavedWorkingMode == WorkingModes.LitBoardMatrix)
            {
                currentSavedMatrix = currentGameMatrix;
                currentGameMatrix  = null;
            }

            if(currentGameClickRule === null || currentClickRuleSize === 0)
            {
                enableDefaultClickRule();
            }

            currentSavedBoard    = currentGameBoard.slice();
            currentSavedGameSize = currentGameSize;

            changeGameSize(currentClickRuleSize);
            currentGameBoard = currentGameClickRule;
            updateBoardLikeTexture(gl, currentGameBoard, currentGameSize, boardTexture);

            infoText.textContent = "Lights Out click rule " + currentGameSize + "x" + currentGameSize + " DOMAIN " + currentDomainSize;

            acceptClickRuleHints.hidden     = false;
            increaseSizeHints.hidden        = false;
            increaseDomainHints.hidden      = true;
            changeClickRuleHints.hidden     = true;
            solutionPeriodHints.hidden      = true;
            solutionInterchangeHints.hidden = true;
            boardSolveHints.hidden          = true;
            metaBoardHints.hidden           = true;
            miscellaneousHints.hidden       = true;
            saveMatrixHints.hidden          = true;
        }
        else if(workingMode == WorkingModes.LitBoardMatrix)
        {
            acceptClickRuleHints.hidden     = true;
            increaseSizeHints.hidden        = true;
            increaseDomainHints.hidden      = false;
            changeClickRuleHints.hidden     = false;
            solutionPeriodHints.hidden      = false;
            solutionInterchangeHints.hidden = false;
            boardSolveHints.hidden          = false;
            metaBoardHints.hidden           = false;
            miscellaneousHints.hidden       = false;
            saveMatrixHints.hidden          = false;
        }
        else if(workingMode == WorkingModes.LitBoardClickRule)
        {
            currentSavedMatrix = null;
            currentGameMatrix  = null;

            acceptClickRuleHints.hidden     = true;
            increaseSizeHints.hidden        = false;
            increaseDomainHints.hidden      = false;
            changeClickRuleHints.hidden     = false;
            solutionPeriodHints.hidden      = false;
            solutionInterchangeHints.hidden = false;
            boardSolveHints.hidden          = false;
            metaBoardHints.hidden           = false;
            miscellaneousHints.hidden       = false;
            saveMatrixHints.hidden          = false;
        }

        requestRedraw();
    }

    function acceptClickRule()
    {
        if(currentWorkingMode === WorkingModes.ConstructClickRule)
        {
            enableCustomClickRule(currentGameBoard.slice(), currentGameSize);

            changeGameSize(currentSavedGameSize);
            currentGameBoard = currentSavedBoard.slice();

            updateBoardLikeTexture(gl, currentGameBoard, currentGameSize, boardTexture);

            requestRedraw();
            changeWorkingMode(WorkingModes.LitBoardClickRule);

            infoText.textContent = "Lights Out " + currentGameSize + "x" + currentGameSize + " DOMAIN " + currentDomainSize;
        }
    }

    function rejectClickRule()
    {
        if(currentWorkingMode === WorkingModes.ConstructClickRule)
        {
            changeGameSize(currentSavedGameSize);
            currentGameBoard = currentSavedBoard.slice();

            updateBoardLikeTexture(gl, currentGameBoard, currentGameSize, boardTexture);

            requestRedraw();
            if(currentSavedWorkingMode === WorkingModes.LitBoardMatrix)
            {
                enableCustomMatrix(currentSavedMatrix, currentSavedGameSize);
            }
            else
            {
                changeWorkingMode(currentSavedWorkingMode);
            }

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
        if(currentWorkingMode !== WorkingModes.LitBoardClickRule && currentWorkingMode !== WorkingModes.LitBoardMatrix)
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
            updateBoardLikeTexture(gl, currentGameSolution, currentGameSize, solutionTexture);
        }
        else
        {
            flagShowSolution = false;
        }

        requestRedraw();
    }

    function showInverseSolution(showFlag)
    {
        if(currentWorkingMode !== WorkingModes.LitBoardClickRule && currentWorkingMode !== WorkingModes.LitBoardMatrix)
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

            if(currentWorkingMode == WorkingModes.LitBoardClickRule)
            {
                currentGameSolution = calculateInverseSolution(currentGameBoard, currentGameSize, currentDomainSize, currentGameClickRule, currentClickRuleSize, currentTopology, flagDefaultClickRule);
            }
            else if(currentWorkingMode == WorkingModes.LitBoardMatrix)
            {
                currentGameSolution = calculateSolution(currentGameBoard, currentGameSize, currentDomainSize, currentGameMatrix);
            }
            
            updateBoardLikeTexture(gl, currentGameSolution, currentGameSize, solutionTexture);
        }
        else
        {
            flagShowInverseSolution = false;
        }

        requestRedraw();
    }

    function showStability(showFlag)
    {
        if((currentWorkingMode !== WorkingModes.LitBoardClickRule && currentWorkingMode !== WorkingModes.LitBoardMatrix) || currentDomainSize > 2)
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

            updateBoardLikeTexture(gl, currentGameStability, currentGameSize, stabilityTexture);
        }
        else
        {
            flagShowStability = false;
        }

        requestRedraw();
    }

    function showLitStability(showFlag)
    {
        if((currentWorkingMode !== WorkingModes.LitBoardClickRule && currentWorkingMode !== WorkingModes.LitBoardMatrix) || currentDomainSize > 2)
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
            updateBoardLikeTexture(gl, currentGameLitStability, currentGameSize, stabilityTexture);
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
        
        drawVertexArray     = createVertexArray(gl, currentShaderProgram);
        drawShaderVariables = obtainShaderVariables(gl, currentShaderProgram);

        updateAddressBar(50);
    }

    function setColorTheme(colorTheme)
    {
        let valueSelect = colorTheme;
        switch(colorTheme)
        {
        case "Neon":
        {
            currentColorLit     = [0.000, 1.000, 0.000, 1.000];
            currentColorUnlit   = [0.000, 0.000, 0.000, 1.000];
            currentColorSolved  = [0.000, 0.000, 1.000, 1.000];
            currentColorBetween = [0.000, 0.000, 0.000, 1.000];
            break;
        }
        case "Autumn":
        {
            currentColorLit     = [1.000, 1.000, 0.000, 1.000];
            currentColorUnlit   = [0.153, 0.086, 0.078, 1.000];
            currentColorSolved  = [0.133, 0.545, 0.133, 1.000];
            currentColorBetween = [0.153, 0.086, 0.078, 1.000];
            break;
        }
        case "Strawberry":
        {
            currentColorLit     = [1.000, 0.412, 0.706, 1.000];
            currentColorUnlit   = [1.000, 0.894, 0.769, 1.000];
            currentColorSolved  = [0.824, 0.412, 0.118, 1.000];
            currentColorBetween = [1.000, 0.894, 0.769, 1.000];
            break;
        }
        case "HardToSee":
        {
            currentColorLit     = [0.000, 0.000, 0.502, 1.000];
            currentColorUnlit   = [0.000, 0.000, 0.545, 1.000];
            currentColorSolved  = [0.098, 0.098, 0.439, 1.000];
            currentColorBetween = [0.000, 0.000, 0.545, 1.000];
            break;
        }
        case "BlackAndWhite":
        {
            currentColorLit     = [1.000, 1.000, 1.000, 1.000];
            currentColorUnlit   = [0.000, 0.000, 0.000, 1.000];
            currentColorSolved  = [1.000, 1.000, 1.000, 1.000];
            currentColorBetween = [0.000, 0.000, 0.000, 1.000];
            break;
        }
        case "Pietia":
        {
            currentColorLit     = [0.980, 0.984, 0.988, 1.000];
            currentColorUnlit   = [0.459, 0.733, 0.992, 1.000];
            currentColorSolved  = [0.639, 0.694, 0.745, 1.000];
            currentColorBetween = [0.459, 0.733, 0.992, 1.000];
            break;
        }
        case "Universe":
        {
            currentColorLit     = [1.000, 0.000, 0.000, 1.000];
            currentColorUnlit   = [1.000, 1.000, 1.000, 1.000];
            currentColorSolved  = [0.545, 0.090, 0.851, 1.000];
            currentColorBetween = [0.000, 0.000, 0.000, 1.000];
            break;
        }
        case "Continuous":
        {
            currentColorLit     = [1.000, 0.000, 0.000, 1.000];
            currentColorUnlit   = [0.000, 0.000, 0.000, 1.000];
            currentColorSolved  = [0.961, 0.871, 0.702, 1.000];
            currentColorBetween = [0.000, 0.000, 0.000, 1.000];
            break;
        }
        default:
        {
            currentColorLit     = [0.000, 1.000, 0.000, 1.000];
            currentColorUnlit   = [0.000, 0.000, 0.000, 1.000];
            currentColorSolved  = [0.000, 0.000, 1.000, 1.000];
            currentColorBetween = [0.000, 0.000, 0.000, 1.000];
            valueSelect         = "Neon";
            break;
        }
        }

        colorThemeSelect.value = valueSelect;

        updateAddressBar(50);

        requestRedraw();
    }

    function setGridVisible(visible)
    {
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

            if(currentWorkingMode == WorkingModes.LitBoardClickRule)
            {
                currentGameBoard = makeTurn(currentGameBoard, currentGameClickRule, currentClickRuleSize, currentGameSize, currentDomainSize, turn.cellX, turn.cellY, currentTopology);
            }
            else if(currentWorkingMode == WorkingModes.LitBoardMatrix)
            {
                currentGameBoard = makeTurnMatrix(currentGameBoard, currentGameMatrix, currentGameSize, currentDomainSize, turn.cellX, turn.cellY);   
            }

            updateBoardLikeTexture(gl, currentGameBoard, currentGameSize, boardTexture);

            resetStability();
            if(flagShowLitStability)
            {
                updateBoardLikeTexture(gl, currentGameLitStability, currentGameSize, stabilityTexture);
            }
            else if(flagShowStability)
            {
                updateBoardLikeTexture(gl, currentGameStability, currentGameSize, stabilityTexture);
            }

            if(flagShowSolution && currentSolutionMatrixCalculated)
            {
                currentGameSolution = calculateSolution(currentGameBoard, currentGameSize, currentDomainSize, currentSolutionMatrix);
                updateBoardLikeTexture(gl, currentGameSolution, currentGameSize, solutionTexture);
            }
            else if(flagShowInverseSolution)
            {
                if(currentWorkingMode == WorkingModes.LitBoardClickRule)
                {
                    currentGameSolution = calculateInverseSolution(currentGameBoard, currentGameSize, currentDomainSize, currentGameClickRule, currentClickRuleSize, currentTopology, flagDefaultClickRule);
                }
                else if(currentWorkingMode == WorkingModes.LitBoardMatrix)
                {
                    currentGameSolution = calculateSolution(currentGameBoard, currentGameSize, currentDomainSize, currentGameMatrix);
                }
        
                updateBoardLikeTexture(gl, currentGameSolution, currentGameSize, solutionTexture);
            }

            if(currentTurnList.length === 0)
            {
                flagTickLoop = false; //No need for the next tick
            }
        }

        if(flagPeriodBackCounting)
        {
            currentPeriodCount++;

            if(currentWorkingMode == WorkingModes.LitBoardClickRule)
            {
                currentGameSolution = calculateInverseSolution(currentGameBoard, currentGameSize, currentDomainSize, currentGameClickRule, currentClickRuleSize, currentTopology, flagDefaultClickRule);
            }
            else if(currentWorkingMode == WorkingModes.LitBoardMatrix)
            {
                currentGameSolution = calculateSolution(currentGameBoard, currentGameSize, currentDomainSize, currentGameMatrix);
            }

            currentGameStability = calculateNewStabilityValue(currentGameSolution);
            currentGameBoard     = currentGameSolution;

            updateBoardLikeTexture(gl, currentGameBoard, currentGameSize, boardTexture);

            if(flagShowLitStability)
            {
                currentGameLitStability = calculateLitStability();
                updateBoardLikeTexture(gl, currentGameLitStability, currentGameSize, stabilityTexture);
            }
            else if(flagShowStability)
            {
                updateBoardLikeTexture(gl, currentGameStability, currentGameSize, stabilityTexture);
            }

            if(flagStopCountingWhenFound && equalsBoard(currentGameBoard, currentCountedBoard))
            {
                flagStopCountingWhenFound = false;
                changeCountingMode(CountingModes.CountNone, false);
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

            updateBoardLikeTexture(gl, currentGameBoard, currentGameSize, boardTexture);

            if(flagShowLitStability)
            {
                currentGameLitStability = calculateLitStability();
                updateBoardLikeTexture(gl, currentGameLitStability, currentGameSize, stabilityTexture);
            }
            else if(flagShowStability)
            {
                updateBoardLikeTexture(gl, currentGameStability, currentGameSize, stabilityTexture);
            }

            if(flagStopCountingWhenFound && equalsBoard(currentGameBoard, currentCountedBoard))
            {
                flagStopCountingWhenFound = false;
                changeCountingMode(CountingModes.CountNone, false);
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
                    changeCountingMode(CountingModes.CountNone, false);
                    flagTickLoop = false;
                    
                    break;
                } 
            }
            
            currentGameStability = calculateNewStabilityValue(currentGameSolution);
            currentGameBoard     = currentGameSolution;

            updateBoardLikeTexture(gl, currentGameBoard, currentGameSize, boardTexture);

            if(flagShowLitStability)
            {
                currentGameLitStability = calculateLitStability();
                updateBoardLikeTexture(gl, currentGameLitStability, currentGameSize, stabilityTexture);
            }
            else if(flagShowStability)
            {
                updateBoardLikeTexture(gl, currentGameStability, currentGameSize, stabilityTexture);
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

            if(currentWorkingMode == WorkingModes.LitBoardClickRule)
            {
                currentGameSolution = calculateInverseSolution(citybuilderBoard, currentGameSize, currentDomainSize, currentGameClickRule, currentClickRuleSize, currentTopology, flagDefaultClickRule);
            }
            else if(currentWorkingMode == WorkingModes.LitBoardMatrix)
            {
                currentGameSolution = calculateSolution(currentGameBoard, currentGameSize, currentDomainSize, currentGameMatrix);
            }
            
            if(flagStopCountingWhenFound && equalsMultipliedBoard(currentGameSolution, citybuilderBoard, currentDomainSize)) //Solution is the current board multiplied by a number => we found an eigenvector
            {
                flagStopCountingWhenFound = false;
                changeCountingMode(CountingModes.CountNone, false);
                flagTickLoop = false;
            }

            currentGameStability = calculateNewStabilityValue(currentGameSolution);
            currentGameBoard     = currentGameSolution;

            currentGameBoard = domainInverseBoard(currentGameBoard, currentDomainSize);

            updateBoardLikeTexture(gl, currentGameBoard, currentGameSize, boardTexture);

            if(flagShowLitStability)
            {
                currentGameLitStability = calculateLitStability();
                updateBoardLikeTexture(gl, currentGameLitStability, currentGameSize, stabilityTexture);
            }
            else if(flagShowStability)
            {
                updateBoardLikeTexture(gl, currentGameStability, currentGameSize, stabilityTexture);
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

    function saveMatrixToImage(matrix)
    {
        const canvasMatrix  = document.createElement("canvas");
        canvasMatrix.width  = currentGameSize * currentGameSize;
        canvasMatrix.height = currentGameSize * currentGameSize;

        let palette = [];
        for(let i = 0; i < currentDomainSize; i++)
        {
            const lerpCoeff = i / (currentDomainSize - 1);

            const r = Math.floor(255.0 * (currentColorUnlit[0] * (1 - lerpCoeff) + currentColorLit[0] * lerpCoeff));
            const g = Math.floor(255.0 * (currentColorUnlit[1] * (1 - lerpCoeff) + currentColorLit[1] * lerpCoeff));
            const b = Math.floor(255.0 * (currentColorUnlit[2] * (1 - lerpCoeff) + currentColorLit[2] * lerpCoeff));
            const a = Math.floor(255.0 * (currentColorUnlit[3] * (1 - lerpCoeff) + currentColorLit[3] * lerpCoeff));

            palette.push([r, g, b, a]);
        }

        let matrixImageArray = new Uint8ClampedArray(currentGameSize * currentGameSize * currentGameSize * currentGameSize * 4);
        for(let yBig = 0; yBig < currentGameSize; yBig++)
        {
            for(let xBig = 0; xBig < currentGameSize; xBig++)
            {
                const matrixRowIndex = yBig * currentGameSize + xBig;
                for(let ySm = 0; ySm < currentGameSize; ySm++)
                {
                    const imageRowIndex = yBig * currentGameSize + ySm;
                    for(let xSm = 0; xSm < currentGameSize; xSm++)
                    {
                        const matrixColumnIndex = ySm * currentGameSize + xSm;
                        const imageColumnIndex  = xBig * currentGameSize + xSm;

                        const matrixVal = matrix[matrixRowIndex][matrixColumnIndex];
                        
                        const imageIndex = 4 * (imageRowIndex * currentGameSize * currentGameSize + imageColumnIndex);
                        matrixImageArray[imageIndex + 0] = palette[matrixVal][0];
                        matrixImageArray[imageIndex + 1] = palette[matrixVal][1];
                        matrixImageArray[imageIndex + 2] = palette[matrixVal][2];
                        matrixImageArray[imageIndex + 3] = palette[matrixVal][3];
                    }
                }
            }
        }

        let matrixImageData = new ImageData(matrixImageArray, currentGameSize * currentGameSize)

        const canvasContext = canvasMatrix.getContext('2d');
        canvasContext.putImageData(matrixImageData, 0, 0);

        let link      = document.createElement("a");
        link.href     = canvasMatrix.toDataURL("image/png");
        link.download = "LightsOutMatrix.png";

        link.click();
        link.remove();

        canvasMatrix.remove();
    }

    function saveMatrixWithEdgesToImage(matrix, matrixCellSize)
    {
        const canvasMatrix  = document.createElement("canvas");
        canvasMatrix.width  = currentGameSize * (currentGameSize * matrixCellSize + currentGameSize + 1) + currentGameSize + 1;
        canvasMatrix.height = currentGameSize * (currentGameSize * matrixCellSize + currentGameSize + 1) + currentGameSize + 1;

        let palette = [];
        for(let i = 0; i < currentDomainSize; i++)
        {
            const lerpCoeff = i / (currentDomainSize - 1);

            const r = Math.floor(255.0 * (currentColorUnlit[0] * (1 - lerpCoeff) + currentColorLit[0] * lerpCoeff));
            const g = Math.floor(255.0 * (currentColorUnlit[1] * (1 - lerpCoeff) + currentColorLit[1] * lerpCoeff));
            const b = Math.floor(255.0 * (currentColorUnlit[2] * (1 - lerpCoeff) + currentColorLit[2] * lerpCoeff));
            const a = Math.floor(255.0 * (currentColorUnlit[3] * (1 - lerpCoeff) + currentColorLit[3] * lerpCoeff));

            palette.push([r, g, b, a]);
        }

        let colorBetweenBigCells   = [Math.floor(255.0 * currentColorUnlit[0]),   Math.floor(255.0 * currentColorUnlit[1]),   Math.floor(255.0 * currentColorUnlit[2]),   Math.floor(255.0 * currentColorUnlit[3])];
        let colorBetweenSmallCells = [Math.floor(255.0 * currentColorBetween[0]), Math.floor(255.0 * currentColorBetween[1]), Math.floor(255.0 * currentColorBetween[2]), Math.floor(255.0 * currentColorBetween[3])];

        let matrixImageArray = new Uint8ClampedArray(canvasMatrix.width * canvasMatrix.height * 4);

        let imageIndex = 0;

        //Edge above the big cell
        for(let xImage = 0; xImage < (currentGameSize * (currentGameSize * matrixCellSize + currentGameSize + 1) + currentGameSize + 1); xImage++)
        {
            matrixImageArray[imageIndex + 0] = colorBetweenBigCells[0];
            matrixImageArray[imageIndex + 1] = colorBetweenBigCells[1];
            matrixImageArray[imageIndex + 2] = colorBetweenBigCells[2];
            matrixImageArray[imageIndex + 3] = colorBetweenBigCells[3];
            imageIndex += 4;
        }

        for(let yBig = 0; yBig < currentGameSize; yBig++)
        {
            //Edge above the cell

            //Leftmost edge of the image
            matrixImageArray[imageIndex + 0] = colorBetweenBigCells[0];
            matrixImageArray[imageIndex + 1] = colorBetweenBigCells[1];
            matrixImageArray[imageIndex + 2] = colorBetweenBigCells[2];
            matrixImageArray[imageIndex + 3] = colorBetweenBigCells[3];
            imageIndex += 4;

            for(let xBig = 0; xBig < currentGameSize; xBig++)
            {
                for(let xBigCell = 0; xBigCell < (currentGameSize * matrixCellSize + currentGameSize + 1); xBigCell++)
                {
                    matrixImageArray[imageIndex + 0] = colorBetweenSmallCells[0];
                    matrixImageArray[imageIndex + 1] = colorBetweenSmallCells[1];
                    matrixImageArray[imageIndex + 2] = colorBetweenSmallCells[2];
                    matrixImageArray[imageIndex + 3] = colorBetweenSmallCells[3];
                    imageIndex += 4;
                }

                //Edge after the big cell
                matrixImageArray[imageIndex + 0] = colorBetweenBigCells[0];
                matrixImageArray[imageIndex + 1] = colorBetweenBigCells[1];
                matrixImageArray[imageIndex + 2] = colorBetweenBigCells[2];
                matrixImageArray[imageIndex + 3] = colorBetweenBigCells[3];
                imageIndex += 4;
            }

            for(let ySm = 0; ySm < currentGameSize; ySm++)
            {
                //The cell
                for(let yCell = 0; yCell < matrixCellSize; yCell++)
                {
                    //Leftmost edge of the image
                    matrixImageArray[imageIndex + 0] = colorBetweenBigCells[0];
                    matrixImageArray[imageIndex + 1] = colorBetweenBigCells[1];
                    matrixImageArray[imageIndex + 2] = colorBetweenBigCells[2];
                    matrixImageArray[imageIndex + 3] = colorBetweenBigCells[3];
                    imageIndex += 4;

                    for(let xBig = 0; xBig < currentGameSize; xBig++)
                    {
                        const matrixRowIndex = yBig * currentGameSize + xBig;

                        //Leftmost edge on the big cell
                        matrixImageArray[imageIndex + 0] = colorBetweenSmallCells[0];
                        matrixImageArray[imageIndex + 1] = colorBetweenSmallCells[1];
                        matrixImageArray[imageIndex + 2] = colorBetweenSmallCells[2];
                        matrixImageArray[imageIndex + 3] = colorBetweenSmallCells[3];
                        imageIndex += 4;

                        for(let xSm = 0; xSm < currentGameSize; xSm++)
                        {
                            const matrixColumnIndex = ySm * currentGameSize + xSm;
                            const matrixVal         = matrix[matrixRowIndex][matrixColumnIndex];
                            
                            for(let xCell = 0; xCell < matrixCellSize; xCell++)
                            {
                                //The cell
                                matrixImageArray[imageIndex + 0] = palette[matrixVal][0];
                                matrixImageArray[imageIndex + 1] = palette[matrixVal][1];
                                matrixImageArray[imageIndex + 2] = palette[matrixVal][2];
                                matrixImageArray[imageIndex + 3] = palette[matrixVal][3];
                                imageIndex += 4;
                            }

                            //Edge after the cell
                            matrixImageArray[imageIndex + 0] = colorBetweenSmallCells[0];
                            matrixImageArray[imageIndex + 1] = colorBetweenSmallCells[1];
                            matrixImageArray[imageIndex + 2] = colorBetweenSmallCells[2];
                            matrixImageArray[imageIndex + 3] = colorBetweenSmallCells[3];
                            imageIndex += 4;
                        }

                        //Edge after the big cell
                        matrixImageArray[imageIndex + 0] = colorBetweenBigCells[0];
                        matrixImageArray[imageIndex + 1] = colorBetweenBigCells[1];
                        matrixImageArray[imageIndex + 2] = colorBetweenBigCells[2];
                        matrixImageArray[imageIndex + 3] = colorBetweenBigCells[3];
                        imageIndex += 4;
                    }
                }

                //Edge below the cell

                //Leftmost edge of the image
                matrixImageArray[imageIndex + 0] = colorBetweenBigCells[0];
                matrixImageArray[imageIndex + 1] = colorBetweenBigCells[1];
                matrixImageArray[imageIndex + 2] = colorBetweenBigCells[2];
                matrixImageArray[imageIndex + 3] = colorBetweenBigCells[3];
                imageIndex += 4;

                for(let xBig = 0; xBig < currentGameSize; xBig++)
                {
                    for(let xBigCell = 0; xBigCell < (currentGameSize * matrixCellSize + currentGameSize + 1); xBigCell++)
                    {
                        matrixImageArray[imageIndex + 0] = colorBetweenSmallCells[0];
                        matrixImageArray[imageIndex + 1] = colorBetweenSmallCells[1];
                        matrixImageArray[imageIndex + 2] = colorBetweenSmallCells[2];
                        matrixImageArray[imageIndex + 3] = colorBetweenSmallCells[3];
                        imageIndex += 4;
                    }

                    //Edge after the big cell
                    matrixImageArray[imageIndex + 0] = colorBetweenBigCells[0];
                    matrixImageArray[imageIndex + 1] = colorBetweenBigCells[1];
                    matrixImageArray[imageIndex + 2] = colorBetweenBigCells[2];
                    matrixImageArray[imageIndex + 3] = colorBetweenBigCells[3];
                    imageIndex += 4;
                }
            }

            //Edge below the big cell
            for(let xImage = 0; xImage < (currentGameSize * (currentGameSize * matrixCellSize + currentGameSize + 1) + currentGameSize + 1); xImage++)
            {
                matrixImageArray[imageIndex + 0] = colorBetweenBigCells[0];
                matrixImageArray[imageIndex + 1] = colorBetweenBigCells[1];
                matrixImageArray[imageIndex + 2] = colorBetweenBigCells[2];
                matrixImageArray[imageIndex + 3] = colorBetweenBigCells[3];
                imageIndex += 4;
            }
        }

        let matrixImageData = new ImageData(matrixImageArray, canvasMatrix.width);

        const canvasContext = canvasMatrix.getContext('2d');
        canvasContext.putImageData(matrixImageData, 0, 0);

        let link      = document.createElement("a");
        link.href     = canvasMatrix.toDataURL("image/png");
        link.download = "LightsOutMatrix.png";

        link.click();
        link.remove();

        canvasMatrix.remove();
    }

    function saveMatrixWithRenderModeToImage(matrix, matrixCellSize, renderMode, showGrid, boardTopology)
    {
        const canvasMatrix = document.createElement("canvas");
        const canvasRow    = document.createElement("canvas");

        const matrixContext = canvasMatrix.getContext("2d");

        const glRow = canvasRow.getContext("webgl2", {preserveDrawingBuffer: true});
        if(!glRow)
        {
            alert("Unable to initialize WebGL. Your browser or machine may not support it.");
            return;
        }

        let matrixShaderProgram = null;
        let paddingCanvasCells  = 0;
        switch(renderMode)
        {
        case "Squares":
        {
            matrixShaderProgram = createSquaresShaderProgram(glRow, createDefaultVertexShader(glRow));
            paddingCanvasCells  = 0;
            break;
        }
        case "Circles":
        {
            matrixShaderProgram = createCirclesShaderProgam(glRow, createDefaultVertexShader(glRow));
            paddingCanvasCells  = 1;
            break;
        }
        case "Diamonds":
        {
            matrixShaderProgram = createDiamondsShaderProgram(glRow, createDefaultVertexShader(glRow));
            paddingCanvasCells  = 1;
            break;
        }
        case "BEAMS":
        {
            matrixShaderProgram = createBeamsShaderProgram(glRow, createDefaultVertexShader(glRow));
            paddingCanvasCells  = 1;
            break;
        }
        case "Raindrops":
        {
            matrixShaderProgram = createRaindropsShaderProgram(glRow, createDefaultVertexShader(glRow));
            paddingCanvasCells  = 1;
            break;
        }
        case "Chains":
        {
            matrixShaderProgram = createChainsShaderProgram(glRow, createDefaultVertexShader(glRow));
            paddingCanvasCells  = 2;
            break;
        }
        default:
        {
            console.error("Unknown render mode");
            return;
        }
        }

        let rowShaderVariables = obtainShaderVariables(glRow, matrixShaderProgram);
        let rowVertexArray     = createVertexArray(glRow, matrixShaderProgram);

        let rowBoardTex = createBoardLikeTexture(glRow);

        let drawCellSize = 0;
        let copySizeX    = 0;
        let copySizeY    = 0;
        if(showGrid)
        {
            drawCellSize = matrixCellSize + 1;

            copySizeX = currentGameSize * drawCellSize + 1;
            copySizeY = currentGameSize * drawCellSize + 1;

            canvasMatrix.width  = currentGameSize * currentGameSize * drawCellSize + 1;
            canvasMatrix.height = currentGameSize * currentGameSize * drawCellSize + 1;

            canvasRow.width  = (currentGameSize + 2 * paddingCanvasCells) * drawCellSize + 1;
            canvasRow.height = (currentGameSize + 2 * paddingCanvasCells) * drawCellSize + 1;
        }
        else
        {
            drawCellSize = matrixCellSize;

            copySizeX = currentGameSize * matrixCellSize;
            copySizeY = currentGameSize * matrixCellSize;

            canvasMatrix.width  = currentGameSize * currentGameSize * matrixCellSize;
            canvasMatrix.height = currentGameSize * currentGameSize * matrixCellSize;

            canvasRow.width  = (currentGameSize + 2 * paddingCanvasCells) * matrixCellSize;
            canvasRow.height = (currentGameSize + 2 * paddingCanvasCells) * matrixCellSize;
        }

        let copyOffsetX = drawCellSize * paddingCanvasCells;
        let copyOffsetY = drawCellSize * paddingCanvasCells;

        canvasRow.clientWidth  = canvasRow.width;
        canvasRow.clientHeight = canvasRow.height;

        glRow.viewport(0, 0, canvasRow.width, canvasRow.height);

        //Draw row by row
        for(let yBig = 0; yBig < currentGameSize; yBig++)
        {
            for(let xBig = 0; xBig < currentGameSize; xBig++)
            {
                let row = flatCellIndex(currentGameSize, xBig, yBig);

                let boardSize = currentGameSize + 2 * paddingCanvasCells;
                let rowBoard  = new Uint8Array(boardSize * boardSize);

                //Main row board data
                for(let y = 0; y < currentGameSize; y++)
                {
                    for(let x = 0; x < currentGameSize; x++)
                    {
                        let indexPadded = flatCellIndex(boardSize, x + paddingCanvasCells, y + paddingCanvasCells);
                        let indexPlain  = flatCellIndex(currentGameSize, x, y);

                        rowBoard[indexPadded] = matrix[row][indexPlain];
                    }
                }

                //Top padded rows
                for(let padY = 0; padY < paddingCanvasCells; padY++)
                {
                    let y = padY;

                    let bigY   = yBig - Math.ceil((paddingCanvasCells - padY) / currentGameSize);
                    let smallY = wholeMod((currentGameSize - (paddingCanvasCells - padY)), currentGameSize);

                    let yOdd = false;
                    if(bigY < 0)
                    {
                        if(boardTopology == Topologies.ProjectivePlaneTopology)
                        {
                            yOdd = Math.floor(bigY / currentGameSize) % 2 != 0;
                        }

                        if(boardTopology == Topologies.SquareTopology)
                        {
                            continue;
                        }
                        else
                        {
                            bigY = wholeMod(bigY, currentGameSize);
                        }
                    }

                    for(let x = 0; x < boardSize; x++)
                    {
                        let bigX   = -1;
                        let smallX = -1;
                        if(x < paddingCanvasCells)
                        {
                            let padX = x;
                            bigX     = xBig - Math.ceil((paddingCanvasCells - padX) / currentGameSize);
                            smallX   = wholeMod((currentGameSize - (paddingCanvasCells - padX)), currentGameSize);
                        }
                        else if(x >= paddingCanvasCells + currentGameSize)
                        {
                            let padX = x - paddingCanvasCells - currentGameSize;
                            bigX     = xBig + Math.ceil((padX + 1) / currentGameSize);
                            smallX   = wholeMod(padX, currentGameSize);
                        }
                        else
                        {
                            bigX   = xBig;
                            smallX = x - paddingCanvasCells;
                        }

                        let xOdd = false;
                        if(bigX < 0 || bigX >= currentGameSize)
                        {
                            if(boardTopology == Topologies.ProjectivePlaneTopology)
                            {
                                xOdd = Math.floor(bigX / currentGameSize) % 2 != 0;
                            }
    
                            if(boardTopology == Topologies.SquareTopology)
                            {
                                continue;
                            }
                            else
                            {
                                bigX = wholeMod(bigX, currentGameSize);
                            }
                        }

                        let matrixRowX = yOdd ? (currentGameSize - bigX - 1) : bigX;
                        let matrixRowY = xOdd ? (currentGameSize - bigY - 1) : bigY;

                        let matrixColumnX = yOdd ? (currentGameSize - smallX - 1) : smallX;
                        let matrixColumnY = xOdd ? (currentGameSize - smallY - 1) : smallY;

                        let matrixRowIndex    = flatCellIndex(currentGameSize, matrixRowX,    matrixRowY);
                        let matrixColumnIndex = flatCellIndex(currentGameSize, matrixColumnX, matrixColumnY); 
                        let boardIndex        = flatCellIndex(boardSize,       x,             y);

                        rowBoard[boardIndex] = matrix[matrixRowIndex][matrixColumnIndex];
                    }
                }

                //Left and right padded columns
                for(let smallY = 0; smallY < currentGameSize; smallY++)
                {
                    let bigY = yBig;
                    let y    = smallY + paddingCanvasCells;

                    for(let padX = 0; padX < paddingCanvasCells; padX++)
                    {
                        let rowXLeft    = xBig - Math.ceil((paddingCanvasCells - padX) / currentGameSize);
                        let columnXLeft = wholeMod((currentGameSize - (paddingCanvasCells - padX)), currentGameSize);
                        let xLeft       = padX;

                        let rowXRight    = xBig + Math.ceil((padX + 1) / currentGameSize);
                        let columnXRight = wholeMod(padX, currentGameSize);
                        let xRight       = padX + currentGameSize + paddingCanvasCells;

                        let rowYLeft     = bigY;
                        let rowYRight    = bigY;
                        let columnYLeft  = smallY;
                        let columnYRight = smallY;

                        if(rowXLeft < 0 || rowXRight >= currentGameSize)
                        {
                            if(boardTopology == Topologies.TorusTopology)
                            {
                                rowXLeft  = wholeMod(rowXLeft, currentGameSize);
                                rowXRight = wholeMod(rowXRight, currentGameSize);
                            }
                            else if(boardTopology == Topologies.ProjectivePlaneTopology)
                            {
                                rowYLeft  = Math.floor(rowXLeft  / currentCellSize) % 2 != 0 ? (currentGameSize - bigY - 1) : bigY;
                                rowYRight = Math.floor(rowXRight / currentCellSize) % 2 != 0 ? (currentGameSize - bigY - 1) : bigY;

                                columnYLeft  = Math.floor(rowXLeft  / currentCellSize) % 2 != 0 ? (currentGameSize - smallY - 1) : smallY;
                                columnYRight = Math.floor(rowXRight / currentCellSize) % 2 != 0 ? (currentGameSize - smallY - 1) : smallY;

                                rowXLeft  = wholeMod(rowXLeft, currentGameSize);
                                rowXRight = wholeMod(rowXRight, currentGameSize);
                            }
                        }

                        if(rowXLeft >= 0) //Can be if topology is square 
                        {
                            let matrixRowIndexLeft    = flatCellIndex(currentGameSize, rowXLeft,    rowYLeft);
                            let matrixColumnIndexLeft = flatCellIndex(currentGameSize, columnXLeft, columnYLeft); 
                            let boardIndexLeft        = flatCellIndex(boardSize,       xLeft,       y);

                            rowBoard[boardIndexLeft] = matrix[matrixRowIndexLeft][matrixColumnIndexLeft];
                        }

                        if(rowXRight < currentGameSize) //Can be if topology is square 
                        {
                            let matrixRowIndexRight    = flatCellIndex(currentGameSize, rowXRight,    rowYRight);
                            let matrixColumnIndexRight = flatCellIndex(currentGameSize, columnXRight, columnYRight); 
                            let boardIndexRight        = flatCellIndex(boardSize,       xRight,       y);

                            rowBoard[boardIndexRight] = matrix[matrixRowIndexRight][matrixColumnIndexRight];
                        }
                    }
                }

                //Bottom padded rows
                for(let padY = 0; padY < paddingCanvasCells; padY++)
                {
                    let y = padY + currentGameSize + paddingCanvasCells;

                    let bigY   = yBig + Math.ceil((padY + 1) / currentGameSize);
                    let smallY = wholeMod(padY, currentGameSize);

                    let yOdd = false;
                    if(bigY >= currentGameSize)
                    {
                        if(boardTopology == Topologies.ProjectivePlaneTopology)
                        {
                            yOdd = Math.floor(bigY / currentGameSize) % 2 != 0;
                        }

                        if(boardTopology == Topologies.SquareTopology)
                        {
                            continue;
                        }
                        else
                        {
                            bigY = wholeMod(bigY, currentGameSize);
                        }
                    }

                    for(let x = 0; x < boardSize; x++)
                    {
                        let bigX   = -1;
                        let smallX = -1;
                        if(x < paddingCanvasCells)
                        {
                            let padX = x;
                            bigX     = xBig - Math.ceil((paddingCanvasCells - padX) / currentGameSize);
                            smallX   = wholeMod((currentGameSize - (paddingCanvasCells - padX)), currentGameSize);
                        }
                        else if(x >= paddingCanvasCells + currentGameSize)
                        {
                            let padX = x - paddingCanvasCells - currentGameSize;
                            bigX     = xBig + Math.ceil((padX + 1) / currentGameSize);
                            smallX   = wholeMod(padX, currentGameSize);
                        }
                        else
                        {
                            bigX   = xBig;
                            smallX = x - paddingCanvasCells;
                        }

                        let xOdd = false;
                        if(bigX < 0 || bigX >= currentGameSize)
                        {
                            if(boardTopology == Topologies.ProjectivePlaneTopology)
                            {
                                xOdd = Math.floor(bigX / currentGameSize) % 2 != 0;
                            }
    
                            if(boardTopology == Topologies.SquareTopology)
                            {
                                continue;
                            }
                            else
                            {
                                bigX = wholeMod(bigX, currentGameSize);
                            }
                        }

                        let matrixRowX = yOdd ? (currentGameSize - bigX - 1) : bigX;
                        let matrixRowY = xOdd ? (currentGameSize - bigY - 1) : bigY;

                        let matrixColumnX = yOdd ? (currentGameSize - smallX - 1) : smallX;
                        let matrixColumnY = xOdd ? (currentGameSize - smallY - 1) : smallY;

                        let matrixRowIndex    = flatCellIndex(currentGameSize, matrixRowX,    matrixRowY);
                        let matrixColumnIndex = flatCellIndex(currentGameSize, matrixColumnX, matrixColumnY); 
                        let boardIndex        = flatCellIndex(boardSize,       x,             y);

                        rowBoard[boardIndex] = matrix[matrixRowIndex][matrixColumnIndex];
                    }
                }

                updateBoardLikeTexture(glRow, rowBoard, boardSize, rowBoardTex);

                glRow.clearColor(0.0, 0.0, 0.0, 0.0);
                glRow.clear(glRow.COLOR_BUFFER_BIT);

                let drawFlags = 0;
                if(!gridCheckBox.checked)
                {
                    drawFlags = drawFlags | 4;
                }

                glRow.bindVertexArray(rowVertexArray);

                glRow.bindFramebuffer(glRow.FRAMEBUFFER, null);
                glRow.useProgram(matrixShaderProgram);

                glRow.uniform1i(rowShaderVariables.BoardSizeUniformLocation,  boardSize);
                glRow.uniform1i(rowShaderVariables.CellSizeUniformLocation,   drawCellSize);
                glRow.uniform1i(rowShaderVariables.DomainSizeUniformLocation, currentDomainSize);
                glRow.uniform1i(rowShaderVariables.FlagsUniformLocation,      drawFlags);

                glRow.uniform1i(rowShaderVariables.CanvasWidthUniformLocation,     canvasRow.width);
                glRow.uniform1i(rowShaderVariables.CanvasHeightUniformLocation,    canvasRow.height);
                glRow.uniform1i(rowShaderVariables.ViewportXOffsetUniformLocation, 0);
                glRow.uniform1i(rowShaderVariables.ViewportYOffsetUniformLocation, 0);

                glRow.uniform4f(rowShaderVariables.ColorNoneUniformLocation,    currentColorUnlit[0],   currentColorUnlit[1],   currentColorUnlit[2],   currentColorUnlit[3]);
                glRow.uniform4f(rowShaderVariables.ColorEnabledUniformLocation, currentColorLit[0],     currentColorLit[1],     currentColorLit[2],     currentColorLit[3]);
                glRow.uniform4f(rowShaderVariables.ColorSolvedUniformLocation,  currentColorSolved[0],  currentColorSolved[1],  currentColorSolved[2],  currentColorSolved[3]);
                glRow.uniform4f(rowShaderVariables.ColorBetweenUniformLocation, currentColorBetween[0], currentColorBetween[1], currentColorBetween[2], currentColorBetween[3]);

                glRow.uniform1i(rowShaderVariables.BoardTextureUniformLocation, 0);

                glRow.activeTexture(glRow.TEXTURE0);
                glRow.bindTexture(glRow.TEXTURE_2D, rowBoardTex);

                glRow.drawArrays(glRow.TRIANGLE_STRIP, 0, 4);

                let copyDestOffsetX = xBig * drawCellSize * currentGameSize;
                let copyDestOffsetY = yBig * drawCellSize * currentGameSize;
                matrixContext.drawImage(canvasRow, copyOffsetX, copyOffsetY, copySizeX, copySizeY, copyDestOffsetX, copyDestOffsetY, copySizeX, copySizeY);
            }
        }

        //glRow.getExtension('WEBGL_lose_context').loseContext();

        let link      = document.createElement("a");
        link.href     = canvasMatrix.toDataURL("image/png");
        link.download = "LightsOutMatrix.png";

        link.click();
        link.remove();

        canvasRow.remove();
        canvasMatrix.remove();
    }

    function loadMatrix(imageFile)
    {
        let fileReader = new FileReader();
        fileReader.onload = function()
        {
            let image    = new Image();
            image.onload = function()
            {
                const canvasMatrix  = document.createElement("canvas");
                const canvasContext = canvasMatrix.getContext('2d'); 

                canvasMatrix.width  = image.width;
                canvasMatrix.height = image.height;

                canvasContext.drawImage(image, 0, 0);
                let matrixData = canvasContext.getImageData(0, 0, image.width, image.height).data;

                let matrixSize = Math.min(image.width, image.height);

                let newGameSize = Math.floor(Math.sqrt(matrixSize));
                matrixSize      = newGameSize * newGameSize;

                //Calculate matrix values based on CIEDE2000 color difference in Lab color space
                let colorUnlitLab = rgbToLab(currentColorUnlit[0], currentColorUnlit[1], currentColorUnlit[2]);
                let colorLitLab   = rgbToLab(currentColorLit[0],   currentColorLit[1],   currentColorLit[2]);

                let distUnlitLit = ciede2000(colorUnlitLab[0], colorUnlitLab[1], colorUnlitLab[2], colorLitLab[0], colorLitLab[1], colorLitLab[2]);

                let newMatrix = [];
                for(let yMatrix = 0; yMatrix < matrixSize; yMatrix++)
                {
                    let matrixRow = new Uint8Array(matrixSize);
                    newMatrix.push(matrixRow);
                }

                for(let yBig = 0; yBig < newGameSize; yBig++)
                {
                    for(let ySm = 0; ySm < newGameSize; ySm++)
                    {
                        let matrixRow = yBig * newGameSize + ySm;

                        for(let xBig = 0; xBig < newGameSize; xBig++)
                        {
                            let imageRow = yBig * newGameSize + xBig;

                            for(let xSm = 0; xSm < newGameSize; xSm++)
                            {
                                let matrixColumn = xBig * newGameSize + xSm; 
                                let imageColumn  = ySm  * newGameSize + xSm;

                                let pixelPos = 4 * (imageRow * image.width + imageColumn);

                                let r = matrixData[pixelPos + 0] / 255.0;
                                let g = matrixData[pixelPos + 1] / 255.0;
                                let b = matrixData[pixelPos + 2] / 255.0;

                                let pixelColorLab  = rgbToLab(r, g, b);
                                let distPixelUnlit = ciede2000(pixelColorLab[0], pixelColorLab[1], pixelColorLab[2], colorUnlitLab[0], colorUnlitLab[1], colorUnlitLab[2]); 

                                let matrixValNormalized = clamp(distPixelUnlit / distUnlitLit, 0.0, 1.0);
                                let matrixVal           = Math.floor(matrixValNormalized * (currentDomainSize - 1) + 0.5);

                                newMatrix[matrixRow][matrixColumn] = matrixVal;
                            }
                        }
                    }
                }

                enableCustomMatrix(newMatrix, newGameSize);

                canvasMatrix.remove();
            }

            image.src = fileReader.result;
        }

        fileReader.readAsDataURL(imageFile);
    }

    function uploadClickRule(imageFile)
    {
        let fileReader = new FileReader();
        fileReader.onload = function()
        {
            let image    = new Image();
            image.onload = function()
            {
                const canvasClickRule = document.createElement("canvas");
                const canvasContext   = canvasClickRule.getContext('2d'); 

                canvasClickRule.width  = image.width;
                canvasClickRule.height = image.height;

                canvasContext.drawImage(image, 0, 0);
                let clickRuleData = canvasContext.getImageData(0, 0, image.width, image.height).data;

                let clickRuleSize = Math.min(image.width, image.height);

                clickRuleSize = clamp(clickRuleSize, minimumBoardSize, maximumBoardSize);

                if(clickRuleSize % 2 == 0)
                {
                    clickRuleSize = clickRuleSize - 1;
                }

                if(clickRuleSize == 0)
                {
                    return;
                }

                //Calculate matrix values based on CIEDE2000 color difference in Lab color space
                let colorUnlitLab = rgbToLab(currentColorUnlit[0], currentColorUnlit[1], currentColorUnlit[2]);
                let colorLitLab   = rgbToLab(currentColorLit[0],   currentColorLit[1],   currentColorLit[2]);

                let distUnlitLit = ciede2000(colorUnlitLab[0], colorUnlitLab[1], colorUnlitLab[2], colorLitLab[0], colorLitLab[1], colorLitLab[2]);

                let newClickRule = new Uint8Array(clickRuleSize * clickRuleSize);
                for(let y = 0; y < clickRuleSize; y++)
                {
                    for(let x = 0; x < clickRuleSize; x++)
                    {
                        let clickRuleIndex = flatCellIndex(clickRuleSize, x, y);
                        let pixelPos       = 4 * (y * image.width + x);

                        let r = clickRuleData[pixelPos + 0] / 255.0;
                        let g = clickRuleData[pixelPos + 1] / 255.0;
                        let b = clickRuleData[pixelPos + 2] / 255.0;

                        let pixelColorLab  = rgbToLab(r, g, b);
                        let distPixelUnlit = ciede2000(pixelColorLab[0], pixelColorLab[1], pixelColorLab[2], colorUnlitLab[0], colorUnlitLab[1], colorUnlitLab[2]); 

                        let clickRuleValNormalized = clamp(distPixelUnlit / distUnlitLit, 0.0, 1.0);
                        let clickRuleVal           = Math.floor(clickRuleValNormalized * (currentDomainSize - 1) + 0.5);

                        newClickRule[clickRuleIndex] = clickRuleVal;
                    }
                }

                enableCustomClickRule(newClickRule, clickRuleSize);

                canvasClickRule.remove();
            }

            image.src = fileReader.result;
        }

        fileReader.readAsDataURL(imageFile);
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
            setTopology(Topologies.SquareTopology);
            enableDefaultClickRule(); //We need a defined click rule for initialization
        }
        else if(encodedClickRule.toUpperCase() === "Torus".toUpperCase())
        {
            setTopology(Topologies.TorusTopology);
            enableDefaultClickRule();
        }
        else if(encodedClickRule.toUpperCase() === "ProjectivePlane".toUpperCase())
        {
            setTopology(Topologies.ProjectivePlaneTopology);
            enableDefaultClickRule();
        }
        else
        {
            let decodedClickRuleData = decodeBase64ClickRule(encodedClickRule, domainSize, minimumBoardSize, maximumBoardSize);

            setTopology(decodedClickRuleData.topology);
            enableCustomClickRule(decodedClickRuleData.clickrule, decodedClickRuleData.clickrulesize);            
        }

        setRenderMode(renderMode);
        setColorTheme(colorTheme);

        changeGameSize(gameSize);
        changeDomainSize(domainSize);

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
            if(currentWorkingMode == WorkingModes.LitBoardClickRule || currentWorkingMode == WorkingModes.LitBoardMatrix)
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

    function obtainShaderVariables(context, shaderProgram)
    {
        let variables = 
        {
            BoardSizeUniformLocation:  context.getUniformLocation(shaderProgram, "gBoardSize"),
            CellSizeUniformLocation:   context.getUniformLocation(shaderProgram, "gCellSize"),
            DomainSizeUniformLocation: context.getUniformLocation(shaderProgram, "gDomainSize"),
            FlagsUniformLocation:      context.getUniformLocation(shaderProgram, "gFlags"),
    
            CanvasWidthUniformLocation:     context.getUniformLocation(shaderProgram, "gImageWidth"),
            CanvasHeightUniformLocation:    context.getUniformLocation(shaderProgram, "gImageHeight"),
            ViewportXOffsetUniformLocation: context.getUniformLocation(shaderProgram, "gViewportOffsetX"),
            ViewportYOffsetUniformLocation: context.getUniformLocation(shaderProgram, "gViewportOffsetY"),
    
            ColorNoneUniformLocation:    context.getUniformLocation(shaderProgram, "gColorNone"),
            ColorEnabledUniformLocation: context.getUniformLocation(shaderProgram, "gColorEnabled"),
            ColorSolvedUniformLocation:  context.getUniformLocation(shaderProgram, "gColorSolved"),
            ColorBetweenUniformLocation: context.getUniformLocation(shaderProgram, "gColorBetween"),
    
            BoardTextureUniformLocation:     context.getUniformLocation(shaderProgram, "gBoard"),
            SolutionTextureUniformLocation:  context.getUniformLocation(shaderProgram, "gSolution"),
            StabilityTextureUniformLocation: context.getUniformLocation(shaderProgram, "gStability")
        };

        return variables;
    }

    function createVertexArray(context, shaderProgram)
    {
        let bufferAttribLocation = context.getAttribLocation(shaderProgram, "vScreenPos");

        const posArray = new Float32Array([-1.0,  1.0, 0.0, 1.0, // eslint-disable-next-line indent
                                            1.0,  1.0, 0.0, 1.0, // eslint-disable-next-line indent
                                           -1.0, -1.0, 0.0, 1.0, // eslint-disable-next-line indent
                                            1.0, -1.0, 0.0, 1.0]);

        let posBuffer = context.createBuffer();
        context.bindBuffer(context.ARRAY_BUFFER, posBuffer);
        context.bufferData(context.ARRAY_BUFFER, posArray, context.STATIC_DRAW);
        context.bindBuffer(context.ARRAY_BUFFER, null);

        let vertexArray = context.createVertexArray();
        context.bindVertexArray(vertexArray);

        context.enableVertexAttribArray(bufferAttribLocation);
        context.bindBuffer(context.ARRAY_BUFFER, posBuffer);
        context.vertexAttribPointer(bufferAttribLocation, 4, context.FLOAT, false, 0, 0);
        context.bindBuffer(context.ARRAY_BUFFER, null);

        context.bindVertexArray(null);

        return vertexArray;
    }

    function createTextures()
    {
        boardTexture     = createBoardLikeTexture(gl);
        solutionTexture  = createBoardLikeTexture(gl);
        stabilityTexture = createBoardLikeTexture(gl);
    }

    function createBoardLikeTexture(context)
    {
        let emptyTexData = new Uint8Array(maximumBoardSize * maximumBoardSize);
        emptyTexData.fill(0);

        let texture = context.createTexture();

        context.bindTexture(context.TEXTURE_2D, texture);
        context.texImage2D(context.TEXTURE_2D, 0, context.R8UI, maximumBoardSize, maximumBoardSize, 0, context.RED_INTEGER, context.UNSIGNED_BYTE, emptyTexData);

        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S,     context.CLAMP_TO_EDGE);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T,     context.CLAMP_TO_EDGE);

        return texture;
    }

    function createShaders()
    {       
        let defaultVS = createDefaultVertexShader(gl);

        squaresShaderProgram   = createSquaresShaderProgram(gl, defaultVS);
        circlesShaderProgram   = createCirclesShaderProgam(gl, defaultVS);
        diamondsShaderProgram  = createDiamondsShaderProgram(gl, defaultVS);
        beamsShaderProgram     = createBeamsShaderProgram(gl, defaultVS);
        raindropsShaderProgram = createRaindropsShaderProgram(gl, defaultVS);
        chainsShaderProgram    = createChainsShaderProgram(gl, defaultVS);
    }

    function updateBoardLikeTexture(context, boardData, gameSize, boardLikeTexture)
    {
        if(boardData === null)
        {
            return;
        }

        context.pixelStorei(context.UNPACK_ALIGNMENT, 1);
        context.bindTexture(context.TEXTURE_2D, boardLikeTexture);
        context.texSubImage2D(context.TEXTURE_2D, 0, 0, 0, gameSize, gameSize, context.RED_INTEGER, context.UNSIGNED_BYTE, boardData);
        context.bindTexture(context.TEXTURE_2D, null);
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
        if(!gridCheckBox.checked)
        {
            drawFlags = drawFlags | 4;
        }

        drawFlags = drawFlags | (currentTopology << 3);

        gl.bindVertexArray(drawVertexArray);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(currentShaderProgram);

        gl.uniform1i(drawShaderVariables.BoardSizeUniformLocation,  currentGameSize);
        gl.uniform1i(drawShaderVariables.CellSizeUniformLocation,   currentCellSize);
        gl.uniform1i(drawShaderVariables.DomainSizeUniformLocation, currentDomainSize);
        gl.uniform1i(drawShaderVariables.FlagsUniformLocation,      drawFlags);

        gl.uniform1i(drawShaderVariables.CanvasWidthUniformLocation,     currentViewportWidth);
        gl.uniform1i(drawShaderVariables.CanvasHeightUniformLocation,    currentViewportHeight);
        gl.uniform1i(drawShaderVariables.ViewportXOffsetUniformLocation, currentViewportOffsetX);
        gl.uniform1i(drawShaderVariables.ViewportYOffsetUniformLocation, currentViewportOffsetY);

        gl.uniform4f(drawShaderVariables.ColorNoneUniformLocation,    currentColorUnlit[0],   currentColorUnlit[1],   currentColorUnlit[2],   currentColorUnlit[3]);
        gl.uniform4f(drawShaderVariables.ColorEnabledUniformLocation, currentColorLit[0],     currentColorLit[1],     currentColorLit[2],     currentColorLit[3]);
        gl.uniform4f(drawShaderVariables.ColorSolvedUniformLocation,  currentColorSolved[0],  currentColorSolved[1],  currentColorSolved[2],  currentColorSolved[3]);
        gl.uniform4f(drawShaderVariables.ColorBetweenUniformLocation, currentColorBetween[0], currentColorBetween[1], currentColorBetween[2], currentColorBetween[3]);

        gl.uniform1i(drawShaderVariables.BoardTextureUniformLocation,     0);
        gl.uniform1i(drawShaderVariables.SolutionTextureUniformLocation,  1);
        gl.uniform1i(drawShaderVariables.StabilityTextureUniformLocation, 2);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, boardTexture);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, solutionTexture);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, stabilityTexture);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        gl.bindVertexArray(null);

        gl.uniform1i(drawShaderVariables.BoardSizeUniformLocation,  null);
        gl.uniform1i(drawShaderVariables.CellSizeUniformLocation,   null);
        gl.uniform1i(drawShaderVariables.DomainSizeUniformLocation, null);
        gl.uniform1i(drawShaderVariables.FlagsUniformLocation,      null);

        gl.uniform1i(drawShaderVariables.CanvasWidthUniformLocation,     null);
        gl.uniform1i(drawShaderVariables.CanvasHeightUniformLocation,    null);
        gl.uniform1i(drawShaderVariables.ViewportXOffsetUniformLocation, null);
        gl.uniform1i(drawShaderVariables.ViewportYOffsetUniformLocation, null);

        gl.uniform4f(drawShaderVariables.ColorNoneUniformLocation,    0, 0, 0, 0);
        gl.uniform4f(drawShaderVariables.ColorEnabledUniformLocation, 0, 0, 0, 0);
        gl.uniform4f(drawShaderVariables.ColorSolvedUniformLocation,  0, 0, 0, 0);
        gl.uniform4f(drawShaderVariables.ColorBetweenUniformLocation, 0, 0, 0, 0);

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