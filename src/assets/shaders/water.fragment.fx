precision mediump float;

//varying
varying vec2 vUv;
varying vec4 vClipSpace;
varying vec2 textureCoords;

// uniform
// camera
uniform float camera_near;
uniform float camera_far;

// textures
uniform sampler2D depthTexture;
uniform sampler2D dudvTexture;
uniform sampler2D reflectionTexture;
uniform sampler2D refractionTexture;
// colors
uniform vec4 shallowWaterColor;
uniform vec4 deepWaterColor;

// dudv
uniform float dudvOffset;

uniform float time;

void main(void)
{
    float waterDistortionStrength = 0.02;
    float dudvOffsetOverTime = dudvOffset * time;

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

    // ***** DISTORTION *****
    // dudv map contains red and green values (vec(RED,GREEN)) ranging from 0.0 to 1.0, convert to -1.0 to 1.0
    vec2 distortion1 = texture2D(dudvTexture, vec2(textureCoords.x + dudvOffsetOverTime, textureCoords.y)).rg * 2.0 - 1.0;
    // add multiple distortions to make water look more realistic
    vec2 distortion2 = texture2D(dudvTexture, vec2(-textureCoords.x + dudvOffsetOverTime, textureCoords.y + dudvOffsetOverTime)).rg * 2.0 - 1.0;
    // sum up distortion
    vec2 totalDistortion = distortion1 + distortion2;

    //refractTexCoords += totalDistortion;
    reflectionTexCoords += totalDistortion * waterDistortionStrength;
    refractionTexCoords += totalDistortion * waterDistortionStrength;

    // Prevent out distortions from sampling from the opposite side of the texture
    // NOTE: This will still cause artifacts towards the edges of the water. You can fix this by
    // making the water more transparent at the edges.
    // @see https://www.youtube.com/watch?v=qgDPSnZPGMA
    refractionTexCoords = clamp(refractionTexCoords, 0.001, 0.999);
    reflectionTexCoords.x = clamp(reflectionTexCoords.x, 0.001, 0.999);
    reflectionTexCoords.y = clamp(reflectionTexCoords.y, -0.999, -0.001);

    // get texture color
    vec4 reflectionColor = texture2D(reflectionTexture, reflectionTexCoords);
    vec4 refractionColor = texture2D(refractionTexture, refractionTexCoords);

    // mix colors
    // The deeper the water the darker the color
    refractionColor = mix(refractionColor,deepWaterColor,clamp(waterDepth * 2000., 0.0, 1.0));
    // add reflection & refraction
    vec4 waterColor = mix(reflectionColor,refractionColor,0.5);
    // add some blue
    gl_FragColor = mix(waterColor,shallowWaterColor,0.2);
}

