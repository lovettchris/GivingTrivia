// This class manages the list of games, a game may be waiting to start or running.

var GameList = function () {
    this.list = [];
    this._listeners = {};
};

GameList.prototype = {

    constructor: GameList,

    connect: function (gameKey) {

        var myThis = this;
        this.connecting = true;
        try {
            var ref = firebase.database().ref();

            // watch the game list
            ref = firebase.database().ref().child("games");
            ref.once("value", function (snapshot) {
                var games = snapshot.val();
                myThis.onGamesUpdated(games);
            }, function (errorObject) {
                ShowError("The read failed: " + errorObject.message);
            });

            ref.on("child_added", function (snapshot) { myThis.onGameAdded(snapshot.val()); });
            ref.on("child_removed", function (snapshot) { myThis.onGameRemoved(snapshot.val()); });
            ref.on("child_changed", function (snapshot) { myThis.onGameChanged(snapshot.val()); });
        } catch (e) {
            ShowError(e.message);
        }

    },

    disconnect: function(){        
        try {
            // stop watching list of users in current game.
            var ref = firebase.database().ref().child("games");
            ref.off("child_added");
            ref.off("child_removed");
            ref.off("child_changed");
        } catch (e) {
            ShowError(e.message);
        }
    },
    join: function(gameKey){
        
        var key = GetUserKey();
        // update global user list to record which game user is playing
        var ref2 = firebase.database().ref().child("users/" + key);
        ref2.update({
            game: game.key
        }, function (errorObject) {
            if (errorObject != null) {
                ShowError("update user failed: " + errorObject.message);
            }
        });
    },

    lockWinner: function(gameKey, userid) {
        var deferred = $.Deferred();
        ref = firebase.database().ref().child("games/" + gameKey + "/winner");
        ref.transaction(function (current_value) {
            if (current_value == null || current_value == "" || current_value == userid) {
                return userid; // winner is free, so take it!
            }
            return undefined; // leave it, someone else beat us to it.
        }, function (errorObject, committed, snapshot) {
            if (errorObject != null) {
                deferred.fail();
            } else if (committed) {
                deferred.resolve();
            } else {
                deferred.fail();
            }
        });
        return deferred.promise();
    },

    setCount: function (gameKey, count) {
        try {
            var game = this.get(gameKey);
            var ref = firebase.database().ref().child("games/" + gameKey + "/users");
            ref.set(count,
                function (errorObject, committed, snapshot) {
                if (errorObject != null) {
                    ShowError("The transaction failed: " + errorObject.message);
                }
            });

        } catch (e) {
            ShowError("increments users failed: " + e.message);
        }
    },

    add: function(game) {
        try {
            var newGame = firebase.database().ref().child("games").push();
            game.key = newGame.key;
            var ref = newGame.set(game);

            ref.then(function (result) {
                ShowError("game added");
            }, function (errorObject) {
                ShowError("add game failed: " + errorObject.message);
                return false;
            });
        } catch (e) {
            ShowError(e.message);
            return false;
        }
        return true;
    },
    find: function(gameid) {

        var game = null;
        // keep complete up to date game state regardless of current UI.
        var i = 0;
        for (i = 0; i < this.list.length; i++) {
            var g = this.list[i];
            if (g.id == gameid) {
                return g;
            }
        }
        return null;
    },
    get: function (key) {

        var game = null;
        // keep complete up to date game state regardless of current UI.
        var i = 0;
        for (i = 0; i < this.list.length; i++) {
            var g = this.list[i];
            if (g.key == key) {
                return g;
            }
        }
        return null;
    },
    remove: function (game) {
        try {
            if (game != null) {
                var ref = firebase.database().ref().child("games/" + game.key);
                ref.remove(function (errorObject) {
                    if (errorObject != null) {
                        ShowError("Remove game '" + game.id + "' failed: " + errorObject.message);
                    }
                    else {
                        ShowError("Remove game '" + game.id + "' succeeded");
                    }
                });
            }

        } catch (e) {
            ShowError(e.message);
            return false;
        }
        return true;

    },
    
    onGamesUpdated: function (newList) {
        if (newList == null) {
            this.list = [];
        } else {
            var game = null;
            for (game in newList) {
                this.onGameAdded(newList[game]);
            }
        }
    },
    
    onGameAdded: function(game) {

        // keep complete up to date game state regardless of current UI.
        var found = false;
        for (g in this.list) {
            if (g.key == game.key) {
                found = true;
            }
        }
        if (!found) {
            this.list.push(game);
            this.fire({
                type: "added",
                game: game,
                target: this
            });
        }

    },
    
    onGameRemoved: function(game) {
        var found = false;
        // keep complete up to date game state regardless of current UI.
        var i = 0;
        for (i = 0; i < this.list.length; i++) {
            var g = this.list[i];
            if (g.key == game.key) {
                this.list.splice(i, 1);
                found = true;
            }
        }
        if (found) {
            this.fire({
                type: "removed",
                game: game,
                target: this
            });
        }
    },
    
    onGameChanged: function(game) {

        // keep complete up to date game state regardless of current UI.
        var i = 0;
        var found = false;
        for (i = 0; i < this.list.length; i++) {
            var g = this.list[i];
            if (g.key == game.key) {
                this.list[i] = game; // save new state
                found = true;
                break;
            }
        }

        var change = "changed";
        if (!found) {
            // weird, why wasn't OnGameAdded called?
            this.list.push(game);
            change = "added";
        }
        this.fire({
            type: change,
            game: game,
            target: this
        });
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

