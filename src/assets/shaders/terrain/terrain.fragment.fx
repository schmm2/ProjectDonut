precision highp float;

// uniforms
uniform mat4 worldView;
uniform float mountainHeight;

uniform sampler2D snowTexture;
uniform sampler2D snowNormalMap;

uniform sampler2D rockTexture;
uniform sampler2D rockNormalMap;

uniform sampler2D grassTexture;
uniform sampler2D grassNormalMap;

uniform vec3 lightPosition;
uniform vec3 cameraPosition;
uniform mat4 world;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

vec3 finalColor;
float lightStrength = 1.5;

vec3 calculateNormal(vec3 normalMapValue, vec3 vNormalW){
  // translate normals to 0-1.0
  vec3 normalMapValueCalc = normalMapValue * 2.0 - 1.0;
  vec3 normalMapValueCalcN = normalize(normalMapValueCalc);
  // add
  /*float red = mix(normalMapValueCalcN.x,vNormalW.x,0.5);
  float green = mix(normalMapValueCalcN.y,vNormalW.y,0.5);
  float blue = vNormalW.z;*/

  float red = normalMapValueCalcN.x + vNormalW.x;
  float green = normalMapValueCalcN.y + vNormalW.y;
  float blue = vNormalW.z;

  vec3 combinedNormal = vec3(red,green,blue);
  return normalize(combinedNormal);
}

void main(void) {
    float snowTop = 19.0;
    float iceAltitude = 16.0;
    float mountainAltitude = 10.0;

    vec3 lightcolor = vec3(220 / 255, 220 / 255, 139 / 255);
    // World values
    vec3 vPositionW = vec3(world * vec4(vPosition, 1.0));
    vec3 vNormalWN = normalize(vec3(world * vec4(vNormal, 0.0)));
    //vec3 viewDirectionW = normalize(cameraPosition - vPositionW);

    // Light
    vec3 lightVectorWN = normalize(lightPosition - vPositionW);
    float light = max(0.,dot(lightVectorWN, vNormalWN));

    // slope
    float slope = 1.0 - vNormalWN.y;

    // snow
    vec3 color_snow = texture2D(snowTexture, vUv * 40.0).rgb;
    vec3 normalMapValue_snow = texture2D(snowNormalMap,vUv * 40.0).rgb;
    vec3 normalMapValueN_snow = calculateNormal(normalMapValue_snow, vNormalWN);
    float ndl_snow = max(0.0,dot(normalMapValueN_snow, lightVectorWN)) * lightStrength;
    vec3 material_snow = clamp(color_snow * ndl_snow,0.0,1.0);

    // grass
    vec3 color_grass = texture2D(grassTexture, vUv * 80.0).rgb;
    vec3 normalMapValue_grass = texture2D(grassNormalMap,vUv * 80.0).rgb;
    vec3 normalMapValueN_grass = calculateNormal(normalMapValue_grass, vNormalWN);
    float ndl_grass = max(0.0,dot(lightVectorWN,normalMapValueN_grass)) * lightStrength;
    vec3 material_grass = clamp(color_grass * ndl_grass,0.0,1.0);


    // rock
    vec3 color_rock = texture2D(rockTexture, vUv * 24.0).rgb;
    vec3 normalMapValue_rock = texture2D(rockNormalMap,vUv * 24.0).rgb;
    vec3 normalMapValueN_rock = calculateNormal(normalMapValue_rock, vNormalWN);
    float ndl_rock = max(0.0,dot(normalMapValueN_rock, lightVectorWN)) * lightStrength;
    vec3 material_rock = clamp(color_rock * ndl_rock,0.0,1.0);


   // icy parts of mountain
   if(vPositionW.y > iceAltitude){
      float snowHeightFactor = clamp(vPositionW.y - iceAltitude,0.0,1.0);

      // flat, amount of snow depending of height
      if(slope <= 1.0) {
          finalColor = mix(material_rock, material_snow, snowHeightFactor);
      }
      // not that steep, has some
      //if(slope >= 0.3) {
        //float blendAmount = clamp(slope * 2.0,0.0,1.0) * snowHeightFactor; //snowHeightFactor;
        //finalColor = mix(material_rock, material_snow, blendAmount);
         //finalColor = vec3(1.0,0.0,0.0);
         //finalColor = material_rock;
      //}
    }

    // Mountain Rocky part
    if(vPositionW.y > mountainAltitude && vPositionW.y < iceAltitude){
        finalColor = material_rock;
    }

    if(vPositionW.y < mountainAltitude ){
      if(slope < 0.2) {
        float blendAmount = slope / 0.2;
        finalColor = mix(material_grass, material_rock, blendAmount);
      }
      if(slope >= 0.2) {
        finalColor = material_rock;
      }
   }


    gl_FragColor = vec4(finalColor, 1.0 );

    //   if(vNormalW.y >= 0.9){
    //     gl_FragColor = vec4(1.0,1.0,1.0, 1.0 );
    //   }

    // show light
    //gl_FragColor = vec4(light * 2.0,light * 2.0,light * 2.0,1.0);
     //gl_FragColor = vec4(ndl_grass,ndl_grass,ndl_grass,1.0);
}
