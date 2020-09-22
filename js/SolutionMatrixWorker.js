//Big thanks to this guy: https://stackoverflow.com/a/33432215
//You're awesome, Tomáš Zato!
function solutionMatrixWorkerFunction()
{
    onmessage = function(e)
    {
        switch(e.data.command)
        {
            case "CalcSolutionMatrix":
            {
                calculateSolutionMatrix(e.data.params.clickRule, e.data.params.gameSize, e.data.params.domainSize, e.data.params.clickRuleSize, e.data.params.isToroid);
                break;
            }
        }
    }
}

if(window != self)
{
    solutionMatrixWorkerFunction();
}