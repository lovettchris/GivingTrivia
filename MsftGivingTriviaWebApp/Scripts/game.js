
// all known games
var games = null;
// list of questions (see game-questions.js)
var questions = null;
// all users
var users = null;
// current game
var runningGame = null;
// current game users (see game-users.js)
var gameUsers = null;
// the categories
var categories = null;
// remember which game we want to start
var startGameId = null;
// this is a computed value from userid that is a valid firebase key.
var userKey = null;

// showing questions?
var currentQuestion = null;
var showingQuestion = null;
var nextQuestionTimeout = 2000;
var wrongAnswerTimeout = 2000;
var questionTimeout = 15;
var pointsPerSecond = 10;
var pauseCountdown = true;

// values for game.status property.
var gameStatusWaiting = 0;
var gameStatusRunning = 1;
var gameStatusFinished = 2;
var gameStatusRemoved = 3;

var waitForWinner = false;
var waitForNextMove = false;
var waitingForGameReset = false;
var editQuestions = false;
var noWinnerCaption = "no winner!";

// Initialize Firebase
var gameConfig =
{
    authDomain: "msft-giving-trivia.firebaseapp.com",
    databaseURL: "https://msft-giving-trivia.firebaseio.com",
    storageBucket: "msft-giving-trivia.appspot.com",
    messagingSenderId: "586632168300"
};

function InitGame() {
    games = new GameList();
    games.addListener("added", OnGameAdded);
    games.addListener("removed", OnGameRemoved);
    games.addListener("changed", OnGameChanged);

    users = new Users();
    users.addListener("added", OnUserAdded);
    users.addListener("removed", OnUserRemoved);
    users.addListener("changed", OnUserChanged);
    users.addListener("reset", OnUsersReset);

    categories = new Categories();
    gameUsers = new GameUsers();
    gameUsers.addListener("added", OnGameUserAdded);
    gameUsers.addListener("removed", OnGameUserRemoved);
    gameUsers.addListener("changed", OnGameUserChanged);
    gameUsers.addListener("reset", OnGameUsersReset);
    gameConfig.apiKey = apiKey;

    firebase.initializeApp(gameConfig);

    document.body.onresize = OnWindowResize;
    categories.fetch();

    questions = new Questions();
    questions.addListener("loading", OnQuestionsLoading);
    questions.addListener("loaded", OnQuestionsLoaded);
    questions.addListener("changed", function () {
        UpdateCurrentQuestion();
    });

    users.connect();
    users.add(userid);
}

var lazyUpdate = false;
function OnWindowResize() {
    if (!lazyUpdate) {
        lazyUpdate = true;
        window.setTimeout(ResizePopups, 100);
    }
}

function ResizePopups() {
    lazyUpdate = false;

    var bounds = getCombinedBounds(".tile");
    var div = $(".wronganswer")[0];
    if (div != null) {
        div.style.width = bounds.width + 20 + "px";
        div.style.height = bounds.height + 20 + "px";
    }
    div = $(".rightanswer")[0];
    if (div != null) {
        div.style.width = bounds.width + 20 + "px";
        div.style.height = bounds.height + 20 + "px";
    }
}

function FindTile(model) {
    var result = null;
    $(".tile").each(function () {
        var tile = $(this)[0];
        if (tile.model != null && tile.model.key == model.key) {
            // found it!  
            tile.model = model; // save the new state
            result = tile;
        }
    });
    return result;
}
function ClearTiles() {

    var tiles = $("#tilelist")[0];
    if (tiles == null) {
        return;
    }
    $(".tile").each(function () {
        var tile = $(this)[0];
        tiles.removeChild(tile);
    });
}

function SetHeading(msg){    
    $("#heading")[0].innerText = msg;
}

function ShowGames() {
    ClearTiles();

    runningGame = null;
    currentQuestion = null;

    SetHeading("Welcome, please pick a game below:");

    if (isadmin) {
        AddNewGameTile();
    }
}

