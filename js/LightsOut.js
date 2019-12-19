// eslint-disable-next-line no-unused-vars
function main()
{
    const canvas = document.getElementById("LightsOutCanvas");
    
    const infoText = document.getElementById("LightsOutPuzzleInfo");
    const qpText   = document.getElementById("QuietPatternsInfo");

    const renderModeSelect = document.getElementById("rendermodesel");

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

        clickAtPoint(x, y, e.ctrlKey);
    };

    document.onkeyup = function (e)
    {
        switch (e.code)
        {
        case "Equal": //Actually +
        {
            if(e.shiftKey)
            {
                changeDomainSize(currentDomainSize + 1);
            }
            else
            {
                incrementGameSize();
            }
            break;
        }
        case "Minus":
        {
            if(e.shiftKey)
            {
                changeDomainSize(currentDomainSize - 1);
            }
            else
            {
                decrementGameSize();
            }
            break;
        }
        case "Digit0":
        {
            resetGameBoard(resetModes.RESET_ZERO, currentGameSize, currentDomainSize);
            break;
        }
        case "Digit1":
        {
            resetGameBoard(resetModes.RESET_ONE, currentGameSize, currentDomainSize);
            break;
        }
        case "KeyO":
        {
            resetGameBoard(resetModes.RESET_BORDER, currentGameSize, currentDomainSize);
            break;
        }
        case "KeyB":
        {
            resetGameBoard(resetModes.RESET_BLATNOY, currentGameSize, currentDomainSize);
            break;
        }
        case "KeyP":
        {
            resetGameBoard(resetModes.RESET_PIETIA, currentGameSize, currentDomainSize);
            break;
        }
        case "KeyF":
        {
            resetGameBoard(resetModes.RESET_FULL_RANDOM, currentGameSize, currentDomainSize);
            break;
        }
        case "KeyR":
        {
            if(e.shiftKey)
            {
                enableDefaultClickRule();
            }
            else
            {
                resetGameBoard(resetModes.RESET_SOLVABLE_RANDOM, currentGameSize, currentDomainSize);
            }
            break;
        }
        case "KeyI":
        {
            resetGameBoard(resetModes.RESET_INVERTO, currentGameSize, currentDomainSize);
            break;
        }
        case "KeyE":
        {
            resetGameBoard(resetModes.RESET_SOLUTION, currentGameSize, currentDomainSize);
            break;
        }
        case "KeyQ":
        {
            updateSolutionMatrixIfNeeded();
            break;
        }
        case "ArrowLeft":
        {
            resetGameBoard(resetModes.RESET_LEFT, currentGameSize, currentDomainSize);
            break;
        }
        case "ArrowRight":
        {
            resetGameBoard(resetModes.RESET_RIGHT, currentGameSize, currentDomainSize);
            break;
        }
        case "ArrowUp":
        {
            resetGameBoard(resetModes.RESET_UP, currentGameSize, currentDomainSize);
            break;
        }
        case "ArrowDown":
        {
            resetGameBoard(resetModes.RESET_DOWN, currentGameSize, currentDomainSize);
            break;
        }
        case "KeyW":
        {
            showInverseSolution(!flagShowInverseSolution);
            break;
        }
        case "KeyT":
        {
            if(e.shiftKey)
            {
                enableDefaultToroidClickRule();
            }
            else
            {
                updateSolutionMatrixIfNeeded();
                showSolution(!flagShowSolution);
            }
            break;
        }
        case "KeyA":
        {
            if(e.shiftKey)
            {
                showLitStability(!flagShowLitStability && !flagShowStability);
            }
            else
            {
                showStability(!flagShowLitStability && !flagShowStability);
            }
            break;
        }
        case "KeyS":
        {
            if(currentTurnList.length == 0)
            {
                updateSolutionMatrixIfNeeded();
                currentGameSolution = calculateSolution();
                updateSolutionTexture();

                currentTurnList = buildTurnList(currentGameSolution, currentGameSize);

                flagRandomSolving = true;

                flagTickLoop = true;
                window.requestAnimationFrame(nextTick);
            }
            else
            {
                currentTurnList.length = 0;
                flagTickLoop = false;
            }

            break;
        }
        case "KeyC":
        {
            if(currentTurnList.length == 0)
            {
                updateSolutionMatrixIfNeeded();
                currentGameSolution = calculateSolution();
                updateSolutionTexture();

                currentTurnList = buildTurnList(currentGameSolution, currentGameSize);

                flagRandomSolving = false;

                flagTickLoop = true;
                window.requestAnimationFrame(nextTick);
            }
            else
            {
                currentTurnList.length = 0;
                flagTickLoop = false;
            }

            break;
        }
        default:
        {
            break;
        }
        }
    };

    renderModeSelect.onchange = function()
    {
        switch(renderModeSelect.value)
        {
        case "Circles":
        {
            setRenderMode(renderModes.RENDER_CIRCLES);
            break;
        }
        case "Raindrops":
        {
            setRenderMode(renderModes.RENDER_RAIDROPS);
            break;   
        }
        default:
        {
            setRenderMode(renderModes.RENDER_SQUARES);
            break;
        }
        }
    };

    let boardGenModes =
    {
        BOARDGEN_FULL_RANDOM:  1, //Generate a random board
        BOARDGEN_ZERO_ELEMENT: 2, //Generate a fully unlit board
        BOARDGEN_ONE_ELEMENT:  3, //Generate a fully lit board
        BOARDGEN_BLATNOY:      4, //Generate a chessboard pattern board
        BOARDGEN_PIETIA_STYLE: 5, //Generate a checkers pattern board
        BOARDGEN_BORDER:       6  //Generate a border board
    };

    let resetModes =
    {
        RESET_ONE:                    1, //Fully lit board
        RESET_ZERO:                   2, //Fully unlit board
        RESET_BORDER:                 3, //Border board
        RESET_PIETIA:                 4, //Checkers board
        RESET_BLATNOY:                5, //Chessboard board
        RESET_SOLVABLE_RANDOM:        6, //Random board, always solvable
        RESET_FULL_RANDOM:            7, //Random board
        RESET_SOLUTION:               8, //Current board -> Current solution/Current stability
        RESET_INVERTO:                9, //Current board -> Inverted current board
        RESET_DOMAIN_ROTATE_NONZERO: 10, //Current board -> Nonzero domain rotated current board
        RESET_LEFT:                  11, //Current board -> Current board moved left
        RESET_RIGHT:                 12, //Current board -> Current board moved right
        RESET_UP:                    13, //Current board -> Current board moved up
        RESET_DOWN:                  14  //Current board -> Current board moved down
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
        COUNT_SOLUTION_PERIOD_4X:      4
    };

    let renderModes =
    {
        RENDER_SQUARES:  1,
        RENDER_CIRCLES:  2,
        RENDER_DIAMONDS: 3,
        RENDER_BEAMS:    4,
        RENDER_RAIDROPS: 5,
        RENDER_CHAINS:   6
    };

    const minimumBoardSize = 1;
    const maximumBoardSize = 256;

    const minimumDomainSize = 2;
    const maximumDomainSize = 255;

    const canvasSize = 900;

    let standardWidth  = canvas.clientWidth;
    let standardHeight = canvas.clientHeight;

    let flagSolutionMatrixComputing = false;
    let flagRandomSolving           = false;
    let flagShowSolution            = false;
    let flagShowInverseSolution     = false;
    let flagShowStability           = false;
    let flagShowLitStability        = false;
    //let flagPeriodCounting          = false; //TODO check
    //let flagEigvecCounting          = false; //TODO check
    //let flagPerio4Counting          = false; //TODO check
    //let flagPeriodBackCounting      = false; //TODO check
    let flagDisplayPeriodCount      = false;
    let flagToroidBoard             = false;
    let flagTickLoop                = false;
    let flagDefaultClickRule        = false;

    let currentGameClickRule    = null;
    let currentGameBoard        = null;
    let currentGameSolution     = null;
    let currentGameStability    = null;
    let currentGameLitStability = null;

    let currentCellSize = 20;

    let currentClickRuleSize = 3;
    let currentGameSize      = 15;
    let currentDomainSize    = 2;

    let currentColorLit     = [0.0, 1.0, 0.0, 1.0];
    let currentColorUnlit   = [0.0, 0.0, 0.0, 1.0];
    let currentColorSolved  = [0.0, 0.0, 1.0, 1.0];
    let currentColorBetween = [0.0, 0.0, 0.0, 1.0];

    let currentWorkingMode  = workingModes.LIT_BOARD;

    let currentSolutionMatrix = [];

    let currentSolutionMatrixRelevant = false;

    let currentQuietPatterns = 0;

    let currentTurnList = [];

    //TODO check
    //let eigvecTurnX = -1;
    //let eigvecTurnY = -1;

    let currentPeriodCount = 0;

    let currentShaderProgram = null;

    let squaresShaderProgram   = null;
    let circlesShaderProgram   = null;
    let raindropsShaderProgram = null;

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

    enableDefaultClickRule();

    createTextures();
    createShaders();

    setRenderMode(renderModes.RENDER_SQUARES);

    changeGameSize(15);
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

        changeCountingMode(countingModes.COUNT_NONE, false);
        currentTurnList.length = 0;
        flagRandomSolving = false;

        //eigvecTurnX = -1;
        //eigvecTurnY = -1;

        currentGameSize = clamp(newSize, minimumBoardSize, maximumBoardSize);
        currentSolutionMatrixRelevant = false;
        flagSolutionMatrixComputing   = false;

        qpText.textContent = "Quiet patterns: ";

        if(currentWorkingMode === workingModes.LIT_BOARD)
        {
            resetGameBoard(resetModes.RESET_SOLVABLE_RANDOM, currentGameSize, currentDomainSize);
            infoText.textContent = "Lights Out " + currentGameSize + "x" + currentGameSize + " DOMAIN " + currentDomainSize;
        }
        else
        {
            currentGameBoard = generateNewBoard(currentGameSize, currentDomainSize, boardGenModes.BOARDGEN_ZERO_ELEMENT);

            resetStability();
            updateStabilityTexture();

            makeTurn(currentGameBoard, currentGameClickRule, currentClickRuleSize, currentGameSize, currentDomainSize, Math.floor(currentGameSize / 2), Math.floor(currentGameSize / 2), false);
            infoText.textContent = "Lights Out constructing " + currentGameSize + "x" + currentGameSize + " DOMAIN " + currentDomainSize;
        }

        currentCellSize = Math.ceil(canvasSize / currentGameSize) - 1;
        standardWidth  = currentGameSize * currentCellSize + 1;
        standardHeight = currentGameSize * currentCellSize + 1;

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

        changeCountingMode(countingModes.COUNT_NONE, false);
        currentTurnList.length = 0;
        flagRandomSolving = false;

        //TODO
        //eigvecTurnX = -1;
        //eigvecTurnY = -1;

        currentDomainSize = clamp(newSize, minimumDomainSize, maximumDomainSize);
        currentSolutionMatrixRelevant = false;
        flagSolutionMatrixComputing   = false;

        resetGameBoard(resetModes.RESET_SOLVABLE_RANDOM, currentGameSize, currentDomainSize);
        enableDefaultClickRule();

        infoText.textContent = "Lights Out  " + currentGameSize + "x" + currentGameSize + " DOMAIN " + currentDomainSize;
        updateBoardTexture();
    }

    function clickAtPoint(x, y, isConstruct)
    {
        if(x > standardWidth || y > standardHeight)
        {
            return;
        }

        let stepX = Math.floor((standardWidth  + 1) / currentGameSize);
        let stepY = Math.floor((standardHeight + 1) / currentGameSize);

        let modX = Math.floor(x / stepX);
        let modY = Math.floor(y / stepY);

        if(currentWorkingMode === workingModes.LIT_BOARD)
        {
            if(isConstruct)
            {
                currentGameBoard = makeConstructTurn(currentGameBoard, currentGameSize, currentDomainSize, modX, modY);
            }
            else
            {
                currentGameBoard = makeTurn(currentGameBoard, currentGameClickRule, currentClickRuleSize, currentGameSize, currentDomainSize, modX, modY, flagToroidBoard);
            }
        }
        else if(currentWorkingMode === workingModes.CONSTRUCT_CLICKRULE || currentWorkingMode === workingModes.CONSTRUCT_CLICKRULE_TOROID)
        {
            currentGameBoard = makeConstructTurn(currentGameBoard, currentGameSize, currentDomainSize, modX, modY);
        }

        resetStability();

        if(flagShowSolution)
        {
            currentGameSolution = calculateSolution();
            updateSolutionTexture();
        }
        else if(flagShowInverseSolution)
        {
            currentGameSolution = calculateInverseSolution();
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
        let clickRuleValues = [0, 1, 0, //eslint-disable-next-line indent
                               1, 1, 1, //eslint-disable-next-line indent
                               0, 1, 0];

        currentClickRuleSize = 3;
        currentGameClickRule = new Uint8Array(clickRuleValues);

        flagToroidBoard               = false;
        flagDefaultClickRule          = true;
        currentSolutionMatrixRelevant = false;
        flagSolutionMatrixComputing   = false;
    }

    function enableDefaultToroidClickRule()
    {   
        let clickRuleValues = [0, 1, 0, // eslint-disable-next-line indent
                               1, 1, 1, // eslint-disable-next-line indent
                               0, 1, 0];

        currentClickRuleSize = 3;
        currentGameClickRule = new Uint8Array(clickRuleValues);

        flagToroidBoard               = true;
        flagDefaultClickRule          = true;
        currentSolutionMatrixRelevant = false;
        flagSolutionMatrixComputing   = false;
    }

    function resetCountedBoard()
    {
        //TODO
    }

    function resetStability()
    {
        currentGameStability = new Uint8Array(currentGameSize * currentGameSize);
        currentGameStability.fill(currentDomainSize - 1);
    }

    function calculateGameMatrix(clickRule, gameSize, clickRuleSize, isToroid)
    {
        //Generate a normal Lights Out matrix for the click rule
        let lightsOutMatrix = [];
        for(let yL = 0; yL < gameSize; yL++)
        {
            for(let xL = 0; xL < gameSize; xL++)
            {
                let matrixRow;
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

    function calculateSolutionMatrix(clickRule, gameSize, domainSize, clickRuleSize, isToroid)
    {
        let lightsOutMatrix = calculateGameMatrix(clickRule, gameSize, clickRuleSize, isToroid);

        //Generate a unit matrix. This will eventually become an inverse matrix
        let invMatrix = [];
        for(let yI = 0; yI < currentGameSize; yI++)
        {
            for(let xI = 0; xI < currentGameSize; xI++)
            {
                if(!flagSolutionMatrixComputing)
                {
                    return {invmatrix: null, quietpats: null};
                }

                let invMatrixRow = new Uint8Array(gameSize * gameSize);
                invMatrixRow.fill(0);

                let cellIndex = cellIndexFromPoint(gameSize, xI, yI);
                invMatrixRow[cellIndex] = 1;

                invMatrix.push(invMatrixRow);
            }
        }

        let domainInvs = []; //For optimization, cache 1/k numbers in the domain
        for(let d = 0; d < domainSize; d++)
        {
            domainInvs.push(invModGcdEx(d, domainSize));
        }
        
        let matrixSize = gameSize * gameSize;
        for(let iD = 0; iD < matrixSize; iD++)
        {
            if(!flagSolutionMatrixComputing)
            {
                return {invmatrix: null, quietpats: null};
            }

            let thisValD = lightsOutMatrix[iD][iD];
            let compValD = lightsOutMatrix[iD][iD];
            if(domainInvs[compValD] === 0 || (thisValD !== 1 && domainSize % thisValD === 0))
            {
                for(let jSw = iD + 1; jSw < matrixSize; jSw++)
                {
                    if(!flagSolutionMatrixComputing)
                    {
                        return {invmatrix: null, quietpats: null};
                    }

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
                if(!flagSolutionMatrixComputing)
                {
                    return {invmatrix: null, quietpats: null};
                }

                compValD = lightsOutMatrix[jD][iD];
                if(domainInvs[compValD] !== 0)
                {
                    lightsOutMatrix[jD] = mulSubBoard(lightsOutMatrix[jD], lightsOutMatrix[iD], invThisValD * compValD, domainSize);
                    invMatrix[jD]       = mulSubBoard(invMatrix[jD],       invMatrix[iD],       invThisValD * compValD, domainSize);
                }
            }
        }

        let quietPatterns = 0;
        for(let iU = matrixSize - 1; iU >= 0; iU--)
        {
            let thisValU    = lightsOutMatrix[iU][iU];
            let invThisValU = domainInvs[thisValU];

            for(let jU = iU - 1; jU >= 0; jU--)
            {
                if(!flagSolutionMatrixComputing)
                {
                    return {invmatrix: null, quietpats: null};
                }

                let compValU = lightsOutMatrix[jU][iU];
                if(domainInvs[compValU] !== 0)
                {
                    lightsOutMatrix[jU] = mulSubBoard(lightsOutMatrix[jU], lightsOutMatrix[iU], invThisValU * compValU, domainSize);
                    invMatrix[jU]       = mulSubBoard(invMatrix[jU],       invMatrix[iU],       invThisValU * compValU, domainSize);
                }
            }

            if(domainInvs[thisValU] !== 0)
            {
                lightsOutMatrix[iU] = mulBoard(lightsOutMatrix[iU], invThisValU, domainSize);
                invMatrix[iU]       = mulBoard(invMatrix[iU],       invThisValU, domainSize);
            }

            if(lightsOutMatrix[iU].every(val => val === 0))
            {
                quietPatterns += 1;
            }
        }

        for(let i = 0; i < matrixSize; i++) //Transpose for the case of non-symmetrical click rules
        {
            for(let j = 0; j < i; j++)
            {
                if(!flagSolutionMatrixComputing)
                {
                    return {invmatrix: null, quietpats: null};
                }

                let temp        = invMatrix[i][j];
                invMatrix[i][j] = invMatrix[j][i];
                invMatrix[j][i] = temp;
            }
        }

        return {invmatrix: invMatrix, quietpats: quietPatterns};
    }

    function calculateSolution()
    {
        let solution = new Uint8Array(currentGameSize * currentGameSize);

        for(let y = 0; y < currentGameSize; y++)
        {
            for (let x = 0; x < currentGameSize; x++)
            {
                let cellIndex = cellIndexFromPoint(currentGameSize, x, y);
                let matrixRow = currentSolutionMatrix[cellIndex];

                solution[cellIndex] = dotProductBoard(currentGameBoard, matrixRow, currentDomainSize);
            }
        }

        solution = domainInverseBoard(solution, currentDomainSize);
        return solution;
    }

    function calculateInverseSolution() //Operates on currentGameBoard
    {
        let invSolution = new Uint8Array(currentGameSize * currentGameSize);
        invSolution.fill(0);

        let turns = buildTurnList(currentGameBoard, currentGameSize);
        if(flagDefaultClickRule)
        {
            invSolution = makeTurnsDefault(invSolution, currentGameSize, currentDomainSize, turns, flagToroidBoard);
        }
        else
        {
            invSolution = makeTurns(invSolution, currentGameClickRule, currentClickRuleSize, currentGameSize, currentDomainSize, turns, flagToroidBoard);
        }

        return invSolution;
    }

    async function updateSolutionMatrixIfNeeded()
    {
        if(!currentSolutionMatrixRelevant)
        {
            flagSolutionMatrixComputing = true;

            let solutionMatrixRes = calculateSolutionMatrix(currentGameClickRule, currentGameSize, currentDomainSize, currentClickRuleSize, flagToroidBoard);
            currentSolutionMatrix = solutionMatrixRes.invmatrix;
            currentQuietPatterns  = solutionMatrixRes.quietpats;

            qpText.textContent = "Quiet patterns: " + currentQuietPatterns;

            currentSolutionMatrixRelevant = true;
            flagSolutionMatrixComputing   = false;
        }
    }

    function calculateNewStabilityValue(boardToCompare)
    {
        return incDifBoard(currentGameStability, currentGameBoard, boardToCompare, currentDomainSize);
    }

    function calculateLitStability()
    {
        return addBoard(currentGameStability, currentGameBoard, currentDomainSize);
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
                currentGameSolution = calculateSolution();
                updateSolutionTexture();
            }
            else if(flagShowInverseSolution)
            {
                currentGameSolution = calculateInverseSolution();
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
                currentGameBoard = inverseBoard(currentGameBoard, currentDomainSize);
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
                currentGameSolution = calculateSolution();
                updateSolutionTexture();
            }
            else if(flagShowInverseSolution)
            {
                currentGameSolution = calculateInverseSolution();
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
            currentGameBoard = calculateInverseSolution();

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
                }
            }
        }

        return generatedBoard;
    }

    function changeCountingMode(newCountingMode, stopWhenReturned)
    {
        if(currentWorkingMode !== workingModes.LIT_BOARD)
        {
            return;
        }

        //flagPeriodCounting     = false;
        //flagPeriodBackCounting = false;
        //flagPerio4Counting     = false;
        flagDisplayPeriodCount = false;

        showSolution(false);
        showInverseSolution(false);

        currentTurnList.length = 0;
        flagRandomSolving = false;

        switch(newCountingMode)
        {
        case countingModes.COUNT_NONE:
        {
            if(flagDisplayPeriodCount && currentPeriodCount !== 0)
            {
                alert("Solution period so far is " + currentPeriodCount);
            }
            break;
        }
        case countingModes.COUNT_SOLUTION_PERIOD:
        {
            //flagPeriodCounting = true;
            break;
        }
        case countingModes.COUNT_SOLUTION_PERIOD_4X:
        {
            //flagPerio4Counting = true;
            break;
        }
        case countingModes.COUNT_INVERSE_SOLUTION_PERIOD:
        {
            //flagPeriodBackCounting = true;
            break;
        }
        }

        currentPeriodCount     = 0;
        flagDisplayPeriodCount = stopWhenReturned;

        resetCountedBoard();
    }

    function buildTurnList(board, gameSize)
    {
        let turnList = [];

        for(let y = 0; y < gameSize; y++)
        {
            for(let x = 0; x < gameSize; x++)
            {
                let cellIndex = cellIndexFromPoint(gameSize, x, y);
                for(let i = 0; i < board[cellIndex]; i++)
                {
                    turnList.push({cellX: x, cellY: y});
                }
            }
        }

        return turnList.reverse(); //Turn lists are oriented bottom-up
    }

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

    function makeConstructTurn(board, gameSize, domainSize, cellX, cellY)
    {
        let resBoard = new Uint8Array(board);

        let cellIndex = cellIndexFromPoint(gameSize, cellX, cellY);
        resBoard[cellIndex] = (board[cellIndex] + 1) % domainSize;

        return resBoard;
    }

    function makeTurns(board, clickRule, clickRuleSize, gameSize, domainSize, turns, isToroid) //Fast in-place version without populating click rules
    {
        let newBoard = board.slice();

        let clickSizeHalf = Math.floor(clickRuleSize / 2);
        for(let t = 0; t < turns.length; t++)
        {
            let left = turns[t].cellX - clickSizeHalf;
            let top  = turns[t].cellY - clickSizeHalf;

            for(let y = 0; y < clickRuleSize; y++)
            {
                let yBig = y + top;
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

                for(let x = 0; x < clickRuleSize; x++)
                {
                    let xBig = x + left;
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

                    let bigClickIndex = cellIndexFromPoint(gameSize, xBig, yBig);
                    let smlClickIndex = cellIndexFromPoint(clickRuleSize, x, y);

                    newBoard[bigClickIndex] = (newBoard[bigClickIndex] + clickRule[smlClickIndex]) % domainSize;
                }
            }
        }

        return newBoard;
    }

    function makeTurnsDefault(board, gameSize, domainSize, turns, isToroid) //Fast in-place version without populating click rules. Default click rule version
    {
        let newBoard = board.slice();

        if(isToroid)
        {
            for(let t = 0; t < turns.length; t++)
            {
                let turn = turns[t];

                let leftX   = wholeMod(turn.cellX - 1, gameSize);
                let rightX  = wholeMod(turn.cellX + 1, gameSize);
                let topY    = wholeMod(turn.cellY - 1, gameSize);
                let bottomY = wholeMod(turn.cellY + 1, gameSize);

                let thisCellIndex   = cellIndexFromPoint(gameSize, turn.cellX, turn.cellY);
                let leftCellIndex   = cellIndexFromPoint(gameSize,      leftX, turn.cellY);
                let rightCellIndex  = cellIndexFromPoint(gameSize,     rightX, turn.cellY);
                let topCellIndex    = cellIndexFromPoint(gameSize, turn.cellX,       topY);
                let bottomCellIndex = cellIndexFromPoint(gameSize, turn.cellX,    bottomY);

                newBoard[thisCellIndex]   = (newBoard[thisCellIndex]   + 1) % domainSize;
                newBoard[leftCellIndex]   = (newBoard[leftCellIndex]   + 1) % domainSize;
                newBoard[rightCellIndex]  = (newBoard[rightCellIndex]  + 1) % domainSize;
                newBoard[topCellIndex]    = (newBoard[topCellIndex]    + 1) % domainSize;
                newBoard[bottomCellIndex] = (newBoard[bottomCellIndex] + 1) % domainSize;
            }
        }
        else
        {
            for(let t = 0; t < turns.length; t++)
            {
                let turn = turns[t];

                let thisCellIndex       = cellIndexFromPoint(gameSize, turn.cellX, turn.cellY);
                newBoard[thisCellIndex] = (newBoard[thisCellIndex] + 1) % domainSize;

                if(turn.cellX > 0)
                {
                    let leftCellIndex       = cellIndexFromPoint(gameSize, turn.cellX - 1, turn.cellY);
                    newBoard[leftCellIndex] = (newBoard[leftCellIndex] + 1) % domainSize;
                }

                if(turn.cellX < gameSize - 1)
                {
                    let rightCellIndex       = cellIndexFromPoint(gameSize, turn.cellX + 1, turn.cellY);
                    newBoard[rightCellIndex] = (newBoard[rightCellIndex] + 1) % domainSize;
                }

                if(turn.cellY > 0)
                {
                    let topCellIndex       = cellIndexFromPoint(gameSize, turn.cellX, turn.cellY - 1);
                    newBoard[topCellIndex] = (newBoard[topCellIndex] + 1) % domainSize;
                }

                if(turn.cellY < gameSize - 1)
                {
                    let bottomCellIndex       = cellIndexFromPoint(gameSize, turn.cellX, turn.cellY + 1);
                    newBoard[bottomCellIndex] = (newBoard[bottomCellIndex] + 1) % domainSize;
                }
            }
        }

        return newBoard;
    }

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

                let bigClickIndex = cellIndexFromPoint(gameSize, xBig, yBig);
                let smlClickIndex = cellIndexFromPoint(clickRuleSize, x, y);

                populatedClickRule[bigClickIndex] = clickRule[smlClickIndex];
            }
        }

        return populatedClickRule;
    }

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

                let bigClickIndex = cellIndexFromPoint(gameSize, xBigMod, yBigMod);
                let smlClickIndex = cellIndexFromPoint(clickRuleSize, x, y);

                populatedClickRule[bigClickIndex] = clickRule[smlClickIndex];
            }
        }

        return populatedClickRule;
    }

    function moveBoardLeft(board, gameSize)
    {
        let resBoard = new Uint8Array(board.length);
        for(let y = 0; y < gameSize; y++)
        {
            for (let x = 0; x < gameSize; x++)
            {
                let leftX = wholeMod(x - 1, gameSize);

                let cellIndex     = cellIndexFromPoint(gameSize, x,     y);
                let cellIndexLeft = cellIndexFromPoint(gameSize, leftX, y);

                resBoard[cellIndexLeft] = board[cellIndex];
            }
        }
        
        return resBoard;
    }

    function moveBoardRight(board, gameSize)
    {
        let resBoard = new Uint8Array(board.length);
        for(let y = 0; y < gameSize; y++)
        {
            for (let x = 0; x < gameSize; x++)
            {
                let rightX = wholeMod(x + 1, gameSize);

                let cellIndex      = cellIndexFromPoint(gameSize, x,      y);
                let cellIndexRight = cellIndexFromPoint(gameSize, rightX, y);

                resBoard[cellIndexRight] = board[cellIndex];
            }
        }
        
        return resBoard;
    }

    function moveBoardUp(board, gameSize)
    {
        let resBoard = new Uint8Array(board.length);
        for(let y = 0; y < gameSize; y++)
        {
            for (let x = 0; x < gameSize; x++)
            {
                let upY = wholeMod(y - 1, gameSize);

                let cellIndex   = cellIndexFromPoint(gameSize, x, y  );
                let cellIndexUp = cellIndexFromPoint(gameSize, x, upY);

                resBoard[cellIndexUp] = board[cellIndex];
            }
        }
        
        return resBoard;
    }

    function moveBoardDown(board, gameSize)
    {
        let resBoard = new Uint8Array(board.length);
        for(let y = 0; y < gameSize; y++)
        {
            for (let x = 0; x < gameSize; x++)
            {
                let downY = wholeMod(y + 1, gameSize);

                let cellIndex     = cellIndexFromPoint(gameSize, x, y    );
                let cellIndexDown = cellIndexFromPoint(gameSize, x, downY);

                resBoard[cellIndexDown] = board[cellIndex];
            }
        }
        
        return resBoard;
    }

    function inverseBoard(board, domainSize)
    {
        let resBoard = new Uint8Array(board.length);
        for(let i = 0; i < board.length; i++)
        {
            resBoard[i] = (board[i] + 1) % domainSize;
        }

        return resBoard;
    }

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

    function domainRotateNonZeroBoard(board, domainSize)
    {
        if(domainSize === 2)
        {
            return board;
        }

        let resBoard = new Uint8Array(board.length);
        for(let i = 0; i < board.length; i++)
        {
            let boardValue = board[i];
            if(boardValue > 0)
            {
                boardValue = (domainSize - boardValue) % domainSize;
            }

            resBoard[i] = boardValue;
        }

        return resBoard;
    }

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

    function mulBoard(board, mulValue, domainSize)
    {
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

            currentGameSolution = calculateSolution();
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

            currentGameSolution = calculateInverseSolution();
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
        switch(renderMode)
        {
        case renderModes.RENDER_SQUARES:
        {
            currentShaderProgram = squaresShaderProgram;
            break;
        }
        case renderModes.RENDER_CIRCLES:
        {
            currentShaderProgram = circlesShaderProgram;
            break;
        }
        case renderModes.RENDER_RAIDROPS:
        {
            currentShaderProgram = raindropsShaderProgram;
            break;
        }
        default:
        {
            break;
        }
        }

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

    function updateViewport()
    {
        gl.viewport(0, canvas.clientHeight - standardHeight, standardWidth, standardHeight); //Very careful here. 
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

        requestRedraw();
        
        if(flagTickLoop)
        {
            window.requestAnimationFrame(nextTick);
        }
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

            if((screenPos.x % gCellSize != 0) && (screenPos.y % gCellSize != 0)) //Inside the cell
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

        ivec2 XX(int x) //Simulating HLSL's .xx
        {
            return ivec2(x, x);
        }

        void main(void)
        {
            ivec2 screenPos = ivec2(int(gl_FragCoord.x) - gViewportOffsetX, gImageHeight - int(gl_FragCoord.y) - 1 + gViewportOffsetY);

            if((screenPos.x % gCellSize != 0) && (screenPos.y % gCellSize != 0)) //Inside the cell
            {
                highp ivec2 cellNumber = screenPos / XX(gCellSize);

                uint          cellValue = texelFetch(gBoard, cellNumber, 0).x;
                mediump float cellPower = float(cellValue) / float(gDomainSize - 1);

                mediump vec2  cellCoord    = (vec2(screenPos) - vec2(cellNumber * gCellSize) - vec2(XX(gCellSize)) / 2.0f);
                mediump float circleRadius = float(gCellSize - 1) / 2.0f;
                
                ivec2 leftCell   = cellNumber + ivec2(-1,  0);
                ivec2 rightCell  = cellNumber + ivec2( 1,  0);
                ivec2 topCell    = cellNumber + ivec2( 0, -1);
                ivec2 bottomCell = cellNumber + ivec2( 0,  1);
        
                bool insideCircle = (dot(cellCoord, cellCoord) < circleRadius * circleRadius);
        
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
        
                    uvec2 leftCellU   = uvec2(leftCell)   + uvec2(XX(gBoardSize)) * maxCheckDistance;
                    uvec2 rightCellU  = uvec2(rightCell)  + uvec2(XX(gBoardSize)) * maxCheckDistance;
                    uvec2 topCellU    = uvec2(topCell)    + uvec2(XX(gBoardSize)) * maxCheckDistance;
                    uvec2 bottomCellU = uvec2(bottomCell) + uvec2(XX(gBoardSize)) * maxCheckDistance;
        
                    leftCell   = ivec2(leftCellU   % uvec2(XX(gBoardSize)));
                    rightCell  = ivec2(rightCellU  % uvec2(XX(gBoardSize)));
                    topCell    = ivec2(topCellU    % uvec2(XX(gBoardSize)));
                    bottomCell = ivec2(bottomCellU % uvec2(XX(gBoardSize)));
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

        //https://lightstrout.com/blog/2019/05/21/raindrops-render-mode/
        const raindropsFsSource = 
        `#version 300 es

        #define FLAG_SHOW_SOLUTION  0x01
        #define FLAG_SHOW_STABILITY 0x02
        #define FLAG_TOROID_RENDER  0x04

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

        ivec2 XX(int x) //Simulating HLSL's .xx
        {
            return ivec2(x, x);
        }

        uvec4 XXXX(uint x) //Simulating HLSL's .xxxx
        {
            return uvec4(x, x, x, x);
        }
    
        uvec4 XYZW(uvec4 v) //For uniformity
        {
            return v.xyzw;
        }

        uvec4 YZWX(uvec4 v) //For uniformity
        {
            return v.yzwx;
        }

        bvec4 b4eq(uvec4 a, uvec4 b) //Another thing that doesn't require writing functions in hlsl
        {
            return bvec4(a.x == b.x, a.y == b.y, a.z == b.z, a.w == b.w);
        }

        bvec4 b4or(bvec4 a, bvec4 b) //Yet another thing that doesn't require writing functions in hlsl
        {
            return bvec4(a.x || b.x, a.y || b.y, a.z || b.z, a.w || b.w);
        }

        bvec4 emptyCornerRule(uvec4 edgeValue)
        {
            return b4eq(XYZW(edgeValue), YZWX(edgeValue));
        }

        bvec4 cornerRule(uint cellValue, uvec4 edgeValue, uvec4 cornerValue)
        {
            bvec4 res = bvec4(false, false, false, false);
            
            res = b4or(res, b4eq(XXXX(cellValue), XYZW(cornerValue)));
            res = b4or(res, b4eq(XXXX(cellValue), XYZW(edgeValue)));
            res = b4or(res, b4eq(XXXX(cellValue), YZWX(edgeValue)));

            return res;
        }

        void main(void)
        {
            ivec2 screenPos = ivec2(int(gl_FragCoord.x) - gViewportOffsetX, gImageHeight - int(gl_FragCoord.y) - 1 + gViewportOffsetY);

            if((screenPos.x % gCellSize != 0) && (screenPos.y % gCellSize != 0)) //Inside the cell
            {
                highp ivec2 cellNumber = screenPos.xy / XX(gCellSize);
                uint        cellValue  = texelFetch(gBoard, cellNumber, 0).x;

                mediump vec2  cellCoord    = (vec2(screenPos.xy) - vec2(cellNumber * XX(gCellSize)) - vec2(XX(gCellSize)) / 2.0f);
                mediump float circleRadius = float(gCellSize - 1) / 2.0f;
                
                mediump float domainFactor = 1.0f / float(gDomainSize - 1);

                ivec2 leftCell        = cellNumber + ivec2(-1,  0);
                ivec2 rightCell       = cellNumber + ivec2( 1,  0);
                ivec2 topCell         = cellNumber + ivec2( 0, -1);
                ivec2 bottomCell      = cellNumber + ivec2( 0,  1);
                ivec2 leftTopCell     = cellNumber + ivec2(-1, -1);
                ivec2 rightTopCell    = cellNumber + ivec2( 1, -1);
                ivec2 leftBottomCell  = cellNumber + ivec2(-1,  1);
                ivec2 rightBottomCell = cellNumber + ivec2( 1,  1);
        
                bool insideCircle      = (dot(cellCoord, cellCoord) < circleRadius * circleRadius);
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

                    uvec2 leftCellU        = uvec2(leftCell)        + uvec2(XX(gBoardSize)) * maxCheckDistance;
                    uvec2 rightCellU       = uvec2(rightCell)       + uvec2(XX(gBoardSize)) * maxCheckDistance;
                    uvec2 topCellU         = uvec2(topCell)         + uvec2(XX(gBoardSize)) * maxCheckDistance;
                    uvec2 bottomCellU      = uvec2(bottomCell)      + uvec2(XX(gBoardSize)) * maxCheckDistance;
                    uvec2 leftTopCellU     = uvec2(leftTopCell)     + uvec2(XX(gBoardSize)) * maxCheckDistance;
                    uvec2 rightTopCellU    = uvec2(rightTopCell)    + uvec2(XX(gBoardSize)) * maxCheckDistance;
                    uvec2 leftBottomCellU  = uvec2(leftBottomCell)  + uvec2(XX(gBoardSize)) * maxCheckDistance;
                    uvec2 rightBottomCellU = uvec2(rightBottomCell) + uvec2(XX(gBoardSize)) * maxCheckDistance;

                    leftCell        = ivec2(leftCellU        % uvec2(XX(gBoardSize)));
                    rightCell       = ivec2(rightCellU       % uvec2(XX(gBoardSize)));
                    topCell         = ivec2(topCellU         % uvec2(XX(gBoardSize)));
                    bottomCell      = ivec2(bottomCellU      % uvec2(XX(gBoardSize)));
                    leftTopCell     = ivec2(leftTopCellU     % uvec2(XX(gBoardSize)));
                    rightTopCell    = ivec2(rightTopCellU    % uvec2(XX(gBoardSize)));
                    leftBottomCell  = ivec2(leftBottomCellU  % uvec2(XX(gBoardSize)));
                    rightBottomCell = ivec2(rightBottomCellU % uvec2(XX(gBoardSize)));
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

        let raindropsFS = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(raindropsFS, raindropsFsSource);
        gl.compileShader(raindropsFS);

        if(!gl.getShaderParameter(raindropsFS, gl.COMPILE_STATUS))
        {
            alert(gl.getShaderInfoLog(raindropsFS));
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

        raindropsShaderProgram = gl.createProgram();
        gl.attachShader(raindropsShaderProgram, defaultVS);
        gl.attachShader(raindropsShaderProgram, raindropsFS);
        gl.linkProgram(raindropsShaderProgram);

        if(!gl.getProgramParameter(raindropsShaderProgram, gl.LINK_STATUS))
        {
            alert(gl.getProgramInfoLog(raindropsShaderProgram));
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
        gl.clearColor(1.0, 1.0, 1.0, 0.0);
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

        gl.bindVertexArray(drawVertexBuffer);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(currentShaderProgram);

        gl.uniform1i(boardSizeUniformLocation,  currentGameSize);
        gl.uniform1i(cellSizeUniformLocation,   currentCellSize);
        gl.uniform1i(domainSizeUniformLocation, currentDomainSize);
        gl.uniform1i(flagsUniformLocation,      drawFlags);

        gl.uniform1i(canvasWidthUniformLocation,     standardWidth);
        gl.uniform1i(canvasHeightUniformLocation,    standardHeight);
        gl.uniform1i(viewportXOffsetUniformLocation, 0);
        gl.uniform1i(viewportYOffsetUniformLocation, canvas.clientHeight - standardHeight);

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
    }

    //=================================================== Util functions ===================================================\\
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

    function cellIndexFromPoint(gameSize, x, y)
    {
        return y * gameSize + x;
    }

    function invModGcdEx(num, domainSize) //Extended Euclid algorithm for inverting (num) modulo (domainSize)
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

    function wholeMod(num, domainSize)
    {
        return ((num % domainSize) + domainSize) % domainSize;
    }
}