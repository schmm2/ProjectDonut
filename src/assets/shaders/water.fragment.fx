precision mediump float;

//varying
varying vec2 vUv;
varying vec4 vClipSpace;
varying vec2 textureCoords;
varying vec3 vNormalW; // normal world
varying vec3 vNewNormal;
varying vec3 vPosition;

// uniform
// camera
uniform float camera_near;
uniform float camera_far;
uniform vec3 cameraPosition;
uniform mat4 world;

// textures
uniform sampler2D depthTexture;
uniform sampler2D dudvTexture;
uniform sampler2D normalMap;
uniform sampler2D reflectionTexture;
uniform sampler2D refractionTexture;
uniform sampler2D foamShoreTexture;
uniform sampler2D foamTexture;

// colors
uniform vec4 shallowWaterColor;
uniform vec4 deepWaterColor;

// dudv
uniform float dudvOffset;

uniform float waterDistortionStrength;
uniform float time;

vec3 sunlightColor = vec3(1.0, 1.0, 1.0);
vec3 sunlightPosition = vec3(-200., 500.0, -200.0);

const float shineDamper = 20.0;
const float waterReflectivity = 0.5;

vec3 getNormal(vec2 textureCoords) {
    vec4 normalMapColor = texture2D(normalMap, textureCoords);
    float makeNormalPointUpwardsMore = 3.0;
    vec3 normal = vec3(
      normalMapColor.r * 2.0 - 1.0,
      normalMapColor.b * makeNormalPointUpwardsMore,
      normalMapColor.g * 2.0 - 1.0
    );
    normal = normalize(normal);
    return normal;
}

void main(void)
{
    float dudvOffsetOverTime = dudvOffset * time * 0.5;
    float fresnelStrength = 0.15;
    vec3 vPositionW = vec3(world * vec4(vPosition, 1.0));

    // calculate normal
    vec3 lightVectorW = normalize(sunlightPosition - vPositionW);
    vec3 vNormalW = normalize(vec3(world * vec4(vNewNormal, 0.0)));

    // ***** Texture Coords *****
    // source: https://www.youtube.com/watch?v=GADTasvDOX4
    // Normalized device coordinates - Between -1 and 1
    vec2 ndc = (vClipSpace.xy / vClipSpace.w);
    // screen coordinates - between 0 and 1, needed in this format for texture sampling
    vec2 screenSpaceCoordinates = ndc / 2.0 + 0.5;
    // refraction text coords
    vec2 refractionTexCoords = vec2(screenSpaceCoordinates.x, screenSpaceCoordinates.y);
    // Reflections are upside down
    vec2 reflectionTexCoords = vec2(screenSpaceCoordinates.x, -screenSpaceCoordinates.y);

    // Get the distance from our camera to the first thing under this water fragment
    float depthOfObjectBehindWater = texture2D(depthTexture, refractionTexCoords).r;
    
    // linear depth of water
    float linearWaterDepth = (vClipSpace.z + camera_near) / (camera_far + camera_near);

    // calculate water depth
    float waterDepth = depthOfObjectBehindWater - linearWaterDepth;
    // higher numbers -> smaller area
    float beachAreaWaterDepth = clamp(waterDepth * 400., 0.0, 1.0);
    float foamAreaWaterDepth = clamp(waterDepth * 80000., 0.0, 1.0);

    // ***** DISTORTION *****
    // dudv map contains red and green values (vec(RED,GREEN)) ranging from 0.0 to 1.0, convert to -1.0 to 1.0
    vec2 distortedTexCoords = texture2D(dudvTexture, vec2(textureCoords.x + dudvOffsetOverTime, textureCoords.y)).rg * 0.1;
     // add multiple distortions to make water look more realistic
    distortedTexCoords = textureCoords + vec2(distortedTexCoords.x, distortedTexCoords.y + dudvOffsetOverTime);
    vec2 totalDistortion = (texture2D(dudvTexture, distortedTexCoords).rg * 2.0 - 1.0) * waterDistortionStrength;

    //refractTexCoords += totalDistortion;
    reflectionTexCoords += totalDistortion;
    refractionTexCoords += totalDistortion;

    // Prevent out distortions from sampling from the opposite side of the texture
    // NOTE: This will still cause artifacts towards the edges of the water. You can fix this by
    // making the water more transparent at the edges.
    // @see https://www.youtube.com/watch?v=qgDPSnZPGMA
    refractionTexCoords = clamp(refractionTexCoords, 0.001, 0.999);
    reflectionTexCoords.x = clamp(reflectionTexCoords.x, 0.001, 0.999);
    reflectionTexCoords.y = clamp(reflectionTexCoords.y, -0.999, -0.001);


    vec3 normal = getNormal(distortedTexCoords);
    vec3 viewDirectionW = normalize(cameraPosition - vPositionW);
    float refractiveFactor = dot(viewDirectionW, normal);
    // A higher fresnelStrength makes the water more reflective since the
    // refractive factor will decrease
    refractiveFactor = pow(refractiveFactor, fresnelStrength);

    // get texture color
    vec4 reflectionColor = texture2D(reflectionTexture, reflectionTexCoords);
    vec4 refractionColor = texture2D(refractionTexture, refractionTexCoords);
    // foam texture, add bit of tiling
    vec4 foamShoreColor = texture2D(foamShoreTexture, textureCoords * 2.0);

    // Normal - diffuse
    float ndl = max(0., dot(vNormalW, lightVectorW));
    
    // WATER Light Reflection
    // calculate specular
    vec3 reflectedLight = reflect(normalize(lightVectorW), vNormalW);
    float specular = max(dot(reflectedLight, viewDirectionW), 0.0); 
    specular = pow(specular, shineDamper);
    vec3 specularHighlights = sunlightColor * specular * waterReflectivity;

    // mix colors
    // The deeper the water the darker the color
    refractionColor = mix(refractionColor, deepWaterColor, beachAreaWaterDepth);
    // add reflection & refraction
    vec4 waterColor = mix(reflectionColor, refractionColor, refractiveFactor);

    // add foam structure on wave
    vec4 foamColor = texture2D(foamTexture, textureCoords);
    /*
    // define were foam can show up
    float heightToStartWaveFoam = 0.95;
    float foamArea = clamp((vPosition.y  - heightToStartWaveFoam),0.0,1.0);
    // multiply normal with y up normal, so only the area where the normal is up will get the texture
    float foamAngleExponent =  dot(vNewNormal, vec3(0.0, 1.0, 0.0));
    float foamSaturation = foamArea * foamAngleExponent;
    waterColor +=  foamColor.r * foamSaturation; // add to watercolor*/

    // add some blue and light reflections
    gl_FragColor = mix(waterColor,shallowWaterColor,1.0) + vec4(specularHighlights, 0.0);

    gl_FragColor = vec4(vec3(shallowWaterColor) * ndl,1.0);

    // add foam to the water edges
    //gl_FragColor = mix(gl_FragColor,foamShoreColor,(1.0-foamAreaWaterDepth));
}