function OnGameAdded(evt) {

    var game = evt.game;

    if (startGameId != null && runningGame == null) {
        if (startGameId == game.key) {
            runningGame = game;
            JoinGame(runningGame);
        }
        // waiting for the game to show up...
        return;
    }

    if (runningGame != null) {
        // we are not showing select game UI right now.
        return;
    }
    var tiles = $("#tilelist")[0];
    if (tiles == null) {
        return;
    }
    if (typeof (game.id) != "undefined" && game.id != "") {
        var tile = FindTile(game);
        if (tile == null) {
            console.log("new game: " + JSON.stringify(game));
            tile = document.createElement('div');
            tile.className = "tile";
            tile.model = game;
            UpdateGameTile(game, tile);
            tiles.appendChild(tile);
            tile.onclick = SelectGame;
        }
        else {
            UpdateGameTile(game, tile);
        }
    }
}

function OnGameRemoved(evt) {

    var game = evt.game;

    if (runningGame != null) {
        // we are not showing selected games, but if this is the runningGame 
        // then we need to cancel this run, tell the user the game is over...
        if (runningGame.key == game.key) {
            // crap, our game has been removed!
            runningGame.status = gameStatusRemoved;
            UpdateRunningGame(runningGame);
        }
        return;
    }
    var tiles = $("#tilelist")[0];
    if (tiles == null) {
        return;
    }
    var tile = FindTile(game);
    if (tile != null) {
        tiles.removeChild(tile);
    }
}

var gameChangeReentrantLock = null;

function OnGameChanged(evt) {

    var game = evt.game;

    if (runningGame != null && runningGame.key != game.key) {
        // this is a different game that we are not tracking.
        return;
    }

    console.log("OnGameChanged: " + game.id + ", winner=" + game.winner);

    if (gameChangeReentrantLock == game.key) {
        return;
    }
    else {
        gameChangeReentrantLock = game.key;
        if (runningGame != null) {
            // we are showing questions
            UpdateRunningGame(game);
        }
        else {
            // then we are showing the game list, so keep it up to date.
            var tile = FindTile(game);
            if (tile != null) {
                UpdateGameTile(game, tile);
            }
        }
        gameChangeReentrantLock = null;
    }
}

function UpdateGameTile(game, tile) {
    // show new game details...           
    var count = game.users;
    if (typeof (count) == "undefined") count = 0;
    var content = "<p class='caption2'>users: " + count + "</p>";
    if (isadmin) {
        content += "<img class='captionDeleteIcon' src='/content/recyclebin.png' onclick='OnDeleteGame()' id='img" + game.id + "'/>";
    }
    content += "<p class='caption'>" + game.id + "</p>";
    tile.innerHTML = content;
    tile.style.background = game.color;
}

function OnDeleteGame(e) {
    event.stopPropagation();
    var gameId = event.target.id.substring(3);
    if (confirm("Do you want to delete game: '" + gameId + "'")) {
        var game = games.find(gameId);
        if (game != null) {
            gameUsers.remove(game.key);
            games.remove(game);
        }
    }
}

function SelectGame() {
    var tile = this;
    var game = tile.model;
    window.location.href = "/Play/Play?id=" + game.key;
}

function OnGameSelected(id) {

    startGameId = id;
    if (runningGame == null) {
        var game = this.games.find(id);
        if (game == null) {
            // wait for game list to download...
            return;
        }
    }
    JoinGame(runningGame);
}

function ShuffleArray(list) {
    if (list == null) {
        return [];
    }
    var result = [];
    while (list.length > 0) {
        var i = Math.floor(Math.random() * list.length);
        result.push(list[i]);
        list.splice(i, 1);
    }
    return result;
}

function GetAnswerShuffle() {
    return ShuffleArray([0, 1, 2, 3]).toString();
}

function GetAnswerColors() {
    var result = [];
    var i = 0;
    for (i = 0; i < 4; i++) {
        result.push(get_random_color());
    }
    return result.toString();
}

// This function is a handy way to update some values once for all current users by using
// a lock property and user id to ensure only one user gets access at a time.
function TransactedUpdate(parent, userid, value) {

    var deferred = $.Deferred();
    ref = firebase.database().ref().child(parent + "/lock");
    ref.transaction(function (current_value) {
        if (current_value == null || current_value == "" || current_value == userid) {
            return userid; // try and take the lock
        }
        return undefined; // leave it, someone else beat us to it.
    }, function (errorObject, committed, snapshot) {
        if (errorObject != null) {
            deferred.fail();
        }
        else if (committed) {
            var id = snapshot.val();
            if (id == userid) {
                // we won!  This means we can update the values
                ref = firebase.database().ref().child("games/" + runningGame.key);
                ref.update(value, function (errorObject) {
                    if (errorObject != null) {
                        ShowError("Updating game failed: " + errorObject.message);
                    }

                    // now we can unlock it.
                    var ref2 = firebase.database().ref().child("games/" + runningGame.key + "/lock");
                    ref2.set("");
                });

                deferred.resolve();
            }
            else {
                deferred.fail();
            }
        } else {
            deferred.fail();
        }

    });
    return deferred.promise();
}

