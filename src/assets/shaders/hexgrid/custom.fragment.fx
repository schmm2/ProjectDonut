#ifdef GL_ES
precision highp float;
#endif

// uniforms
uniform sampler2D terrainTexture;
uniform vec3 colortest;
varying vec2 vPosition;
varying vec2 vUV;

// cell size
const vec2 s = vec2(1, 1.7320508); // 1.7320508 = sqrt(3)


// Source: https://andrewhungblog.wordpress.com/2018/07/28/shader-art-tutorial-hexagonal-grids/
// xy - offset from nearest hex center
// zw - unique ID of hexagon
vec4 calcHexInfo(vec2 uv)
{
    vec4 hexCenter = round(vec4(uv, uv - vec2(.5, 1.)) / s.xyxy);
    vec4 offset = vec4(uv - hexCenter.xy * s, uv - (hexCenter.zw + .5) * s);
    return dot(offset.xy, offset.xy) < dot(offset.zw, offset.zw) ? vec4(offset.xy, hexCenter.xy) : vec4(offset.zw, hexCenter.zw);
}

// generate random numbers between 0.0 and 1.0
float random (vec2 st) {
    return fract(sin(dot( st.xy, vec2(12.9898,78.233))) *43758.5453123);
}

void main(void) {
    // bigger numbers -> more tiles
    const float tileAmount = 32.0;
    
    // calculate hex info
    // zw -> index of hex
    vec4 hexInfo = calcHexInfo(vUV * tileAmount);

    // we take the index of the hex multiply it with the cell size
    // we need to reverse tilining
    vec2 hexCenter = hexInfo.zw * s / tileAmount;

    // get heightmap value for the hex center
    vec4 heightValue = texture2D(terrainTexture, hexCenter);

    //if(heightValue.x <)
    gl_FragColor = heightValue;
    //gl_FragColor = texture2D(terrainTexture, vUV);
}