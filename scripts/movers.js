var width = window.innerWidth - 25;
var height = window.innerHeight - 25;

////////////////////////////////////////
//Laser beam class with dummy start up values
function Beam (rem, f, pos, v){  
    this.remove = rem || true;  
    this.force = f || function () {return 0};
    this.position = pos || new Vector (0,0,0);
    this.velocity = v || new Vector(-10,0,0);
};

////////////////////////////////////////
//Particle class. For explosions.
function Particle(vx, vy, px, py, fill){
    this.velocity = new Vector (vx, vy);
    this.position = new Vector (px, py);
    this.fillColor = fill || 'white';
    this.update = function(){
        this.position.add(this.velocity);
    }
    this.renderIn = function(ctx){
        ctx.save();
        ctx.fillStyle = this.fillColor;
        ctx.fillRect(this.position.x, this.position.y, 3 ,3)
        ctx.restore();
    }
}

//////////////////////////////////////////////
//Basic moving object class. No edge detection.
function Mover(x, y, shape, mass, life, outline, fill, rotation, spin, radius) {
    this.shape = shape || [[3, -3], [3, 3], [-3, 0], [3, -3]];
    this.mass = mass || 1;
    this.force = function () {
        return this.mass * (this.velocity.length() || 10);
    }
    this.radius = radius || console.log('Bounding radius value is required for calling ' + this.constructor.toString());
    this.rotation = rotation || 0;
    this.spin = spin || 0;
    this.fillColor = fill || 'white';
    this.lineColor = outline || 'white';
    this.life = life || 1;
    this.position = new Vector(x, y);
    this.velocity = new Vector(0, 0);
    this.acceleration = new Vector(0, 0);
    this.remove = false;
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
    isHitBy: function (other){
        if ((other.position.x < this.position.x+this.radius)
            && (other.position.x > this.position.x-this.radius)
            && (other.position.y < this.position.y+this.radius)
            && (other.position.y > this.position.y-this.radius)) {
                this.life -= other.force();
                this.isDead();
                if (other instanceof Beam){
                    other.remove = true;
                    return true
                }
                other.life -= this.force();
                other.isDead();
                return true
            } else return false;
    },
    isDead: function () {    //check life and flag if dead
        if (this.life < 1) {
            this.remove = true;
            this.explode();
            return true;
        } else return false
    },
    explode: function () {   //make particle explosion
        numParticles = this.mass * 3;
        for (var i = 0; i <= numParticles; i++){
            var vx = Math.random()*6+0.1;
            var vy = Math.random()*6+0.1;
            if (Math.random()>=0.5) vx *= -1;
            if (Math.random()>=0.5) vy *= -1;
            var p = new Particle(vx, vy, this.position.x, this.position.y, '#f50');
            model.particles.push(p)
        }
    }
}

// Globals hooks for method extension
var moverUpdate = Mover.prototype.update; 
var moverRender = Mover.prototype.renderIn;
// var moverIsHitBy = Mover.prototype.isHitBy;

///////////////////////////////////////////////
//Bouncer class: A mover that bounces off edges.
//Loses %dampenF (0-1) velocity each bounce
function Bouncer(x, y, shape, mass, life, outline, fill, rotation, spin, dampenF, radius) {
    Mover.call(this, x, y, shape, mass, life, outline, fill, rotation, spin, radius);
    this.dampenF = dampenF || 0;
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
function EnemyFighter(x, y, rotation, dampenF) {
    var life = 2, mass = 5, shape = null, outline = '#900', fill = '#900', spin = 0, radius = 7;
    Bouncer.call(this, x, y, shape, mass, life, outline, fill, rotation, spin, dampenF, radius)
}
EnemyFighter.prototype = Object.create(Bouncer.prototype);
EnemyFighter.prototype.constructor = EnemyFighter;

///////////////////
/////Enemy Corvette
function EnemyCorvette(x, y, rotation, dampenF) {
    var mass = 10, life = 10, fill = '#505', outline = '#717', spin = 0, radius = 35;
    var shape = [
        [-25, 0], [0, 4], [7, 4], [20, 20], [15, 4],     //right side
        [15, -4], [20, -20], [7, -4], [0, -4], [-25, 0], //left side
        [-15, 0], [-7, 7], [-7, -7], [-15, 0]            //nose wing
    ];
    Bouncer.call(this, x, y, shape, mass, life, outline, fill, rotation, spin, dampenF, radius);

}
EnemyCorvette.prototype = Object.create(Bouncer.prototype);
EnemyCorvette.prototype.constructor = EnemyCorvette;
