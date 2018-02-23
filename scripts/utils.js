function Utils() {
    this.clone = function (obj) {
        // Takes an object and retuns a copy
        if (obj == null || typeof (obj) != 'object')
            return obj;
        var temp = new obj.constructor();
        for (var key in obj)
            temp[key] = this.clone(obj[key]);
        return temp;
    }

    this.precisionRound= function (number, precision) {
        // Rounds number given to provided precision
        var factor = Math.pow(10, precision);
        return Math.round(number * factor) / factor;
    }

    this.toRadian= function (x) {
        return (x * Math.PI / 180);
    }

    this.random= function (array) {
        //Returns random element from an array
        return array[Math.floor(Math.random() * array.length)];
    }

    this.randomIntTo= function(x){
        return Math.round(Math.random()*(x));
    }

    this.padRight= function (str, char, num) {
        // Returns a string padded right with char, num times
        if (!str || !char || str.length >= num) {
            return str;
        }
        var max = (num - str.length) / char.length;
        for (var i = 0; i < max; i++) {
            str += char;
        }
        return str;
    }

    this.map= function (param, in_min, in_max, out_min, out_max) {
        return (param - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    }
}
 
