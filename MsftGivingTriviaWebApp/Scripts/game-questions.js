
// The Questions class maintains the list of questions from the server.
// Call fetch(category) to load the questions, you can addListener('changed',event)
// to be notified when the questions have been updated.

var QuestionLimit = 25;

var Questions = function () {
    this.list = [];
    this._listeners = {};
    this.category = null;
    this.loading = false;
    this.loadingCategory = null;
};

Questions.prototype = {

    constructor: Questions,

    fetch: function (category) {
        // fetch the question categories
        var deferred = $.Deferred();
        var myThis = this;
        if ((this.category == category && this.list != null && this.list.length > 0) ||
            (this.loading && this.loadingCategory == category))
        {
            // nothing to do!
            deferred.resolve();
            return deferred.promise();
        }
        myThis.fire({
            type: "loading",
            category: category
        });
        myThis.loadingCategory = category;
        myThis.loading = true;
        var start = new Date();
        console.log("Loading questions for category '" + category + "'");
        $.getJSON("/play/questions?category=" + category, function (result) {
            myThis.list = result;
            myThis.category = category;
            myThis.fire("changed");
            var stop = new Date();
            var diff = (stop - start) / 1000;
            console.log("Loaded questions for category '" + category + "' in " + diff + " seconds.");
            myThis.fire({
                type: "loaded",
                category: category
            });
            myThis.loading = false;
            deferred.resolve();
        });
        return deferred.promise();
    },

    max: function () {
        return this.list.length < QuestionLimit ? this.list.length : QuestionLimit;
    },

    get: function (i) {
        return this.list[i];
    },

    getById: function (id) {
        var result = null;
        $.each(this.list, function () {
            if (this.Id == id){
                result = this;
            }
        });
        return result;
    },

    getOrderedIndex: function(index, order)
    {
        if (order == null || order == "")
        {
            // hmmm, we don't have a special order, so treat the index as direct.            
            if (index >= 0 && index < this.list.length) {
                return this.list[index];
            }
        }
        else {
            var orderArray = order.split(',');        

            if (index >= 0 && index < orderArray.length) {
                var i = orderArray[index];
                return this.list[i];
            }
        }
    },

    remove: function(id){        
        var i = 0;
        for (i = 0; i < list.length; i++) {
            var q = this.list[i];
            if (q.Id == Id) {
                list.splice(i, 1);
            }
        }
    },

    update: function (question) {
        
        var i = 0;
        var found = false;
        for (i = 0; i < this.list.length; i++) {
            var q = this.list[i];
            if (q.Id == question.Id) {
                this.list[i] = question; // save new state
                found = true;
                break;
            }
        }
        if (!found) {
            // weird, why wasn't OnQuestionAdded called?
            this.list.push(question);
        }
        return found;
    },

    shuffle: function(){
        
        // generate array [0,1,2,3...n]
        var list = $.map(this.list, function (val, i) {
            return i;
        });

        // shuffle it
        var shuffle = ShuffleArray(list);

        // limit it to 25 questions.
        if (shuffle.length > QuestionLimit) {
            shuffle.splice(QuestionLimit, shuffle.length - QuestionLimit);
        }

        console.log("new question shuffle is " + shuffle.toString());
        return shuffle;
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