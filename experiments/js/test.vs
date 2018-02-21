
attribute vec3 vertPos;
attribute vec3 vertColor;

uniform mat4 VP;

varying vec3 fragColor;

void main() {
    gl_Position = VP*vec4(vertPos, 1);
    fragColor = vertColor;
}