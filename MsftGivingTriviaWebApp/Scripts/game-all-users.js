// This class manages the list of all users across all games.
// This class raises 4 events: 
//  reset - a new user list is just set (evt.list) 
//  added - a new user is added (evt.user)
//  removed - a user was removed (evt.user)
//  changed - a user was changed (evt.user)
var Users = function () {
    this.list = null;
    this._listeners = {};
    this.connecting = false;
};

Users.prototype = {

    constructor: Users,

    connect: function () {

        var myThis = this;
        this.connecting = true;
        this.list = [];

        try {
            // watch the users list so we can display a high score list (hope this doesn't get too big...)
            var ref = firebase.database().ref().child("users");
            ref.once("value", function (snapshot) {
                var users = snapshot.val();
                if (users != null) {
                    myThis.onUsersUpdated(users);
                }
            }, function (errorObject) {
                ShowError("read users failed: " + errorObject.message);
            });

            ref.on("child_added", function (snapshot) { myThis.onUserAdded(snapshot.val()); });
            ref.on("child_removed", function (snapshot) { myThis.onUserRemoved(snapshot.val()); });
            ref.on("child_changed", function (snapshot) { myThis.onUserChanged(snapshot.val()); });
        } catch (e) {
            ShowError(e.message);
        }
        this.connecting = false;

    },

    disconnect: function(){        
        try {
            // stop watching list of users in current game.
            var ref = firebase.database().ref().child("users");
            ref.off("child_added");
            ref.off("child_removed");
            ref.off("child_changed");
        } catch (e) {
            ShowError(e.message);
        }
    },

    reset: function () {

        try {
            var ref = firebase.database().ref().child("/users");
            ref.remove(function (errorObject) {
                if (errorObject != null) {
                    ShowError("Remove users failed: " + errorObject.message);
                }
            });
            var ref2 = firebase.database().ref().child("/usergames");
            ref2.remove(function (errorObject) {
                if (errorObject != null) {
                    ShowError("Remove users failed: " + errorObject.message);
                }
            });

        } catch (e) {
            ShowError("Remove users failed: " + e.message);
        }
    },

    setUserScore: function (user, score)
    {
        try {
            var key = GetValidKey(user.id);
            var ref = firebase.database().ref().child("/users/" + key);
            ref.update({
                score: score
            }, function (errorObject) {
                if (errorObject != null) {
                    ShowError("Set user score failed: " + errorObject.message);
                }
            });

        } catch (e) {
            ShowError("Set user score failed: " + e.message);
        }
    },
    
    add : function(userid) {
        if (typeof (userid) == "string" && userid != "") {
            try {
                var key = GetUserKey();
                var ref = firebase.database().ref().child("users/" + key);
                ref.once("value", function (snapshot) {
                    var user = snapshot.val();
                    if (user == null) {
                        ref.set({
                            id: userid,
                            score:0,
                            wins: 0
                        }, function (errorObject) {
                            if (errorObject != null) {
                                ShowError("Add user failed: " + errorObject.message);
                            }
                        });
                    }
                }, function (errorObject) {
                    ShowError("read users : " + errorObject.message);
                });


            } catch (e) {
                ShowError("read users failed: " + e.message);
            }
        }
    },

    incrementScore: function(key, points)
    {
        try {
            if (points == 0) {
                return; // nothing to do.
            }
            var ref = firebase.database().ref().child("/users/" + key + "/score");
            ref.transaction(function (current_value) {
                if (typeof (current_value) != "number") {
                    return points;
                }
                return current_value + points;
            }, function (errorObject, committed, snapshot) {
                if (errorObject != null) {
                    ShowError("increment total score failed: " + errorObject.message);
                }
            });

        } catch (e) {
            ShowError("increment total score failed: " + e.message);
        }
    },

    incrementWins: function(key, delta){
        
        try {
            var ref = firebase.database().ref().child("/users/" + key + "/wins");
            ref.transaction(function (current_value) {
                if (typeof (current_value) != "number") {
                    return delta;
                }
                return current_value + delta;
            }, function (errorObject, committed, snapshot) {
                if (errorObject != null) {
                    ShowError("increment wins failed: " + errorObject.message);
                }
            });

        } catch (e) {
            ShowError("increment wins failed: " + e.message);
        }
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

    onUsersUpdated: function(newList)
    {
        var myThis = this;
        if (newList == null) {
            this.list  = [];
        }
        else
        {
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

    onUserAdded: function(newUser)
    {
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

        if (found) {
            this.fire({
                type: "added",
                user: newUser,
                target: this
            });
        }
        else {
            this.fire({
                type: "changed",
                user: newUser,
                target: this
            });
        }

    },

    onUserRemoved: function(user)
    {
        // keep complete up to date user state regardless of current UI.
        var i = 0;
        for (i = 0; i < this.list.length; i++) {
            var u = this.list[i];
            if (u.id == user.id) {
                this.list.splice(i, 1);
            }
        }
                
        this.fire({
            type: "removed",
            user: user,
            target: this
        });
    },

    onUserChanged: function (user) {
    
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
            // weird, why wasn't OnUserAdded called yet?
            this.list.push(user);
        }

        this.fire({
            type: "changed",
            user: user,
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

