//Big thanks to this guy: https://stackoverflow.com/a/33432215
//You're awesome, Tomáš Zato!
function solutionMatrixWorkerFunction()
{
    ////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////    UTIL FUNCTIONS    /////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////

    //Computes a flat cell index from x and y for the given board size (gameSize x gameSize)
    function flatCellIndex(gameSize, x, y)
    {
        return y * gameSize + x;
    }

    function postProgressMessage(progressValue)
    {
        postMessage({command: "Progress", params: {progress: progressValue}});
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

    //////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////    CLICK RULE FUNCTIONS    /////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////

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

    /////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////    BOARD FUNCTIONS    /////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////

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

    //Calculates (boardLeft - mulValue * boardRight) component-wise in-place, taking the value from a cache
    //Assumes mulValue is always positive
    //Makes function ~35% faster in domain 2.
    function mulSubBoardInPlaceCached(boardLeft, boardRight, mulValue, domainSize, wholeModCache)
    {
        if(boardLeft.length !== boardRight.length || mulValue === 0)
        {
            return;
        }

        const domainSizeCacheOffset = (domainSize - 1) * (domainSize - 1);
        mulValue = mulValue % domainSize;
        for(let i = 0; i < boardLeft.length; i++)
        {
            boardLeft[i] = wholeModCache[boardLeft[i] - mulValue * boardRight[i] + domainSizeCacheOffset];
        }
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////    MATRIX FUNCTIONS    /////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////

    //Calculates the Lights Out matrix for the given click rule and game size. Lights Out matrix helps to calculate inverse solutions
    function calculateGameMatrix(clickRule, gameSize, clickRuleSize, isToroid)
    {
        //Generate a normal Lights Out matrix for the click rule
        let lightsOutMatrix = [];
        for(let yL = 0; yL < gameSize; yL++)
        {
            for(let xL = 0; xL < gameSize; xL++)
            {
                let matrixRow = {};
                if(isToroid)
                {
                    matrixRow = populateClickRuleToroid(clickRule, clickRuleSize, gameSize, xL, yL);
                }
                else
                {
                    matrixRow = populateClickRulePlane(clickRule, clickRuleSize, gameSize, xL, yL);
                }

                lightsOutMatrix.push(matrixRow);
            }
        }

        return lightsOutMatrix;
    }
    
    //Calculates the inverse Lights Out matrix for the given click rule and game size. Lights Out matrix helps to calculate solutions
    //Single-execute version
    function calculateSolutionMatrix(clickRule, gameSize, domainSize, clickRuleSize, isToroid)
    {
        let currProgress = 0.0;
        postProgressMessage(currProgress);

        let lightsOutMatrix = calculateGameMatrix(clickRule, gameSize, clickRuleSize, isToroid);

        currProgress = 0.01;
        postProgressMessage(currProgress);

        //Generate a unit matrix. This will eventually become an inverse matrix
        let invMatrix = [];
        for(let yI = 0; yI < gameSize; yI++)
        {
            for(let xI = 0; xI < gameSize; xI++)
            {
                let invMatrixRow = new Uint8Array(gameSize * gameSize);
                invMatrixRow.fill(0);

                let cellIndex = flatCellIndex(gameSize, xI, yI);
                invMatrixRow[cellIndex] = 1;

                invMatrix.push(invMatrixRow);
            }
        }

        currProgress = 0.016;
        postProgressMessage(currProgress);

        let domainInvs = []; //For optimization purposes, cache 1/k values for every possible value in the domain. Since the maximum domain size is 255, this cache won't take a lot of memory
        for(let d = 0; d < domainSize; d++)
        {
            domainInvs.push(invModGcdEx(d, domainSize));
        }
        
        currProgress = 0.02;
        postProgressMessage(currProgress);

        //For more optimization, cache all possible values of Whole Mod of A - B * C too
        //Cache makes mod calculations 35% faster (1.8s vs 2.3s without cache on 50x50 domain 2)
        const domainSizeCacheOffset = (domainSize - 1) * (domainSize - 1);
        let wholeModCache = new Uint8Array((domainSize - 1) * (domainSize - 1) + domainSize); //(domainSize - 1) for positive cache and (domainSize * domainSize - 1) for negative cache
        for(let i = 0; i < wholeModCache.length; i++)
        {
            let divisor      = i - domainSizeCacheOffset;                         //[-domainSizeCacheOffset, domainSize - 1]
            wholeModCache[i] = ((divisor % domainSize) + domainSize) % domainSize; //Whole mod
        }

        //First pass: top to bottom, eliminating numbers from below the diagonal
        let matrixSize = gameSize * gameSize;
        for(let iD = 0; iD < matrixSize; iD++)
        {
            let thisValD = lightsOutMatrix[iD][iD];
            let compValD = lightsOutMatrix[iD][iD];
            if(domainInvs[compValD] === 0 || (thisValD !== 1 && domainSize % thisValD === 0))
            {
                for(let jSw = iD + 1; jSw < matrixSize; jSw++)
                {
                    compValD = lightsOutMatrix[jSw][iD];
                    if(domainInvs[compValD] !== 0)
                    {
                        thisValD = compValD;
                        
                        let tmpMatrixRow     = lightsOutMatrix[iD];
                        lightsOutMatrix[iD]  = lightsOutMatrix[jSw];
                        lightsOutMatrix[jSw] = tmpMatrixRow;

                        let tmpInvMatrixRow = invMatrix[iD];
                        invMatrix[iD]       = invMatrix[jSw];
                        invMatrix[jSw]      = tmpInvMatrixRow;

                        break;
                    }
                }
            }

            let invThisValD = domainInvs[thisValD];
            for(let jD = iD + 1; jD < matrixSize; jD++)
            {
                let compValD = lightsOutMatrix[jD][iD];
                if(domainInvs[compValD] !== 0)
                {
                    mulSubBoardInPlaceCached(lightsOutMatrix[jD], lightsOutMatrix[iD], invThisValD * compValD, domainSize, wholeModCache);
                    mulSubBoardInPlaceCached(invMatrix[jD],       invMatrix[iD],       invThisValD * compValD, domainSize, wholeModCache);
                }
            }

            currProgress += 0.48 / matrixSize;
            postProgressMessage(currProgress);
        }

        //Second pass: bottom to top, eliminating numbers from above the diagonal
        let quietPatterns = 0;
        for(let iU = matrixSize - 1; iU >= 0; iU--)
        {
            let thisValU    = lightsOutMatrix[iU][iU];
            let invThisValU = domainInvs[thisValU];
            for(let jU = iU - 1; jU >= 0; jU--)
            {
                let compValU = lightsOutMatrix[jU][iU];
                if(domainInvs[compValU] !== 0)
                {
                    mulSubBoardInPlaceCached(lightsOutMatrix[jU], lightsOutMatrix[iU], invThisValU * compValU, domainSize, wholeModCache);
                    mulSubBoardInPlaceCached(invMatrix[jU],       invMatrix[iU],       invThisValU * compValU, domainSize, wholeModCache);
                }
            }

            if(domainInvs[thisValU] !== 0)
            {
                mulBoardInPlace(lightsOutMatrix[iU], invThisValU, domainSize);
                mulBoardInPlace(invMatrix[iU],       invThisValU, domainSize);
            }

            if(lightsOutMatrix[iU].every(val => val === 0))
            {
                quietPatterns += 1;
            }

            currProgress += 0.48 / matrixSize;
            postProgressMessage(currProgress);
        }

        for(let i = 0; i < matrixSize; i++) //Transpose for the case of non-symmetrical click rules
        {
            for(let j = 0; j < i; j++)
            {
                let temp        = invMatrix[i][j];
                invMatrix[i][j] = invMatrix[j][i];
                invMatrix[j][i] = temp;
            }
        }

        postProgressMessage(1.0);
        return {invM: invMatrix, quietP: quietPatterns};
    }

    onmessage = function(e)
    {
        switch(e.data.command)
        {
            case "CalcSolutionMatrix":
            {
                let operationAfter = e.data.params.opAfter;
                
                let calcResult = calculateSolutionMatrix(e.data.params.clickRule, e.data.params.gameSize, e.data.params.domainSize, e.data.params.clickRuleSize, e.data.params.isToroid);
                postMessage({command: "Finish", params: {matrix: calcResult.invM, qp: calcResult.quietP, opAfter: operationAfter}});

                break;
            }
        }
    }
}

if(window != self)
{
    solutionMatrixWorkerFunction();
}