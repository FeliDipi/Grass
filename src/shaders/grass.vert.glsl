precision highp float;
// RawShaderMaterial: must declare built-ins we reference
attribute vec3 position;
attribute vec3 normal;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
// Grass Vertex Shader
attribute vec3 aOffset;
attribute float aScale;
attribute float aPhase;
attribute vec4 aQuat; // orientation quaternion

uniform float uTime;
uniform float uWindStrength;
uniform float uBladeHeight;
uniform float uNoiseFreq;
uniform float uNoiseAmp;
uniform float uCurvature; // horizontal curvature
uniform float uFollowNormals; // 0 or 1 toggle
uniform float uWaveAmp;
uniform float uWaveLength;
uniform float uWaveSpeed;
uniform vec2 uWaveDir; // normalized direction in XZ
uniform float uWaveBlend; // 0-1 blend between local turbulence and macro wave

varying float vProgress;
varying float vShade;

// Simple hash / noise helpers
float hash11(float p) { return fract(sin(p * 127.1) * 43758.5453123); }
float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  // Four corners
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  // Local (upright) blade space
  vec3 pos = position;
  float progress = clamp(pos.y, 0.0, 1.0);
  vProgress = progress;

  // Height and static curvature
  pos.y *= uBladeHeight * aScale;
  float curve = uCurvature * progress * progress;
  pos.x += curve;

  // Local turbulent sway
  float t = uTime + aPhase;
  float localSway = sin(t * 1.3 + aOffset.x * 0.2) + cos(t * 0.7 + aOffset.z * 0.15);
  localSway *= uWindStrength * (progress * progress);
  pos.x += localSway * 0.4;
  pos.z += localSway * 0.15;

  // Macro traveling wave along uWaveDir (angle around Y) – displacement applied along the same direction
  vec2 dir = normalize(uWaveDir);
  float phaseCoord = dot(aOffset.xz, dir) / max(uWaveLength, 0.0001);
  float wave = sin(phaseCoord * 6.28318 - uTime * uWaveSpeed) * uWaveAmp * progress;
  pos.xz += dir * wave * uWaveBlend;

  // Noise jitter (local lateral)
  float n = noise(vec2(aOffset.x, aOffset.z) * uNoiseFreq + progress * 4.0 + uTime * 0.1);
  vShade = n;
  pos.xz += (n - 0.5) * uNoiseAmp * progress;

  // Rotate whole blade (with wind) to match surface normal
  if (uFollowNormals > 0.5) {
    vec3 qv = cross(aQuat.xyz, pos) + aQuat.w * pos;
    pos = pos + 2.0 * cross(aQuat.xyz, qv);
  }

  vec3 worldPos = pos + aOffset;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
}
