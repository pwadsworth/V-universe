//
//     VS intra-galaxy travel animation
//     based on Daniel Shiffman's P5 tutorials
//

var speed = 10;
var width = window.innerWidth - 25;
var height = window.innerHeight - 25;

function Star() {
  this.x = Math.random()*width;
  this.y = Math.random()*height;
  this.z = Math.random()*width;
  this.pz = this.z;
  this.color = utils.random(['orange','gold','blue','white', 'white', 'white','white', 'white', 'white'])

  this.update = function() {
    this.z = this.z - speed;
    if (this.z < 1) {
      this.z = width;
      this.x = Math.random()*width;
      this.y = Math.random()*height;
      this.pz = this.z;
    }
  }

  this.show = function(ctx) {
    ctx.fillStyle = this.color;

    var sx = utils.map(this.x / this.z, 0, 1, 0, width);
    var sy = utils.map(this.y / this.z, 0, 1, 0, height);

    var r = utils.map(this.z, 0, width, 5, 0);
    ctx.fillRect(sx, sy, r, r);

    var px = utils.map(this.x / this.pz, 0, 1, 0, width);
    var py = utils.map(this.y / this.pz, 0, 1, 0, height);

    this.pz = this.z;

    ctx.strokeStyle = this.color;
    ctx.moveTo(sx, sy);
    ctx.lineTo(px, py);

  }
}

