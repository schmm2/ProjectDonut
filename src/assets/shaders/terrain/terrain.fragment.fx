#extension GL_OES_standard_derivatives : enable

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

uniform sampler2D sandTexture;
uniform sampler2D sandNormalMap;

uniform vec3 lightPosition;
uniform vec3 cameraPosition;
uniform mat4 world;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vViewPosition;

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
    float iceAltitude = 24.0;
    float iceStop = 20.0;
    float mountainAltitude = 10.0;
    float sandAltitude = 2.0;



    vec3 lightcolor = vec3(220 / 255, 220 / 255, 139 / 255);
    // World values
    vec3 vPositionW = vec3(world * vec4(vPosition, 1.0));
    vec3 vNormalWN = normalize(vec3(world * vec4(vNormal, 0.0)));
    //vec3 viewDirectionW = normalize(cameraPosition - vPositionW);



    vec3 xTangent = dFdx( vPositionW );
    vec3 yTangent = dFdy( vPositionW );
    vec3 faceNormal = normalize( cross( xTangent, yTangent ) );
    vec4 fragCol = vec4(faceNormal,1.0);

    // Light

    // Light
        vec3 lightVectorWN2 = normalize(lightPosition - vPositionW);
        float light2 = max(0.,dot(lightVectorWN2, vNormalWN));

    vec3 lightVectorWN = normalize(vPositionW - lightPosition);
    vec3 lightColor = vec3(1.0,1.0,1.0);

    //vec3 lightDir = normalize(lightPosition - vPosition);
    float diffuseLight = max(0.0,dot(  faceNormal, lightVectorWN));

    // slope
    float slope = 1.0 - vNormalWN.y;

    // snow
    vec3 color_snow = texture2D(snowTexture, vUv * 40.0).rgb;
    vec3 normalMapValue_snow = texture2D(snowNormalMap,vUv * 40.0).rgb;
    vec3 normalMapValueN_snow = calculateNormal(normalMapValue_snow, vNormalWN);
    float ndl_snow = max(0.0,dot(normalMapValueN_snow, lightVectorWN2)) * lightStrength;
    vec3 material_snow = clamp(color_snow * ndl_snow,0.0,1.0);
    material_snow = vec3(color_snow);

    // grass
    vec3 color_grass = texture2D(grassTexture, vUv * 80.0).rgb;
    vec3 normalMapValue_grass = texture2D(grassNormalMap,vUv * 80.0).rgb;
    vec3 normalMapValueN_grass = calculateNormal(normalMapValue_grass, vNormalWN);
    float ndl_grass = max(0.0,dot(lightVectorWN2,normalMapValueN_grass));
    //vec3 material_grass = clamp(color_grass * ndl_grass,0.0,1.0);
    vec3 material_grass = vec3(color_grass);

    // rock
    vec3 color_rock = texture2D(rockTexture, vUv * 24.0).rgb;
    vec3 normalMapValue_rock = texture2D(rockNormalMap,vUv * 24.0).rgb;
    vec3 normalMapValueN_rock = faceNormal; //calculateNormal(normalMapValue_rock, faceNormal);
    float ndl_rock = max(0.0,dot(faceNormal, lightVectorWN)) * lightStrength;
    vec3 material_rock = clamp(color_rock * ndl_rock,0.0,1.0);
    material_rock = vec3(color_rock);

     // sand
      vec3 color_sand = texture2D(sandTexture, vUv * 24.0).rgb;
      vec3 normalMapValue_sand = texture2D(sandNormalMap,vUv * 24.0).rgb;
      vec3 normalMapValueN_sand = calculateNormal(normalMapValue_sand, vNormalWN);
      float ndl_sand = max(0.0,dot(normalMapValueN_sand, lightVectorWN2)) * lightStrength;
      vec3 material_sand = clamp(color_sand * ndl_sand,0.0,1.0);
      //material_sand = vec3(color_sand);

   // icy parts of mountain
   if(vPositionW.y > iceAltitude){
      float snowHeightFactor = clamp(vPositionW.y - iceAltitude,0.0,1.0);

      // flat, amount of snow depending of height
      if(slope <= 1.0) {
          finalColor = mix(material_rock, material_snow, snowHeightFactor);
          diffuseLight = diffuseLight * 0.8;
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



    if(vPositionW.y < mountainAltitude&& vPositionW.y > sandAltitude ){
      if(slope < 0.2) {
        float grassHeightFactor = clamp(mountainAltitude - vPositionW.y,0.0,1.0);
        float blendAmount = clamp(slope / 0.2 / grassHeightFactor,0.,1.);
        finalColor = mix(material_grass, material_rock, blendAmount);
        diffuseLight = ndl_grass;
      }
      if(slope >= 0.2) {
        finalColor = material_rock;
      }
   }

   if(vPositionW.y <= sandAltitude){
      finalColor = material_sand;
   }


    gl_FragColor = fragCol; //vec4(finalColor, 1.0 );

    //   if(vNormalW.y >= 0.9){
    //     gl_FragColor = vec4(1.0,1.0,1.0, 1.0 );
    //   }

    float ambientStrength = 0.2;
    vec3 ambient = ambientStrength * lightColor;

    // show light
    float lightStrength = 1.7;
    diffuseLight = diffuseLight * lightStrength;

    gl_FragColor = vec4(vec3((diffuseLight + ambient) * finalColor), 1.0); //vec4(light,light,light,1.0);
    //gl_FragColor = vec4(ndl_grass,ndl_grass,ndl_grass,1.0);

     //gl_FragColor = fragCol;
}
