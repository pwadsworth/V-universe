var width = window.innerWidth - 25;
var height = window.innerHeight - 25;

//////////////////////////////////////////////
//Basic moving object class. No edge detection.
function Mover(x, y, shape, mass, life, outline, fill, rotation, spin, radius) {
    this.shape = shape || [[3, -3], [3, 3], [-3, 0], [3, -3]];
    this.mass = mass || 1;
    this.radius = radius || console.log('Bounding radius value is required for calling ' + this.constructor.toString());
    this.rotation = rotation || 0;
    this.spin = spin || 0;
    this.fillColor = fill || 'white';
    this.lineColor = outline || 'white';
    this.life = life || 1;
    this.position = new Vector(x, y);
    this.velocity = new Vector(0, 0);
    this.acceleration = new Vector(0, 0);
}
Mover.prototype = {
    applyForce: function (force) {
        // Newton's 2nd law: F = M * A
        var a = force.divide(this.mass);
        this.acceleration = this.acceleration.add(a);
    },
    update: function () {
        // Velocity changes according to acceleration
        this.velocity = this.velocity.add(this.acceleration);
        // Position changes by velocity
        this.position = this.position.add(this.velocity);
        // Clear acceleration after each frame
        this.acceleration = this.acceleration.multiply(0);
    },
    renderIn: function (ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(utils.toRadian(this.rotation));
        ctx.fillStyle = this.fillColor;
        ctx.strokeStyle = this.lineColor
        ctx.lineWidth = 3;
        ctx.beginPath();
        this.shape.forEach(function (point) {
            ctx.lineTo(point[0], point[1]);
        });
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        ctx.restore();
        if (DEBUG) {
            ctx.strokeStyle = this.lineColor
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI)
            ctx.closePath();
            ctx.stroke();
        }

    },
    isDead: function () { return this.life < 1 }
}
var moverUpdate = Mover.prototype.update; // Globals for method extension
var moverRender = Mover.prototype.renderIn;

///////////////////////////////////////////////
//Bouncer class: A mover that bounces off edges.
//Loses %dampenF (0-1) velocity each bounce
function Bouncer(x, y, shape, mass, life, outline, fill, rotation, spin, dampenF, radius) {
    Mover.call(this, x, y, shape, mass, life, outline, fill, rotation, spin, radius);
    this.dampenF = dampenF || 0.05;
}
Bouncer.prototype = Object.create(Mover.prototype);
Bouncer.prototype.constructor = Bouncer;
Bouncer.prototype.checkEdges = function () {
    if (this.position.y > height) {
        this.velocity.y *= this.dampenF - 1;
        this.position.y = height;
        this.rotation += 180;
    }
    if (this.position.x > width) {
        this.velocity.x *= this.dampenF - 1;
        this.position.x = width;
        this.rotation += 180;
    }
    if (this.position.y < 0) {
        this.velocity.y *= this.dampenF - 1;
        this.position.y = 0;
        this.rotation += 180;
    }
    if (this.position.x < 0) {
        this.velocity.x *= this.dampenF - 1;
        this.position.x = 0;
        this.rotation += 180;
    }
};
Bouncer.prototype.update = function () {
    moverUpdate.call(this);
    this.checkEdges();
};

//////////////////////////////////////////////
//FlyThrough class: A mover that appears on
//the opposite edge after exit.
function FlyThrough(x, y, shape, mass, life, outline, fill, rotation, spin, radius) {
    Mover.call(this, x, y, shape, mass, life, outline, fill, rotation, spin, radius);
}
FlyThrough.prototype = Object.create(Mover.prototype);
FlyThrough.prototype.constructor = FlyThrough;
FlyThrough.prototype.checkEdges = function () {
    if (this.position.y > height) {
        this.position.y = 0;
    }
    if (this.position.x > width) {
        this.position.x = 0;
    }
    if (this.position.y < 0) {
        this.position.y = height;
    }
    if (this.position.x < 0) {
        this.position.x = width;
    }
};


///////////////////////
/////Basic enemy fighter
function EnemyFighter(x, y, rotation) {
    var life = 2, mass = 1, shape = null, outline = '#900', fill = '#900', spin = 0, dampingF = 0.01, radius = 7;
    Bouncer.call(this, x, y, shape, mass, life, outline, fill, rotation, spin, dampingF, radius)
}
EnemyFighter.prototype = Object.create(Bouncer.prototype);
EnemyFighter.prototype.constructor = EnemyFighter;

///////////////////
/////Enemy Corvette
function EnemyCorvette(x, y, rotation, dampenF) {
    var mass = 10, life = 20, fill = '#505', outline = '#717', spin = 0, radius = 35;
    var shape = [
        [-25, 0], [0, 4], [7, 4], [20, 20], [15, 4],     //right side
        [15, -4], [20, -20], [7, -4], [0, -4], [-25, 0], //left side
        [-15, 0], [-7, 7], [-7, -7], [-15, 0]            //nose wing
    ];
    Bouncer.call(this, x, y, shape, mass, life, outline, fill, rotation, spin, dampenF, radius);

}
EnemyCorvette.prototype = Object.create(Bouncer.prototype);
EnemyCorvette.prototype.constructor = EnemyCorvette;



/////////////////////
//////Asteroid Class
function Asteroid( _x, _y, _r, _type) {
    //Set velocity from calling function.
    //If no parameters, it will be random type/size at edge of screen
    this.type = _type;
    this.remove = false;
    var outline, fill, life,
        radius = _r || Math.random() * 40 + 15,
        mass = radius / 3,
        x = _x || width + 50,                //initial position
        y = _y || Math.random() * height,
        n = Math.random() * 15 + 5,          //5 to 15 vertices
        shape = function () {
            var poly = [];
            for (var i = 1; i <= n; i++) {
                var o = Math.random()*30-15; //offset r +/-15
                var r = radius + o;
                var angle = utils.map(i, 0, n, 0, 2*Math.PI)
                var Xi = r*Math.cos(angle);
                var Yi = r*Math.sin(angle);
                poly.push([Xi, Yi])
            }
            return poly;
        }(),
        rotation = Math.random() * 360,
        spin = Math.random() / 2;

    if (this.type === undefined){
        var provRoll = Math.random();
        if (provRoll <= 0.75) {//Carbonaceous asteroids are gray and represent 75 percent of known asteroids. Made of clay and stony silicate rocks.
        this.type = "clay";
        }
        else if  (provRoll < 0.92) {//Silicaceous asteroids are greenish, account for about 17 percent of asteroids. Made of silicate/iron
            this.type = "silicate";
            mass *= 2;
        }
        else  if  (provRoll >= 0.92){//Metallic asteroids are reddish in color, make 13% of known asteroids. Mostly made of nickle-iron.
            this.type = 'metallic';
            mass *= 3;
        }
    }
    if (this.type === 'clay') outline = '#222';
    else if (this.type === 'silicate') outline = '#010';
    else if (this.type === 'metallic') outline = '#100';

    var fill = outline;
    var life = mass;

    Mover.call(this, x, y, shape, mass, life, outline, fill, rotation, spin, radius);
}
Asteroid.prototype = Object.create(Mover.prototype);
Asteroid.prototype.constructor = Asteroid;
Asteroid.prototype.isHitBy = function (point){
    return((point.position.x < this.position.x+this.radius)
        && (point.position.x > this.position.x-this.radius)
        && (point.position.y < this.position.y+this.radius)
        && (point.position.y > this.position.y-this.radius))
}
