precision mediump float;

// Attributes
attribute vec3 position; // model coordinate
attribute vec2 uv;
attribute vec3 normal;

// Uniforms
uniform float time; // changes wave form
// for projectionMatrix -> maps world view to screen view
uniform mat4 worldViewProjection;

// Varying
varying vec2 vUv;
varying vec4 vClipSpace;
varying vec2 textureCoords;

const float tiling = 6.0;

float calculateSurface(float x, float z) {
    float scale = 1.0;
    float y = 0.0;
    float heightMultiplier = 0.5;
    y += heightMultiplier * (sin(x * 1.0 / scale + time * 1.0) + sin(x * 2.3 / scale + time * 1.5) + sin(x * 3.3 / scale + time * 0.4)) / 3.0;
    y += heightMultiplier * (sin(z * 0.2 / scale + time * 1.8) + sin(z * 1.8 / scale + time * 1.8) + sin(z * 2.8 / scale + time * 0.8)) / 3.0;
    return y;
}

void main(void){
    // calculate new height of wave > model space
    float newY = calculateSurface(position.x, position.z);

    // calculate new vertex position > model space
    vec3 newPosition = vec3(position.x, newY, position.z);

    // calculate new vertex position -> clipSpace
    // transforms model -> world -> view -> projection
    vClipSpace = worldViewProjection * vec4(newPosition,1.0);
    gl_Position = vClipSpace;

    // texture coords
    // convert from (-0.5 to 0.5) to range (0 to +1.0), add tiling
    textureCoords = vec2(position.x / 2.0 + 0.5, position.z / 2.0 + 0.5 ) * tiling ;
}
