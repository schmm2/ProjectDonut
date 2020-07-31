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

vec3 calculateNormal(vec3 normalMapValue, vec3 normalWorldN){
  // translate normals to 0-1.0
  vec3 normalMapValueCalc = normalMapValue * 2.0 - 1.0;
  vec3 normalMapValueCalcN = normalize(normalMapValueCalc);

  float red = normalMapValueCalcN.x +  normalWorldN.x;
  float green = normalMapValueCalcN.y + normalWorldN.y;
  float blue = normalWorldN.z;

  vec3 combinedNormal = vec3(red,green,blue);
  return normalize(combinedNormal);
}

void main(void) {
    // Variables
    float iceAltitude = 20.0;
    float rockAltitude = 8.0;
    float grassAltitude = 1.0;

    float ambientStrength = 1.0;
    float lightStrength = 0.9;
    vec3 ambientColor = ambientStrength * lightColor;


    // World values
    vec3 positionWorld = vec3(world * vec4(vPosition, 1.0));
    vec3 normalWorldN = normalize(vec3(world * vec4(vNormal, 0.0)));
    //vec3 viewDirectionW = normalize(cameraPosition - vPositionW);

    // slope
    float slope = 1.0 - normalWorldN.y;

    // calculate face normal
    vec3 xTangent = dFdx( positionWorld );
    vec3 yTangent = dFdy( positionWorld );
    vec3 faceNormalRaw = normalize(cross( xTangent, yTangent ));

    float vectorRoundFactor = 2.0;
    float faceNormalX =  round(faceNormalRaw.x * vectorRoundFactor) / vectorRoundFactor;
    float faceNormalY = round(faceNormalRaw.y * vectorRoundFactor) / vectorRoundFactor;
    float faceNormalZ = round(faceNormalRaw.z * vectorRoundFactor) / vectorRoundFactor;
    vec3 faceNormal = normalize(vec3(faceNormalX,faceNormalY,faceNormalZ));

    // Light
    vec3 lightVectorN = normalize(positionWorld - lightPosition);
    vec3 lightVectorReversedN = normalize(lightPosition - positionWorld);

    // set diffuse light to flat shading
    float diffuseLight = max(0.0, dot( faceNormal, lightVectorN));


    // snow
    vec3 color_snow = texture2D(snowTexture, vUv * 40.0).rgb;
    vec3 normalMapValue_snow = texture2D(snowNormalMap,vUv * 40.0).rgb;
    vec3 normalMapValueN_snow = calculateNormal(normalMapValue_snow, normalWorldN);
    float ndl_snow = max(0.0,dot(lightVectorReversedN, normalMapValueN_snow));
    vec3 material_snow = clamp(color_snow * ndl_snow,0.0,1.0);
    material_snow = vec3(color_snow);

    // grass
    vec3 color_grass = texture2D(grassTexture, vUv * 80.0).rgb;
    vec3 normalMapValue_grass = texture2D(grassNormalMap,vUv * 80.0).rgb;
    vec3 normalMapValueN_grass = calculateNormal(normalMapValue_grass, normalWorldN);
    float ndl_grass = max(0.0,dot(lightVectorReversedN,normalMapValueN_grass));
    //vec3 material_grass = clamp(color_grass * ndl_grass,0.0,1.0);
    vec3 material_grass = vec3(color_grass);

    // rock

    //vec3 normalMapValue_rock = texture2D(rockNormalMap,vUv * 24.0).rgb;
    //vec3 normalMapValueN_rock = faceNormal; //calculateNormal(normalMapValue_rock, faceNormal);
    //float ndl_rock = max(0.0,dot(faceNormal, lightVectorWN)) * lightStrength;
    //vec3 material_rock = clamp(color_rock * ndl_rock,0.0,1.0);
    vec3 colorRockTexture = texture2D(rockTexture, vUv * 40.0).rgb;
    vec3 colorRock = vec3(146.0 / 255.0, 97.0 / 255.0, 63.0 / 255.0);
    vec3 finalColorRock = mix(colorRockTexture, colorRock, 0.8);
    vec3 material_rock = vec3(finalColorRock);

     // sand
    vec3 color_sand = texture2D(sandTexture, vUv * 24.0).rgb;
    vec3 normalMapValue_sand = texture2D(sandNormalMap,vUv * 24.0).rgb;
    vec3 normalMapValueN_sand = calculateNormal(normalMapValue_sand, normalWorldN);
    float ndl_sand = max(0.0,dot(lightVectorReversedN,normalMapValueN_sand));
    vec3 material_sand = clamp(color_sand * ndl_sand,0.0,1.0);
    material_sand = vec3(color_sand);

    // ---------- Color MIXING ------------
    // ---------- Snow Peak Area ------------
    if(positionWorld.y > iceAltitude){
      finalColor = material_snow;
      // dim the light a n^bit
    }

    // ---------- Rock Area ------------
    if(positionWorld.y > rockAltitude && positionWorld.y < iceAltitude){
      // the area between rock and snow should not be a hard edge
      float snowRockTransitionHeight = 5.0;
      // if position is closer (more up) to the iceAltitude the factor gets smaller -> less rock
      float rockAmount = clamp((iceAltitude - positionWorld.y) / snowRockTransitionHeight,0.0,1.0);

      // blend between rock & snow depending on rock amount
      finalColor = mix(material_snow, material_rock, rockAmount);
    }

    // ---------- Grass Area ------------
    if(positionWorld.y < rockAltitude && positionWorld.y >= grassAltitude ){
      // area between rock and grass, there should not be a hard edge
      float grassRockTransitionHeight = 10.0; // 10meter of transition area
      // if position is closer (more up) to the rockHeight the factor gets smaller -> less grass
      float grassAmount = clamp((rockAltitude - positionWorld.y) / grassRockTransitionHeight,0.0,1.0);

      // not that steep, show grass and rock
      if(slope < 0.3) {
        // blend between grass & rock depending on slope and grass Amount Factor
        float blendAmount = clamp((slope * 2.0) / grassAmount,0.0,1.0);

        finalColor = mix(material_grass, material_rock, blendAmount);
        diffuseLight = mix(ndl_grass,diffuseLight,blendAmount);
      }
      // very steep, rock only
      if(slope >= 0.3) {
        finalColor = material_rock;
      }
    }

    // ---------- Sand Area ------------
    if(positionWorld.y < grassAltitude){
      finalColor = material_sand;
      diffuseLight = ndl_sand;
    }

    //finalColor = clamp(finalColor,0.4,0.8);

    // ---------- LIGHT ------------
    diffuseLight = diffuseLight * lightStrength;

    // brighten up dark spots to avoid hard edges
    if(diffuseLight < 0.2){
       diffuseLight += 0.1;
    }

    // ---------- Final Color ------------
    gl_FragColor = vec4(vec3((diffuseLight + ambientColor) * finalColor), 1.0);
}
