// We have to set this one up ourselves
uniform vec4 camera_params;
uniform sampler2D uDiffuseMap;
uniform sampler2D uHeightMap;

varying vec2 vUv0;
varying vec3 WorldPosition;

// These uniforms are all injected automatically by PlayCanvas
uniform sampler2D uDepthMap;
uniform vec4 uScreenSize;
uniform mat4 matrix_view;

float unpackFloat(vec4 rgbaDepth) {
    const vec4 bitShift = vec4(1.0 / (256.0 * 256.0 * 256.0), 1.0 / (256.0 * 256.0), 1.0 / 256.0, 1.0);
    float depth = dot(rgbaDepth, bitShift);
    return depth;
}


void main(void)
{
    //float height = texture2D(uHeightMap, vUv0).r;
    //vec4 color = texture2D(uDiffuseMap, vUv0);
    gl_FragColor = vec4(unpackFloat(texture2D(uDepthMap, vUv0)) * 10.0);

   // float worldDepth = getLinearDepth(WorldPosition);

    //float screenDepth = getLinearScreenDepth();
    //gl_FragColor = vec4(vec3(screenDepth), 1.0);
    //vec4 color = vec4(vec3(screenDepth),1.0);
    //gl_FragColor = color;
}
