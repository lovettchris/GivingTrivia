// This class manages the list of users in a given game and what state each of those users is in right now
// in terms of running score, number of wrong attempts on the current question, etc.

var userStatusReady = 0;
var userStatusWaiting = 1; // user has made winning choice, waiting for next question.
var userLoadingQuestions = 2; // user is loading questions

var GameUsers = function () {
    this.list = null;
    this._listeners = {};
    this.gameKey = null;
    this.connecting = false;
};

GameUsers.prototype = {

    constructor: GameUsers,

    isJoined: function(gamekey)
    {
        if (this.gameKey == gamekey)
        {
            var user = this.getUser(userid);
            return (user != null);
        }
        return false;
    },

    join: function (gamekey) {

        if (this.gameKey != gamekey)
        {
            this.gamekey = gamekey;
            this.connect(gamekey);
        }
        else if (!this.connecting)
        {
            var myThis = this;
            var key = GetUserKey();
            var ref = firebase.database().ref().child("usergames/" + gamekey + "/users/" + key);
            // see if user already exists
            ref.once("value", function (snapshot) {
                var user = snapshot.val();
                if (user == null || user.id != userid) {

                    ref.set({
                        id: userid,
                        score: 0,
                        wins: 0,
                        tallyScore: 0,
                        tallyWins: 0,
                        status: userStatusReady
                    }, function (errorObject) {
                        if (errorObject != null) {
                            ShowError("Add game user failed: " + errorObject.message);
                        }
                    });

                }
            }, function (errorObject) {
                ShowError("read game users failed: " + errorObject.message);
            });

        }
    },

    connect: function (gameKey) {

        var myThis = this;
        this.connecting = true;
        this.gameKey = gameKey;
        this.list = [];
        try {
            // watch the users list for the selected game.
            var ref = firebase.database().ref().child("usergames/" + gameKey + "/users");
            ref.once("value", function (snapshot) {
                var users = snapshot.val();
                if (users != null) {
                    myThis.onGameUsersUpdated(users);
                }
                myThis.connecting = false;
                // now join the user to this game
                myThis.join(gameKey);
            }, function (errorObject) {
                ShowError("read game users failed: " + errorObject.message);
            });

            ref.on("child_added", function (snapshot) { myThis.onGameUserAdded(gameKey, snapshot.val()); });
            ref.on("child_removed", function (snapshot) { myThis.onGameUserRemoved(gameKey, snapshot.val()); });
            ref.on("child_changed", function (snapshot) { myThis.onGameUserChanged(gameKey, snapshot.val()); });
        } catch (e) {
            ShowError(e.message);
        }
        this.connecting = false;

    },

    disconnect: function(){        
        try {
            // stop watching list of users in current game.
            var ref = firebase.database().ref().child("usergames/" + gameKey);
            ref.off("child_added");
            ref.off("child_removed");
            ref.off("child_changed");
        } catch (e) {
            ShowError(e.message);
        }
    },

    safeAdd: function (a,b) {
        var r = 0;
        
        if (typeof (a) == "number") {
            r = a;
        }
        if (typeof (b) == "number") {
            r += b;
        }
        return r;
    },

    tallyScores: function () {
        
        // tally user scores.
        var id = null;
        for (id in this.list)
        {
            var user = this.list[id];
            
            try {
                var key = GetValidKey(user.id);
                var tallyScore = this.safeAdd(user.score, user.tallyScore)
                var tallyWins = this.safeAdd(user.wins, user.tallyWins);
                var ref = firebase.database().ref().child("usergames/" + this.gameKey + "/users/" + key);
                ref.update({
                    score: 0,
                    wins:0,
                    penalty: 0,
                    tallyScore: tallyScore,
                    tallyWins: tallyWins,
                    status: userStatusReady
                }, function (errorObject) {
                    if (errorObject != null) {
                        ShowError("Tally user score failed: " + errorObject.message);
                    }
                });

            } catch (e) {
                ShowError("Tally user score failed: " + e.message);
            }

        }
    },

    clearPenalties: function () {
        
        // reset any user penalties and waiting states
        var id = null;
        for (id in this.list)
        {
            var user = this.list[id];
            user.penalty = 0;
            var key = GetValidKey(user.id);
            var ref = firebase.database().ref().child("usergames/" + this.gameKey + "/users/" + key);
            ref.update({
                penalty: 0,
                status: userStatusReady,
                startTime: null
            }, function (errorObject) {
                if (errorObject != null) {
                    ShowError("Set user score failed: " + errorObject.message);
                }
            });
        }
    },
    
    incrementScore: function(points)
    {
        try {
            var u = this.getUser(userid);
            var myThis = this;
            var key = GetUserKey();
            var ref = firebase.database().ref().child("usergames/" + this.gameKey + "/users/" + key + "/score");
            ref.transaction(function (current_value) {
                if (typeof (current_value) != "number") {
                    return points;
                }
                return current_value + points;
            }, function (errorObject, committed, snapshot) {
                if (errorObject != null) {
                    ShowError("The transaction failed: " + errorObject.message);
                } 
            });

            // accumulate global tally.
            users.incrementScore(key, points);


        } catch (e) {
            ShowError("increment score failed: " + e.message);
        }
    },

    incrementWins: function(delta) {

        try {
            var u = this.getUser(userid);
            var myThis = this;
            var key = GetUserKey();
            var ref = firebase.database().ref().child("usergames/" + this.gameKey + "/users/" + key + "/wins");
            ref.transaction(function (current_value) {
                if (typeof (current_value) != "number") {
                    return delta;
                }
                return current_value + delta;
            }, function (errorObject, committed, snapshot) {
                if (errorObject != null) {
                    ShowError("The GameUsers incrementWins transaction failed: " + errorObject.message);
                }
            });

            // accumulate global tally.
            users.incrementWins(key, delta);

        } catch (e) {
            ShowError("GameUsers incrementWins failed: " + e.message);
        }
    },

    lockUser: function(userid){
        var key = GetValidKey(userid);
        var ref = firebase.database().ref().child("usergames/" + this.gameKey + "/users/" + key + "/status");
        ref.set(userStatusWaiting,
            function (errorObject) {
                if (errorObject != null) {
                    ShowError("Lock user failed: " + errorObject.message);
                }
        });
    },

    onLoadingQuestions: function (userid) {
        var key = GetValidKey(userid);
        var ref = firebase.database().ref().child("usergames/" + this.gameKey + "/users/" + key + "/status");
        ref.set(userLoadingQuestions,
            function (errorObject) {
                if (errorObject != null) {
                    ShowError("onLoadingQuestions failed: " + errorObject.message);
                }
            });
    },


    onLoadingQuestionsComplete: function (userid, category) {
        var key = GetValidKey(userid);
        var ref = firebase.database().ref().child("usergames/" + this.gameKey + "/users/" + key);
        ref.update({
                category: category
            },
            function (errorObject) {
                if (errorObject != null) {
                    ShowError("onLoadingQuestionsComplete failed: " + errorObject.message);
                }
            });
    },

    getUser: function(userid) {
        
        var id = null;
        for (id in this.list) {
            var u = this.list[id];
            if (u.id == userid)
            {
                return u;
            }
        }
        return null;
    },

    remove: function (gameKey) {
        try {
            if (gameKey != null) {
                var ref = firebase.database().ref().child("usergames/" + gameKey);
                ref.remove(function (errorObject) {
                    if (errorObject != null) {
                        ShowError("Remove usergames '" + game.id + "' failed: " + errorObject.message);
                    }
                });
            }
        } catch (e) {
            ShowError(e.message);
            return false;
        }
        return true;
    },

    setStartTime: function(userid, time) {

        try {
            var key = GetValidKey(userid);
            var ref = firebase.database().ref().child("usergames/" + this.gameKey + "/users/" + key + "/startTime");
            ref.set(time, function (errorObject) {
                if (errorObject != null) {
                    ShowError("setStartTime failed: " + errorObject.message);
                }
            });

        } catch (e) {
            ShowError("setStartTime failed: " + e.message);
        }
    },

    getPenalty: function(){

        var u = this.getUser(userid);
        if (u == null)
        {
            return 0;
        }
        if (u.penalty == null) {
            return 0;
        }
        return parseInt(u.penalty);
    },

    setPenalty: function (userid, penalty) {
        try {
            var key = GetValidKey(userid);
            var ref = firebase.database().ref().child("usergames/" + this.gameKey + "/users/" + key + "/penalty");
            ref.set(penalty, function (errorObject) {
                if (errorObject != null) {
                    ShowError("setPenalty failed: " + errorObject.message);
                }
            });

        } catch (e) {
            ShowError("setPenalty failed: " + e.message);
        }
    },
    
    onGameUsersUpdated: function(newList)
    {
        var myThis = this;
        if (newList == null) {
            this.list  = [];
        }
        else {
            // turn the JSON object into an array
            this.list = [];
            var id = null;
            for (id in newList) {
                var u = newList[id];
                this.list.push(u);
            }
        }

        this.fire({
            type: "reset",
            list: myThis.list,
            target: this
        });

    },

    onGameUserAdded: function(gameKey, newUser)
    {
        if (runningGame != null && this.gameKey == gameKey) {
            // keep complete up to date user state regardless of current UI.
            var found = false;
            var id = null;
            for (id in this.list) {
                var u = this.list[id];
                if (u.id == newUser.id) {
                    found = true;
                    this.list[id] = newUser; // update state                 
                }
            }
            if (!found) {
                this.list.push(newUser);
            }

            games.setCount(gameKey, this.list.length);

            if (!found) {
                this.fire({
                    type: "added",
                    user: newUser,
                    target: this
                });
            } else {
                this.fire({
                    type: "changed",
                    user: newUser,
                    target: this
                });
            }
        }
    },

    onGameUserRemoved: function(gameKey, user)
    {
        if (this.gameKey == gameKey) {
            // keep complete up to date user state regardless of current UI.
            var i = 0;
            var removed = null;
            for (i = 0; i < this.list.length; i++) {
                var u = this.list[i];
                if (u.id == user.id) {
                    removed = this.list[i];
                    this.list.splice(i, 1);
                }
            }

            games.setCount(gameKey, this.list.length);

            this.fire({
                type: "removed",
                game: removed,
                user: user,
                target: this
            });

        }
    },

    onGameUserChanged: function (gameKey, user) {
    
        if (this.gameKey == gameKey) {
            // keep complete up to date user state regardless of current UI.
            var i = 0;
            var found = false;
            for (i = 0; i < this.list.length; i++) {
                var u = this.list[i];
                if (u.id == user.id) {
                    this.list[i] = user; // save new state
                    found = true;
                    break;
                }
            }
            if (!found) {
                // weird, why wasn't OnGameUserAdded called yet?
                this.list.push(user);

                this.fire({
                    type: "added",
                    user: user,
                    target: this
                });

            }
            else {
                this.fire({
                    type: "changed",
                    user: user,
                    target: this
                });
            }

        }
    },


    length: function () {
        return this.list.length;
    },

    get: function (i) {
        return this.list[i];
    },

    addListener: function (type, listener) {
        if (typeof this._listeners[type] == "undefined") {
            this._listeners[type] = [];
        }

        this._listeners[type].push(listener);
    },

    fire: function (event) {
        if (typeof event == "string") {
            event = { type: event };
        }
        if (!event.target) {
            event.target = this;
        }

        if (!event.type) {  //falsy
            throw new Error("Event object missing 'type' property.");
        }

        if (this._listeners[event.type] instanceof Array) {
            var listeners = this._listeners[event.type];
            for (var i = 0, len = listeners.length; i < len; i++) {
                listeners[i].call(this, event);
            }
        }
    },

    random: function () {
        while (list.length > 0) {
            var i = Math.floor(Math.random() * list.length);
            return list[i];
        }
        return null;
    },

    removeListener: function (type, listener) {
        if (this._listeners[type] instanceof Array) {
            var listeners = this._listeners[type];
            for (var i = 0, len = listeners.length; i < len; i++) {
                if (listeners[i] === listener) {
                    listeners.splice(i, 1);
                    break;
                }
            }
        }
    }
}

