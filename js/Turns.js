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
    let resBoard = new Uint8Array(board);

    let cellIndex = flatCellIndex(gameSize, cellX, cellY);
    resBoard[cellIndex] = (board[cellIndex] + 1) % domainSize;

    return resBoard;
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
    let solution = new Uint8Array(gameSize * gameSize);

    for(let y = 0; y < gameSize; y++)
    {
        for (let x = 0; x < gameSize; x++)
        {
            let cellIndex = flatCellIndex(gameSize, x, y);
            let matrixRow = solutionMatrix[cellIndex];

            solution[cellIndex] = dotProductBoard(board, matrixRow, domainSize);
        }
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

    return invSolution;
}