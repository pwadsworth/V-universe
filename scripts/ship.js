/////////////////////////////////////////////
///////////////Player Ship
function PlayerShip(x, y, enginePwr, maxSpeed) {
    var playerShape = [[0, 5], [10, 15], [10, 0], [10, 15], [0, -15],
                       [-10, 15], [-10, 0], [-10, 15], [0, 5]];
    var mass = 10,
        life = 10,
        outline = '#889',
        fill = '#eee',
        rotation = 90,
        spin = 0,
        radius = 25;
    FlyThrough.call(this, x, y, playerShape, mass, life, outline, fill, rotation, spin, radius);

    this.enginePwr = enginePwr || 1;
    this.maxSpeed = maxSpeed || 60;
    this.pwr = 1000;
    this.fireRate = 200         //one shot every x milliseconds
    this.pwrStr =  function () {///visual representation of pwr
        if (this.pwr <= 0) return "          "; //No power
        for (var power = ""; power.length < this.pwr/100; power+="|") {}
        power = utils.padRight(power, " ", 10)
        return power;
    };
    this.lastLaser = 0;
    this.pressedKeys = {
        left: false,
        right: false,
        engineOn: false,
        fireWpn: false,
        thrusterFront: false,
        thrusterRight: false,
        thrusterLeft: false,
        thrusterBack: false,
        lastKey: ""
    };
}
PlayerShip.prototype = Object.create(FlyThrough.prototype);
PlayerShip.prototype.constructor = PlayerShip;
PlayerShip.prototype.renderIn = function (ctx) {
    ctx.save();
    moverRender.call(this, ctx);
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(utils.toRadian(this.rotation));
    //Engine
    if (this.pwr > -1) {
        if (this.pressedKeys.engineOn) {
            ctx.fillStyle = 'rgb(255,0,0)';
            outline([[-3, 7], [0, 30], [3, 7]], 0, 5);
            ctx.fill();
        }
        //Thrusters
        if (this.pressedKeys.thrusterFront) {
            ctx.fillStyle = 'rgb(0,255,250)';
            outline([[1, -25], [-1, -25], [0, -21]], 0, -14);
            ctx.fill();
        }

        if (this.pressedKeys.thrusterRight) {
            ctx.fillStyle = 'rgb(0,255,250)';
            outline([[10, 6], [10, 4], [10, 5]], 20, 5);
            ctx.fill();
        }

        if (this.pressedKeys.thrusterLeft) {
            ctx.fillStyle = 'rgb(0,255,250)';
            outline([[-10, 6], [-10, 4], [-10, 5]], -20, 5)
            ctx.fill()
        }

        if (this.pressedKeys.thrusterBack) {
            ctx.fillStyle = 'rgb(0,255,250)';
            outline([[1, 15], [-1, 15], [0, 6]], 0, 5);
            ctx.fill();
        }
    }
    function outline(shape, _initX, _initY) {
        ctx.beginPath();
        ctx.moveTo(_initX || 0, _initY || 0);
        shape.forEach(function (point) {
            ctx.lineTo(point[0], point[1]);
        });
        ctx.closePath();
    }
    ctx.restore();
};
PlayerShip.prototype.update = function (p) {
    //Method extension called at end, after setup.
    //update PWR
    if (this.pwr < 1000) this.pwr += 1;
    /////update inputs
    if (this.pressedKeys.left) {
        this.rotation -= p * 3;
        this.rotation %= 360;
    }
    else if (this.pressedKeys.right) {
        this.rotation += p * 3;
        this.rotation %= 360;
    }
    this.rotation = Math.round(this.rotation)
    if (this.rotation < 0) this.rotation += 360; // 0-360 clockwise

    ///Update Thrust
    var engineForce = p * this.enginePwr;
    var thrusterForce = engineForce / 10;
    var rotation = utils.toRadian(this.rotation - 90)
    if (this.pressedKeys.engineOn) {
        if (this.pwr > 0) {
            var x = engineForce * Math.cos(rotation)
            var y = engineForce * Math.sin(rotation)
            this.applyForce(new Vector(x, y));
            this.pwr -= this.enginePwr * 3;
        }
    }
    if (this.pressedKeys.thrusterFront) {
        var x = -thrusterForce * Math.cos(rotation)
        var y = -thrusterForce * Math.sin(rotation)
        this.applyForce(new Vector(x, y))
        this.pwr -= this.enginePwr;
    }
    if (this.pressedKeys.thrusterRight) {
        var x = thrusterForce * Math.sin(rotation)
        var y = -thrusterForce * Math.cos(rotation)
        this.applyForce(new Vector(x, y))
        this.pwr -= this.enginePwr;
    }
    if (this.pressedKeys.thrusterLeft) {
        var x = -thrusterForce * Math.sin(rotation)
        var y = thrusterForce * Math.cos(rotation)
        this.applyForce(new Vector(x, y))
        this.pwr -= this.enginePwr;
    }
    if (this.pressedKeys.thrusterBack) {
        var x = thrusterForce * Math.cos(utils.toRadian(this.rotation - 90))
        var y = thrusterForce * Math.sin(utils.toRadian(this.rotation - 90))
        this.applyForce(new Vector(x, y))
        this.pwr -= this.enginePwr;
    }
    // Limit max speed   **Global setting
    if (this.velocity.length() > this.maxSpeed) {
        this.velocity = this.velocity.limit(this.maxSpeed)
    }
    moverUpdate.call(this)
    this.checkEdges();
}

PlayerShip.prototype.fire = function () {
    var dT =  Date.now()- this.lastLaser;
    if ((this.pwr > 5) && (dT > this.fireRate) ) {
        this.lastLaser = Date.now()
        this.pwr -= 5;
        switch (this.wpnType){
            case 'double':{
                //TODO
                break;
            }
            case 'mega': {
                //TODO
                break;
            }
            default:
                var x = 10 * Math.cos(utils.toRadian(this.rotation-90));
                var y = 15 * Math.sin(utils.toRadian(this.rotation-90));
                var beam = {
                    remove: false,
                    position: this.position,
                    velocity: this.velocity.add(new Vector(x,y,0)),
                }
                break;
        }
        return beam;
    }
}
