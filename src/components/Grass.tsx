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
  } = useControls();
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.RawShaderMaterial>(null!);
  const clockRef = useRef(0);

  const { geometry, uniforms } = useMemo(() => {
    // Base blade geometry: narrow plane with subdivisions along Y for bending.
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
    } = {
      uTime: { value: 0 },
      uWindStrength: { value: windStrength },
      uBladeHeight: { value: bladeHeight },
      uNoiseFreq: { value: noiseFreq },
      uNoiseAmp: { value: noiseAmp },
      uColorBottom: { value: new THREE.Color(colorBottom) },
      uColorTop: { value: new THREE.Color(colorTop) },
      uCurvature: { value: curvature },
      uFollowNormals: { value: followNormals ? 1 : 0 },
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

  useFrame((_, delta) => {
    clockRef.current += delta * timeScale;
    if (materialRef.current)
      materialRef.current.uniforms.uTime.value = clockRef.current;
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        frustumCulled={false}
        rotation={[0, 0, 0]}
      >
        <rawShaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms as any}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Ground */}
      {!sourceGeometry && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[patchSize, patchSize, 1, 1]} />
          <meshStandardMaterial color={colorBottom} />
        </mesh>
      )}
    </group>
  );
};