function StartGame() {

    if (runningGame != null) {

        // hide the category selector
        var select = $("#categorySelect")[0];
        var category = runningGame.category;
        if (select.selectedIndex >= 0) {
            category = select.options[select.selectedIndex].value;
            categories.markUsed(category);
        }

        // fetch the new set of questions, so that we shuffle the right set.
        questions.fetch(category).then(function () {

            var questionOrder = questions.shuffle();
            var shuffle = GetAnswerShuffle();
            var colors = GetAnswerColors();

            ref = firebase.database().ref().child("games/" + runningGame.key);
            ref.update({
                status: gameStatusRunning,
                category: category,
                currentQuestion: 0,
                winner: null,
                shuffle: shuffle,
                colors: colors,
                order: questionOrder.toString()
            }, function (errorObject) {
                if (errorObject != null) {
                    ShowError("Setting game running failed: " + errorObject.message);
                }
                HideUnusedCategories();
            });

            UpdateCurrentQuestion();
        });
    }

}

// look up the indexed question by the order specified in runningGame.order.
function GetOrderedQuestion(index) {
    if (runningGame != null && questions != null) {
        return questions.getOrderedIndex(index, runningGame.order);
    }
    return null;
}

var showingCategoryCount = 0;

function ShowUnusedCategories() {

    var unused = categories.getUnused();

    showingCategoryCount = unused.length;
    var select = $("#categorySelect")[0];

    var options = select.options;
    var same = options.length == unused.length;
    if (same)
    {
        for (i = options.length - 1 ; i >= 0 ; i--) {
            if (unused[i] != options[i].value)
            {
                same = false;
                break;
            }
        }
    }
    if (!same) {
        // clear the current list but remember what is selected
        var selected = null;
        var i;
        for (i = options.length - 1 ; i >= 0 ; i--) {
            if (options[i].selected) {
                selected = options[i].value;
            }
            options.remove(i);
        }

        var unused = categories.getUnused();
        for (i in unused) {
            var cat = unused[i];
            var option = document.createElement('option');
            option.value = cat;
            option.text = cat;
            options.add(option);
            if (cat == selected && selected != null) {
                option.selected = true;
            }
        }
    }

    $("#categorySelectPanel")[0].style.display = "block";
}

function HideUnusedCategories() {

    $("#categorySelectPanel")[0].style.display = "none";
}

function HideQRCode() {

    $("#qrcode")[0].style.display = "none";
}

function ShowQRCode() {

    $("#qrcode")[0].style.display = "block";
    var el = $("#qrcode")[0];
    if (el.firstChild == null) {
        var qrcode = new QRCode("qrcode");
        qrcode.makeCode(window.location.href);
    }
}

var previousStatus = 0;

