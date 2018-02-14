
var defaultGameTime = 60 * 5;


function AddGame() {

    window.location.href = "/Admin/AddGame";
    return;
}

function AddNewGame(id) 
{
    ShowError("");

    if (games != null) {
        // make sure the game id is unique.
        for (var g in games) {
            if (g.id == id) {
                ShowError("Game with id '" + id + "' already exists");
                return false;
            }
        }
    }

    var game = {
        id: id,
        users: 0,
        currentQuestion: 0,
        status: 0, // 0=waiting, 1=running, 2=finished
        color: get_random_color()
    };

    return games.add(game);
}


function AddNewGameTile()
{
    var tiles = $("#tilelist")[0];
    tile = document.createElement('div');
    tile.className = "tile";
    tile.innerHTML = "<p class='caption-plus'>+</p>";
    tile.style.background = "#303030";
    tiles.appendChild(tile);
    tile.onclick = AddGame;
}

function FindQuestionDiv(question) {
    var result = null;

    $(".question").each(function () {
        var div = $(this)[0];
        if (div.question != null && div.question.Id == question.Id) {
            // found it!            
            result = div;
        }
    });
    return result;
}

function OnQuestionAdded(question) {

    // keep complete up to date question state regardless of current UI.
    var found = false;
    var id = null;
    for (id in questions) {
        var q = questions.list[id];
        if (q.Id == question.Id) {
            found = true;
            questions.list[id] = question;
        }
    }
    if (!found) {
        questions.push(question);
    }

    UpdateCurrentQuestion();

    if (!editQuestions) {
        return;
    }
    var list = $("#questionlist")[0];
    if (list == null) {
        return;
    }
    if (typeof (question.id) != "undefined" && question.id != "") {
        var div = FindQuestionDiv(question);
        if (div == null) {
            console.log("new question: " + JSON.stringify(question));
            div = document.createElement('div');
            div.className = "question";
            div.question = question;
            UpdateQuestion(question, div);
            list.appendChild(div);
        }
        else {
            UpdateQuestion(question, div);
        }
    }

}

function UpdateQuestion(question, div) {
    // show new question details...           
    div.innerHTML = "<p class='questiontitle'>" + question.Question + "</p>" +
                        "<p class='questionanswer'>" + question.Answer + "</p>" +
                        "<p class='questionwrong'>" + question.Wrong1 + "</p>" +
                        "<p class='questionwrong'>" + question.Wrong2 + "</p>" +
                        "<p class='questionwrong'>" + question.Wrong3 + "</p>";
    //div.style.background = question.color;
}

function OnQuestionRemoved(question) {

    // keep complete up to date question state regardless of current UI.
    questions.remove(question.id);

    if (!editQuestions) {
        return;
    }
    var list = $("#questionlist")[0];
    if (list == null) {
        return;
    }
    var div = FindQuestionDiv(question);
    if (div != null) {
        list.removeChild(div);
    }
}

function OnQuestionChanged(question) {

    // keep complete up to date question state regardless of current UI.
    questions.update(question);

    if (!editQuestions) {
        return;
    }
    var div = FindQuestionDiv(question);
    if (div != null) {
        UpdateQuestion(question, div);
    }

    if (currentQuestion != null && currentQuestion.Id == question.Id) {
        ShowCurrentQuestion();
    }
}

function OnQuestionsUpdated(newList) {
    var q = null;
    for (q in newList) {
        OnQuestionAdded(newList[q]);
    }
}

function EditQuestions() {
    editQuestions = true;
}
