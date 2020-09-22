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

//Returns (num % domainSize) with regard to the sign of num
function wholeMod(num, domainSize)
{
    return ((num % domainSize) + domainSize) % domainSize;
}