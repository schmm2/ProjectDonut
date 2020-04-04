precision mediump float;

//varying
varying vec2 vUv;
varying vec4 vClipSpace;

// uniform
// camera
uniform float camera_near;
uniform float camera_far;

// textures
uniform sampler2D depthTexture;
uniform sampler2D reflectionTexture;
uniform sampler2D refractionTexture;
// colors
uniform vec4 shallowWaterColor;
uniform vec4 deepWaterColor;

void main(void)
{
    // Normalized device coordinates - Between 0 and 1
    vec2 ndc = (vClipSpace.xy / vClipSpace.w) / 2.0 + 0.5;
    vec2 refractionTexCoords = vec2(ndc.x, ndc.y);
    // Reflections are upside down
    vec2 reflectionTexCoords = vec2(ndc.x, -ndc.y);

    // Get the distance from our camera to the first thing under this water fragment
    float depthOfObjectBehindWater = texture2D(depthTexture, refractionTexCoords).r;

    // depth to linear depth
    float linearWaterDepth = (vClipSpace.z + camera_near) / (camera_far + camera_near);

    // calculate water depth
    float waterDepth = depthOfObjectBehindWater - linearWaterDepth;

    // get reflection color
    //vec4 reflectionColor = texture2D(reflectionTexture, reflectionTexCoords);

    // mix colors
    gl_FragColor = vec4(vec3(shallowWaterColor),1.0);
    gl_FragColor = mix(gl_FragColor,deepWaterColor,clamp(waterDepth * 1000., 0.0, 1.0));

}
