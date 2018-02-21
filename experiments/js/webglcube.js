
class Canvas {
    constructor(r, g, b, alpha) {
        this.canvas = document.querySelector("canvas");
        this.canvas.width = document.body.scrollWidth;
        this.canvas.height = document.body.scrollHeight;
        this.gl = this.canvas.getContext("webgl2");

        if (!this.gl) alert("Error: unable to initalize WebGL2. Your browser or machine may not support it.");

        // initialize gl settings
        this.setClearColor(r, g, b, alpha);
        this.gl.enable(this.gl.DEPTH_TEST);
    }

    getWidth() {
        return this.canvas.width;
    }

    getHeight() {
        return this.canvas.height;
    }

    getAspectRatio() {
        return this.getWidth() / this.getHeight();
    }

    setClearColor(r, g, b, alpha) {
        this.gl.clearColor(r, g, b, alpha);
    }

    clear() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    viewport(x, y, width, height) {
        this.gl.viewport(x, y, width, height);
    }
}

//TODO: destructor?
class VertexBuffer {
    constructor(data, type, gl) {
        this.gl = gl;
        this.object = gl.createBuffer();
        this.type = type;

        this.bind();
        if (type == gl.ELEMENT_ARRAY_BUFFER)
            gl.bufferData(type, new Uint32Array(data), gl.STATIC_DRAW);
        else
            gl.bufferData(type, new Float32Array(data), gl.STATIC_DRAW);
        this.unbind();
    }

    bind() {
        this.gl.bindBuffer(this.type, this.object);
    }

    unbind() {
        this.gl.bindBuffer(this.type, null);
    }
}

class VertexAttribute {
    constructor(vertBuff, attribLoc, attribSize) {
        this.vertBuff = vertBuff;
        this.attribLoc = attribLoc;
        this.attribSize = attribSize;
    }
}

class VertexArray {
    constructor(vertAttribs, indexData = [], gl) {
        this.gl = gl;
        this.indexCount = indexData.length;

        this.object = gl.createVertexArray();
        this.bind();

        if (this.indexCount != 0) {
            this.ibo = new VertexBuffer(indexData, gl.ELEMENT_ARRAY_BUFFER, gl);
            this.ibo.bind();
        }

        for (var i = 0; i < vertAttribs.length; i++) {
            vertAttribs[i].vertBuff.bind();
            gl.vertexAttribPointer(vertAttribs[i].attribLoc, vertAttribs[i].attribSize, gl.FLOAT, gl.FALSE, 0, 0);
            gl.enableVertexAttribArray(vertAttribs[i].attribLoc);
            vertAttribs[i].vertBuff.unbind();
        }

        this.unbind();

        if (this.indexCount != 0) this.ibo.unbind();
    }

    bind() {
        this.gl.bindVertexArray(this.object);
    }
    unbind() {
        this.gl.bindVertexArray(null);
    }

    getIndexCount() {
        return this.indexCount;
    }
}

// TODO: Destructor?
class Shader {
    constructor(path, type, gl) {
        this.gl = gl;
        this.path = path;

        var source = this.loadFileFromServer(path);
        this.object = gl.createShader(type);
        gl.shaderSource(this.object, source);
        gl.compileShader(this.object);

        this.checkShaderCompErr();
    }

    getObject() { return this.object; }

    loadFileFromServer(path) {
        var result = null;
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", path, false);
        xmlhttp.send();
        if (xmlhttp.status == 200)
            result = xmlhttp.responseText;
        return result;
    }

    checkShaderCompErr() {
        var success = this.gl.getShaderParameter(this.object, this.gl.COMPILE_STATUS);
        if (!success) {
            var infoLog = this.gl.getShaderInfoLog(this.object);
            console.error("Error: Shader " + this.path + " failed to compile " + infoLog);
        }
    }
}