function UpdateCurrentQuestion() {
    if (runningGame != null) {

        var index = parseInt(runningGame.currentQuestion);

        HideQRCode();

        if (typeof (runningGame.status) == "undefined" || runningGame.status == gameStatusWaiting) {

            ClearTiles();
            HidePopups();

            SetHeading("Waiting for game '" + runningGame.id + "' to start...");
            $("#scoreTitle")[0].innerText = "Running score for this game:";

            if (isadmin) {
                var tile = AddAnswerTile("GO", get_random_color());
                ShowUnusedCategories();
                tile.onclick = StartGame;
            }
            ShowQRCode();

            StopQuestionCountdown();

            if (gameUsers != null && previousStatus == gameStatusFinished)
            {
                previousStatus = gameStatusWaiting;
                // update the score list to show tallies instead.
                UpdateUserTable();
            }
            return;
        }
        else if (runningGame.status == gameStatusFinished || index >= questions.max()) {
            ClearTiles();
            HidePopups();

            SetHeading("'" + runningGame.id + "' game is over.");
            $("#scoreTitle")[0].innerText = "Running score for this game:";

            if (isadmin) {
                AddAnswerTile("RESET", get_random_color()).onclick = ResetGame;
            }

            previousStatus = gameStatusFinished;

            // make a fuss about the winner, and increment 'wins'
            OnGameOver();
            StopQuestionCountdown();
            return;
        }
        else if (runningGame.status == gameStatusRemoved) {
            ClearTiles();
            HidePopups();
            previousStatus = 0;

            SetHeading("Sorry, the '" + runningGame.id + "' game is has been removed by your game admin.");
            $("#scoreTitle")[0].innerText = "Score for this round:";

            // make a fuss about the winner, and increment 'wins'
            OnGameOver();
            StopQuestionCountdown();
            return;
        }

        $("#scoreTitle")[0].innerText = "Score for the " + runningGame.category + " round:";

        // if we are watching this game come up then make sure we are listed as 'joined'
        if (!gameUsers.isJoined(runningGame.key)) {
            JoinGame(runningGame);
        }
        previousStatus = 0;

        HideUnusedCategories();

        var question = GetOrderedQuestion(index);
        if (question != null) {
            if (currentQuestion == null || currentQuestion.Id != question.Id) {

                console.log("UpdateCurrentQuestion: new question found " + index + ") " + question.Id);

                var user = gameUsers.getUser(userid);
                if (user != null) {
                    console.log("UpdateCurrentQuestion: clearing starttime, currentQuestion.Id=" + (currentQuestion == null ? 'null' : currentQuestion.Id) + ", question.Id=" + question.Id);
                    pauseCountdown = true;
                    if (currentQuestion != null) {
                        user.startTime = null;
                    }
                }
                // new question just got started, so clear the winner.
                currentQuestion = question;
            }
            ShowCurrentQuestion();

            if (pauseCountdown && runningGame.status == gameStatusRunning) {
                StartQuestionCountdown();
            }
        }
    }
}

function StartQuestionCountdown() {

    // remember our starttime so user can't cheat by pressing F5 to reset the countdown
    var user = gameUsers.getUser(userid);
    if (user == null) {
        return; // not ready yet, still fetching the list of users.
    }
    if (user.startTime == null) {
        user.startTime = new Date().toUTCString();
        gameUsers.setStartTime(user.id, user.startTime);
        console.log("StartQuestionCountdown: setting startTime " + user.startTime);
    }
    console.log("StartQuestionCountdown: " + GetRemainingSeconds());
    ShowQuestionCountdown();
    window.setTimeout(QuestionTimer, 1000);
    pauseCountdown = false;
}

function StopQuestionCountdown() {
    console.log("StopQuestionCountdown");
    pauseCountdown = true;
}

function GetTimeTaken() {
    var user = gameUsers.getUser(userid);
    if (user == null) {
        return 15;// no idea user isn't joined yet
    }
    var now = new Date().getTime();
    var startTime = Date.parse(user.startTime);
    return (now - startTime) / 1000;
}

function GetRemainingSeconds() {
    var seconds = GetTimeTaken();
    if (seconds < questionTimeout) {
        return questionTimeout - seconds;
    }
    return 0;
}

function GetPointsAvailable() {

    var pointsAvailable = 0;
    var remainingSeconds = GetRemainingSeconds();
    if (remainingSeconds > 0) {
        pointsAvailable = remainingSeconds * pointsPerSecond;
    }
    pointsAvailable -= gameUsers.getPenalty(userid);
    if (pointsAvailable < 0) {
        return 0;
    }
    return parseInt(pointsAvailable);
}

function QuestionTimer() {

    var user = gameUsers.getUser(userid);
    if (user.startTime == null) {
        // we are between questions...
        console.log("QuestionTimer, no start time?");
        pauseCountdown = true;
    }
    else {
        var remainingSeconds = GetRemainingSeconds();
        if (remainingSeconds > 0) {
            pointsAvailable = parseInt(remainingSeconds * pointsPerSecond);
        } else {
            console.log("QuestionTimer, time is up, startTime=" + user.startTime);
            OnTimeUp();
            pauseCountdown = true;
            waitForNextMove = true;
        }

        ShowQuestionCountdown();
    }
    if (!pauseCountdown) {
        window.setTimeout(QuestionTimer, 100);
    }
}

