//DEFINE THEM ONLY IN THE SCOPE OF THE WORKER

//Lights out inverse matrix calculation step 1: calculate lights out matrix
function calculateSolutionMatrixStep1Bit(lightsOutMatrix, clickRule, clickRuleSize, gameSize, gridRowNumber, isToroid)
{
    for(let xL = 0; xL < gameSize; xL++)
    {
        let matrixRow = {};
        if(isToroid)
        {
            matrixRow = populateClickRuleToroid(clickRule, clickRuleSize, gameSize, xL, gridRowNumber);
        }
        else
        {
            matrixRow = populateClickRulePlane(clickRule, clickRuleSize, gameSize, xL, gridRowNumber);
        }

        lightsOutMatrix.push(matrixRow);
    }
}

//Lights out inverse matrix calculation step 2: allocate inverse matrix
function calculateSolutionMatrixStep2Bit(invMatrix, gameSize)
{
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
}

//Lights out inverse matrix calculation step 3: top to bottom, eliminating numbers from below the diagonal
function calculateSolutionMatrixStep3Bit(lightsOutMatrix, invMatrix, matrixSize, domainInvs, domainSize, matrixRow)
{
    let thisValD = lightsOutMatrix[matrixRow][matrixRow];
    let compValD = lightsOutMatrix[matrixRow][matrixRow];
    if(domainInvs[compValD] === 0 || (thisValD !== 1 && domainSize % thisValD === 0))
    {
        for(let jSw = matrixRow + 1; jSw < matrixSize; jSw++)
        {
            compValD = lightsOutMatrix[jSw][matrixRow];
            if(domainInvs[compValD] !== 0)
            {
                thisValD = compValD;
                
                let tmpMatrixRow           = lightsOutMatrix[matrixRow];
                lightsOutMatrix[matrixRow] = lightsOutMatrix[jSw];
                lightsOutMatrix[jSw]       = tmpMatrixRow;

                let tmpInvMatrixRow  = invMatrix[matrixRow];
                invMatrix[matrixRow] = invMatrix[jSw];
                invMatrix[jSw]       = tmpInvMatrixRow;

                break;
            }
        }
    }

    let invThisValD = domainInvs[thisValD];
    for(let jD = matrixRow + 1; jD < matrixSize; jD++)
    {
        compValD = lightsOutMatrix[matrixRow][matrixRow];
        if(domainInvs[compValD] !== 0)
        {
            mulSubBoardInPlace(lightsOutMatrix[jD], lightsOutMatrix[matrixRow], invThisValD * compValD, domainSize);
            mulSubBoardInPlace(invMatrix[jD],       invMatrix[matrixRow],       invThisValD * compValD, domainSize);
        }
    }
}

//Lights out inverse matrix calculation step 3: bottom to top, eliminating numbers from above the diagonal
function calculateSolutionMatrixStep4Bit(lightsOutMatrix, invMatrix, domainInvs, domainSize, matrixRow)
{
    let thisValU    = lightsOutMatrix[matrixRow][matrixRow];
    let invThisValU = domainInvs[thisValU];

    for(let jU = matrixRow - 1; jU >= 0; jU--)
    {
        let compValU = lightsOutMatrix[jU][matrixRow];
        if(domainInvs[compValU] !== 0)
        {
            mulSubBoardInPlace(lightsOutMatrix[jU], lightsOutMatrix[matrixRow], invThisValU * compValU, domainSize);
            mulSubBoardInPlace(invMatrix[jU],       invMatrix[matrixRow],       invThisValU * compValU, domainSize);
        }
    }

    if(domainInvs[thisValU] !== 0)
    {
        mulBoardInPlace(lightsOutMatrix[matrixRow], invThisValU, domainSize);
        mulBoardInPlace(invMatrix[matrixRow],       invThisValU, domainSize);
    }
}

function calculateSolutionMatrixStep5Bit(lightsOutMatrix, matrixRow, quietPatterns)
{
    let qp = quietPatterns;
    if(lightsOutMatrix[matrixRow].every(val => val === 0))
    {
        qp = quietPatterns + 1;
    }

    return qp;
}

function calculateSolutionMatrixStep6Bit(invMatrix, matrixSize)
{
    for(let i = 0; i < matrixSize; i++) //Transpose for the case of non-symmetrical click rules
    {
        for(let j = 0; j < i; j++)
        {
            let temp        = invMatrix[i][j];
            invMatrix[i][j] = invMatrix[j][i];
            invMatrix[j][i] = temp;
        }
    }
}

//Calculates the inverse Lights Out matrix for the given click rule and game size. Lights Out matrix helps to calculate solutions
//Single-execute version
function calculateSolutionMatrix(clickRule, gameSize, domainSize, clickRuleSize, isToroid)
{
    //Generate a normal Lights Out matrix for the click rule
    let lightsOutMatrix = [];
    for(let yL = 0; yL < gameSize; yL++)
    {
        calculateSolutionMatrixStep1Bit(lightsOutMatrix, clickRule, clickRuleSize, gameSize, yL, isToroid);
    }

    //Generate a unit matrix. This will eventually become an inverse matrix
    let invMatrix = [];
    calculateSolutionMatrixStep2Bit(invMatrix, gameSize);

    let domainInvs = []; //For optimization purposes, cache 1/k values for every possible value in the domain. Since the maximum domain size is 255, this cache won't take a lot of memory
    for(let d = 0; d < domainSize; d++)
    {
        domainInvs.push(invModGcdEx(d, domainSize));
    }
    
    //First pass: top to bottom, eliminating numbers from below the diagonal
    let matrixSize = gameSize * gameSize;
    for(let iD = 0; iD < matrixSize; iD++)
    {
        calculateSolutionMatrixStep3Bit(lightsOutMatrix, invMatrix, matrixSize, domainInvs, domainSize, iD);
    }

    //Second pass: bottom to top, eliminating numbers from above the diagonal
    let quietPatterns = 0;
    for(let iU = matrixSize - 1; iU >= 0; iU--)
    {
        calculateSolutionMatrixStep4Bit(lightsOutMatrix, invMatrix, domainInvs, domainSize, iU);
    }

    for(let iD = 0; iD < matrixSize; iD++)
    {
        quietPatterns = calculateSolutionMatrixStep5Bit(lightsOutMatrix, iD, quietPatterns);
    }

    calculateSolutionMatrixStep6Bit(invMatrix, matrixSize);

    return {invmatrix: invMatrix, quietpats: quietPatterns};
}