// TODO: destructor?
class Program {
    constructor(shaders, gl) {
        this.object = gl.createProgram();
        this.gl = gl;
        for (var i = 0; i < shaders.length; i++)
            gl.attachShader(this.object, shaders[i].getObject());
        gl.linkProgram(this.object);

        this.checkProgramLinkErr();
    }

    checkProgramLinkErr() {
        var success = this.gl.getProgramParameter(this.object, this.gl.LINK_STATUS);
        if (!success) {
            var infoLog = this.gl.getProgramInfoLog(this.object);
            console.error("Error: Program failed to link " + infoLog);
        }
    }

    bind() {
        this.gl.useProgram(this.object);
    }
    unbind() { this.gl.useProgram(null); }

    getObject() {
        return object;
    }

    // valid types: "float", "vec2", "vec3", "vec4", "mat2", "mat3", "mat4"
    setUniformf(uniformName, type, data) {
        var loc = this.getUniformLocation(uniformName);
        switch (type) {
            case "float":
                this.gl.uniform1f(loc, data[0]); break;
            case "vec2":
                this.gl.uniform2f(loc, data[0], data[1]); break;
            case "vec3":
                this.gl.uniform3f(loc, data[0], data[1], data[2]); break;
            case "vec4":
                this.gl.uniform4f(loc, data[0], data[1], data[2], data[3]); break;
            case "mat2":
                this.gl.uniformMatrix2fv(loc, this.gl.FALSE, data); break;
            case "mat3":
                this.gl.uniformMatrix3fv(loc, this.gl.FALSE, data); break;
            case "mat4":
                this.gl.uniformMatrix4fv(loc, this.gl.FALSE, data); break;
            default:
                console.error("Error: Unknown uniform type specified: " + type);
        }
    }
    setUniform1i(uniformName, data) {
        var loc = this.getUniformLocation(uniformName);
        this.gl.uniform1i(loc, data);
    }

    getUniformLocation(uniformName) {
        var loc = this.gl.getUniformLocation(this.object, uniformName);
        if (loc == -1) console.error("Error: no such uniform name: " + uniformName);

        return loc;
    }

    getAttribLocation(attribName) {
        var loc = this.gl.getAttribLocation(this.object, attribName);
        if (loc == -1) console.error("Error: no such attrib name: " + attribName);

        return loc;
    }
}


class Camera {

    constructor(pos, center, up, fovy, aspectRatio) {
        this.pos = pos;
        this.center = center;
        this.up = vec3.create();
        vec3.normalize(this.up, up);
        this.fovy = fovy;
        this.aspectRatio = aspectRatio;

        this.P = mat4.create();
        this.V = mat4.create();
        this.VP = mat4.create();

        this.updateP();
        this.updateV();
        this.updateVP();
    }

    // getters
    getPos() { return this.pos; }
    getCenter() { return this.center; }
    getUp() { return this.up; }
    getLook() {
        var look = vec3.create();
        vec3.subtract(look, this.center, this.pos);
        vec3.normalize(look, look);
        return look;
    }
    getRight() {
        var right = vec3.create();
        vec3.cross(right, this.getLook(), this.up);
        vec3.normalize(right, right);
        return right;
    }
    getFovy() { return this.fovy; }
    getAspectRatio() { return this.aspectRatio; }
    getVP() { return this.VP; }
    getV() { return this.V; }
    getP() { return this.P }

    // setters
    setPos(val) {
        this.pos = val;
        this.updateV();
        this.updateVP();
    }
    setUp(val) {
        vec3.normalize(this.up, val);
        this.updateV();
        this.updateVP();
    }
    setFovy(val) {
        this.fovy = fov;
        this.updateP();
        this.updateVP();
    }
    setAspectRatio(val) {
        this.aspectRatio = val;
        this.updateP();
        this.updateVP();
    }

    updateVP() {
        mat4.multiply(this.VP, this.P, this.V);
    }
    updateV() {
        mat4.lookAt(this.V, this.pos, this.center, this.up);
    }
    updateP() {
        mat4.perspective(this.P, this.fovy, this.aspectRatio, 0.1, 100.0);
    }
}

