precision highp float;
attribute vec3 position;
attribute vec3 normal;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

// Grass Vertex Shader
attribute vec3 aOffset;
attribute float aScale;
attribute float aPhase;
attribute vec4 aQuat;

uniform float uTime;
uniform float uWindStrength;
uniform float uBladeHeight;
uniform float uNoiseFreq;
uniform float uNoiseAmp;
uniform float uCurvature;
uniform float uFollowNormals;
uniform float uWaveAmp;
uniform float uWaveLength;
uniform float uWaveSpeed;
uniform vec2 uWaveDir;
uniform float uWaveBlend;

// Interaction (mouse/touch) uniforms
uniform vec3 uInteractorPos;
uniform float uInteractorRadius;
uniform float uInteractorStrength;
uniform float uInteractorEnabled;

varying float vProgress;
varying float vShade;

float hash11(float p) {
  return fract(sin(p * 127.1) * 43758.5453123);
}
float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

vec3 quatRotate(vec4 q, vec3 v) {
  return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}

void main() {
  vec3 pos = position;
  float progress = clamp(pos.y, 0.0, 1.0);
  vProgress = progress;

  pos.y *= uBladeHeight * aScale;
  float curve = uCurvature * progress * progress;
  pos.x += curve;

  float t = uTime + aPhase;
  float localSway = sin(t * 1.3 + aOffset.x * 0.2) + cos(t * 0.7 + aOffset.z * 0.15);
  localSway *= uWindStrength * (progress * progress);
  pos.x += localSway * 0.4;
  pos.z += localSway * 0.15;

  vec2 dir = normalize(uWaveDir);
  float phaseCoord = dot(aOffset.xz, dir) / max(uWaveLength, 0.0001);
  float wave = sin(phaseCoord * 6.28318 - uTime * uWaveSpeed) * uWaveAmp * progress;
  pos.xz += dir * wave * uWaveBlend;

  float n = noise(vec2(aOffset.x, aOffset.z) * uNoiseFreq + progress * 4.0 + uTime * 0.1);
  vShade = n;
  pos.xz += (n - 0.5) * uNoiseAmp * progress;

  if(uFollowNormals > 0.5) {
    vec3 qv = cross(aQuat.xyz, pos) + aQuat.w * pos;
    pos = pos + 2.0 * cross(aQuat.xyz, qv);
  }

  if(uInteractorEnabled > 0.5 && uInteractorRadius > 0.0) {
    vec3 baseWorld = aOffset;
    vec3 N = normalize(quatRotate(aQuat, vec3(0.0, 1.0, 0.0)));
    vec3 d = baseWorld - uInteractorPos;
    vec3 tangentDelta = d - N * dot(d, N);
    float dist = length(tangentDelta);
    float infl = 1.0 - smoothstep(0.0, uInteractorRadius, dist);
    infl *= uInteractorStrength;
    vec3 dir3 = (dist > 1e-5) ? (tangentDelta / dist) : vec3(0.0);
    pos += dir3 * (infl * 0.35) * progress;
    pos.y *= (1.0 - infl * 0.45 * progress);
  }

  vec3 worldPos = pos + aOffset;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
}
