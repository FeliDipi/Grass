import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useControls } from "../store/useControls";
import {
  sampleGeometrySurface,
  quaternionFromUpToNormal,
} from "../utils/sampleGeometry";
import vertexShader from "../shaders/grass.vert.glsl?raw";
import fragmentShader from "../shaders/grass.frag.glsl?raw";

interface GrassMaterialUniforms {
  uTime: { value: number };
  uWindStrength: { value: number };
  uBladeHeight: { value: number };
  uNoiseFreq: { value: number };
  uNoiseAmp: { value: number };
  uColorBottom: { value: THREE.Color };
  uColorTop: { value: THREE.Color };
  uCurvature: { value: number };
}

interface GrassProps {
  sourceGeometry?: THREE.BufferGeometry | null;
}

export const Grass: React.FC<GrassProps> = ({ sourceGeometry = null }) => {
  const {
    bladeCount,
    patchSize,
    bladeHeight,
    windStrength,
    noiseFreq,
    noiseAmp,
    colorBottom,
    colorTop,
    curvature,
    timeScale,
    followNormals,
    waveAmp,
    waveLength,
    waveSpeed,
    waveDirectionDeg,
    waveBlend,
  } = useControls();
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.RawShaderMaterial>(null!);
  const clockRef = useRef(0);
  const waveDirBaseRef = useRef(new THREE.Vector3());
  const parentQuatRef = useRef(new THREE.Quaternion());

  const { geometry, uniforms } = useMemo(() => {
    clockRef.current = 0;

    const baseBlade = new THREE.PlaneGeometry(0.08, 1, 1, 4);
    baseBlade.translate(0, 0.5, 0); // base at y=0

    const instGeom = new THREE.InstancedBufferGeometry();
    instGeom.index = baseBlade.index;
    instGeom.attributes.position = baseBlade.attributes.position;
    instGeom.attributes.uv = baseBlade.attributes.uv;
    instGeom.attributes.normal = baseBlade.attributes.normal;

    const offsets = new Float32Array(bladeCount * 3);
    const scales = new Float32Array(bladeCount);
    const sway = new Float32Array(bladeCount);
    const quats = new Float32Array(bladeCount * 4);

    let sampled: { positions: Float32Array; normals: Float32Array } | null =
      null;
    if (sourceGeometry) {
      try {
        sampled = sampleGeometrySurface(sourceGeometry, bladeCount);
      } catch (e) {
        console.warn("Sampling failed, falling back to plane distribution", e);
      }
    }

    const tmpNormal = new THREE.Vector3();
    const quat = new THREE.Quaternion();

    for (let i = 0; i < bladeCount; i++) {
      let xi: number, yi: number, zi: number;
      if (sampled) {
        xi = sampled.positions[i * 3];
        yi = sampled.positions[i * 3 + 1];
        zi = sampled.positions[i * 3 + 2];
        tmpNormal
          .set(
            sampled.normals[i * 3],
            sampled.normals[i * 3 + 1],
            sampled.normals[i * 3 + 2]
          )
          .normalize();
      } else {
        xi = (Math.random() - 0.5) * patchSize;
        zi = (Math.random() - 0.5) * patchSize;
        yi = 0;
        tmpNormal.set(0, 1, 0);
      }
      offsets[i * 3 + 0] = xi;
      offsets[i * 3 + 1] = yi!;
      offsets[i * 3 + 2] = zi;
      scales[i] = 0.6 + Math.random() * 0.9;
      sway[i] = Math.random() * Math.PI * 2;
      quaternionFromUpToNormal(tmpNormal, quat);
      quats[i * 4 + 0] = quat.x;
      quats[i * 4 + 1] = quat.y;
      quats[i * 4 + 2] = quat.z;
      quats[i * 4 + 3] = quat.w;
    }
    instGeom.setAttribute(
      "aOffset",
      new THREE.InstancedBufferAttribute(offsets, 3)
    );
    instGeom.setAttribute(
      "aScale",
      new THREE.InstancedBufferAttribute(scales, 1)
    );
    instGeom.setAttribute(
      "aPhase",
      new THREE.InstancedBufferAttribute(sway, 1)
    );
    instGeom.setAttribute(
      "aQuat",
      new THREE.InstancedBufferAttribute(quats, 4)
    );
    instGeom.instanceCount = bladeCount;

    const uniforms: GrassMaterialUniforms & {
      uFollowNormals: { value: number };
      uWaveAmp: { value: number };
      uWaveLength: { value: number };
      uWaveSpeed: { value: number };
      uWaveDir: { value: THREE.Vector2 };
      uWaveBlend: { value: number };
    } = {
      uTime: { value: clockRef.current },
      uWindStrength: { value: windStrength },
      uBladeHeight: { value: bladeHeight },
      uNoiseFreq: { value: noiseFreq },
      uNoiseAmp: { value: noiseAmp },
      uColorBottom: { value: new THREE.Color(colorBottom) },
      uColorTop: { value: new THREE.Color(colorTop) },
      uCurvature: { value: curvature },
      uFollowNormals: { value: followNormals ? 1 : 0 },
      uWaveAmp: { value: waveAmp },
      uWaveLength: { value: waveLength },
      uWaveSpeed: { value: waveSpeed },
      uWaveDir: {
        value: new THREE.Vector2(
          Math.cos((waveDirectionDeg * Math.PI) / 180),
          Math.sin((waveDirectionDeg * Math.PI) / 180)
        ),
      },
      uWaveBlend: { value: waveBlend },
    };

    return { geometry: instGeom, uniforms };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bladeCount, patchSize, sourceGeometry]);

  // Update dynamic uniforms from store
  useEffect(() => {
    if (materialRef.current)
      materialRef.current.uniforms.uWindStrength.value = windStrength;
  }, [windStrength]);
  useEffect(() => {
    if (materialRef.current)
      materialRef.current.uniforms.uBladeHeight.value = bladeHeight;
  }, [bladeHeight]);
  useEffect(() => {
    if (materialRef.current)
      materialRef.current.uniforms.uNoiseFreq.value = noiseFreq;
  }, [noiseFreq]);
  useEffect(() => {
    if (materialRef.current)
      materialRef.current.uniforms.uNoiseAmp.value = noiseAmp;
  }, [noiseAmp]);
  useEffect(() => {
    if (materialRef.current)
      materialRef.current.uniforms.uColorBottom.value.set(colorBottom);
  }, [colorBottom]);
  useEffect(() => {
    if (materialRef.current)
      materialRef.current.uniforms.uColorTop.value.set(colorTop);
  }, [colorTop]);
  useEffect(() => {
    if (materialRef.current)
      materialRef.current.uniforms.uCurvature.value = curvature;
  }, [curvature]);
  useEffect(() => {
    if (materialRef.current)
      materialRef.current.uniforms.uFollowNormals.value = followNormals ? 1 : 0;
  }, [followNormals]);
  useEffect(() => {
    if (materialRef.current)
      materialRef.current.uniforms.uWaveAmp.value = waveAmp;
  }, [waveAmp]);
  useEffect(() => {
    if (materialRef.current)
      materialRef.current.uniforms.uWaveLength.value = waveLength;
  }, [waveLength]);
  useEffect(() => {
    if (materialRef.current)
      materialRef.current.uniforms.uWaveSpeed.value = waveSpeed;
  }, [waveSpeed]);
  useEffect(() => {
    if (materialRef.current)
      materialRef.current.uniforms.uWaveBlend.value = waveBlend;
  }, [waveBlend]);

  useFrame((_, delta) => {
    clockRef.current += delta * timeScale;
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clockRef.current;

      // Recompute wave direction considering parent rotation
      const angleRad = (waveDirectionDeg * Math.PI) / 180;
      const base = waveDirBaseRef.current.set(
        Math.cos(angleRad),
        0,
        Math.sin(angleRad)
      );
      if (meshRef.current?.parent) {
        meshRef.current.parent.getWorldQuaternion(parentQuatRef.current);
        base.applyQuaternion(parentQuatRef.current);
      }
      // Project to XZ plane and normalize
      base.y = 0;
      if (base.lengthSq() > 1e-6) base.normalize();
      materialRef.current.uniforms.uWaveDir.value.set(base.x, base.z);
    }
  });

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} frustumCulled={false}>
        <rawShaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms as any}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh geometry={sourceGeometry!} receiveShadow castShadow>
        <meshStandardMaterial
          color={colorBottom}
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>
    </group>
  );
};
