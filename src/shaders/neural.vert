attribute float aConnection;
attribute float aSize;

uniform float uTime;
uniform float uPixelRatio;

varying float vAlpha;
varying vec3 vColor;

void main() {
  vec3 pos = position;

  float pulse = sin(uTime * 1.5 + position.x * 0.02 + position.y * 0.02) * 0.15;
  pos += normal * pulse;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float size = aSize * (1.0 + aConnection * 0.5);
  gl_PointSize = size * uPixelRatio * (300.0 / -mvPosition.z);

  vAlpha = 0.4 + aConnection * 0.6;
  float mixVal = fract(sin(dot(position.xy, vec2(12.9898, 78.233))) * 43758.5453);
  vColor = mix(vec3(0.0, 0.83, 1.0), vec3(0.55, 0.36, 0.96), mixVal);
}
