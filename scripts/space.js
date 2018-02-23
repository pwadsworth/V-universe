//
//     VS intra-galaxy travel animation
//     based on Daniel Shiffman's P5 tutorials
//


var stars = [];
var speed;

function setup() {
  createCanvas( window.innerWidth-10 , window.innerHeight-10 );
  for (var i = 0; i < 1500; i++) {
    stars[i] = new Star();
  }
}

function draw() {
  speed = map(mouseX, 0, width, 0, 100);
  background(0);
  translate(width / 2, height / 2);
  for (var i = 0; i < stars.length; i++) {
    stars[i].update();
    stars[i].show();
  }
}

function Star() {
  this.x = random(-width, width);
  this.y = random(-height, height);
  this.z = random(width);
  this.pz = this.z;
  this.color = random(['orange','gold','blue','white', 'white', 'white','white', 'white', 'white'])

  this.update = function() {
    this.z = this.z - speed;
    if (this.z < 1) {
      this.z = width;
      this.x = random(-width, width);
      this.y = random(-height, height);
      this.pz = this.z;
    }
  }

  this.show = function(ctx) {
    fill(this.color);
    noStroke();

    var sx = map(this.x / this.z, 0, 1, 0, width);
    var sy = map(this.y / this.z, 0, 1, 0, height);

    var r = map(this.z, 0, width, 5, 0);
    ellipse(sx, sy, r, r);

    var px = map(this.x / this.pz, 0, 1, 0, width);
    var py = map(this.y / this.pz, 0, 1, 0, height);

    this.pz = this.z;

    stroke(this.color);
    line(px, py, sx, sy);

  }
}

function StarField(ctx){
  for (var i = 0; i < 1500; i++) {
    stars[i] = new Star();
  }
}
