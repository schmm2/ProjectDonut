precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
attribute vec3 uv2;
attribute vec3 terrainTypes;

// Uniforms
uniform mat4 worldViewProjection;
uniform mat4 worldView;

// Varying
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vUv2;
varying vec4 vColor;
varying vec3 vTerrainTypes;


#ifdef VERTEXCOLOR
attribute vec4 color;
#endif

void main() {
  gl_Position =  worldViewProjection *  vec4(position, 1.0);

  vUv = uv;
  vUv2 = uv2;
  vPosition = position;
  vNormal = normal;

  //vTerrainIndex = gl_VertexID;
  //vVertexPosition = position;
  vTerrainTypes = terrainTypes;
  
  // Vertex color
  #ifdef VERTEXCOLOR
	  vColor = color;
  #endif
}
