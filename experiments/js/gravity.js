var canvas = document.querySelector("canvas");

// make canvas take up full page
canvas.width = window.innerWidth
canvas.height = window.innerHeight
var c = canvas.getContext('2d');

// register mouse listeners
var mouseX = 0;
var mouseY = 0;
var leftDown = false;
var rightDown = false;
function mouseMove(e) {
    mouseX = e.x;
    mouseY = e.y;
    mouseX -= canvas.offsetLeft;
    mouseY -= canvas.offsetTop;
}
function mouseDown(e) {
    if (e.button == 0) {
        leftDown = true;
    } else if (e.button == 2) {
        rightDown = true;
    }
}
function mouseUp(e) {
    if (e.button == 0) {
        leftDown = false;
    } else if (e.button == 2) {
        rightDown = false;
    }
}
function resize(e) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
canvas.addEventListener('mousemove', mouseMove);
canvas.addEventListener('mousedown', mouseDown);
canvas.addEventListener('mouseup', mouseUp);
document.addEventListener('contextmenu', event => event.preventDefault());
window.addEventListener('resize', resize)

var alpha = 0;
var beta = 0;
function tilt(acc) {
    alpha = acc[0];
    beta = acc[1];
}

if (window.DeviceOrientationEvent) {
    window.addEventListener("deviceorientation", function () {
        tilt([event.beta, event.gamma]);
    }, true);
} else if (window.DeviceMotionEvent) {
    window.addEventListener('devicemotion', function () {
        tilt([event.acceleration.x * 2, event.acceleration.y * 2]);
    }, true);
}

class ParticleSystem {
    constructor(nParticles, mass, wallDamping, xPosLower, xPosUpper, yPosLower, yPosUpper) {
        this.nParticles = nParticles;
        this.partMass = mass;
        this.wallDamping = wallDamping;
        this.xPosLower = xPosLower;
        this.xPosUpper = xPosUpper;
        this.yPosLower = yPosLower;
        this.yPosUpper = yPosUpper;

        this.partPosX = [];
        this.partPosY = [];
        this.partVelX = [];
        this.partVelY = [];
        this.partAccX = [];
        this.partAccY = [];
        for (var i = 0; i < nParticles; i++) {
            this.partPosX.push(this.lerp(xPosLower, xPosUpper, Math.random()));
            this.partPosY.push(this.lerp(yPosLower, yPosUpper, Math.random()));

            this.partVelX.push(0);
            this.partVelY.push(0);
            this.partAccX.push(0);
            this.partAccY.push(0);
        }
    }

    resetAcc() {
        for (var i = 0; i < this.nParticles; i++) {
            this.partAccX[i] = 0;
            this.partAccY[i] = 0;
        }
    }

    pointAttraction(attractorForce, attractorPosX, attractorPosY) {
        for (var i = 0; i < this.nParticles; i++) {
            var xDist = attractorPosX - this.partPosX[i];
            var yDist = attractorPosY - this.partPosY[i];

            var sqrDist = Math.pow(xDist, 2) + Math.pow(yDist, 2);
            var dist = Math.sqrt(sqrDist);

            var xForce = attractorForce * xDist / dist;
            var yForce = attractorForce * yDist / dist;

            this.partAccX[i] = xForce / this.partMass;
            this.partAccY[i] = yForce / this.partMass;
        }
    }

    step(timeStep) {
        for (var i = 0; i < this.nParticles; i++) {
            this.partVelX[i] += timeStep * this.partAccX[i];
            this.partVelY[i] += timeStep * this.partAccY[i];

            var deltaPartPosX = timeStep * this.partVelX[i];
            var deltaPartPosY = timeStep * this.partVelY[i];

            if (this.partPosX[i] + deltaPartPosX < this.xPosLower) {
                this.partPosX[i] = this.xPosLower;
                this.partVelX[i] *= -1 * wallDamping;
            } else if (this.partPosX[i] + deltaPartPosX > this.xPosUpper) {
                this.partPosX[i] = this.xPosUpper;
                this.partVelX[i] *= -1 * wallDamping;
            } else {
                this.partPosX[i] += deltaPartPosX;
            }

            if (this.partPosY[i] + deltaPartPosY < this.yPosLower) {
                this.partPosY[i] = this.yPosLower;
                this.partVelY[i] *= -1 * wallDamping;
            } else if (this.partPosY[i] + deltaPartPosY > this.yPosUpper) {
                this.partPosY[i] = this.yPosUpper;
                this.partVelY[i] *= -1 * wallDamping;
            } else {
                this.partPosY[i] += deltaPartPosY;
            }
        }
    }

