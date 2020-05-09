precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

// Uniforms
uniform mat4 worldViewProjection;
uniform mat4 worldView;
uniform sampler2D heightMap;
uniform vec2 resolution;
uniform float steepnessFactor;

// Varying
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

float getVertexHeight(vec2 uvParameter){
   // calculate new position
   float heightValueBase = texture2D(heightMap, uvParameter).x;
   // move 0.0-1.0 up to 1.0-2.0 so pow works, pow make lower parts flat, higher parts more step
   float heightValueScaled = pow(heightValueBase + 1.0, steepnessFactor);
   return heightValueScaled;
}

// https://www.alanzucconi.com/2019/07/03/interactive-map-shader-terrain-shading/
// https://forum.unity.com/threads/calculate-vertex-normals-in-shader-from-heightmap.169871/
vec3 calculateNormalFromDepth(vec4 newPosition){
  float step = 1. / resolution.x;

  vec2 offsets[4];
  offsets[0] = uv + vec2(-step, 0);
  offsets[1] = uv + vec2(step, 0);
  offsets[2] = uv + vec2(0, -step);
  offsets[3] = uv + vec2(0, step);

  float hts[4];
  for(int i = 0; i < 4; i++){
      hts[i] = getVertexHeight(offsets[i]);
  }

  vec2  _step = vec2(1.0, 0.0);

  vec3 va = normalize( vec3(_step.xy, hts[1]-hts[0]) );
  vec3 vb = normalize( vec3(_step.yx, hts[3]-hts[2]) );

  return cross(va,vb).rbg;
}

void main() {
    vec4 p = vec4( position, 1. );

    // calculate position
    float heightValueScaled = getVertexHeight(uv);
    float offSetX = 0.02;
    float offSetZ = 0.04;
    vec4 newPosition = vec4(position.x + offSetX , heightValueScaled, position.z + offSetZ, 1.0);
    vPosition = newPosition.xyz;

    // calculate normal
    vec3 newNormal = calculateNormalFromDepth(newPosition);
    vNormal = newNormal;

    gl_Position =  worldViewProjection * newPosition;
    vUv = uv;
}
