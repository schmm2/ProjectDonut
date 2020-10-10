precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

// Uniforms
uniform mat4 worldViewProjection;
uniform mat4 worldView;
uniform sampler2D heightMap;
uniform sampler2D hexMap;
uniform vec2 resolution;
uniform float steepnessFactor;

// Varying
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying float vEdgeDistance;
varying float vHexValueBase;

float terrainBaseHeight = 4.0;
float terrainScale = 15.0;

// cell size
const vec2 s = vec2(1, 1.7320508); // 1.7320508 = sqrt(3)


float hex(in vec2 p){
    
    p = abs(p);
    
    #ifdef FLAT_TOP_HEXAGON
    // Below is equivalent to:
    //return max(p.x*.866025 + p.y*.5, p.y); 

    return max(dot(p, s*.5), p.y); // Hexagon.
    #else
    // Below is equivalent to:
    //return max(p.x*.5 + p.y*.866025, p.x); 

    return max(dot(p, s*.5), p.x); // Hexagon.
    #endif
    
}

float getVertexHeight(vec2 uvParameter, vec4 hexInfo){
  //float hexValueBase =  texture2D(hexMap, uvParameter).x;
  float heightValueBase = texture2D(heightMap, uvParameter).x; 
  
  float heightValueScaled = 0.0;
  // move to -1.0-1.0
  heightValueScaled = heightValueBase * 2.0 - 1.0;
  // make steep
  heightValueScaled = pow(heightValueScaled, 3.0);
  // scale
  heightValueScaled = heightValueScaled * terrainScale + terrainBaseHeight;  
 
  return heightValueScaled;
}

// https://www.alanzucconi.com/2019/07/03/interactive-map-shader-terrain-shading/
// https://forum.unity.com/threads/calculate-vertex-normals-in-shader-from-heightmap.169871/
vec3 calculateNormalFromDepth(vec4 newPosition, vec4 edgeDistance){
  float step = 1. / resolution.x;

  vec2 offsets[4];
  offsets[0] = uv + vec2(-step, 0);
  offsets[1] = uv + vec2(step, 0);
  offsets[2] = uv + vec2(0, -step);
  offsets[3] = uv + vec2(0, step);

  float hts[4];
  for(int i = 0; i < 4; i++){
      hts[i] = getVertexHeight(offsets[i], edgeDistance);
  }

  vec2  _step = vec2(1.0, 0.0);

  vec3 va = normalize( vec3(_step.xy, hts[1]-hts[0]) );
  vec3 vb = normalize( vec3(_step.yx, hts[3]-hts[2]) );

  return cross(va,vb).rbg;
}


// Source: https://andrewhungblog.wordpress.com/2018/07/28/shader-art-tutorial-hexagonal-grids/
// xy - offset from nearest hex center
// zw - unique ID of hexagon
vec4 calcHexInfo(vec2 uv)
{
    vec4 hexCenter = round(vec4(uv, uv - vec2(.5, 1.)) / s.xyxy);
    vec4 offset = vec4(uv - hexCenter.xy * s, uv - (hexCenter.zw + .5) * s);
    return dot(offset.xy, offset.xy) < dot(offset.zw, offset.zw) ? vec4(offset.xy, hexCenter.xy) : vec4(offset.zw, hexCenter.zw);
}



void main() {
    vUv = uv;

    vHexValueBase = texture2D(hexMap, uv).x;

    // bigger numbers -> more tiles
    const float tileAmount = 32.0;
    
    // calculate hex info
    // zw -> index of hex
    vec4 hexInfo = calcHexInfo(vUv * tileAmount);

    // we take the index of the hex multiply it with the cell size
    // we need to reverse tilining
    vec2 hexCenter = hexInfo.zw * s / tileAmount;

    vEdgeDistance = hex(hexInfo.xy); // Edge distance
 
    vec4 p = vec4( position, 1. );

    // calculate position
    float heightValueScaled = getVertexHeight(uv, hexInfo);

    vec4 newPosition = vec4(position.x, heightValueScaled, position.z, 1.0);
    vPosition = newPosition.xyz;

    // calculate normal
    vNormal = calculateNormalFromDepth(newPosition, hexInfo);

    gl_Position =  worldViewProjection * newPosition;
}