function OnTimeUp() {

    if (runningGame.status == gameStatusRemoved) {
        return;
    }
    var remainingSeconds = GetRemainingSeconds();
    if (remainingSeconds > 0) {
        console.log("OnTimeUp: ignoring spurious call");
        return;
    }

    console.log("OnTimeUp");

    if (runningGame.winner == null || runningGame.winner == "") {

        console.log("OnTimeUp: no winner");
        runningGame.winner = noWinnerCaption;

        // try and grab the lock on advancing the game then
        TransactedUpdate("games/" + runningGame.key, userid,
            {
                winner: noWinnerCaption
            }
        ).then(function () {
            console.log("OnTimeUp: " + userid + " finished setting 'no winner'");
            CompleteTimeUp();
        }).fail(function () {
            CompleteTimeUp();
        });
        return;
    }
    else
    {
        CompleteTimeUp();
    }
    
}

function CompleteTimeUp() {
    console.log("CompleteTimeUp: winner=" + runningGame.winner);
    // show the winner
    ShowWinner();

    var currentIndex = runningGame.currentQuestion;
    // Add a delay to show the winner to folks.
    window.setTimeout(function () {
        TryAdvance(currentIndex);
    }, 1500);
}

function TryAdvance(currentIndex)
{
    console.log("TryAdvance: " + currentIndex);

    // this is for added fault tolerance, if the the user who won this round suddenly leaves the game their
    // machine might not advance the game to the next question, so we can't depend on that.  Instead every
    // machine votes to advance the game, only one will win because it is a transacted update.    
    // try and grab the lock on advancing the game then
    TransactedUpdate("games/" + runningGame.key, userid,
        {
            advancer: userid
        }
    ).done(function () {
        // we won the vote to become the next question advancer...
        console.log("TryAdvance: we won the vote to advance");
        if (runningGame.currentQuestion == currentIndex) {
            if (runningGame.advancer == userid) {
                console.log("CompleteTimeUp: " + userid + " is calling AdvanceNextQuestion");
                AdvanceNextQuestion();
            } else {
                // Let's make sure we still advance to the next question.
                console.log("TryAdvance: someone else is advancing: " + runningGame.advancer);
            }
        } else {
            console.log("TryAdvance: question moved on, it was " + currentIndex + " and now it's " + runningGame.currentQuestion);
        }
    }).fail(function () {
        console.log("TryAdvance: advancement failed, advancer=" + runningGame.advancer);
    });
}

var amazing = ["amazing", "wow", "awesome", "great", "jeeze that was quick!", "lightning!", "quick!"]
var praises = ["well done", "congratulations", "nice job", "cool", "nice", "good job", "hey cool", "jolly good show", "good on ya mate"]
var taunts = ["don't quit your day job", "finally", "Zzzzz", "about time", "snore", "slow poke", "need more coffee?"]

function GetRandomPraise() {
    var seconds = GetTimeTaken();
    if (seconds < 3) {
        return amazing[parseInt(Math.random() * amazing.length)];
    }
    else if (seconds < 8)
    {
        return praises[parseInt(Math.random() * praises.length)];
    }
    return taunts[parseInt(Math.random() * taunts.length)];

}

function ShowWinner()
{

    console.log("ShowWinner " + runningGame.winner);

    // show the winner
    popup = $(".rightanswer")[0];
    $("#winnerName")[0].innerText = runningGame.winner;
    $("#winnerSubtitle")[0].innerText = "";

    popup.style.visibility = "visible";
}

function ShowQuestionCountdown() {
    if (pauseCountdown) {
        $("#points")[0].innerText = "0";
        $("#timeRemaining")[0].innerText = "0";
    }
    else {
        $("#timeRemainingRow")[0].style.display = "table-row";
        $("#points")[0].innerText = GetPointsAvailable();
        $("#timeRemaining")[0].innerText = parseInt(GetRemainingSeconds());
    }
}

function OnGameOver() {
    console.log("OnGameOver");
    if (runningGame != null && runningGame.status != gameStatusRemoved) {
        $("#timeRemainingRow")[0].style.display = "none";

        UpdateUserTable();
    }
}

function ResetGame() {

    if (runningGame != null) {

        var game = runningGame;

        // reset game users
        gameUsers.tallyScores();

        gameusers = [];

        // reset the game state
        ref = firebase.database().ref().child("games/" + game.key);
        ref.update({
            status: gameStatusWaiting,
            currentQuestion: 0,
            order: null,
            users: 0,
            winner: null,
            shuffle: null,
            colors: null
        }, function (errorObject) {
            if (errorObject != null) {
                ShowError("Setting game running failed: " + errorObject.message);
            }
        });

    }
}