var canvas = new Canvas(0, 0, 0, 1.0);
canvas.viewport(0, 0, canvas.getWidth(), canvas.getHeight());
canvas.clear();

cam = new Camera([3, 3, 3], [0, 0, 0], [0, 1, 0], Math.PI / 2.0, canvas.getAspectRatio());

var vertices = [
    -0.5, -0.5, 0.5,
    0.5, -0.5, 0.5,
    -0.5, 0.5, 0.5,
    0.5, 0.5, 0.5,
    -0.5, -0.5, -0.5,
    0.5, -0.5, -0.5,
    -0.5, 0.5, -0.5,
    0.5, 0.5, -0.5,
];

var vertColors = [
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 0.0, 1.0,
    1.0, 1.0, 0.0,
    1.0, 0.0, 1.0,
    0.0, 1.0, 1.0,
    1.0, 1.0, 1.0,
    0.5, 0.5, 0.5
]

var indices = [
    0, 1, 2, 3, 7, 1, 5, 4, 7, 6, 2, 4, 0, 1
];

// register mouse listeners
var mouseX = 0;
var mouseY = 0;
var mouseDeltaX = 0;
var mouseDeltaY = 0;
var leftDown = false;
var rightDown = false;
function mouseMove(e) {
    mouseDeltaX = mouseX;
    mouseDeltaY = mouseY;

    mouseX = e.x;
    mouseY = e.y;
    mouseX -= canvas.canvas.offsetLeft;
    mouseY -= canvas.canvas.offsetTop;

    mouseDeltaX = mouseX - mouseDeltaX;
    mouseDeltaY = mouseY - mouseDeltaY;
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
canvas.canvas.addEventListener('mousemove', mouseMove);
canvas.canvas.addEventListener('mousedown', mouseDown);
canvas.canvas.addEventListener('mouseup', mouseUp);


var vertShader = new Shader("/experiments/js/test.vs", canvas.gl.VERTEX_SHADER, canvas.gl);
var fragShader = new Shader("/experiments/js/test.fs", canvas.gl.FRAGMENT_SHADER, canvas.gl);
var program = new Program([vertShader, fragShader], canvas.gl);

var vbo_pos = new VertexBuffer(vertices, canvas.gl.ARRAY_BUFFER, canvas.gl);
var vbo_color = new VertexBuffer(vertColors, canvas.gl.ARRAY_BUFFER, canvas.gl);
var vertAttribs = [new VertexAttribute(vbo_pos, program.getAttribLocation("vertPos"), 3), new VertexAttribute(vbo_color, program.getAttribLocation("vertColor"), 3)];
var vao_tri = new VertexArray(vertAttribs, indices, canvas.gl);

function mainLoop() {
    // update model
    if (leftDown) {
        var pos = cam.getPos();
        vec3.rotateY(pos, pos, vec3.fromValues(0, 0, 0), -mouseDeltaX / 100.);
        var transform = mat4.create();
        mat4.fromRotation(transform, -mouseDeltaY / 100., cam.getRight());
        var pos4 = vec4.fromValues(pos[0], pos[1], pos[2], 1);
        vec4.transformMat4(pos4, pos4, transform);
        pos = vec3.fromValues(pos4[0], pos4[1], pos4[2]);
        cam.setPos(pos);


        mouseDeltaX = 0;
        mouseDeltaY = 0;
    }

    // update view
    canvas.clear();
    program.bind();
    vao_tri.bind();
    program.setUniformf("VP", "mat4", cam.getVP());
    canvas.gl.drawElements(canvas.gl.TRIANGLE_STRIP, vao_tri.getIndexCount(), canvas.gl.UNSIGNED_INT, 0);
    program.unbind();
    vao_tri.unbind();

    requestAnimationFrame(mainLoop);
}

mainLoop();
