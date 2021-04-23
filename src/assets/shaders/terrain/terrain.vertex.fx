precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

// Uniforms
uniform mat4 worldViewProjection;
uniform mat4 worldView;

// Varying
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying vec4 vColor;

#ifdef VERTEXCOLOR
attribute vec4 color;
#endif

void main() {
  gl_Position =  worldViewProjection *  vec4(position, 1.0);

  vUv = uv;
  vPosition = position;
  vNormal = normal;

  // Vertex color
  #ifdef VERTEXCOLOR
	  vColor = color;
  #endif
}