    lerp(lowerVal, upperVal, ratio) {
        return lowerVal + ratio * (upperVal - lowerVal);
    }
}

class ViewPort {
    constructor(xPos, yPos, width, height) {
        this.xPos = xPos;
        this.yPos = yPos;
        this.width = width;
        this.height = height;
    }

    realToViewportCoords(xReal, yReal) {
        var xView = xReal - this.xPos;
        var yView = this.yPos - yReal;
        return [xView, yView];
    }

    viewportToRealCoords(xView, yView) {
        var xReal = xView + this.xPos;
        var yReal = this.yPos - yView;
        return [xReal, yReal];
    }

    viewportToPixCoords(xView, yView, canvas) {
        var widthRatio = canvas.width / this.width;
        var heightRatio = canvas.height / this.height;
        return [xView * widthRatio, yView * heightRatio];
    }

    pixToViewportCoords(xPix, yPix, canvas) {
        var widthRatio = canvas.width / this.width;
        var heightRatio = canvas.height / this.height;
        return [xPix / widthRatio, yPix / heightRatio];
    }

    realToPixCoords(xReal, yReal, canvas) {
        var v = this.realToViewportCoords(xReal, yReal);
        return this.viewportToPixCoords(v[0], v[1], canvas);
    }

    pixToRealCoords(xPix, yPix, canvas) {
        var v = this.pixToViewportCoords(xPix, yPix, canvas)
        return this.viewportToRealCoords(v[0], v[1]);
    }
}

function drawCircle(px, py, radius, context) {
    context.beginPath();
    context.arc(px, py, radius, 0, 2 * Math.PI, false);
    context.stroke();
}

function drawParticleSystem(particleSystem, viewport, canvas, context) {
    for (var i = 0; i < particleSystem.nParticles; i++) {
        var px = particleSystem.partPosX[i];
        var py = particleSystem.partPosY[i];
        var pixCoords = viewport.realToPixCoords(px, py, canvas);
        drawCircle(pixCoords[0], pixCoords[1], 3, context);
    }
}

// Params
var nParticles = 1000;
var particleMass = 100000; // kg
var xPosLower = -10; // m
var xPosUpper = 10; // m
var yPosLower = -(canvas.height / (2 * canvas.width)) * (xPosUpper - xPosLower); // m, trying to maintain aspect ratio
var yPosUpper = -yPosLower; // m, trying to maintain aspect ratio
var attractorForce = 100; // N
var wallDamping = 0.50; // percentage of velocity to keep after collision

var viewPosX = xPosLower; // m
var viewPosY = yPosUpper; // m
var viewHeight = (yPosUpper - yPosLower); // m
var viewWidth = (xPosUpper - xPosLower); // m
var G = 6.67408 * Math.pow(10, -11); // gravitational constant
var timeStep = 2; // seconds per frame

var particleSystem = new ParticleSystem(nParticles, particleMass, wallDamping, xPosLower, xPosUpper, yPosLower, yPosUpper);
var viewport = new ViewPort(viewPosX, viewPosY, viewWidth, viewHeight);

function mainLoop() {
    // physics
    particleSystem.step(timeStep);
    particleSystem.pointAttraction(attractorForce, beta, -alpha);

    /*
    if (leftDown) {
        var realCoords = viewport.pixToRealCoords(mouseX, mouseY, canvas);
        particleSystem.pointAttraction(attractorForce, realCoords[0], realCoords[1]);
    } else if (rightDown) {
        var realCoords = viewport.pixToRealCoords(mouseX, mouseY, canvas);
        particleSystem.pointAttraction(-attractorForce, realCoords[0], realCoords[1]);
    }
    else particleSystem.resetAcc();
    */

    // draw
    c.clearRect(0, 0, canvas.width, canvas.height);
    drawCircle(mouseX, mouseY, 10, c);
    drawParticleSystem(particleSystem, viewport, canvas, c);

    requestAnimationFrame(mainLoop);
}
requestAnimationFrame(mainLoop);
