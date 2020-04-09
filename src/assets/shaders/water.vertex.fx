precision mediump float;
#define PI 3.1415926538

// Attributes
attribute vec3 position; // model coordinate
attribute vec2 uv;
attribute vec3 normal;

// Uniforms
uniform float time; // changes wave form
// for projectionMatrix -> maps world view to screen view
uniform mat4 worldViewProjection;
uniform vec3 cameraPosition;
uniform mat4 world;

// Varying
varying vec2 vUv;
varying vec4 vClipSpace;
varying vec2 textureCoords;
varying vec3 vPositionW;
varying vec3 vPositionM;
varying vec3 vNormalW;
varying vec3 vNewNormal;

const float tiling = 1.0;
const float waveHeightScale = 0.1;

float calculateSurface(float x, float z) {
    float scale = 1.0;
    float y = 0.0;
    float heightMultiplier = 0.3;
    y += heightMultiplier * (sin(x * 1.0 / scale + time * 1.0) + sin(x * 2.3 / scale + time * 1.5) + sin(x * 3.3 / scale + time * 0.4)) / 3.0;
    y += heightMultiplier * (sin(z * 0.2 / scale + time * 1.8) + sin(z * 1.8 / scale + time * 1.8) + sin(z * 2.8 / scale + time * 0.8)) / 3.0;
    return y;
}

vec3 calculateGerstnerWave(vec4 wave, vec3 position, inout vec3 binormal, inout vec3 tangent){
  float steepness = wave.z;
  float waveLength = wave.w;

  float waveNumber = 2.0 * PI / waveLength;
  float phaseSpeed = sqrt(9.8 / waveNumber);
  vec2 directionN = normalize(wave.xy);

  float f = waveNumber * (dot(directionN, position.xz) - phaseSpeed * time);
  float steepnessFactor = steepness / waveNumber;

  tangent += vec3(
    -directionN.x * directionN.x * (steepnessFactor * sin(f)),
    directionN.x * (steepnessFactor * cos(f)),
    -directionN.x * directionN.y * (steepnessFactor * sin(f))
  );

  binormal += vec3(
    -directionN.x * directionN.y * (steepnessFactor * sin(f)),
    directionN.y * (steepnessFactor * cos(f)),
    -directionN.y * directionN.y * (steepnessFactor * sin(f))
  );

  vec3 newPosition = vec3(
  	(steepnessFactor * cos(f)),
  	steepnessFactor * sin(f) * waveHeightScale,
    (steepnessFactor * cos(f))
  );
  return newPosition;
}

void main(void){
    // calculate new height of wave > model space
    //float newY = calculateSurface(position.x, position.z);

    vec3 tangent = vec3(0,0,0);
    vec3 binormal = vec3(0,0,0);

    // calculate new vertex position > model space
    // vec3 newPosition = vec3(position.x, position.y, position.z);
    //vec3 newPosition = vec3(position.x, newY, position.z);
    vec4 waveA = vec4(1.0,0.8,0.3,20.0);
    vec4 waveB = vec4(1.0,1.0,0.2,40.0);
    vec4 waveC = vec4(1.0,0.4,0.1,30.0);


    vec3 newPosition = position;
    newPosition += calculateGerstnerWave(waveA, position, binormal, tangent);
    newPosition += calculateGerstnerWave(waveB, position, binormal, tangent);
    newPosition += calculateGerstnerWave(waveC, position, binormal, tangent);
    //newPosition.y += 20.0;
    // calculate new vertex position -> clipSpace
    // transforms model -> world -> view -> projection
    vClipSpace = worldViewProjection * vec4(newPosition,1.0);
    gl_Position = vClipSpace;

    vNewNormal = normalize(cross(binormal, tangent));

    // texture coords
    // convert from (-0.5 to 0.5) to range (0 to +1.0), add tiling
    textureCoords = vec2(position.x / 2.0 + 0.5, position.z / 2.0 + 0.5 ) * tiling ;

    vPositionM = newPosition;
    // to Camera Vector
    vPositionW = vec3(world * vec4(newPosition, 1.0));
    vNormalW = normalize(vec3(world * vec4(normal, 0.0)));
}
