precision mediump float;
//varying
varying vec2 vUv;
varying vec2 vBumpUV;

uniform mat4 matrix_view;
// We have to set this one up ourselves
uniform vec4 camera_params;
uniform sampler2D bumpTexture;
uniform sampler2D depthTexture;
uniform float bumpHeight;

varying vec3 viewZ;
uniform float time;
uniform float camera_near;
uniform float camera_far;

uniform vec3 vCameraPosition;
uniform vec4 vLevels;
uniform vec3 waterColor;
uniform vec2 waveData;

varying vec3 vPositionW;
varying vec3 vNormalW;
uniform vec3 vLightPosition;

varying float vWaterDistanceToCamera;

// for projectionMatrix -> maps world view to screen view
uniform mat4 worldViewProjection;
// for modelViewMatrix
varying vec4 vClipSpace;

uniform sampler2D reflectionTexture;
uniform sampler2D refractionTexture;
varying vec2 textureCoords;
uniform sampler2D dudvTexture;
varying vec3 vReflectionMapTexCoord;
varying vec3 vRefractionMapTexCoord;

uniform vec4 shallowWaterColor;
uniform vec4 deepWaterColor;

void main(void)
{
    vec4 waterColor = vec4(0.0,0.2,0.5,1.0);
    vec4 waterShoreColor = vec4(0.3,0.4,0.8,1.0);

    // Normalized device coordinates - Between 0 and 1
    vec2 ndc = (vClipSpace.xy / vClipSpace.w) / 2.0 + 0.5;
    vec2 refractTexCoords = vec2(ndc.x, ndc.y);
    // Reflections are upside down
    vec2 reflectTexCoords = vec2(ndc.x, -ndc.y);

    // Get the distance from our camera to the first thing under this water fragment that a
    // ray would collide with. This might be the ground, the under water walls, a fish, or any
    // other thing under the water. This distance will depend on our camera angle.
    float depthOfObjectBehindWater = texture2D(depthTexture, refractTexCoords).r;

    // Convert from our perspective transformed distance to our world distance
    float cameraDistanceToObjectBehindWater = 2.0 * camera_near * camera_far /
    (camera_far + camera_near - (2.0 * depthOfObjectBehindWater - 1.0)* (camera_far - camera_near));
    float linearWaterDepth = (vClipSpace.z + camera_near) / (camera_far + camera_near);

    // calculate water depth
    //float waterDepth = cameraDistanceToObjectBehindWater - vWaterDistanceToCamera;
    float waterDepth = depthOfObjectBehindWater - linearWaterDepth;

    float dudvOffset = 1.0;
    //vec2 distortedTexCoords = texture2D(dudvTexture, vec2(textureCoords.x + dudvOffset, textureCoords.y)).rg * 0.1;
    //distortedTexCoords = textureCoords + vec2(distortedTexCoords.x, distortedTexCoords.y + dudvOffset);

    //vec2 totalDistortion = (texture2D(dudvTexture, distortedTexCoords).rg * 2.0 - 1.0) * 1.0;

    // dummy code
    //refractTexCoords += totalDistortion;
    //reflectTexCoords += totalDistortion;
    refractTexCoords = clamp(refractTexCoords, 0.001, 0.999);
    reflectTexCoords.x = clamp(reflectTexCoords.x, 0.001, 0.999);
    reflectTexCoords.y = clamp(reflectTexCoords.y, -0.999, -0.001);

    vec4 refractColor = texture2D(refractionTexture,  refractTexCoords);
    vec4 reflectColor = texture2D(reflectionTexture, reflectTexCoords);

    // mix some colors
    gl_FragColor = vec4(vec3(waterShoreColor),1.0);
    // The deeper the water the darker the color
    gl_FragColor = mix(gl_FragColor,waterColor,clamp(waterDepth, 0.0, 1.0));

    gl_FragColor = vec4(vec3(vWaterDistanceToCamera),1.0);

    gl_FragColor = vec4(vec3(waterShoreColor),1.0);
    gl_FragColor = mix(gl_FragColor,waterColor,clamp(waterDepth * 200., 0.0, 1.0));

}
