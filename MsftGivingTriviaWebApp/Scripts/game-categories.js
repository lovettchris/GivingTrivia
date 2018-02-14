
// The Categories class maintains the list of categories from the server.
// Call 'fetch' to load the categories, you can addListener('changed',event)
// to be notified when the categories have been updated.

var Categories = function () {
    this.list = [];
    this._listeners = {};
    this.used = [];
};

Categories.prototype = {
    
    constructor: Categories,
    
    fetch: function() {
    
        var myThis = this;
        // fetch the question categories
        $.getJSON("/play/categories", function (result) {
            myThis.list = result;
            myThis.fire("changed");
        });
        
    },

    length: function() {
        return this.list.length;
    },

    get: function(i) {
        return this.list[i];
    },

    markUsed: function(cat) {
        this.used.push(cat);
    },

    getUnused: function() {
        var result = [];
        var i = 0;
        var cat = null;
        for (i in this.list)
        {
            cat = this.list[i];
            var j = this.used.indexOf(cat);
            if (j < 0) {
                result.push(cat);
            }
        }
        return result;
    },

    random: function () {
        while (list.length > 0) {
            var i = Math.floor(Math.random() * list.length);
            return list[i];
        }
        return null;
    },

    // event handling
    addListener: function(type, listener){
        if (typeof this._listeners[type] == "undefined"){
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

    removeListener: function(type, listener){
        if (this._listeners[type] instanceof Array){
            var listeners = this._listeners[type];
            for (var i=0, len=listeners.length; i < len; i++){
                if (listeners[i] === listener){
                    listeners.splice(i, 1);
                    break;
                }
            }
        }
    }
}