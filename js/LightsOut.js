function main()
{
    const canvas = document.getElementById("LightsOutCanvas");
    
    const infoText = document.getElementById("LightsOutPuzzleInfo");
    const qpText   = document.getElementById("QuietPatternsInfo");

    const gl = canvas.getContext("webgl2");
    if (!gl)
    {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    canvas.onmousedown = function(e)
    {
        var x = e.pageX - canvas.offsetLeft;
        var y = e.pageY - canvas.offsetTop;

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

    var boardGenModes =
    {
        BOARDGEN_FULL_RANDOM:  1, //Generate a random board
        BOARDGEN_ZERO_ELEMENT: 2, //Generate a fully unlit board
        BOARDGEN_ONE_ELEMENT:  3, //Generate a fully lit board
        BOARDGEN_BLATNOY:      4, //Generate a chessboard pattern board
        BOARDGEN_PIETIA_STYLE: 5, //Generate a checkers pattern board
        BOARDGEN_BORDER:       6  //Generate a border board
    };

    var resetModes =
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

    var workingModes =
    {
        LIT_BOARD:                  1,
        CONSTRUCT_CLICKRULE:        2,
        CONSTRUCT_CLICKRULE_TOROID: 3
    };

    var countingModes =
    {
        COUNT_NONE:                    1,
        COUNT_SOLUTION_PERIOD:         2,
        COUNT_INVERSE_SOLUTION_PERIOD: 3,
        COUNT_SOLUTION_PERIOD_4X:      4
    };

    var renderModes =
    {
        RENDER_SQUARES: 1
    };

    const minimumBoardSize = 1;
    const maximumBoardSize = 256;

    const minimumDomainSize = 2;
    const maximumDomainSize = 255;

    const canvasSize = 900;

    var standardWidth  = canvas.clientWidth;
    var standardHeight = canvas.clientHeight;

    var flagRandomSolving       = false;
    var flagShowSolution        = false;
    var flagShowInverseSolution = false;
    var flagShowStability       = false;
    var flagShowLitStability    = false;
    var flagPeriodCounting      = false;
    var flagEigvecCounting      = false;
    var flagPerio4Counting      = false;
    var flagPeriodBackCounting  = false;
    var flagDisplayPeriodCount  = false;
    var flagToroidBoard         = false;
    var flagTickLoop            = false;
    var flagDefaultClickRule    = false;

    var currentGameClickRule    = null;
    var currentGameBoard        = null;
    var currentGameSolution     = null;
    var currentGameStability    = null;
    var currentGameLitStability = null;

    var currentCellSize = 20;

    var currentClickRuleSize = 3;
    var currentGameSize      = 15;
    var currentDomainSize    = 2;

    var currentColorLit     = [0.0, 1.0, 0.0, 1.0];
    var currentColorUnlit   = [0.0, 0.0, 0.0, 1.0];
    var currentColorSolved  = [0.0, 0.0, 1.0, 1.0];
    var currentColorBetween = [0.0, 0.0, 0.0, 1.0];

    var currentWorkingMode  = workingModes.LIT_BOARD;

    var currentSolutionMatrix = [];

    var currentSolutionMatrixRelevant = false;

    var currentQuietPatterns = 0;

    var currentTurnList = [];

    var eigvecTurnX = -1;
    var eigvecTurnY = -1;

    var currentPeriodCount = 0;

    var currentShaderProgram = null;

    var squaresShaderProgram = null;

    var boardTexture     = null;
    var solutionTexture  = null;
    var stabilityTexture = null;

    var boardTextureUniformLocation     = null;
    var solutionTextureUniformLocation  = null;
    var stabilityTextureUniformLocation = null;

    var boardSizeUniformLocation  = null;
    var cellSizeUniformLocation   = null;
    var domainSizeUniformLocation = null;
    var flagsUniformLocation      = null;

    var canvasWidthUniformLocation     = null;
    var canvasHeightUniformLocation    = null;
    var viewportXOffsetUniformLocation = null;
    var viewportYOffsetUniformLocation = null;

    var colorNoneUniformLocation    = null;
    var colorEnabledUniformLocation = null;
    var colorSolvedUniformLocation  = null;
    var colorBetweenUniformLocation = null;

    var drawVertexBuffer = null; //Still don't know about WebGL gl_VertexID support :/

    var drawVertexBufferAttribLocation = null;

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

        eigvecTurnX = -1;
        eigvecTurnY = -1;

        currentGameSize = clamp(newSize, minimumBoardSize, maximumBoardSize);
        currentSolutionMatrixRelevant = false;

        qpText.textContent = "Quiet patterns: "

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

        eigvecTurnX = -1;
        eigvecTurnY = -1;

        currentDomainSize = clamp(newSize, minimumDomainSize, maximumDomainSize);
        currentSolutionMatrixRelevant = false;

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

        var stepX = Math.floor((standardWidth  + 1) / currentGameSize);
        var stepY = Math.floor((standardHeight + 1) / currentGameSize);

        var modX = Math.floor(x / stepX);
        var modY = Math.floor(y / stepY);

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
        var clickRuleValues = [0, 1, 0,
                               1, 1, 1,
                               0, 1, 0];

        currentClickRuleSize = 3;
        currentGameClickRule = new Uint8Array(clickRuleValues);

        flagToroidBoard               = false;
        flagDefaultClickRule          = true;
        currentSolutionMatrixRelevant = false;
    }

    function enableDefaultToroidClickRule()
    {   
        var clickRuleValues = [0, 1, 0,
                               1, 1, 1,
                               0, 1, 0];

        currentClickRuleSize = 3;
        currentGameClickRule = new Uint8Array(clickRuleValues);

        flagToroidBoard               = true;
        flagDefaultClickRule          = true;
        currentSolutionMatrixRelevant = false;
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
        var lightsOutMatrix = [];
        for(var yL = 0; yL < gameSize; yL++)
        {
            for(var xL = 0; xL < gameSize; xL++)
            {
                var matrixRow;
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
        var lightsOutMatrix = calculateGameMatrix(clickRule, gameSize, clickRuleSize, isToroid);

        //Generate a unit matrix. This will eventually become an inverse matrix
        var invMatrix = [];
        for(var yI = 0; yI < currentGameSize; yI++)
        {
            for(var xI = 0; xI < currentGameSize; xI++)
            {
                var invMatrixRow = new Uint8Array(gameSize * gameSize);
                invMatrixRow.fill(0);

                var cellIndex = cellIndexFromPoint(gameSize, xI, yI);
                invMatrixRow[cellIndex] = 1;

                invMatrix.push(invMatrixRow);
            }
        }

        var domainInvs = []; //For optimisation, cache 1/k numbers in the domain
        for(var d = 0; d < domainSize; d++)
        {
            domainInvs.push(invModGcdEx(d, domainSize));
        }
        
        var matrixSize = gameSize * gameSize;
        for(var iD = 0; iD < matrixSize; iD++)
        {
            var thisValD = lightsOutMatrix[iD][iD];
            var compValD = lightsOutMatrix[iD][iD];
            if(domainInvs[compValD] === 0 || (thisValD !== 1 && domainSize % thisValD === 0))
            {
                for(var jSw = iD + 1; jSw < matrixSize; jSw++)
                {
                    compValD = lightsOutMatrix[jSw][iD];
                    if(domainInvs[compValD] !== 0)
                    {
                        thisValD = compValD;
                        
                        var tmpMatrixRow     = lightsOutMatrix[iD];
                        lightsOutMatrix[iD]  = lightsOutMatrix[jSw];
                        lightsOutMatrix[jSw] = tmpMatrixRow;

                        var tmpInvMatrixRow = invMatrix[iD];
                        invMatrix[iD]       = invMatrix[jSw];
                        invMatrix[jSw]      = tmpInvMatrixRow;

                        break;
                    }
                }
            }

            var invThisValD = domainInvs[thisValD];
            for(var jD = iD + 1; jD < matrixSize; jD++)
            {
                compValD = lightsOutMatrix[jD][iD];
                if(domainInvs[compValD] !== 0)
                {
                    lightsOutMatrix[jD] = mulSubBoard(lightsOutMatrix[jD], lightsOutMatrix[iD], invThisValD * compValD, domainSize);
                    invMatrix[jD]       = mulSubBoard(invMatrix[jD],       invMatrix[iD],       invThisValD * compValD, domainSize);
                }
            }
        }

        var quietPatterns = 0;
        for(var iU = matrixSize - 1; iU >= 0; iU--)
        {
            var thisValU    = lightsOutMatrix[iU][iU];
            var invThisValU = domainInvs[thisValU];

            for(var jU = iU - 1; jU >= 0; jU--)
            {
                var compValU = lightsOutMatrix[jU][iU];
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

        for(var i = 0; i < matrixSize; i++) //Transpose for the case of non-symmetrical click rules
        {
            for(var j = 0; j < i; j++)
            {
                var temp        = invMatrix[i][j];
                invMatrix[i][j] = invMatrix[j][i];
                invMatrix[j][i] = temp;
            }
        }

        return {invmatrix: invMatrix, quietpats: quietPatterns};
    }

    function calculateSolution()
    {
        var solution = new Uint8Array(currentGameSize * currentGameSize);

        for(var y = 0; y < currentGameSize; y++)
        {
            for (var x = 0; x < currentGameSize; x++)
            {
                var cellIndex = cellIndexFromPoint(currentGameSize, x, y);
                var matrixRow = currentSolutionMatrix[cellIndex];

                solution[cellIndex] = dotProductBoard(currentGameBoard, matrixRow, currentDomainSize);
            }
        }

        solution = domainInverseBoard(solution, currentDomainSize);
        return solution;
    }

    function calculateInverseSolution() //Operates on currentGameBoard
    {
        var invSolution = new Uint8Array(currentGameSize * currentGameSize);
        invSolution.fill(0);

        var turns = buildTurnList(currentGameBoard, currentGameSize);
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

    function updateSolutionMatrixIfNeeded()
    {
        if(!currentSolutionMatrixRelevant)
        {
            solutionMatrixRes     = calculateSolutionMatrix(currentGameClickRule, currentGameSize, currentDomainSize, currentClickRuleSize, flagToroidBoard);
            currentSolutionMatrix = solutionMatrixRes.invmatrix;
            currentQuietPatterns  = solutionMatrixRes.quietpats;

            qpText.textContent = "Quiet patterns: " + currentQuietPatterns;

            currentSolutionMatrixRelevant = true;
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

            var modeBgen = boardGenModes.BOARDGEN_ONE_ELEMENT;
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
        var generatedBoard = new Uint8Array(gameSize * gameSize);

        var minVal = 0;
        var maxVal = domainSize - 1;

        for(var y = 0; y < gameSize; y++) 
        {
            for(var x = 0; x < gameSize; x++)
            {
                var cellNumber = y * gameSize + x;

                switch (bgenMode)
                {
                case boardGenModes.BOARDGEN_FULL_RANDOM:
                {
                    var randomCellValue = minVal + Math.floor(Math.random() * (maxVal - minVal + 1));
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

        flagPeriodCounting     = false;
        flagPeriodBackCounting = false;
        flagPerio4Counting     = false;
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
            flagPeriodCounting = true;
            break;
        }
        case countingModes.COUNT_SOLUTION_PERIOD_4X:
        {
            flagPerio4Counting = true;
            break;
        }
        case countingModes.COUNT_INVERSE_SOLUTION_PERIOD:
        {
            flagPeriodBackCounting = true;
            break;
        }
        }

        currentPeriodCount     = 0;
        flagDisplayPeriodCount = stopWhenReturned;

        resetCountedBoard();
    }

    function buildTurnList(board, gameSize)
    {
        turnList = [];

        for(var y = 0; y < gameSize; y++)
        {
            for(var x = 0; x < gameSize; x++)
            {
                var cellIndex = cellIndexFromPoint(gameSize, x, y);
                for(var i = 0; i < board[cellIndex]; i++)
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
            var populatedClickRuleT = populateClickRuleToroid(clickRule, clickRuleSize, gameSize, cellX, cellY);
            return addBoard(board, populatedClickRuleT, domainSize);
        }
        else
        {
            var populatedClickRuleP = populateClickRulePlane(clickRule, clickRuleSize, gameSize, cellX, cellY);
            return addBoard(board, populatedClickRuleP, domainSize);
        }
    }

    function makeConstructTurn(board, gameSize, domainSize, cellX, cellY)
    {
        var resBoard = new Uint8Array(board);

        var cellIndex = cellIndexFromPoint(gameSize, cellX, cellY);
        resBoard[cellIndex] = (board[cellIndex] + 1) % domainSize;

        return resBoard;
    }

    function makeTurns(board, clickRule, clickRuleSize, gameSize, domainSize, turns, isToroid) //Fast in-place version without populating click rules
    {
        var newBoard = board.slice();

        var clickSizeHalf = Math.floor(clickRuleSize / 2);
        for(var t = 0; t < turns.length; t++)
        {
            var left = turns[t].cellX - clickSizeHalf;
            var top  = turns[t].cellY - clickSizeHalf;

            for(var y = 0; y < clickRuleSize; y++)
            {
                var yBig = y + top;
                if(!isToroid)
                {
                    if(yBig < 0 || yBig >= gameSize)
                    {
                        continue;
                    }
                }
                else
                {
                    yBig = wholeMod(yBig, gameSize)
                }

                for(var x = 0; x < clickRuleSize; x++)
                {
                    var xBig = x + left;
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

                    var bigClickIndex = cellIndexFromPoint(gameSize, xBig, yBig);
                    var smlClickIndex = cellIndexFromPoint(clickRuleSize, x, y);

                    newBoard[bigClickIndex] = (newBoard[bigClickIndex] + clickRule[smlClickIndex]) % domainSize;
                }
            }
        }

        return newBoard;
    }

    function makeTurnsDefault(board, gameSize, domainSize, turns, isToroid) //Fast in-place version without populating click rules. Default click rule version
    {
        var newBoard = board.slice();

        if(isToroid)
        {
            for(var t = 0; t < turns.length; t++)
            {
                var turn = turns[t];

                var leftX   = wholeMod(turn.cellX - 1, gameSize);
                var rightX  = wholeMod(turn.cellX + 1, gameSize);
                var topY    = wholeMod(turn.cellY - 1, gameSize);
                var bottomY = wholeMod(turn.cellY + 1, gameSize);

                var thisCellIndex   = cellIndexFromPoint(gameSize, turn.cellX, turn.cellY);
                var leftCellIndex   = cellIndexFromPoint(gameSize,      leftX, turn.cellY);
                var rightCellIndex  = cellIndexFromPoint(gameSize,     rightX, turn.cellY);
                var topCellIndex    = cellIndexFromPoint(gameSize, turn.cellX,       topY);
                var bottomCellIndex = cellIndexFromPoint(gameSize, turn.cellX,    bottomY);

                newBoard[thisCellIndex]   = (newBoard[thisCellIndex]   + 1) % domainSize;
                newBoard[leftCellIndex]   = (newBoard[leftCellIndex]   + 1) % domainSize;
                newBoard[rightCellIndex]  = (newBoard[rightCellIndex]  + 1) % domainSize;
                newBoard[topCellIndex]    = (newBoard[topCellIndex]    + 1) % domainSize;
                newBoard[bottomCellIndex] = (newBoard[bottomCellIndex] + 1) % domainSize;
            }
        }
        else
        {
            for(var t = 0; t < turns.length; t++)
            {
                var turn = turns[t];

                var thisCellIndex       = cellIndexFromPoint(gameSize, turn.cellX, turn.cellY);
                newBoard[thisCellIndex] = (newBoard[thisCellIndex] + 1) % domainSize;

                if(turn.cellX > 0)
                {
                    var leftCellIndex       = cellIndexFromPoint(gameSize, turn.cellX - 1, turn.cellY);
                    newBoard[leftCellIndex] = (newBoard[leftCellIndex] + 1) % domainSize;
                }

                if(turn.cellX < gameSize - 1)
                {
                    var rightCellIndex       = cellIndexFromPoint(gameSize, turn.cellX + 1, turn.cellY);
                    newBoard[rightCellIndex] = (newBoard[rightCellIndex] + 1) % domainSize;
                }

                if(turn.cellY > 0)
                {
                    var topCellIndex       = cellIndexFromPoint(gameSize, turn.cellX, turn.cellY - 1);
                    newBoard[topCellIndex] = (newBoard[topCellIndex] + 1) % domainSize;
                }

                if(turn.cellY < gameSize - 1)
                {
                    var bottomCellIndex       = cellIndexFromPoint(gameSize, turn.cellX, turn.cellY + 1);
                    newBoard[bottomCellIndex] = (newBoard[bottomCellIndex] + 1) % domainSize;
                }
            }
        }

        return newBoard;
    }

    function populateClickRulePlane(clickRule, clickRuleSize, gameSize, cellX, cellY)
    {
        var populatedClickRule = new Uint8Array(gameSize * gameSize);
        populatedClickRule.fill(0);

        var clickSizeHalf = Math.floor(clickRuleSize / 2);

        var left = cellX - clickSizeHalf;
        var top  = cellY - clickSizeHalf;
        
        for(var y = 0; y < clickRuleSize; y++)
        {
            var yBig = y + top;
            if(yBig < 0 || yBig >= gameSize)
            {
                continue;
            }

            for(var x = 0; x < clickRuleSize; x++)
            {
                var xBig = x + left;
                if(xBig < 0 || xBig >= gameSize)
                {
                    continue;
                }

                var bigClickIndex = cellIndexFromPoint(gameSize, xBig, yBig);
                var smlClickIndex = cellIndexFromPoint(clickRuleSize, x, y);

                populatedClickRule[bigClickIndex] = clickRule[smlClickIndex];
            }
        }

        return populatedClickRule;
    }

    function populateClickRuleToroid(clickRule, clickRuleSize, gameSize, cellX, cellY)
    {
        var populatedClickRule = new Uint8Array(gameSize * gameSize);
        populatedClickRule.fill(0);

        var clickSizeHalf = Math.floor(clickRuleSize / 2);

        var left = cellX - clickSizeHalf;
        var top  = cellY - clickSizeHalf;
        
        for(var y = 0; y < clickRuleSize; y++)
        {
            var yBig    = y + top;
            var yBigMod = wholeMod(yBig, gameSize);

            for(var x = 0; x < clickRuleSize; x++)
            {
                var xBig    = x + left;
                var xBigMod = wholeMod(xBig, gameSize); 

                var bigClickIndex = cellIndexFromPoint(gameSize, xBigMod, yBigMod);
                var smlClickIndex = cellIndexFromPoint(clickRuleSize, x, y);

                populatedClickRule[bigClickIndex] = clickRule[smlClickIndex];
            }
        }

        return populatedClickRule;
    }

    function moveBoardLeft(board, gameSize)
    {
        var resBoard = new Uint8Array(board.length);
        for(var y = 0; y < gameSize; y++)
        {
            for (var x = 0; x < gameSize; x++)
            {
                var leftX = wholeMod(x - 1, gameSize);

                var cellIndex     = cellIndexFromPoint(gameSize, x,     y);
                var cellIndexLeft = cellIndexFromPoint(gameSize, leftX, y);

                resBoard[cellIndexLeft] = board[cellIndex];
            }
        }
        
        return resBoard;
    }

    function moveBoardRight(board, gameSize)
    {
        var resBoard = new Uint8Array(board.length);
        for(var y = 0; y < gameSize; y++)
        {
            for (var x = 0; x < gameSize; x++)
            {
                var rightX = wholeMod(x + 1, gameSize);

                var cellIndex      = cellIndexFromPoint(gameSize, x,      y);
                var cellIndexRight = cellIndexFromPoint(gameSize, rightX, y);

                resBoard[cellIndexRight] = board[cellIndex];
            }
        }
        
        return resBoard;
    }

    function moveBoardUp(board, gameSize)
    {
        var resBoard = new Uint8Array(board.length);
        for(var y = 0; y < gameSize; y++)
        {
            for (var x = 0; x < gameSize; x++)
            {
                var upY = wholeMod(y - 1, gameSize);

                var cellIndex   = cellIndexFromPoint(gameSize, x, y  );
                var cellIndexUp = cellIndexFromPoint(gameSize, x, upY);

                resBoard[cellIndexUp] = board[cellIndex];
            }
        }
        
        return resBoard;
    }

    function moveBoardDown(board, gameSize)
    {
        var resBoard = new Uint8Array(board.length);
        for(var y = 0; y < gameSize; y++)
        {
            for (var x = 0; x < gameSize; x++)
            {
                var downY = wholeMod(y + 1, gameSize);

                var cellIndex     = cellIndexFromPoint(gameSize, x, y    );
                var cellIndexDown = cellIndexFromPoint(gameSize, x, downY);

                resBoard[cellIndexDown] = board[cellIndex];
            }
        }
        
        return resBoard;
    }

    function inverseBoard(board, domainSize)
    {
        var resBoard = new Uint8Array(board.length);
        for(var i = 0; i < board.length; i++)
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

        var resBoard = new Uint8Array(board.length);
        for(var i = 0; i < board.length; i++)
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

        var resBoard = new Uint8Array(boardLeft.length);
        for(var i = 0; i < board.length; i++)
        {
            var boardValue = board[i];
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

        var resBoard = new Uint8Array(boardLeft.length);
        for(var i = 0; i < boardLeft.length; i++)
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

        var resBoard = new Uint8Array(board.length);
        for(var i = 0; i < board.length; i++)
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

        var resBoard = new Uint8Array(boardLeft.length);
        for(var i = 0; i < resBoard.length; i++)
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

        var resBoard = new Uint8Array(board.length);
        for(var i = 0; i < board.length; i++)
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

        var sum = 0;
        for(var i = 0; i < boardLeft.length; i++)
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

        const posArray = new Float32Array([-1.0,  1.0, 0.0, 1.0,
                                            1.0,  1.0, 0.0, 1.0,
                                           -1.0, -1.0, 0.0, 1.0,
                                            1.0, -1.0, 0.0, 1.0]);

        var posBuffer = gl.createBuffer();
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
    }

    function updateViewport()
    {
        gl.viewport(0, canvas.clientHeight - standardHeight, standardWidth, standardHeight); //Very careful here. 
    }

    function nextTick()
    {
        if(currentTurnList.length !== 0)
        {
            var turn = (-1, -1);
            if(flagRandomSolving)
            {
                var randomIndex = Math.floor(Math.random() * currentTurnList.length);

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
        var emptyTexData = new Uint8Array(maximumBoardSize * maximumBoardSize);
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
        var vsSource = document.getElementById("vertexShader").text;

        var squaresFsSource = document.getElementById("fragmentShaderSquares").text;

        vsSource        = trimStringLeft(vsSource,        " \n"); //CUT THIS SO THE #version WILL BE THE FIRST CHARACTERS
        squaresFsSource = trimStringLeft(squaresFsSource, " \n"); //CUT THIS SO THE #version WILL BE THE FIRST CHARACTERS

        var defaultVS = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(defaultVS, vsSource);
        gl.compileShader(defaultVS);

        if(!gl.getShaderParameter(defaultVS, gl.COMPILE_STATUS))
        {
            alert(gl.getShaderInfoLog(defaultVS));
        }

        var squaresFS = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(squaresFS, squaresFsSource);
        gl.compileShader(squaresFS);

        if(!gl.getShaderParameter(squaresFS, gl.COMPILE_STATUS))
        {
            alert(gl.getShaderInfoLog(squaresFS));
        }

        squaresShaderProgram = gl.createProgram();
        gl.attachShader(squaresShaderProgram, defaultVS);
        gl.attachShader(squaresShaderProgram, squaresFS);
        gl.linkProgram(squaresShaderProgram);

        if(!gl.getProgramParameter(squaresShaderProgram, gl.LINK_STATUS))
        {
            alert(gl.getProgramInfoLog(squaresShaderProgram));
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

        var drawFlags = 0;
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

    function trimStringLeft(string, chars)
    {
        if(string.length === 0)
        {
            return string;
        }

        var start = 0;
        while(start < string.length && chars.includes(string[start]))
        {
            start++;
        }

        return string.substring(start);
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
                var tCurr = 0;
                var rCurr = domainSize;
                var tNext = 1;
                var rNext = num;

                while(rNext !== 0)
                {
                    var quotR = Math.floor(rCurr / rNext);
                    var tPrev = tCurr;
                    var rPrev = rCurr;

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