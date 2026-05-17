varying float vAlpha;
varying vec3 vColor;

void main() {
  vec2 c = gl_PointCoord - vec2(0.5);
  float dist = length(c);
  if (dist > 0.5) discard;

  float glow = 1.0 - smoothstep(0.0, 0.5, dist);
  glow = pow(glow, 1.8);

  gl_FragColor = vec4(vColor, vAlpha * glow);
}
