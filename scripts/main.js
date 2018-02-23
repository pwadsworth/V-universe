// User Settings
var astrdMaxSpeed = 1,  //Asteroids max speed factor (x200 m/s)
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
var DEBUG = false,         //Debug mode toggle
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
    tester: new EnemyCorvette(100, 100, 180),

    ship: new PlayerShip(width/5, height/2, enginePwr, maxSpeed),

    lastCharge: 0,

    laserBeams: [],

    asteroids: [],

    lastAsteroidCreation: 0,

    stars: [],

    makeStars: function () {
        for (var i = 0; i <= width / 2; i++) {
            var x = Math.floor(Math.random() * width)
            var y = Math.floor(Math.random() * height)
            model.stars.push({ x: x, y: y })
        }
    },

    cleanUp: function(){//remove asteroids and lasers flagged
        model.asteroids = model.asteroids.filter(function(x){
            return !x.remove});
        model.laserBeams = model.laserBeams.filter(function(x){
            return !x.remove});
    }
}

/////////////VIEW/////////////
function view() {
    //Draw background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgb(0,0,0)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'rgb(255,255,255)';
    model.stars.forEach(function (s) {
        ctx.fillRect(s.x, s.y, 2, 2)
    })
    ctx.save();

    //Draw game elements
    model.tester.renderIn(ctx);  //test
    model.ship.renderIn(ctx);
    model.asteroids.forEach(function (a) {a.renderIn(ctx)})

    drawBeams();
   // drawAsteroids();
    drawHUD();

    function drawBeams() {

        var beams = model.laserBeams;

        ctx.fillStyle = "red";
        beams.forEach(function (b) {
            ctx.fillRect(b.position.x, b.position.y, 2, 2)
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

    function drawAsteroids() {
        var astrds = model.asteroids;
        ctx.fillStyle = 'gray';
        astrds.forEach(function (astrd) {
            ctx.save();
            ctx.rotate(utils.toRadian(astrd.rotation));
            outline(astrd.shape)
            ctx.fill();
            ctx.restore();
        });
        ctx.restore();
    }

    function outline(shape, _initX, _initY) {
        ctx.beginPath();
        ctx.moveTo(_initX || 0, _initY || 0)
        shape.forEach(function (point) {
            ctx.lineTo(point[0], point[1]);
        });
        ctx.closePath();
    }
}


var theForce = new Vector(2, 0);         // test
model.tester.acceleration = theForce;    // test

/////////////CONTROLER/////////////
function controller(progress) {
    var p = progress / 16
    var s = model.ship

    model.tester.update();               //test
    model.ship.update(p);
    updateBeams();
    updateAsteroids()
    CleanOutOfFrame();

    function updateBeams(p) {
        if (s.pressedKeys.fireWpn && s.pwr > 50) {
            var b = s.fire();
            if (b) model.laserBeams.push(b);
        }
        model.laserBeams.forEach(function (beam) {
            if (beam) {
                beam.position = beam.position.add(beam.velocity);
            }
        })
    }

    function updateAsteroids() {
        //Makes a new asteroid every 'AsteroidF' seconds,
        //updates existing asteroids' positions and
        //handles laser hits.
        var time = Date.now()
        var randomNum = Math.random();

        if ((time - model.lastAsteroidCreation) > AsteroidsF * 1000) {
            var a = new Asteroid();
            a.velocity.x = -randomNum;
            a.velocity.y = randomNum/3-0.166; //close to horizontal
            model.asteroids.push(a);
            model.lastAsteroidCreation = time
        }

        //Check asteroids for hits
        model.asteroids.forEach(function(a) {
            model.laserBeams.forEach( function (beam) {
                if (a.isHitBy(beam)) {
                    a.remove = true;  //mark for removal
                    beam.remove = true
                    if (a.radius>20){ //make 2 slower children with
                                      //different vertical angle
                        var v = a.velocity;
                        var p = a.position;
                        for (var i = -1; i < 2; i += 2 ){
                            //one child goes up one down
                            var child = new Asteroid(p.x, p.y+i*20, a.radius/2, a.type);
                            child.velocity = new Vector(v.x/2, i*randomNum/2, 0);
                            model.asteroids.push(child);
                        }
                    }
                }
            });
        });
        model.cleanUp();

        model.asteroids.forEach(function (a) {
            a.position = a.position.add(a.velocity)
            a.rotation +=  a.spin;
        });
    }



    function CleanOutOfFrame() {
        model.laserBeams = model.laserBeams.filter(isInFrame);
        model.asteroids = model.asteroids.filter(isInFrame);
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

 /*  EXPLOSION   // shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function( callback ){
              window.setTimeout(callback, 1000 / 60);
            };
  })();

  var canvas = document.getElementById("canvas"),
      ctx = canvas.getContext("2d"),
      W = window.innerWidth,
      H = window.innerHeight,
      circles = [];

  canvas.width = W;
  canvas.height = H;

  //Random Circles creator
  function create() {

      //Place the circles at the center

      this.x = W/2;
      this.y = H/2;


      //Random radius between 2 and 6
      this.radius = 2 + Math.random()*2;

      //Random velocities
      this.vx = -5 + Math.random()*10;
      this.vy = -5 + Math.random()*10;

      //Random colors
      this.r = 100+Math.round(Math.random())*140;
      this.g = 60;
      this.b = 10;
  }

  for (var i = 0; i < 100; i++) {
      circles.push(new create());
  }

  function draw() {

      //Fill canvas with black color
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(0, 0, W, H);

      //Fill the canvas with circles
      for(var j = 0; j < circles.length; j++){
          var c = circles[j];

          //Create the circles
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.radius, 0, Math.PI*2, false);
          ctx.fillStyle = "rgba("+c.r+", "+c.g+", "+c.b+", 0.5)";
          ctx.fill();

          c.x += c.vx;
          c.y += c.vy;
          c.radius -= .02;

          if(c.radius < 0)
              circles[j] = new create();
      }
  }

  function animate() {
      requestAnimFrame(animate);
      draw();
  }

 */