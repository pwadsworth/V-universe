// User Settings
var astrdMaxSpeed = 1,  //Asteroids max speed factor (x200 km/s)
    AsteroidsF = 2,     //Seconds between new asteroid creation
    maxSpeed = 60,      //Ship max speed (x1000 km/s) i.e  500=c
    enginePwr = 1,      //Main engine power.
                        //Thrusters = 1/10 enginePwr
    font = '18px Arial',
    fontColor = 'rgb(0,255,0)',
    keyMap = {
        83: 'left',           //S
        70: 'right',          //F
        69: 'engineOn',       //E
        32: 'fireWpn',        //Spacebar
        73: 'thrusterFront',  //I
        74: 'thrusterLeft',   //J
        76: 'thrusterRight',  //L
        75: 'thrusterBack'    //K
    };

//GLOBAL SETUP
var DEBUG = true,         //Debug mode toggle
    utils = new Utils(),
    canvas = document.getElementById('myCanvas'),
    width = window.innerWidth - 25,
    height = window.innerHeight - 25,
    ctx = canvas.getContext("2d"),
    lastRender = 0;

window.addEventListener("keydown", keydown, false);
window.addEventListener("keyup", keyup, false);
window.requestAnimationFrame(loop);
canvas.width = width;
canvas.height = height;

/////////////MODEL/////////////
var model = {
    ship: new PlayerShip(width/5, height/2, enginePwr, maxSpeed),

    lastCharge: 0,

    enemies: [],

    laserBeams: [],

    asteroids: [],

    particles: [],

    lastAsteroidCreation: 0,

    stars: [],

    makeStars: function () {

        for (var i = 0; i <= width; i++) {
          //  model.stars[i] = new Star();
            var x = Math.floor(Math.random() * width)
            var y = Math.floor(Math.random() * height)
            model.stars.push({ x: x, y: y })
        }
    },

    cleanUp: function(arr){
         model[arr] = model[arr].filter(function(x){ return !x.remove});
    }
};

/////////////VIEW/////////////
function view() {
    //Draw background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgb(0,0,0)';
    ctx.fillRect(0, 0, width, height);

   // speed = 0  //map(mouseX, 0, width, 0, 100);
 //   ctx.translate(width / 2, height / 2);
    // for (var i = 0; i < model.stars.length; i++) {
    //     model.stars[i].update();
  //    model.stars[i].show(ctx);
// }
    ctx.fillStyle = 'rgb(255,255,255)';
    model.stars.forEach(function (s) {
        ctx.fillRect(s.x, s.y, 2, 2)
    })
    ctx.save();

    //Draw game elements
    model.asteroids.forEach(function (a) {a.renderIn(ctx)})
    model.enemies.forEach(function (e)  {e.renderIn(ctx)})
    model.particles.forEach(function (p) {p.renderIn(ctx)})
    drawBeams();
    model.ship.renderIn(ctx);
    drawHUD();

    

    function drawBeams() {
        var beams = model.laserBeams;
        ctx.fillStyle = "red";
        beams.forEach(function (b) {
            ctx.fillRect(b.position.x, b.position.y, 3, 3)
        });
       ctx.restore();
    }

    function drawHUD() {
        var s = model.ship;
        var txt =
            "Speed: " + utils.precisionRound((s.velocity.length() * 1000),0).toString(10).substr(0, 5) + " Km/s  " +
            "Aiming: " + s.rotation + "°  "+
            "Power: [" +s.pwrStr() + "]"
        ctx.font = font;
        ctx.fillStyle = 'rgb(0,255,0)';
        if (s.isDead()) ctx.fillStyle = 'rgb(255,0,0)';
        ctx.fillText(txt, (width / 2) - (txt.length * 7 / 2), height - 5)
        ctx.fillText(s.pressedKeys.lastKey, width / 2, 20)
        ctx.restore();
    }
}

function testEnemies(){
  model.enemies.push(new EnemyFighter(width, 50))
  model.enemies.push(new EnemyCorvette(width, 100, 0, 0))
  model.enemies.push(new EnemyFighter(width, 150))
  var theForce = new Vector(-2, 0);  
  model.enemies.forEach(function(e) {
      e.acceleration = theForce;  
  })
}

/////////////CONTROLER/////////////
function controller(progress) {
    var p = progress / 16
    var s = model.ship

    if (model.enemies.length == 0) testEnemies();  //TEST

    model.ship.update(p);
    updateBeams();
    updateAsteroids()
    updateEnemies();
    model.particles.forEach(function (p){
        p.position = p.position.add(p.velocity)
    });

    if (s.pressedKeys.fireWpn) {
        var b = s.fire();
        if (b) model.laserBeams.push(b);
    }
    CleanOutOfFrame();

    function updateEnemies() {
        //Check enemies for hits
        model.enemies.forEach( function(e) {
            model.laserBeams.forEach( function (beam) {
                if (e.isHitBy(beam)) beam.remove = true
            });
            e.update();
        });
        model.cleanUp('enemies');
    }

    function updateBeams() {
        model.laserBeams.forEach(function (beam) {
            if (beam) {
                beam.position = beam.position.add(beam.velocity);
            }
        })
        model.cleanUp('laserBeams');
    }

    function updateAsteroids() {
        //Makes a new asteroid every 'AsteroidF' seconds,
        //updates existing asteroids' positions and
        //handles laser hits.
        var time = Date.now()
        var randomNum = Math.random();

        if ((time - model.lastAsteroidCreation) > AsteroidsF * 1000) {
            var a = new Asteroid();
            model.asteroids.push(a);
            model.lastAsteroidCreation = time
        }

        //Check asteroids for hits
        model.asteroids.forEach( function(a) {
            model.laserBeams.forEach( function (beam) {
                var check = a.isHitBy(beam);
                if (check && check.yes) {
                    check.children.forEach(function (c){
                        model.asteroids.push(c);
                    })
                }
            });
        });
        model.cleanUp('asteroids');

        model.asteroids.forEach(function (a) {
            a.position = a.position.add(a.velocity)
            a.rotation +=  a.spin;
        });
    }

    function CleanOutOfFrame() {
        model.laserBeams = model.laserBeams.filter(isInFrame);
        model.asteroids = model.asteroids.filter(isInFrame);
        model.particles = model.particles.filter(isInFrame);
        function isInFrame(el) {
            if (el){
                if (el.position.x > width + 100 || el.position.y > height + 100) return false;
                if (el.position.x < -100 || el.position.y < -100) return false;
                return true;
            }
        }
    }
}


//////////////// World Events ///////////////////
/////////////////////////////////////////////////
model.makeStars();
function loop(timestamp) {
    var progress = timestamp - lastRender
    controller(progress)
    view()
    lastRender = timestamp
    window.requestAnimationFrame(loop)
}

function onResize() {
    width = window.innerWidth - 25,
        height = window.innerHeight - 25,
        canvas.width = width;
    canvas.height = height;
    model.stars = [];
    model.makeStars();
}

function keydown(event) {
    var mKeys = model.ship.pressedKeys;
    var key = keyMap[event.keyCode];
    mKeys[key] = true;
    mKeys.lastKey = String.fromCharCode(event.keyCode);
}

function keyup(event) {
    var mKeys = model.ship.pressedKeys;
    var key = keyMap[event.keyCode];
    mKeys[key] = false;
    mKeys.lastKey = "";
}
