#extension GL_OES_standard_derivatives : enable

precision highp float;

// uniforms
uniform mat4 worldView;
uniform mat4 world;

uniform sampler2D snowTexture;
uniform sampler2D snowNormalMap;

uniform sampler2D rockTexture;
uniform sampler2D rockNormalMap;

uniform sampler2D grassTexture;
uniform sampler2D grassNormalMap;

uniform sampler2D sandTexture;
uniform sampler2D sandNormalMap;

uniform vec3 lightPosition;
uniform vec3 lightColor;
uniform vec3 cameraPosition;


// Varying
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

// Declare empty Variables
vec3 finalColor;

varying vec4 vColor;

uniform vec3 test;

void main(void) {
  gl_FragColor = vec4(vColor);
}
