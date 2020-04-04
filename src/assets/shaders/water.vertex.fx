attribute vec3 aPosition;
attribute vec2 aUv0;

uniform mat4 matrix_model;
uniform mat4 matrix_viewProjection;
uniform float uTime;

// Shared between Vertex & Fragment Shader
varying vec2 vUv0;
varying vec3 ScreenPosition;
varying vec3 WorldPosition;

float calculateSurface(float x, float z) {
    float scale = 6.0;
    float y = 0.0;
    y += (sin(x * 1.0 / scale + uTime * 1.0) + sin(x * 2.3 / scale + uTime * 1.5) + sin(x * 3.3 / scale + uTime * 0.4)) / 3.0;
    y += (sin(z * 0.2 / scale + uTime * 1.8) + sin(z * 1.8 / scale +uTime * 1.8) + sin(z * 2.8 / scale + uTime * 0.8)) / 3.0;
    return y;
}

void main(void)
{
   // share with fragment shader
   vUv0 = aUv0;
   vec3 pos = aPosition;

   // offset y to create waves
   pos.y = calculateSurface(aPosition.x, aPosition.z);
   vec3 newVertexCoord = vec3(pos.x, pos.y, pos.z);
   // calculate new screen position
   gl_Position = matrix_viewProjection * matrix_model * vec4(newVertexCoord, 1.0);

   // set Screen Position
   ScreenPosition = gl_Position.xyz;
   // set World Position
   WorldPosition = pos;
}
