precision highp float;

uniform vec3 uColorBottom;
uniform vec3 uColorTop;

varying float vProgress;
varying float vShade;

void main() {
  vec3 col = mix(uColorBottom, uColorTop, pow(vProgress, 1.2));
  col *= mix(0.75, 1.25, vShade);
  float rim = smoothstep(0.7, 1.0, vProgress);
  col += rim * 0.15;
  gl_FragColor = vec4(col, 1.0);
}