function AddAnswerTile(caption, color) {
    var tiles = $("#tilelist")[0];
    if (tiles == null) {
        return;
    }
    var tile = document.createElement('div');
    tile.className = "tile";
    tile.model = caption;
    UpdateAnswerTile(caption, tile);
    tiles.appendChild(tile);
    tile.onclick = CheckAnswer;
    tile.style.background = color;
    return tile;
}

function HidePopups() {
    $(".rightanswer")[0].style.visibility = "hidden";
    $(".wronganswer")[0].style.visibility = "hidden";
}

function CheckAnswer() {
    var div = this;
    if (currentQuestion != null) {
        waitForWinner = true;
        var popup = null;
        HidePopups();
        if (div.model == currentQuestion.Answer) {
            // got it!
            popup = $(".rightanswer")[0];
            $("#winnerName")[0].innerText = "CORRECT";
            var praise = GetRandomPraise();
            $("#winnerSubtitle")[0].innerText = praise;

            var u = gameUsers.getUser(userid);
            if (u != null && u.status != userStatusWaiting) {

                // we won the current question, so we get the score based on time remaining.
                gameUsers.incrementScore(GetPointsAvailable());

                // see if we are the first!
                if (runningGame.winner == null) {

                    games.lockWinner(runningGame.key, userid).then(function () {
                        // we really are the winner.
                        gameUsers.incrementWins(1);
                    });

                }

                // lock in this turn so user can't cheat (by pressing F5 and trying again).
                gameUsers.lockUser(u.id);
            }

            // CheckWinner will be called in a sec ...
        }
        else {
            // wrong answer!!
            var points = GetPointsAvailable();
            var penalty = gameUsers.getPenalty(userid) + (points / 2);
            gameUsers.setPenalty(userid, penalty);
            popup = $(".wronganswer")[0];
            window.setTimeout(HidePopups, wrongAnswerTimeout);
        }
        popup.style.visibility = "visible";
    }
}


function UpdateRunningGame(game) {

    if (runningGame != null && runningGame.key == game.key) {
        // save new state.
        runningGame = game;
        UpdateUserParticipants();
    }
    else {
        // it was a different game so ignore it.
        return;
    }

    if (questions == null || (runningGame != null && runningGame.category != questions.category)) {
        console.log("UpdateRunningGame: category changed!");
        // category has changed, need to fetch new questions.
        questions.fetch(runningGame.category).then(function () {
            currentQuestion = null; // force update because we have new questions.
            CheckGameState(game);
        });
    } else {
        CheckGameState(game);
    }
}
function OnQuestionsLoading(evt) {
    SetHeading("Loading questions for category '" + evt.category + "'");
    gameUsers.onLoadingQuestions(userid);
}

function OnQuestionsLoaded(evt) {
    gameUsers.onLoadingQuestionsComplete(userid, evt.category);
}

function CheckGameState(game) {
    if (waitForNextMove && game.status == gameStatusRunning) {
        var index = parseInt(runningGame.currentQuestion);
        var question = GetOrderedQuestion(index);
        if (currentQuestion == null || question == null || question.Id != currentQuestion.Id) {
            console.log("CheckGameState: new question " + index);
            // next question has arrived.
            waitForNextMove = false;
            UpdateCurrentQuestion();
        }
    }
    else if (CheckWinner(game)) {
        // someone picked a winner!
    }
    else {
        UpdateCurrentQuestion();
    }
}

function CheckWinner(game) {
    if (typeof (game.winner) == "string" && game.winner != "") {

        console.log("CheckGameState: new winner " + game.winner);

        if (game.winner == userid && waitForWinner) {
            waitForWinner = false;
        }
        else {
            waitForWinner = false;
            // someone else beat us!
            if (GetRemainingSeconds() <= 0) {
                ShowWinner();
            }
        }
        waitForNextMove = true;
        return true;
    }
    return false;
}

