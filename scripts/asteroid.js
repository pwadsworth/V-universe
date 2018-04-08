/////////////////////
//////Asteroid Class
function Asteroid( _x, _y, _r, _type) {
    //Set velocity from calling function.
    //If no parameters, it will be random type/size at edge of screen
    this.type = _type;
    this.remove = false;
    var outline, fill, life, 
        rN = Math.random();
        radius = _r || rN * 40 + 15,
        mass = radius / 3,
        x = _x || width + 50,     //initial position
        y = _y || rN * height,
        verts = rN * 15 + 5,      //5 to 15 vertices
        shape = function () {
            var poly = [];
            for (var i = 1; i <= verts; i++) {
                var o = Math.random() * -20;    //offset
                var r = radius + o;
                var angle = utils.map(i, 0, verts, 0, 2*Math.PI)
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
        else  if  (provRoll < 0.99){//Metallic asteroids are reddish in color, make 13% of known asteroids. Mostly made of nickle-iron.
            this.type = 'metallic';
            mass *= 3;              //higher density
        }
        else if (provRoll >= 0.99) { //Pure diamond asteroid at Sammy's request 
            this.type = 'diamond'; 
            mass *= 1000;
        }
    }
    if (this.type === 'clay') outline = '#222';
    else if (this.type === 'silicate') outline = '#010';
    else if (this.type === 'metallic') outline = '#100';
    else if (this.type === 'diamond') outline = '#fff';

    var fill = outline;
    var life = mass;

    Mover.call(this, x, y, shape, mass, life, outline, fill, rotation, spin, radius);
    this.velocity.x = -rN; 
    this.velocity.y = rN/3-0.166; //close to horizontal by default
}
Asteroid.prototype = Object.create(Mover.prototype);
Asteroid.prototype.constructor = Asteroid;

Asteroid.prototype.isHitBy = function (other){
    var result = {yes: false, children: []}
    if ((other.position.x < this.position.x+this.radius)
        && (other.position.x > this.position.x-this.radius)
        && (other.position.y < this.position.y+this.radius)
        && (other.position.y > this.position.y-this.radius)) {
        this.life -= other.force();
        if (this.isDead()) {
            this.remove = true;  //mark for removal
            if (this.radius>20){ 
                //make 2 slower asteroids with different direction
                var v = this.velocity;
                var p = this.position;
                for (var i = -1; i < 2; i += 2 ){   //1up 1down
                    var child = new Asteroid(p.x, p.y+i*20, this.radius/2, this.type);
                    child.velocity = new Vector(v.x/2, i*Math.random()/2, 0);
                   result.children.push(child);
                }
            }
        }
        result.yes = true;
        return result;
    }
}

