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

//Gets 2-dimensional cell index from a canvas point (x, y) for the given board size (gameSize x gameSize) and canvas size (canvasWidth x canvasHeight).
//Since the actual board has dynamic size and is centered on a statically sized canvas, offsets: (canvasOffsetX, canvasOffsetY) are added.
function boardPointFromCanvasPoint(x, y, gameSize, viewportWidth, viewportHeight, canvasWidth, canvasHeight, useGrid)
{
    let xCorrected = x * (viewportWidth  / canvasWidth);
    let yCorrected = y * (viewportHeight / canvasHeight);

    let widthAdjusted  = viewportWidth;
    let heightAdjusted = viewportHeight;

    if(useGrid)
    {
        widthAdjusted  = widthAdjusted  - 1;
        heightAdjusted = heightAdjusted - 1;
    }

    let smallCellWidth  = Math.floor(widthAdjusted  / gameSize);
    let smallCellHeight = Math.floor(heightAdjusted / gameSize);

    let widerCellCount      = widthAdjusted  - smallCellWidth  * gameSize;
    let tallerCellCount     = heightAdjusted - smallCellHeight * gameSize;

    let thinnerCellHalfCount = Math.floor((gameSize - widerCellCount)  / 2);
    let shorterCellHalfCount = Math.floor((gameSize - tallerCellCount) / 2);

    let leftThinnerCellPartWidth = smallCellWidth  * thinnerCellHalfCount;
    let topShorterCellPartHeight = smallCellHeight * shorterCellHalfCount;

    let widerCellPartWidth   = (smallCellWidth  + 1) * widerCellCount;
    let tallerCellPartHeight = (smallCellHeight + 1) * tallerCellCount;

    let idX = 0;
    if(xCorrected <= leftThinnerCellPartWidth)
    {
        idX = Math.floor(xCorrected / smallCellWidth);
    }
    else if(xCorrected <= leftThinnerCellPartWidth + widerCellPartWidth)
    {
        idX = thinnerCellHalfCount + Math.floor((xCorrected - leftThinnerCellPartWidth) / (smallCellWidth + 1));
    }
    else
    {
        idX = thinnerCellHalfCount + widerCellCount + Math.floor((xCorrected - leftThinnerCellPartWidth - widerCellPartWidth) / smallCellWidth);
    }

    let idY = 0;
    if(yCorrected <= topShorterCellPartHeight)
    {
        idY = Math.floor(yCorrected / smallCellHeight);
    }
    else if(yCorrected <= topShorterCellPartHeight + tallerCellPartHeight)
    {
        idY = shorterCellHalfCount + Math.floor((yCorrected - topShorterCellPartHeight) / (smallCellHeight + 1));
    }
    else
    {
        idY = shorterCellHalfCount + tallerCellCount + Math.floor((yCorrected - topShorterCellPartHeight - tallerCellPartHeight) / smallCellHeight);
    }

    return {x: idX, y: idY};
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
//Contains basic declarations, structures and helper functions.
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

uniform int gBoardSize;
uniform int gCellSize;
uniform int gDomainSize;
uniform int gFlags;

layout(location = 0) out lowp vec4 outColor;

const uint SquareTopology          = 0u;
const uint TorusTopology           = 1u;
const uint ProjectivePlaneTopology = 2u;

const uint CellTypeSmall = 0u;
const uint CellTypeWide  = 1u;
const uint CellTypeTall  = 2u;
const uint CellTypeBig   = 3u;

struct FragmentCellInfo
{
    ivec2 Coord;
    ivec2 Size;
    ivec2 Id;
    uint  Type;
};

struct CellSidesInfo
{
    ivec2 LeftCellId;
    ivec2 RightCellId;
    ivec2 TopCellId;
    ivec2 BottomCellId;
    bvec4 Mask;
};

struct CellCornersInfo
{
    ivec2 TopLeftCellId;
    ivec2 TopRightCellId;
    ivec2 BottomLeftCellId;
    ivec2 BottomRightCellId;
    bvec4 Mask;
};

struct CellSides2Info
{
    ivec2 Left2CellId;
    ivec2 Right2CellId;
    ivec2 Top2CellId;
    ivec2 Bottom2CellId;
    bvec4 Mask;
};

struct CellNeighbourValues
{
    uvec4 SidesValues;
    uvec4 CornersValues;
    uvec4 Sides2Values;
    uint  CellValue;
};

uint GetTopology()
{
    return uint((gFlags & MASK_TOPOLOGY) >> 3);
}

bool IsInsideCell(ivec2 cellCoord)
{
    return (cellCoord.x != -1) && (cellCoord.y != -1);
}

FragmentCellInfo CalcCellInfo(ivec2 screenPos)
{
    bool gridVisible = ((gFlags & FLAG_NO_GRID) == 0);

    int widthAdjusted  = gImageWidth  - int(gridVisible);
    int heightAdjusted = gImageHeight - int(gridVisible);

    int wideCellCount = widthAdjusted  % gCellSize;
    int tallCellCount = heightAdjusted % gCellSize;

    int smallLeftCellCount = (gBoardSize - wideCellCount) / 2;
    int smallTopCellCount  = (gBoardSize - tallCellCount) / 2;


    int leftSmallZoneWidth  = smallLeftCellCount * gCellSize;
    int centerWideZoneWidth = wideCellCount * (gCellSize + 1);

    int topSmallZoneHeight   = smallTopCellCount * gCellSize;
    int centerTallZoneHeight = tallCellCount * (gCellSize + 1);

    ivec2 coordAdjusted = screenPos;
    ivec2 idOffset      = ivec2(0, 0);
    ivec2 cellSize      = ivec2(gCellSize, gCellSize);

    if(coordAdjusted.x >= leftSmallZoneWidth)
    {
        idOffset.x      += smallLeftCellCount;
        coordAdjusted.x -= leftSmallZoneWidth;
        cellSize.x      += 1;

        if(coordAdjusted.x >= centerWideZoneWidth)
        {
            idOffset.x      += wideCellCount;
            coordAdjusted.x -= centerWideZoneWidth;
            cellSize.x      -= 1;
        }
    }

    if(coordAdjusted.y >= topSmallZoneHeight)
    {
        idOffset.y      += smallTopCellCount;
        coordAdjusted.y -= topSmallZoneHeight;
        cellSize.y      += 1;

        if(coordAdjusted.y >= centerTallZoneHeight)
        {
            idOffset.y      += tallCellCount;
            coordAdjusted.y -= centerTallZoneHeight;
            cellSize.y      -= 1;
        }
    }

    ivec2 idAdjusted = coordAdjusted / cellSize;

    FragmentCellInfo cellInfo;
    cellInfo.Coord = coordAdjusted - idAdjusted * cellSize - ivec2(int(gridVisible));
    cellInfo.Size  = cellSize - ivec2(int(gridVisible));
    cellInfo.Id    = idOffset + idAdjusted;
    
    bool wide = (cellInfo.Id.x >= smallLeftCellCount) && (cellInfo.Id.x < (smallLeftCellCount + wideCellCount));
    bool tall = (cellInfo.Id.y >= smallTopCellCount)  && (cellInfo.Id.y < (smallTopCellCount  + tallCellCount));

    if(wide && tall)
    {
        cellInfo.Type = CellTypeBig;
    }
    else if(wide)
    {
        cellInfo.Type = CellTypeWide;
    }
    else if(tall)
    {
        cellInfo.Type = CellTypeTall;
    }
    else
    {
        cellInfo.Type = CellTypeSmall;
    }

    return cellInfo;
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

bvec2 b2nd(bvec2 a, bvec2 b)
{
    return bvec2(a.x && b.x, a.y && b.y);
}

uint udot(uvec4 a, uvec4 b) //No words for this...
{
    return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
}

uint udot(uvec2 a, uvec2 b)
{
    return a.x * b.x + a.y * b.y;
}

int idot(ivec4 a, ivec4 b)
{
    return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
}

int idot(ivec2 a, ivec2 b)
{
    return a.x * b.x + a.y * b.y;
}

//Vectorized form of the ternary operator
uvec4 select(uvec4 a, uvec4 b, bvec4 mask)
{
    uvec4 res;
    res.x = mask.x ? a.x : b.x;
    res.y = mask.y ? a.y : b.y;
    res.z = mask.z ? a.z : b.z;
    res.w = mask.w ? a.w : b.w;

    return res;
}
`;

//Helper functions to access cardinal cell neighbours
const ShaderSidesStateFunctions = 
`
uvec4 GetSidesCellValues(CellSidesInfo sidesInfo, highp usampler2D board)
{
    uvec4 result = uvec4(texelFetch(board, sidesInfo.LeftCellId,   0).x,
                         texelFetch(board, sidesInfo.RightCellId,  0).x,
                         texelFetch(board, sidesInfo.TopCellId,    0).x,
                         texelFetch(board, sidesInfo.BottomCellId, 0).x);

    result *= uvec4(sidesInfo.Mask);
    return result;
}

CellSidesInfo GetSidesState(highp ivec2 cellId)
{
    CellSidesInfo sidesInfo;

    sidesInfo.LeftCellId   = cellId + ivec2(-1,  0);
    sidesInfo.RightCellId  = cellId + ivec2( 1,  0);
    sidesInfo.TopCellId    = cellId + ivec2( 0, -1);
    sidesInfo.BottomCellId = cellId + ivec2( 0,  1);

    if(GetTopology() != SquareTopology)
    {
        sidesInfo.Mask = bvec4(true);

        ivec2 boardSize2d = ivec2(gBoardSize);

        ivec2 leftCellWrapped   = sidesInfo.LeftCellId   + boardSize2d;
        ivec2 rightCellWrapped  = sidesInfo.RightCellId  + boardSize2d;
        ivec2 topCellWrapped    = sidesInfo.TopCellId    + boardSize2d;
        ivec2 bottomCellWrapped = sidesInfo.BottomCellId + boardSize2d;

        sidesInfo.LeftCellId   = leftCellWrapped   % boardSize2d;
        sidesInfo.RightCellId  = rightCellWrapped  % boardSize2d;
        sidesInfo.TopCellId    = topCellWrapped    % boardSize2d;
        sidesInfo.BottomCellId = bottomCellWrapped % boardSize2d;

        if(GetTopology() == ProjectivePlaneTopology)
        {
            bool leftCellFlipped   = ((leftCellWrapped.x   / gBoardSize + 1) & 0x01) != 0;
            bool rightCellFlipped  = ((rightCellWrapped.x  / gBoardSize + 1) & 0x01) != 0;
            bool topCellFlipped    = ((topCellWrapped.y    / gBoardSize + 1) & 0x01) != 0;
            bool bottomCellFlipped = ((bottomCellWrapped.y / gBoardSize + 1) & 0x01) != 0;

            if(leftCellFlipped)
            {
                sidesInfo.LeftCellId.y = gBoardSize - sidesInfo.LeftCellId.y - 1;
            }

            if(rightCellFlipped)
            {
                sidesInfo.RightCellId.y = gBoardSize - sidesInfo.RightCellId.y - 1;
            }

            if(topCellFlipped)
            {
                sidesInfo.TopCellId.x = gBoardSize - sidesInfo.TopCellId.x - 1;
            }

            if(bottomCellFlipped)
            {
                sidesInfo.BottomCellId.x = gBoardSize - sidesInfo.BottomCellId.x - 1;
            }
        }
    }
    else
    {
        sidesInfo.Mask.x = cellId.x > 0;
        sidesInfo.Mask.y = cellId.x < gBoardSize - 1;
        sidesInfo.Mask.z = cellId.y > 0;
        sidesInfo.Mask.w = cellId.y < gBoardSize - 1;
    }

    return sidesInfo;
}
`;

//Dummy functions for cardinal cell neighbours, for shaders that don't need them
const ShaderNoSidesStateFunctions = 
`
uvec4 GetSidesCellValues(CellSidesInfo sidesInfo, highp usampler2D board)
{
    return uvec4(0u);
}

CellSidesInfo GetSidesState(highp ivec2 cellId)
{
    CellSidesInfo sidesInfo;
    sidesInfo.LeftCellId   = ivec2(0);
    sidesInfo.RightCellId  = ivec2(0);
    sidesInfo.TopCellId    = ivec2(0);
    sidesInfo.BottomCellId = ivec2(0);
    sidesInfo.Mask         = bvec4(false);

    return sidesInfo;
}
`;

//Helper functions to access diagonal cell neighbours
const ShaderCornersStateFunctions = 
`
uvec4 GetCornersCellValues(CellCornersInfo cornersInfo, highp usampler2D board)
{
    uvec4 result = uvec4(texelFetch(board, cornersInfo.TopLeftCellId,     0).x,
                         texelFetch(board, cornersInfo.TopRightCellId,    0).x,
                         texelFetch(board, cornersInfo.BottomLeftCellId,  0).x,
                         texelFetch(board, cornersInfo.BottomRightCellId, 0).x);

    result *= uvec4(cornersInfo.Mask);
    return result;
}

CellCornersInfo GetCornersState(highp ivec2 cellId)
{
    CellCornersInfo cornersInfo;

    cornersInfo.TopLeftCellId     = cellId + ivec2(-1, -1);
    cornersInfo.TopRightCellId    = cellId + ivec2( 1, -1);
    cornersInfo.BottomLeftCellId  = cellId + ivec2(-1,  1);
    cornersInfo.BottomRightCellId = cellId + ivec2( 1,  1);

    if(GetTopology() != SquareTopology)
    {
        cornersInfo.Mask = bvec4(true);

        ivec2 boardSize2d = ivec2(gBoardSize);

        ivec2 leftTopCellWrapped     = cornersInfo.TopLeftCellId     + boardSize2d;
        ivec2 rightTopCellWrapped    = cornersInfo.TopRightCellId    + boardSize2d;
        ivec2 leftBottomCellWrapped  = cornersInfo.BottomLeftCellId  + boardSize2d;
        ivec2 rightBottomCellWrapped = cornersInfo.BottomRightCellId + boardSize2d;

        cornersInfo.TopLeftCellId     = leftTopCellWrapped     % boardSize2d;
        cornersInfo.TopRightCellId    = rightTopCellWrapped    % boardSize2d;
        cornersInfo.BottomLeftCellId  = leftBottomCellWrapped  % boardSize2d;
        cornersInfo.BottomRightCellId = rightBottomCellWrapped % boardSize2d;

        if(GetTopology() == ProjectivePlaneTopology)
        {
            bvec2 leftTopCellFlipped     = notEqual((leftTopCellWrapped     / boardSize2d + ivec2(1)) % ivec2(2), ivec2(0));
            bvec2 rightTopCellFlipped    = notEqual((rightTopCellWrapped    / boardSize2d + ivec2(1)) % ivec2(2), ivec2(0));
            bvec2 leftBottomCellFlipped  = notEqual((leftBottomCellWrapped  / boardSize2d + ivec2(1)) % ivec2(2), ivec2(0));
            bvec2 rightBottomCellFlipped = notEqual((rightBottomCellWrapped / boardSize2d + ivec2(1)) % ivec2(2), ivec2(0));

            if(leftTopCellFlipped.x)
            {
                cornersInfo.TopLeftCellId.y = gBoardSize - cornersInfo.TopLeftCellId.y - 1;
            }

            if(leftTopCellFlipped.y)
            {
                cornersInfo.TopLeftCellId.x = gBoardSize - cornersInfo.TopLeftCellId.x - 1;
            }

            if(rightTopCellFlipped.x)
            {
                cornersInfo.TopRightCellId.y = gBoardSize - cornersInfo.TopRightCellId.y - 1;
            }

            if(rightTopCellFlipped.y)
            {
                cornersInfo.TopRightCellId.x = gBoardSize - cornersInfo.TopRightCellId.x - 1;
            }

            if(leftBottomCellFlipped.x)
            {
                cornersInfo.BottomLeftCellId.y = gBoardSize - cornersInfo.BottomLeftCellId.y - 1;
            }

            if(leftBottomCellFlipped.y)
            {
                cornersInfo.BottomLeftCellId.x = gBoardSize - cornersInfo.BottomLeftCellId.x - 1;
            }

            if(rightBottomCellFlipped.x)
            {
                cornersInfo.BottomRightCellId.y = gBoardSize - cornersInfo.BottomRightCellId.y - 1;
            }

            if(rightBottomCellFlipped.y)
            {
                cornersInfo.BottomRightCellId.x = gBoardSize - cornersInfo.BottomRightCellId.x - 1;
            }
        }
    }
    else
    {
        cornersInfo.Mask.x = cellId.x > 0              && cellId.y > 0;
        cornersInfo.Mask.y = cellId.x < gBoardSize - 1 && cellId.y > 0;
        cornersInfo.Mask.z = cellId.x > 0              && cellId.y < gBoardSize - 1;
        cornersInfo.Mask.w = cellId.x < gBoardSize - 1 && cellId.y < gBoardSize - 1;
    }

    return cornersInfo;
}
`;

//Dummy functions for diagonal cell neighbours, for shaders that don't need them
const ShaderNoCornersStateFunctions = 
`
uvec4 GetCornersCellValues(CellCornersInfo cornersInfo, highp usampler2D board)
{
    return uvec4(0u);
}

CellCornersInfo GetCornersState(highp ivec2 cellId)
{
    CellCornersInfo cornersInfo;
    cornersInfo.TopLeftCellId     = ivec2(0);
    cornersInfo.TopRightCellId    = ivec2(0);
    cornersInfo.BottomLeftCellId  = ivec2(0);
    cornersInfo.BottomRightCellId = ivec2(0);
    cornersInfo.Mask              = bvec4(false);

    return cornersInfo;
}
`;

//Helper functions to access cardinal cell 2-neighbours
const ShaderSides2StateFunctions = 
`
uvec4 GetSides2CellValues(CellSides2Info sides2Info, highp usampler2D board)
{
    uvec4 result = uvec4(texelFetch(board, sides2Info.Left2CellId,   0).x,
                         texelFetch(board, sides2Info.Right2CellId,  0).x,
                         texelFetch(board, sides2Info.Top2CellId,    0).x,
                         texelFetch(board, sides2Info.Bottom2CellId, 0).x);

    result *= uvec4(sides2Info.Mask);
    return result;
}

CellSides2Info GetSides2State(highp ivec2 cellId)
{
    CellSides2Info sides2Info;

    sides2Info.Left2CellId   = cellId + ivec2(-2,  0);
    sides2Info.Right2CellId  = cellId + ivec2( 2,  0);
    sides2Info.Top2CellId    = cellId + ivec2( 0, -2);
    sides2Info.Bottom2CellId = cellId + ivec2( 0,  2);

    if(GetTopology() != SquareTopology)
    {
        sides2Info.Mask = bvec4(true);

        ivec2 boardSize2d = ivec2(gBoardSize);

        ivec2 left2CellWrapped   = sides2Info.Left2CellId   + boardSize2d * 2;
        ivec2 right2CellWrapped  = sides2Info.Right2CellId  + boardSize2d * 2;
        ivec2 top2CellWrapped    = sides2Info.Top2CellId    + boardSize2d * 2;
        ivec2 bottom2CellWrapped = sides2Info.Bottom2CellId + boardSize2d * 2;

        sides2Info.Left2CellId   = left2CellWrapped   % boardSize2d;
        sides2Info.Right2CellId  = right2CellWrapped  % boardSize2d;
        sides2Info.Top2CellId    = top2CellWrapped    % boardSize2d;
        sides2Info.Bottom2CellId = bottom2CellWrapped % boardSize2d;

        if(GetTopology() == ProjectivePlaneTopology)
        {
            bool left2CellFlipped   = ((left2CellWrapped.x   / gBoardSize + 2) & 0x01) != 0;
            bool right2CellFlipped  = ((right2CellWrapped.x  / gBoardSize + 2) & 0x01) != 0;
            bool top2CellFlipped    = ((top2CellWrapped.y    / gBoardSize + 2) & 0x01) != 0;
            bool bottom2CellFlipped = ((bottom2CellWrapped.y / gBoardSize + 2) & 0x01) != 0;

            if(left2CellFlipped)
            {
                sides2Info.Left2CellId.y = gBoardSize - sides2Info.Left2CellId.y - 1;
            }

            if(right2CellFlipped)
            {
                sides2Info.Right2CellId.y = gBoardSize - sides2Info.Right2CellId.y - 1;
            }

            if(top2CellFlipped)
            {
                sides2Info.Top2CellId.x = gBoardSize - sides2Info.Top2CellId.x - 1;
            }

            if(bottom2CellFlipped)
            {
                sides2Info.Bottom2CellId.x = gBoardSize - sides2Info.Bottom2CellId.x - 1;
            }
        }
    }
    else
    {
        sides2Info.Mask.x = cellId.x > 1;
        sides2Info.Mask.y = cellId.x < gBoardSize - 2;
        sides2Info.Mask.z = cellId.y > 1;
        sides2Info.Mask.w = cellId.y < gBoardSize - 2;
    }

    return sides2Info;
}
`;

//Dummy functions for cardinal cell 2-neighbours, for shaders that don't need them
const ShaderNoSides2StateFunctions = 
`
uvec4 GetSides2CellValues(CellSides2Info sides2Info, highp usampler2D board)
{
    return uvec4(0u);
}

CellSides2Info GetSides2State(highp ivec2 cellId)
{
    CellSides2Info sides2Info;
    sides2Info.Left2CellId   = ivec2(0);
    sides2Info.Right2CellId  = ivec2(0);
    sides2Info.Top2CellId    = ivec2(0);
    sides2Info.Bottom2CellId = ivec2(0);
    sides2Info.Mask          = bvec4(false);

    return sides2Info;
}
`;

//Common shader end functions, including main()
const ShaderCommonEnd = 
`
CellNeighbourValues GetCellNeighbourValues(ivec2 cellId, CellSidesInfo sidesInfo, CellCornersInfo cornersInfo, CellSides2Info sides2Info, highp usampler2D board)
{
    CellNeighbourValues result;

    result.CellValue     = texelFetch(board, cellId, 0).x;
    result.SidesValues   = GetSidesCellValues(sidesInfo,     board);
    result.CornersValues = GetCornersCellValues(cornersInfo, board);
    result.Sides2Values  = GetSides2CellValues(sides2Info,   board);

    return result;
}

void main(void)
{
    ivec2 screenPos = ivec2(int(gl_FragCoord.x), gImageHeight - int(gl_FragCoord.y) - 1);

    FragmentCellInfo cellInfo = CalcCellInfo(screenPos);
    if(IsInsideCell(cellInfo.Coord))
    {
        mediump float domainFactor = 1.0f / float(gDomainSize - 1);

        RegionInfo regionInfo = CalculateRegionInfo(cellInfo.Coord, cellInfo.Size, cellInfo.Type);

        CellSidesInfo   sidesInfo   = GetSidesState(cellInfo.Id);
        CellCornersInfo cornersInfo = GetCornersState(cellInfo.Id);
        CellSides2Info  sides2Info  = GetSides2State(cellInfo.Id);

        CellNeighbourValues cellBoardNeighbours = GetCellNeighbourValues(cellInfo.Id, sidesInfo, cornersInfo, sides2Info, gBoard);
        uint regionBoardValue = CalculateRegionValue(regionInfo, cellBoardNeighbours, cellInfo.Type);
        outColor = mix(gColorNone, gColorEnabled, float(regionBoardValue) * domainFactor);

        if((gFlags & FLAG_SHOW_SOLUTION) != 0)
        {
            CellNeighbourValues cellSolutionNeighbours = GetCellNeighbourValues(cellInfo.Id, sidesInfo, cornersInfo, sides2Info, gSolution);
            uint regionSolutionValue = CalculateRegionValue(regionInfo, cellSolutionNeighbours, cellInfo.Type);
            outColor = mix(outColor, gColorSolved, float(regionSolutionValue) * domainFactor);
        }
        else if((gFlags & FLAG_SHOW_STABILITY) != 0)
        {
            lowp vec4 colorStable = vec4(1.0f, 1.0f, 1.0f, 1.0f) - gColorEnabled;
            colorStable.a = 1.0f;

            CellNeighbourValues cellStableNeighbours = GetCellNeighbourValues(cellInfo.Id, sidesInfo, cornersInfo, sides2Info, gStability);
            uint regionStabilityValue = CalculateRegionValue(regionInfo, cellStableNeighbours, cellInfo.Type);
            outColor = mix(outColor, colorStable, float(regionStabilityValue) * domainFactor);
        }
    }
    else
    {
        outColor = gColorBetween;
    }
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
    const squaresShaderFunctions = 
    `
    struct RegionInfo
    {
        int Unused;
    };

    RegionInfo CalculateRegionInfo(ivec2 cellCoord, ivec2 cellSize, uint cellType)
    {
        RegionInfo unused;
        return unused;
    }

    uint CalculateRegionValue(RegionInfo regionInfo, CellNeighbourValues cellNeighbours, uint cellType)
    {
        return cellNeighbours.CellValue;
    }
    `;

    const squaresFSSource = ShaderCommonStart 
                          + ShaderNoSidesStateFunctions + ShaderNoCornersStateFunctions + ShaderNoSides2StateFunctions
                          + squaresShaderFunctions + ShaderCommonEnd;

    return createShaderProgram(context, squaresFSSource, vertexShader);
}

function createCirclesShaderProgam(context, vertexShader)
{
    //https://lightstrout.com/blog/2019/05/21/circles-render-mode/
    const circlesShaderFunctions = 
    `
    struct RegionInfo
    {
        bvec4 OnSides;
        bool  InsideCircle;
    };

    bvec4 EqualSidesRule(uint cellValue, uvec4 sidesValues)
    {
        uvec4 cellValueVec = uvec4(cellValue);
        return equal(cellValueVec, sidesValues);
    }

    RegionInfo CalculateRegionInfo(ivec2 cellCoord, ivec2 cellSize, uint cellType)
    {
        ivec2 cellSizeHalf = cellSize / 2;
        ivec2 circleRadius = cellSizeHalf;
        ivec2 cellCoordAdjusted = cellCoord - cellSizeHalf;
        
        //Make the coordinate "0" only available on even cell sizes
        ivec2 zero           = ivec2(0, 0);
        bvec2 onPositiveHalf = greaterThanEqual(cellCoordAdjusted, zero);
        bvec2 evenCellSize   = equal(cellSize % 2, zero);
        cellCoordAdjusted    = cellCoordAdjusted + ivec2(b2nd(onPositiveHalf, evenCellSize));
    
        //Ellipse is defined as x^2 * b^2 + y^2 * a^2 <= a^2 * b^2
        ivec2 coordSq  = cellCoordAdjusted * cellCoordAdjusted;
        ivec2 radiusSq = circleRadius * circleRadius;
    
        RegionInfo regionInfo;
        regionInfo.OnSides      = bvec4(cellCoordAdjusted.x <= 0, cellCoordAdjusted.x >= 0, cellCoordAdjusted.y <= 0, cellCoordAdjusted.y >= 0);
        regionInfo.InsideCircle = idot(coordSq, radiusSq.yx) <= radiusSq.x * radiusSq.y;
    
        return regionInfo;
    }

    uint CalculateRegionValue(RegionInfo regionInfo, CellNeighbourValues cellNeighbours, uint cellType)
    {
        bvec4 sidesCandidate = EqualSidesRule(cellNeighbours.CellValue, cellNeighbours.SidesValues);

        bool resSides = any(b4nd(regionInfo.OnSides, sidesCandidate));
        bool circleRuleColored = regionInfo.InsideCircle || resSides;

        return cellNeighbours.CellValue * uint(circleRuleColored);
    }
    `;

    const circlesFSSource = ShaderCommonStart 
                          + ShaderSidesStateFunctions + ShaderNoCornersStateFunctions + ShaderNoSides2StateFunctions
                          + circlesShaderFunctions + ShaderCommonEnd;

    return createShaderProgram(context, circlesFSSource, vertexShader);
}

function createDiamondsShaderProgram(context, vertexShader)
{
    //http://lightstrout.com/blog/2019/12/09/diamonds-render-mode/
    const diamondsShaderFunctions = 
    `
    struct RegionInfo
    {
        int   CharacteristicValue;
        int   DiamondRadius;
        int   SmallerDiamondRadius;
        bool  CellClassEven;
        bvec4 InsideSides;
    };

    //Calculated from RegionInfo using additional information about neighbours
    struct PureRegionInfo
    {
        bvec4 InsideFilledCorners;
        bvec4 InsideEmptyCorners;
        bool  InsideDiamond;
    };

    bvec4 emptyCornerRule(uvec4 edgeValue)
    {
        return equal(edgeValue.xyxy, edgeValue.zzww);
    }

    bvec4 filledCornerRule(uint cellValue, uvec4 cornerValue)
    {
        return equal(uvec4(cellValue), cornerValue);
    }

    RegionInfo CalculateRegionInfo(ivec2 cellCoord, ivec2 cellSize, uint cellType)
    {
        ivec2 cellSizeHalf = cellSize / 2;
        ivec2 cellCoordAdjusted = cellCoord - cellSizeHalf;

        int diamondRadius = min(cellSizeHalf.x, cellSizeHalf.y) + 1;
        
        //Fix for 1-pixel error with grid
        //To make empty corners match neighbour diamonds, draw them with the diamond radius smaller by 1 unit.
        //Without grid, we don't have to worry about ths
        bool gridVisible = ((gFlags & FLAG_NO_GRID) == 0);
        int smallerDiamondRadius = diamondRadius + int(gridVisible);

        //Cell class even: small cells have even size
        //Cell class odd: small cells have odd size
        int minCellSize    = min(cellSize.x, cellSize.y);
        bool cellSizeOdd   = (minCellSize % 2 == 1);
        bool cellClassEven = (cellType == CellTypeBig) ? cellSizeOdd : !cellSizeOdd;

        //For aesthetic purposes, increase the diamond radius for odd big, even wide, and even tall cells
        //The first case corresponds to even small cells. In this case, min cell size for big cells is odd.
        //The second and third case correspond to odd small cells. But again, min cell size is odd in these cases.
        bool cellBigOrWideOrTall = (cellType != CellTypeSmall);
        diamondRadius += int(cellBigOrWideOrTall && minCellSize % 2 == 1);

        //For even cell sizes, increase the diamond radius by 1 (there is no "zero" coordinate)
        diamondRadius += int(!cellSizeOdd);

        //Make the coordinate "0" only available on odd cell sizes
        ivec2 zero           = ivec2(0, 0);
        bvec2 onPositiveHalf = greaterThanEqual(cellCoordAdjusted, zero);
        bvec2 evenCellSize   = equal(cellSize % 2, zero);
        cellCoordAdjusted    = cellCoordAdjusted + ivec2(b2nd(onPositiveHalf, evenCellSize));

        int characteristicValue = abs(cellCoordAdjusted.x) + abs(cellCoordAdjusted.y);
        
        bvec4 insideSides = bvec4(cellCoordAdjusted.x <= 0, cellCoordAdjusted.x >= 0, 
                                cellCoordAdjusted.y <= 0, cellCoordAdjusted.y >= 0);

        RegionInfo regionInfo;
        regionInfo.CharacteristicValue  = characteristicValue;
        regionInfo.DiamondRadius        = diamondRadius;
        regionInfo.SmallerDiamondRadius = smallerDiamondRadius;
        regionInfo.CellClassEven        = cellClassEven;
        regionInfo.InsideSides          = insideSides;
        return regionInfo;
    }

    int JitterDiamondMain(RegionInfo regionInfo, CellNeighbourValues cellNeighbours, uint cellType)
    {
        if(cellType == CellTypeSmall)
        {
            return regionInfo.CharacteristicValue;
        }
        
        //INITIALIZE THE CELL WITH THE MAXIMUM POSSIBLE DIAMOND SIZE.
        //SUBTRACT THE CHARACTERISTIC VALUE FROM ALL SIDES THAT DO_NOT HAVE NEIGHBOURS
        
        bvec4 cornersEqual = equal(uvec4(cellNeighbours.CellValue), cellNeighbours.CornersValues);
        bvec4 cornerSidesEmpty = not(b4or(cornersEqual.zyyz, cornersEqual.xwxw));
        
        int numberOfEqualCorners = idot(ivec4(cornersEqual), ivec4(1));

        int characteristicOffset = 0;
        if(regionInfo.CellClassEven)
        {
            if(numberOfEqualCorners == 0)
            {
                characteristicOffset = 1;
            }
            else if(cellType == CellTypeWide || cellType == CellTypeTall)
            {
                bool isWide = (cellType == CellTypeWide);
                bool isTall = (cellType == CellTypeTall);
                
                bvec4 insideSidesNonZero = not(regionInfo.InsideSides.yxwz);
                bvec4 insideSideWithFilledCorners = b4nd(insideSidesNonZero, cornerSidesEmpty);

                bvec4 sidesMask = bvec4(isWide, isWide, isTall, isTall);
                insideSideWithFilledCorners = b4nd(insideSideWithFilledCorners, sidesMask);

                characteristicOffset = idot(ivec4(insideSideWithFilledCorners), ivec4(1));
            }
            else if(cellType == CellTypeBig)
            {
                if(numberOfEqualCorners == 1)
                {
                    bvec4 insideSideWithFilledCorners = b4nd(regionInfo.InsideSides, cornerSidesEmpty);
                    characteristicOffset = idot(ivec4(insideSideWithFilledCorners), ivec4(1));
                }
                else
                {
                    bvec4 insideCorners = b4nd(regionInfo.InsideSides.xyxy, regionInfo.InsideSides.zzww);
                    bvec4 insideNonFilledCorners = b4nd(insideCorners, not(cornersEqual));
                    
                    characteristicOffset = idot(ivec4(insideNonFilledCorners), ivec4(1));
                }
            }
        }
        else
        {
            if(numberOfEqualCorners == 0)
            {
                characteristicOffset = 0;
            }
            else if(cellType == CellTypeWide || cellType == CellTypeTall)
            {
                bool isWide = (cellType == CellTypeWide);
                bool isTall = (cellType == CellTypeTall);
                
                bvec4 insideNonFilledCorners = b4nd(regionInfo.InsideSides, cornerSidesEmpty);
                
                bvec4 sidesMask = bvec4(isWide, isWide, isTall, isTall);
                insideNonFilledCorners = b4nd(insideNonFilledCorners, sidesMask);

                characteristicOffset = idot(ivec4(insideNonFilledCorners), ivec4(1));
            }
            else if(cellType == CellTypeBig)
            {
                if(numberOfEqualCorners == 1)
                {
                    bvec4 insideSideWithNonFilledCorners = b4nd(regionInfo.InsideSides, cornerSidesEmpty);
                    characteristicOffset = idot(ivec4(insideSideWithNonFilledCorners), ivec4(1));
                }
                else if(numberOfEqualCorners >= 2)
                {
                    bvec4 insideCorners = b4nd(regionInfo.InsideSides.xyxy, regionInfo.InsideSides.zzww);
                    bvec4 insideNonFilledCorners = b4nd(insideCorners, not(cornersEqual));
                    
                    characteristicOffset = idot(ivec4(insideNonFilledCorners), ivec4(1));
                }
            }   
        }

        return regionInfo.CharacteristicValue + characteristicOffset;
    }

    int JitterDiamondEmpty(RegionInfo regionInfo, CellNeighbourValues cellNeighbours, uint cellType)
    {
        //Increase the radius of empty corners equal to the value of the cell
        //to avoid "gaps" between the central diamond and empty corners on odd cell sizes
        bvec4 lateralSidesEqual = equal(cellNeighbours.SidesValues.xyxy, cellNeighbours.SidesValues.zzww);
        bvec4 cellSidesEqual = equal(uvec4(cellNeighbours.CellValue), cellNeighbours.SidesValues.xyxy);
        bvec4 needEmptyCornerCorrection = b4nd(lateralSidesEqual, cellSidesEqual);
        
        bvec4 insideCorners = b4nd(regionInfo.InsideSides.xyxy, regionInfo.InsideSides.zzww);
        bvec4 emptyCornerCorrectRule = b4nd(needEmptyCornerCorrection, insideCorners);
        
        int characteristicOffset = 0;
        if(any(emptyCornerCorrectRule))
        {
            characteristicOffset = 1;
        }
        else if(cellType == CellTypeSmall)
        {
            characteristicOffset = 0;
        }
        else if(!regionInfo.CellClassEven)
        {
            //Otherwise, on odd cell sizes decrease the corner size
            //to avoid 1-pixel "jumps"
            characteristicOffset = -1;   
        }
        
        return regionInfo.CharacteristicValue + characteristicOffset;
    }

    PureRegionInfo PurifyRegionInfo(RegionInfo regionInfo, CellNeighbourValues cellNeighbours, uint cellType)
    {
        bvec4 insideCorners = b4nd(regionInfo.InsideSides.xyxy, regionInfo.InsideSides.zzww);

        int characteristicBig   = JitterDiamondMain(regionInfo, cellNeighbours, cellType);
        int characteristicSmall = JitterDiamondEmpty(regionInfo, cellNeighbours, cellType);
            
        bool insideDiamond   = characteristicBig   < regionInfo.DiamondRadius;
        bool insideDiamondSm = characteristicSmall < regionInfo.SmallerDiamondRadius;
        
        PureRegionInfo pureRegionInfo;
        pureRegionInfo.InsideEmptyCorners  = b4nd(bvec4(!insideDiamondSm), insideCorners);
        pureRegionInfo.InsideFilledCorners = b4nd(bvec4(!insideDiamond),   insideCorners);
        pureRegionInfo.InsideDiamond       = insideDiamond;
        return pureRegionInfo;
    }

    uint CalculateRegionValue(RegionInfo regionInfo, CellNeighbourValues cellNeighbours, uint cellType)
    {
        PureRegionInfo pureRegionInfo = PurifyRegionInfo(regionInfo, cellNeighbours, cellType);
        
        uvec4 emptyCornerCandidate  = uvec4(emptyCornerRule(cellNeighbours.SidesValues)) * cellNeighbours.SidesValues.zzww;
        uvec4 filledCornerCandidate = uvec4(filledCornerRule(cellNeighbours.CellValue, cellNeighbours.CornersValues)) * cellNeighbours.CellValue;

        bvec4 selectMask = greaterThan(emptyCornerCandidate, filledCornerCandidate);
        selectMask = b4nd(selectMask, pureRegionInfo.InsideEmptyCorners);

        uvec4 cornerCandidate  = select(emptyCornerCandidate, filledCornerCandidate, selectMask);
        uvec4 cornerRegionRule = select(uvec4(pureRegionInfo.InsideEmptyCorners), uvec4(pureRegionInfo.InsideFilledCorners), selectMask);

        //Allow a fragment to be inside at most 1 of corner regions
        bvec4 cornerRegionRuleMask = bvec4(true, !bool(cornerRegionRule.x), !any(bvec2(cornerRegionRule.xy)), !any(bvec3(cornerRegionRule.xyz)));
        cornerRegionRule = cornerRegionRule * uvec4(cornerRegionRuleMask);

        uint resCorner  = udot(cornerCandidate, cornerRegionRule);
        uint resDiamond = cellNeighbours.CellValue * uint(pureRegionInfo.InsideDiamond);

        return max(resCorner, resDiamond);
    }
    `;

    const diamondsFSSource = ShaderCommonStart 
                           + ShaderSidesStateFunctions + ShaderCornersStateFunctions + ShaderNoSides2StateFunctions
                           + diamondsShaderFunctions + ShaderCommonEnd;
    

    return createShaderProgram(context, diamondsFSSource, vertexShader);
}

function createBeamsShaderProgram(context, vertexShader)
{
    //https://lightstrout.com/blog/2019/12/18/beams-render-mode/
    const beamsShaderFunctions = 
    `
    struct RegionInfo
    {
        bvec4 InsideBRegion;           //Smaller (1 - 1/sqrt(2))/2 square corners: top-left, top-right, bottom-left, bottom-right (B-A, B-B, B-D, B-C)
        bvec4 InsideIRegion;           //Central diamond corners: left, right, top, bottom (I-D, I-B, I-A, I-C)
        bvec4 InsideYHorizontalRegion; //Square edge pieces on horizontal beam: top on left, bottom on left, top on right, bottom on right (Y-H, Y-C, Y-G, Y-D)
        bvec4 InsideYVerticalRegion;   //Square edge pieces on vertical beam: left on top, right on top, left on bottom, right on bottom (Y-A, Y-B, Y-F, Y-E)
        bvec4 InsideVRegion;           //Square corners: top-left, top-right, bottom-left, bottom-right (V-A, V-B, V-D, V-C)
        bool  InsideGRegion;           //Central octagon
        bool  OutsideCentralDiamond;   //Out of central diamond (all regions combined except G-region and I-regions)
    };

    bvec4 emptyCornerRule(CellNeighbourValues cellNeighbours)
    {
        bvec4 res = bvec4(true);

        res = b4nd(res,    equal(cellNeighbours.SidesValues.xyxy, cellNeighbours.SidesValues.zzww));
        res = b4nd(res, notEqual(cellNeighbours.SidesValues.xyxy, cellNeighbours.CornersValues.xyzw));
        res = b4nd(res, notEqual(cellNeighbours.SidesValues.zzww, uvec4(cellNeighbours.CellValue)));

        return res;
    }

    bvec4 regionBRule(bvec4 equalsSides, bvec4 equalsCorners)
    {
        bvec4 res = bvec4(false);

        //Rules B1 and B2: check the neighbour cell in one of adjacent cardinal directions
        res = b4or(res, equalsSides.xyxy); //B#1
        res = b4or(res, equalsSides.zzww); //B#2

        //Rule B3: check the neighbour cell in the corresponding diagonal direction 
        res = b4or(res, equalsCorners); //B#3

        //Rule B4: check both neighbour cells in two opposite cardinal directions
        bvec4 equalsOppositeSides = b4nd(equalsSides.wwzz, equalsSides.yxyx);
        res = b4or(res, equalsOppositeSides); //B#4

        //Rule B5 (diagonal beam continuation): check the neighbour cell in the opposite diagonal direction.
        //Mind the possible direction change: the rule applies only if the cells in two lateral diagonal directions and two opposite cardinal directions are unlit
        bvec4 notEqualsLateralCorners = b4nd(not(equalsCorners.yxxy), not(equalsCorners.zwwz));
        bvec4 notEqualsOppositeSides  = b4nd(not(equalsSides.yxyx), not(equalsSides.wwzz));
        bvec4 notEqualsSurround       = b4nd(notEqualsLateralCorners, notEqualsOppositeSides);
        bvec4 beamContinuesIntertial  = b4nd(equalsCorners.wzyx, notEqualsSurround);
        res = b4or(res, beamContinuesIntertial); //B#5

        return res;
    }

    bvec4 regionIRule(bvec4 equalsSides, bvec4 equalsCorners)
    {
        bvec4 res = bvec4(false);

        //Rule I1: check the neighbour cell in the corresponding cardinal direction
        res = b4or(res, equalsSides); //I#1

        //Rules I2 and I3: check the neighbour cells in one of adjacent diagonal directions.
        //Maintain the cardinal priority: the rules apply only if the cell in the other cardinal direction adjacent to the diagonal is unlit
        bvec4 equalsAdjacentCornerPrioritized1 = b4nd(equalsCorners.zyyz, not(equalsSides.wzyx));
        bvec4 equalsAdjacentCornerPrioritized2 = b4nd(equalsCorners.xwxw, not(equalsSides.zwxy));
        res = b4or(res, equalsAdjacentCornerPrioritized1); //I#2
        res = b4or(res, equalsAdjacentCornerPrioritized2); //I#3

        //Rule I4 (diagonal 90° turn): check both neighbour cells in two opposite diagonal directions.
        //Maintain the cardinal priority: the rule applies only if the cells in the lateral cardinal directions are unlit
        bvec4 equalsOppositeCorners = b4nd(equalsCorners.yzzy, equalsCorners.wxwx);
        bvec4 notEqualsLateralSides = b4nd(not(equalsSides.zzxx), not(equalsSides.wwyy));
        bvec4 beam90DegreeTurn      = b4nd(equalsOppositeCorners, notEqualsLateralSides);
        res = b4or(res, beam90DegreeTurn); //I#4
        
        //Rule I5 (cardinal beam continuation): check the neighbour cell in the opposite cardinal direction.
        //Mind the possible direction change: the rule applies only if the cells in two lateral cardinal directions are unlit
        bvec4 beamContinuesIntertial = b4nd(notEqualsLateralSides, equalsSides.yxwz);
        res = b4or(res, beamContinuesIntertial); //I#5

        //Rule I6 (lone diamond): a lit cell with no lit neighbours has a diamond shape
        bool loneDiamond = all(not(equalsSides)) && all(not(equalsCorners));
        bvec4 loneDiamondVec = bvec4(loneDiamond);
        res = b4or(res, loneDiamondVec); //I#6;

        return res;
    }

    bvec4 regionYHorizontalRule(bvec4 equalsSides, bvec4 equalsCorners)
    {
        bvec4 res = bvec4(false);

        //Rule Y1: check the neighbour cell in the corresponding cardinal direction
        res = b4or(res, equalsSides.xyxy); //Y#1

        //Rule Y2: check the neighbour cell in the corresponding diagonal direction
        //Maintain the cardinal priority: the rule applies only if the cell in the other cardinal direction adjacent to the diagonal is unlit
        bvec4 beamContinues = b4nd(equalsCorners, not(equalsSides.zzww));
        res = b4or(res, beamContinues); //Y#2

        return res;
    }

    bvec4 regionYVerticalRule(bvec4 equalsSides, bvec4 equalsCorners)
    {
        bvec4 res = bvec4(false);

        //Rule Y1: check the neighbour cell in the corresponding cardinal direction
        res = b4or(res, equalsSides.zzww); //Y#1

        //Rule Y2: check the neighbour cell in the corresponding diagonal direction
        //Maintain the cardinal priority: the rule applies only if the cell in the other cardinal direction adjacent to the diagonal is unlit
        bvec4 beamContinues = b4nd(equalsCorners, not(equalsSides.xyxy));
        res = b4or(res, beamContinues); //Y#2

        return res;
    }

    bvec4 regionVRule(bvec4 equalsSides, bvec4 equalsCorners)
    {
        //Rule V: check the neighbour cell in the corresponding diagonal direction
        //Maintain the cardinal priority: the rule applies only if the cell in the adjacent cardinal directions are unlit
        bvec4 notEqualsAdjacentSides = b4nd(not(equalsSides.xyxy), not(equalsSides.zzww));
        return b4nd(equalsCorners, notEqualsAdjacentSides); //V#1
    }

    RegionInfo CalculateRegionInfo(ivec2 cellCoord, ivec2 cellSize, uint cellType)
    {
        int cellSizeMin = min(cellSize.x, cellSize.y);
        mediump vec2 cellCoordFrac = vec2(cellCoord) - 0.5f * vec2(cellSize);

        mediump vec2 absCellCoord = abs(cellCoordFrac);
        mediump float diamondRadius = float(cellSizeMin) / 2.0f;

        bvec4 insideSides   = bvec4(cellCoordFrac.x <= 0.0f, cellCoordFrac.x >= 0.0f, cellCoordFrac.y <= 0.0f, cellCoordFrac.y >= 0.0f);
        bvec4 insideCorners = b4nd(insideSides.xyxy, insideSides.zzww);

        //Fix for 1 pixel off. To make it work, x == 0 and y == 0 pixels shouldn't be considered a part of beam (or else single pixel artifacts will appear)
        //For even cell sizes, region inside the diamond should be a bit smaller to compensate
        bool insideCentralDiamond   = (absCellCoord.x + absCellCoord.y <= diamondRadius - 1.0f * float((gCellSize % 2 == 0) && ((gFlags & FLAG_NO_GRID) != 0)));
        bool outsideCentralDiamond  = (absCellCoord.x + absCellCoord.y >= diamondRadius + 1.0f * float(gCellSize % 2 == 0));

        bool insideVerticalBeam   = absCellCoord.x <= 0.707f * float(cellSizeMin) * 0.5f;
        bool insideHorizontalBeam = absCellCoord.y <= 0.707f * float(cellSizeMin) * 0.5f;

        bvec2 insideHalfBeamsHorizontal = b2nd(bvec2(insideHorizontalBeam), insideSides.xy);
        bvec2 insideHalfBeamsVertical   = b2nd(bvec2(insideVerticalBeam),   insideSides.zw);
        bvec4 insideHalfBeams           = bvec4(insideHalfBeamsHorizontal,  insideHalfBeamsVertical);

        bool insideBothBeams = insideHorizontalBeam && insideVerticalBeam;
        bool outsideBeams    = !insideHorizontalBeam && !insideVerticalBeam;
        
        bool insideBeamEnds   = !insideBothBeams && !outsideBeams;
        bool insideBeamWedges = insideBeamEnds && !insideCentralDiamond;

        bvec4 insideBeamEndsSided = b4nd(insideHalfBeams, insideSides);

        bool insideHorizontalBeamWedges = insideHorizontalBeam && insideBeamWedges;
        bool insideVerticalBeamWedges   = insideVerticalBeam   && insideBeamWedges;

        bool insideCentralSquareCorners = !insideCentralDiamond && insideBothBeams;
        bool insideDiamondCorners       = insideCentralDiamond  && insideBeamEnds;


        RegionInfo result;

        result.OutsideCentralDiamond = outsideCentralDiamond;

        result.InsideGRegion = insideCentralDiamond && insideBothBeams;
        
        result.InsideBRegion = b4nd(bvec4(insideCentralSquareCorners), insideCorners);       //B-A, B-B, B-D, B-C

        result.InsideIRegion = b4nd(bvec4(insideDiamondCorners), insideBeamEndsSided); //I-D, I-B, I-A, I-C

        result.InsideYHorizontalRegion = b4nd(bvec4(insideHorizontalBeamWedges), insideCorners); //Y-H, Y-C, Y-G, Y-D
        result.InsideYVerticalRegion   = b4nd(bvec4(insideVerticalBeamWedges),   insideCorners); //Y-A, Y-B, Y-F, Y-E

        result.InsideVRegion = b4nd(bvec4(outsideBeams), insideCorners); //V-A, V-B, V-D, V-C

        return result;
    }

    uint CalculateRegionValue(RegionInfo regionInfo, CellNeighbourValues cellNeighbours, uint cellType)
    {
        uvec4 cellValueVec = uvec4(cellNeighbours.CellValue);

        bvec4 equalsSides   = equal(cellValueVec, cellNeighbours.SidesValues);
        bvec4 equalsCorners = equal(cellValueVec, cellNeighbours.CornersValues);

        uvec4 emptyCornerCandidate = uvec4(emptyCornerRule(cellNeighbours)) * cellNeighbours.SidesValues.zzww;
        emptyCornerCandidate      *= uint(regionInfo.OutsideCentralDiamond); //Fix for 1 pixel offset 

        uvec4 regionBCandidate = uvec4(regionBRule(equalsSides, equalsCorners)) * cellNeighbours.CellValue;
        uvec4 regionICandidate = uvec4(regionIRule(equalsSides, equalsCorners)) * cellNeighbours.CellValue;

        uvec4 regionYHorizontalCandidate = uvec4(regionYHorizontalRule(equalsSides, equalsCorners)) * cellNeighbours.CellValue;
        uvec4 regionYVerticalCandidate   = uvec4(regionYVerticalRule(equalsSides, equalsCorners)) * cellNeighbours.CellValue;

        uvec4 regionVCandidate = uvec4(regionVRule(equalsSides, equalsCorners)) * cellNeighbours.CellValue;

        uvec4 resB           = max(regionBCandidate,           emptyCornerCandidate);
        uvec4 resYHorizontal = max(regionYHorizontalCandidate, emptyCornerCandidate);
        uvec4 resYVertical   = max(regionYVerticalCandidate,   emptyCornerCandidate);
        uvec4 resV           = max(regionVCandidate,           emptyCornerCandidate);

        uint result = uint(regionInfo.InsideGRegion) * cellNeighbours.CellValue;
        result     += udot(uvec4(regionInfo.InsideBRegion),           resB);
        result     += udot(uvec4(regionInfo.InsideIRegion),           regionICandidate); 
        result     += udot(uvec4(regionInfo.InsideYHorizontalRegion), resYHorizontal);
        result     += udot(uvec4(regionInfo.InsideYVerticalRegion),   resYVertical);
        result     += udot(uvec4(regionInfo.InsideVRegion),           resV);

        return result;
    }
    `;

    const beamsFSSource = ShaderCommonStart 
                        + ShaderSidesStateFunctions + ShaderCornersStateFunctions + ShaderNoSides2StateFunctions
                        + beamsShaderFunctions + ShaderCommonEnd;
    

    return createShaderProgram(context, beamsFSSource, vertexShader);
}

function createRaindropsShaderProgram(context, vertexShader)
{
    //https://lightstrout.com/blog/2019/05/21/raindrops-render-mode/
    const raindropsShaderFunctions = 
    `
    struct RegionInfo
    {
        bvec4 InsideCorners;
        bool  InsideCircle;
        bool  OutsideCircle;
    };

    bvec4 emptyCornerRule(uvec4 edgeValue)
    {
        return equal(edgeValue.xyxy, edgeValue.zzww);
    }

    bvec4 cornerRule(CellNeighbourValues cellNeighbours)
    {
        bvec4 res = bvec4(false);

        uvec4 cellValueVec = uvec4(cellNeighbours.CellValue);
        
        res = b4or(res, equal(cellValueVec, cellNeighbours.CornersValues.xyzw));
        res = b4or(res, equal(cellValueVec, cellNeighbours.SidesValues.xyxy));
        res = b4or(res, equal(cellValueVec, cellNeighbours.SidesValues.zzww));

        return res;
    }

    RegionInfo CalculateRegionInfo(ivec2 cellCoord, ivec2 cellSize, uint cellType)
    {
        int cellSizeMin = min(cellSize.x, cellSize.y);
        mediump vec2 cellCoordFrac = vec2(cellCoord) - 0.5f * vec2(cellSize);

        mediump float circleRadius = float(cellSizeMin - 1) / 2.0f;

        bool insideCircle  = (dot(cellCoordFrac, cellCoordFrac) < (circleRadius * circleRadius));
        bool outsideCircle = (dot(cellCoordFrac, cellCoordFrac) > (circleRadius + 1.0f) * (circleRadius + 1.0f));

        bool insideTopLeft     = !insideCircle && cellCoordFrac.x <= 0.0f && cellCoordFrac.y <= 0.0f;
        bool insideTopRight    = !insideCircle && cellCoordFrac.x >= 0.0f && cellCoordFrac.y <= 0.0f;
        bool insideBottomLeft  = !insideCircle && cellCoordFrac.x <= 0.0f && cellCoordFrac.y >= 0.0f;
        bool insideBottomRight = !insideCircle && cellCoordFrac.x >= 0.0f && cellCoordFrac.y >= 0.0f;

        RegionInfo result;

        result.InsideCorners = bvec4(insideTopLeft, insideTopRight, insideBottomLeft, insideBottomRight);

        result.InsideCircle  = insideCircle;
        result.OutsideCircle = outsideCircle;

        return result;
    }

    uint CalculateRegionValue(RegionInfo regionInfo, CellNeighbourValues cellNeighbours, uint cellType)
    {
        uvec4 emptyCornerCandidate = uvec4(emptyCornerRule(cellNeighbours.SidesValues)) * cellNeighbours.SidesValues.zzww;
        uvec4 cornerCandidate      = uvec4(cornerRule(cellNeighbours)) * cellNeighbours.CellValue;

        emptyCornerCandidate = uint(regionInfo.OutsideCircle) * emptyCornerCandidate;

        uvec4 resCorner = max(emptyCornerCandidate, cornerCandidate);

        return cellNeighbours.CellValue * uint(regionInfo.InsideCircle) + udot(resCorner, uvec4(regionInfo.InsideCorners));
    }
    `;

    const raindropsFSSource = ShaderCommonStart 
                            + ShaderSidesStateFunctions + ShaderCornersStateFunctions + ShaderNoSides2StateFunctions
                            + raindropsShaderFunctions + ShaderCommonEnd;

    return createShaderProgram(context, raindropsFSSource, vertexShader);
}

function createChainsShaderProgram(context, vertexShader)
{
    //https://lightstrout.com/blog/2019/05/21/chains-render-mode/
    const chainsShaderFunctions = 
    `
    struct RegionInfo
    {
        bvec4 InsideFreeCorners;
        bvec4 InsideSlimEdgesHorizontal;
        bvec4 InsideSlimEdgesVertical;
        bvec2 InsideCircleLinks;
        bool  InsideBothLinks;
        bool  InsideFreeCircle;
        bool  OutsideCircle;
    };

    bvec4 emptyCornerRule(uvec4 edgeValue)
    {
        return equal(edgeValue.xyxy, edgeValue.zzww);
    }

    bvec4 cornerRule(bvec4 equalsSides, bvec4 equalsCorners)
    {
        bvec4 res = bvec4(false);

        res = b4or(res, equalsCorners);
        res = b4or(res, equalsSides.xyxy);
        res = b4or(res, equalsSides.zzww);

        return res;
    }

    bvec2 linkRule(uint cellValue, uvec4 edgeValue)
    {
        uvec2 cellValueVec = uvec2(cellValue);

        bvec2 res = bvec2(true);
        res       = b2nd(res, equal(edgeValue.xz, edgeValue.yw));
        res       = b2nd(res, notEqual(edgeValue.xz, edgeValue.zx));
        res       = b2nd(res, notEqual(edgeValue.yw, edgeValue.wy));
        res       = b2nd(res, notEqual(edgeValue.xz, cellValueVec));

        return res;
    }

    bvec4 slimEdgeHorizontalRule(bvec4 equalsSides, bvec4 equalsCorners, bvec4 equalsSides2)
    {
        bvec4 equalsAdjacentSides = b4or(equalsSides.xyxy, equalsSides.zzww);
        bvec4 equalsAdjacentCells = b4or(equalsCorners, equalsAdjacentSides);

        bvec4 equalsDistantSides = b4nd(equalsSides2.xyxy, not(equalsCorners.zwxy));

        return b4or(equalsAdjacentCells, equalsDistantSides);
    }

    bvec4 slimEdgeEmptyHorizontalRule(bvec2 equalsOppositeSides, bvec4 equalsLateralSides)
    {
        return b4nd(equalsOppositeSides.xxxx, not(equalsLateralSides.zwxy));
    }

    bvec4 slimEdgeVerticalRule(bvec4 equalsSides, bvec4 equalsCorners, bvec4 equalsSides2)
    {
        bvec4 equalsAdjacentSides = b4or(equalsSides.xyxy, equalsSides.zzww);
        bvec4 equalsAdjacentCells = b4or(equalsCorners, equalsAdjacentSides);

        bvec4 equalsDistantSides = b4nd(equalsSides2.zzww, not(equalsCorners.yxwz));

        return b4or(equalsAdjacentCells, equalsDistantSides);
    }

    bvec4 slimEdgeEmptyVerticalRule(bvec2 equalsOppositeSides, bvec4 equalsLateralSides)
    {
        return b4nd(equalsOppositeSides.yyyy, not(equalsLateralSides.yxwz));
    }

    RegionInfo CalculateRegionInfo(ivec2 cellCoord, ivec2 cellSize, uint cellType)
    {
        int cellSizeMin = min(cellSize.x, cellSize.y);
        mediump vec2 cellCoordFrac = vec2(cellCoord) - 0.5f * vec2(cellSize);

        mediump float circleRadius    = float(cellSizeMin) * 0.5f;
        mediump float circleRadiusBig = float(cellSizeMin) * 0.9f;

        mediump vec2 cellCoordLeft   = cellCoordFrac + vec2(float( cellSizeMin),              0.0f);
        mediump vec2 cellCoordRight  = cellCoordFrac + vec2(float(-cellSizeMin),              0.0f);
        mediump vec2 cellCoordTop    = cellCoordFrac + vec2(             0.0f, float( cellSizeMin));
        mediump vec2 cellCoordBottom = cellCoordFrac + vec2(             0.0f, float(-cellSizeMin));

        bool insideCircle  = (dot(cellCoordFrac, cellCoordFrac) < circleRadius          * circleRadius);
        bool outsideCircle = (dot(cellCoordFrac, cellCoordFrac) > (circleRadius + 1.0f) * (circleRadius + 1.0f));

        bool insideCircleBigLeft   = (dot(  cellCoordLeft,   cellCoordLeft) < (circleRadiusBig) * (circleRadiusBig));
        bool insideCircleBigRight  = (dot( cellCoordRight,  cellCoordRight) < (circleRadiusBig) * (circleRadiusBig));
        bool insideCircleBigTop    = (dot(   cellCoordTop,    cellCoordTop) < (circleRadiusBig) * (circleRadiusBig));
        bool insideCircleBigBottom = (dot(cellCoordBottom, cellCoordBottom) < (circleRadiusBig) * (circleRadiusBig));

        bool insideLinkHorizontal = !insideCircleBigTop  && !insideCircleBigBottom;
        bool insideLinkVertical   = !insideCircleBigLeft && !insideCircleBigRight;

        bool  insideCircleLinkHorizontal = insideLinkHorizontal && !insideLinkVertical   && insideCircle;
        bool  insideCircleLinkVertical   = insideLinkVertical   && !insideLinkHorizontal && insideCircle;

        bool insideTopLeft     = cellCoordFrac.x <= 0.0f && cellCoordFrac.y <= 0.0f;
        bool insideTopRight    = cellCoordFrac.x >= 0.0f && cellCoordFrac.y <= 0.0f;
        bool insideBottomLeft  = cellCoordFrac.x <= 0.0f && cellCoordFrac.y >= 0.0f;
        bool insideBottomRight = cellCoordFrac.x >= 0.0f && cellCoordFrac.y >= 0.0f;

        bvec4 insideCorners      = bvec4(insideTopLeft, insideTopRight, insideBottomLeft, insideBottomRight);
        bvec4 insideRoundCorners = b4nd(insideCorners, bvec4(!insideCircle));

        bool outsideLinks = !insideLinkHorizontal && !insideLinkVertical;


        RegionInfo result;

        result.InsideFreeCorners = b4nd(insideRoundCorners, bvec4(outsideLinks));
        
        result.InsideSlimEdgesHorizontal = b4nd(bvec4(insideLinkHorizontal), insideRoundCorners);
        result.InsideSlimEdgesVertical   = b4nd(bvec4(insideLinkVertical),   insideRoundCorners);

        result.InsideCircleLinks = bvec2(insideCircleLinkHorizontal, insideCircleLinkVertical);
        result.InsideBothLinks   = insideLinkHorizontal && insideLinkVertical;

        result.InsideFreeCircle = insideCircle && outsideLinks;
        result.OutsideCircle    = outsideCircle;

        return result;
    }

    uint CalculateRegionValue(RegionInfo regionInfo, CellNeighbourValues cellNeighbours, uint cellType)
    {
        uvec4 cellValueVec        = uvec4(cellNeighbours.CellValue);
        bvec4 equalsSides         = equal(cellValueVec, cellNeighbours.SidesValues);
        bvec4 equalsCorners       = equal(cellValueVec, cellNeighbours.CornersValues);
        bvec4 equalsSides2        = equal(cellValueVec, cellNeighbours.Sides2Values);
        bvec2 equalsOppositeSides = equal(cellNeighbours.SidesValues.xz, cellNeighbours.SidesValues.yw);
        bvec4 equalsLateralSides  = equal(cellNeighbours.SidesValues.xyxy, cellNeighbours.SidesValues.zzww);

        uvec4 emptyCornerCandidate = uvec4(emptyCornerRule(cellNeighbours.SidesValues)) * cellNeighbours.SidesValues.zzww;
        uvec4 cornerCandidate      = uvec4(cornerRule(equalsSides, equalsCorners)) * cellNeighbours.CellValue;

        emptyCornerCandidate = uint(regionInfo.OutsideCircle) * emptyCornerCandidate;
        uvec4 resCorner = max(cornerCandidate, emptyCornerCandidate);

        uvec4 slimEdgeFilledHorizontalCandidate = uvec4(slimEdgeHorizontalRule(equalsSides, equalsCorners, equalsSides2)) * cellNeighbours.CellValue;
        uvec4 slimEdgeEmptyHorizontalCandidate  = uvec4(slimEdgeEmptyHorizontalRule(equalsOppositeSides, equalsLateralSides)) * cellNeighbours.SidesValues.xyxy;

        uvec4 resSlimEdgeHorizontal = max(slimEdgeFilledHorizontalCandidate, slimEdgeEmptyHorizontalCandidate);
        resSlimEdgeHorizontal = max(resSlimEdgeHorizontal, resCorner);

        uvec4 slimEdgeFilledVerticalCandidate = uvec4(slimEdgeVerticalRule(equalsSides, equalsCorners, equalsSides2)) * cellNeighbours.CellValue;
        uvec4 slimEdgeEmptyVerticalCandidate  = uvec4(slimEdgeEmptyVerticalRule(equalsOppositeSides, equalsLateralSides)) * cellNeighbours.SidesValues.zzww;

        uvec4 resSlimEdgeVertical = max(slimEdgeFilledVerticalCandidate, slimEdgeEmptyVerticalCandidate);
        resSlimEdgeVertical = max(resSlimEdgeVertical, resCorner);

        uvec2 linkCandidate = uvec2(linkRule(cellNeighbours.CellValue, cellNeighbours.SidesValues)) * cellNeighbours.SidesValues.xz;

        uvec2 resLink     = max(linkCandidate, uvec2(cellNeighbours.CellValue));
        uint  resMidLinks = max(resLink.x, resLink.y);

        uint result =       uint(regionInfo.InsideFreeCircle)    *      cellNeighbours.CellValue;
        result     += udot(uvec4(regionInfo.InsideFreeCorners),         resCorner);
        result     += udot(uvec4(regionInfo.InsideSlimEdgesHorizontal), resSlimEdgeHorizontal); 
        result     += udot(uvec4(regionInfo.InsideSlimEdgesVertical),   resSlimEdgeVertical);
        result     += udot(uvec2(regionInfo.InsideCircleLinks),         resLink); 
        result     +=       uint(regionInfo.InsideBothLinks)     *      resMidLinks;

        return result;
    }
    `;

    const chainsFSSource = ShaderCommonStart 
                         + ShaderSidesStateFunctions + ShaderCornersStateFunctions + ShaderSides2StateFunctions
                         + chainsShaderFunctions + ShaderCommonEnd;

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
        requestRedraw();
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

    const canvasWidth  = canvas.width;
    const canvasHeight = canvas.height;

    const canvasSize = Math.min(canvasWidth, canvasHeight);

    let currentViewportWidth  = canvasSize;
    let currentViewportHeight = canvasSize;

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
        let boardPoint = boardPointFromCanvasPoint(x, y, currentGameSize, currentViewportWidth, currentViewportHeight, gridCheckBox.checked);

        if(isConstruct)
        {
            makeConstructTurn(currentGameBoard, currentGameSize, currentDomainSize, boardPoint.x, boardPoint.y);
        }
        else
        {
            if(currentWorkingMode === WorkingModes.LitBoardClickRule)
            {
                currentGameBoard = makeTurn(currentGameBoard, currentGameClickRule, currentClickRuleSize, currentGameSize, currentDomainSize, boardPoint.x, boardPoint.y, currentTopology);
            }
            else if(currentWorkingMode == WorkingModes.LitBoardMatrix)
            {
                currentGameBoard = makeTurnMatrix(currentGameBoard, currentGameMatrix, currentGameSize, currentDomainSize, boardPoint.x, boardPoint.y);
            }
            else if(currentWorkingMode === WorkingModes.ConstructClickRule)
            {
                makeConstructTurn(currentGameBoard, currentGameSize, currentDomainSize, boardPoint.x, boardPoint.y);
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

    function updateViewport()
    {
        gl.viewport(0, 0, currentViewportWidth, currentViewportHeight); //Very careful here. 
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

                glRow.uniform1i(rowShaderVariables.CanvasWidthUniformLocation,  canvasRow.width);
                glRow.uniform1i(rowShaderVariables.CanvasHeightUniformLocation, canvasRow.height);

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
    
            CanvasWidthUniformLocation:  context.getUniformLocation(shaderProgram, "gImageWidth"),
            CanvasHeightUniformLocation: context.getUniformLocation(shaderProgram, "gImageHeight"),
    
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

        gl.uniform1i(drawShaderVariables.CanvasWidthUniformLocation,  currentViewportWidth);
        gl.uniform1i(drawShaderVariables.CanvasHeightUniformLocation, currentViewportHeight);

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

        gl.uniform1i(drawShaderVariables.CanvasWidthUniformLocation,  null);
        gl.uniform1i(drawShaderVariables.CanvasHeightUniformLocation, null);

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