function AdvanceNextQuestion() {

    console.log("AdvanceNextQuestion: " + userid);
    waitForNextMove = true;
    StopQuestionCountdown();

    if (runningGame != null) {
        // must reset penalties before advancing the next question.
        gameUsers.clearPenalties();

        ref = firebase.database().ref().child("games/" + runningGame.key);

        var next = parseInt(runningGame.currentQuestion) + 1;
        if (next >= questions.max()) {
            ref.update({
                currentQuestion: next,
                status: gameStatusFinished,
                winner: null,
                advancer: null
            }, function (errorObject) {
                if (errorObject != null) {
                    ShowError("Setting game complete failed: " + errorObject.message);
                }
                console.log("AdvanceNextQuestion complete");
            });
        }
        else {
            var shuffle = GetAnswerShuffle();
            var colors = GetAnswerColors();
            ref.update({
                currentQuestion: next,
                shuffle: shuffle,
                colors: colors,
                winner: null,
                advancer: null
            }, function (errorObject) {
                if (errorObject != null) {
                    ShowError("Advance to next question failed: " + errorObject.message);
                }
                console.log("AdvanceNextQuestion complete");
            });
        }

    }
}

function UpdateAnswerTile(caption, tile) {
    // show new game details...           
    tile.innerHTML = "<p class='caption'>" + caption + "</p>";
}

function ShowCurrentQuestion() {
    if (currentQuestion != null && runningGame != null && typeof (runningGame.shuffle) == "string" && runningGame.shuffle != null && 
        showingQuestion != runningGame.currentQuestion) {
        showingQuestion = runningGame.currentQuestion;
        SetHeading((1 + runningGame.currentQuestion) + ". " + currentQuestion.Question);
        ClearTiles();
        HidePopups();
        var shuffle = runningGame.shuffle.split(",").map(Number);
        if (shuffle.length == 4 && runningGame.colors != null) {
            var colors = runningGame.colors.split(",");
            if (colors.length == 4) {
                var answers = [currentQuestion.Answer, currentQuestion.Wrong1, currentQuestion.Wrong2, currentQuestion.Wrong3];
                var n = 0;
                for (n in shuffle) {
                    var i = shuffle[n];
                    AddAnswerTile(answers[i], colors[i]);
                }
            }
        }
        ResizePopups();
    }
}

function WatchGames() {
    games.connect();
}

function ShowError(msg) {
    var div = $("#errormessage")[0];
    if (div == null) {
        console.log(msg);
    }
    else {
        div.innerText = msg;
    }
}

//Note that URLs used to construct Firebase references may contain any unicode characters except:
//. (period)
//$ (dollar sign)
//[ (left square bracket)
//] (right square bracket)
//# (hash or pound sign)
/// (forward slash)
function GetValidKey(id) {
    var result = "";
    var n = id.length;
    var i = 0;
    for (i = 0; i < n; i++) {
        var ch = id[i];
        var code = id.charCodeAt(i);
        if (ch == '.' || ch == '$' || ch == '[' || ch == ']' || ch == '#' || ch == '/' || code < 31 || code == 127) {
            result += "_";
        }
        else {
            result += ch;
        }
    }
    return result;
}

function GetUserKey(){
    return GetValidKey(userid);
}

var joining = null;

function JoinGame(game) {

    if (typeof (userid) == "string" && userid != "" && joining != game) {
        try {
            joining = game;

            gameUsers.join(game.key);

            if (game.category != null) {
                questions.fetch(game.category).then(function () {
                    UpdateCurrentQuestion();
                });
            }
            else {
                // so admin can pick category...
                UpdateCurrentQuestion();
            }


        } catch (e) {
            ShowError("read user failed: " + e.message);
        }
    }
}

// when we show a tally we need to use different objects so we can rebind the 
// sccore and wins to tallyScore and tallyWins, but we have to be careful not 
// to create new objects every time otherwise we hit the infamous angular error:
// Aborting! Watchers fired in the last 5 iterations.
var filterMap = [];

function getOrCreateFilter(u)
{
    var key;
    var w = filterMap[u.id];
    if (w == null)
    {
        var w = {
            id: u.id
        };
        filterMap[u.id] = w;
    }
    
    return w;
}

