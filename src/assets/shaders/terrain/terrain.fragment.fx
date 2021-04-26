#extension GL_OES_standard_derivatives : enable

precision highp float;
precision highp sampler2DArray;

// uniforms
uniform mat4 worldView;
uniform mat4 world;

uniform vec3 lightPosition;
uniform vec3 lightColor;
uniform vec3 cameraPosition;

uniform sampler2D terrainTextures[4];
uniform sampler2D gridTexture;

// Varying
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vTerrainTypes;
varying vec4 vColor;

// attributes
attribute vec3 terrainTypes;
varying float vVerticeHighlight;

// constants
float textureSamplingRate = 0.05;
float ambientStrength = 1.0;
float lightStrength = 0.9;
vec4 highLightColor = vec4(0.3,0.5,0.8,1.0);

vec4 GetTerrainColor (int index) {
  float terrainIndex = 0.0;
  float colorValueForThisChannel = 0.0;
  vec4 activeTerrainTexture = vec4(0,0,0,0);

  if(index == 0){
    terrainIndex = round(vTerrainTypes.x * 1.0);
    colorValueForThisChannel = vColor.r;
  }
  else if(index == 1){
    terrainIndex = round(vTerrainTypes.y * 1.0);
     colorValueForThisChannel = vColor.g;
  }
  else if(index == 2){
    terrainIndex = round(vTerrainTypes.z * 1.0);
    colorValueForThisChannel = vColor.b;
  }

  if(terrainIndex == 0.0){
    activeTerrainTexture = texture2D(terrainTextures[0], vPosition.xz * textureSamplingRate);
  }
  else if(terrainIndex == 1.0){
     activeTerrainTexture = texture2D(terrainTextures[1],  vPosition.xz * textureSamplingRate);
  }
  else if(terrainIndex == 2.0){
    activeTerrainTexture = texture2D(terrainTextures[2],  vPosition.xz * textureSamplingRate);
  }
  else if(terrainIndex == 3.0){
    activeTerrainTexture = texture2D(terrainTextures[3],  vPosition.xz * textureSamplingRate);
  }
  return (activeTerrainTexture * colorValueForThisChannel);
}

void main(void) {
  // World values
  vec3 positionWorld = vec3(world * vec4(vPosition, 1.0));
  vec3 normalWorldN = normalize(vec3(world * vec4(vNormal, 0.0)));
  vec3 viewDirectionWorldN = normalize(cameraPosition - positionWorld);

  // Light
  vec3 lightVectorN = normalize(lightPosition - positionWorld);
  vec3 ambientColor = ambientStrength * lightColor;
  // diffuse
  float ndl = max(0., dot(normalWorldN, lightVectorN));

  // get color for the three color chanels
  vec4 color_red = GetTerrainColor(0);
  vec4 color_blue = GetTerrainColor(1);
  vec4 color_green = GetTerrainColor(2);

  /*float highlightx = round(vVerticeHighlight.x * 1.0);
  
  float highlighty = round(vVerticeHighlight.y * 1.0);
  float highlightz = round(vVerticeHighlight.z * 1.0);*/
  float highlightx = round(vVerticeHighlight * 1.0);

  vec4 highlightColor = vec4(vec3(highlightx),1.0) * 0.1;

  // calculate final color value
  vec4 finalColor = color_red + color_green + color_blue;

  if(highlightx == 1.0){
    
  }
  finalColor = finalColor - highlightColor;
  
 
  // grid
  vec2 gridUV = vPosition.xz;
	gridUV.x *= 1.0 / (4.0 * 8.66025404);
	gridUV.y *= 1.0 / (2.0 * 15.0);
  //vec4 gridColor = texture2D(gridTexture, gridUV);

  gl_FragColor = vec4((ndl + ambientColor),1.0) * finalColor;
}
