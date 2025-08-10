precision highp float;

uniform vec3 uColorBottom;
uniform vec3 uColorTop;

varying float vProgress;
varying float vShade;

void main() {
  // Vertical gradient
  vec3 col = mix(uColorBottom, uColorTop, pow(vProgress, 1.2));
  // Dapple variation
  col *= mix(0.75, 1.25, vShade);
  // Slight rim highlight toward tips
  float rim = smoothstep(0.7, 1.0, vProgress);
  col += rim * 0.15;
  gl_FragColor = vec4(col, 1.0);
}