// this is an angular filter function that returns the top n winners, sorted.
function GetTopWinners(input, limit) {
    // pull the top limit=10, from the input list and return those only.
    // Make a copy of the input so we don't mess with the input model 
    // which has to remain in tact.
    var showTally = (runningGame != null && runningGame.status == gameStatusWaiting);

    var result = [];
    result = result.concat(input);
    result.sort(function (a, b) { return b.score - a.score; });

    // find the user's score and remove it (siunce we have a special row for that).
    var u = null;
    var i;
    for (i = 0; i < result.length; i++) {
        u = result[i];
        if (u.id == userid) {
            result.splice(i, 1);
            break;
        }
    }
    if (u != null) {
        var pointCell = $("#userPoints")[0];
        var nameCell = $("#userName")[0];
        var winCell = $("#userWins")[0];
        if (showTally) {
            pointCell.innerText = getNumber(u.tallyScore);
            nameCell.innerText = TrimEmail(u.id);
            if (typeof (winCell) != "undefined") {
                winCell.innerText = getNumber(u.tallyWins);
            }
        }
        else
        {
            pointCell.innerText = getNumber(u.score);
            nameCell.innerText = TrimEmail(u.id);
            if (typeof (winCell) != "undefined") {
                winCell.innerText = getNumber(u.wins);
            }
        }
    }

    if (result.length > limit && runningGame != null && runningGame.status == gameStatusRunning) {
        result.splice(limit, result.length - limit);
    }

    if (showTally)
    {
        // return a modified list showing the tally numbers instead.
        var modified = [];
        var i;
        for (i = 0; i < result.length; i++) {
            u = result[i];
            var w = getOrCreateFilter(u);
            w.score = getNumber(u.tallyScore);
            w.wins = getNumber(u.tallyWins);
            modified.push(w);
        }
        result = modified;
        result.sort(function (a, b) { return b.score - a.score; });
    }

    return result;
}

function getNumber(a) {
    if (typeof (a) == "number") {
        return a;
    }
    return 0;
}

function TrimEmail(value)
{
    if (typeof (value) != "string") {
        return value;
    }
    var i = value.indexOf('@');
    if (i > 0)
    {
        return value.substring(0, i);
    }
    return value;
}

// overall top score user list.
function getTopScoreTableBindingScope() {
    var e = document.getElementById("topScores");
    if (e != null)
    {
        return angular.element(e).scope();
    }
    return null;
}

function OnUserAdded(evt) {
    OnUserChanged(evt);
}

function OnUserRemoved(evt) {
    // update the table binding
    var scope = getTopScoreTableBindingScope();
    if (scope != null) {
        scope.$apply(function () {
            scope.removeUser(evt.user);
        });
    }

    UpdateUserParticipants();
}

function OnUserChanged(evt) {
    // update the table binding
    var scope = getTopScoreTableBindingScope();
    if (scope != null) {
        scope.$apply(function () {
            scope.updateUser(evt.user);
        });
    }
    UpdateUserParticipants();
}

function UpdateUserParticipants() {

    var e = document.getElementById("gameParticipants");
    if (e != null)
    {
        if (startGameId != null) {
            if (gameUsers != null) {
                e.innerText = "# participants: " + gameUsers.length();
            }
        }
        else if (users != null)
        {            
            e.innerText = "Total participants: " + users.length();
        }
    }
}

function OnUsersReset(evt) {    
    // show UI of users in game.
    // update the table binding
    var scope = getTopScoreTableBindingScope();
    if (scope != null) {
        scope.$apply(function () {
            scope.setUsers(evt.list);
        });
    }
}

// in game user list
function getUserTableBindingScope()
{
    var e = document.getElementById("userTable");
    if (e != null)
    {
        return angular.element(e).scope();
    }
    return null;
}

function UpdateUserTable() {
    // update the table binding
    var scope = getUserTableBindingScope();
    if (scope != null) {
        scope.$apply(function () {
            // do nothing, this is just to force an update of the filter.
        });
    }
}

function OnGameUserAdded(evt) {
    OnGameUserChanged(evt);
}

function OnGameUserRemoved(evt) {

    // update the table binding
    var scope = getUserTableBindingScope();
    if (scope != null) {
        scope.$apply(function () {
            scope.removeUser(evt.user);
        });
    }
    UpdateUserParticipants();
}

function OnGameUserChanged(evt) {

    // update the table binding
    var scope = getUserTableBindingScope();
    if (scope != null) {
        scope.$apply(function () {
            scope.updateUser(evt.user);
        });
    }

    UpdateUserParticipants();
}


function OnGameUsersReset(evt) {

    // show UI of users in game.
    // update the table binding
    var scope = getUserTableBindingScope();
    if (scope != null) {
        scope.$apply(function () {
            scope.setUsers(evt.list);
        });
    }
}