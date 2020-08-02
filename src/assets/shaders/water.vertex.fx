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
varying vec3 vPosition;

const float tiling = 1.0;

vec3 calculateGerstnerWave(vec4 wave, vec3 position, inout vec3 binormal, inout vec3 tangent){
  float steepness = wave.z;
  float waveLength = wave.w;

  float waveNumber = 2.0 * PI / waveLength; // k in original post
  // phasespeed depends of gravity
  float phaseSpeed = sqrt(9.8 / waveNumber); // c

  vec2 directionN = normalize(wave.xy); // d

  float f = waveNumber * (dot(directionN, position.xz) - phaseSpeed * time);
  float steepnessFactor = steepness / waveNumber; // a

  tangent += vec3(
    -directionN.x * directionN.x * (steepness * sin(f)),
    directionN.x * (steepness * cos(f)),
    -directionN.x * directionN.y * (steepness* sin(f))
  );

  binormal += vec3(
    -directionN.x * directionN.y * (steepness * sin(f)),
    directionN.y * (steepness * cos(f)),
    -directionN.y * directionN.y * (steepness * sin(f))
  );

  return vec3(
  	directionN.x * (steepnessFactor * cos(f)),
  	steepnessFactor * sin(f),
    directionN.y * (steepnessFactor * cos(f))
  );
}

void main(void){
    vec3 tangent = vec3(1.0,0,0);
    vec3 binormal = vec3(0,0,1.0);

    // wave
    // x: x direction
    // y: y direction
    // z: z steepness
    // w: waveLength -> occurence
    vec4 waveA = vec4(1.0,1.,0.01,10.0);
    vec4 waveB = vec4(1.0,0.6,0.01,8.);
    vec4 waveC = vec4(0.8,1.3,0.01,10.);
    vec4 waveD = vec4(1.0,.5,0.01,6.0);
    vec4 waveE = vec4(0.5,0.6,0.01,10.0);
    vec4 waveF = vec4(0.5,0.4,0.005,8.0);


    vec3 newPosition = position;
    newPosition += calculateGerstnerWave(waveA, position, binormal, tangent);
    newPosition += calculateGerstnerWave(waveB, position, binormal, tangent);
    newPosition += calculateGerstnerWave(waveC, position, binormal, tangent);
    newPosition += calculateGerstnerWave(waveD, position, binormal, tangent);
    newPosition += calculateGerstnerWave(waveE, position, binormal, tangent);
    newPosition += calculateGerstnerWave(waveF, position, binormal, tangent);

    // calculate new vertex position -> clipSpace
    // transforms model -> world -> view -> projection
    vClipSpace = worldViewProjection * vec4(newPosition,1.0);

    // texture coords
    // convert from (-0.5 to 0.5) to range (0 to +1.0), add tiling
    textureCoords = vec2(position.x / 2.0 + 0.5, position.z / 2.0 + 0.5 ) * tiling ;
    
    vNormalW = normalize(vec3(world * vec4(normal, 0.0)));
    vNewNormal = normalize(cross(binormal, tangent));

    vPosition = newPosition;
    gl_Position = vClipSpace;
}
