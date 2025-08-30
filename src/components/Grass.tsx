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
    bladeWidth,
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
    wireframe,
  } = useControls();
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.RawShaderMaterial>(null!);
  const clockRef = useRef(0);
  const waveDirBaseRef = useRef(new THREE.Vector3());
  const parentQuatRef = useRef(new THREE.Quaternion());

  // Persistent uniforms (do not recreate on geometry changes)
  const uniformsRef = useRef<
    | (GrassMaterialUniforms & {
        uFollowNormals: { value: number };
        uWaveAmp: { value: number };
        uWaveLength: { value: number };
        uWaveSpeed: { value: number };
        uWaveDir: { value: THREE.Vector2 };
        uWaveBlend: { value: number };
        uInteractorPos: { value: THREE.Vector3 };
        uInteractorRadius: { value: number };
        uInteractorStrength: { value: number };
        uInteractorEnabled: { value: number };
      })
    | null
  >(null);
  if (!uniformsRef.current) {
    uniformsRef.current = {
      uTime: { value: 0 },
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
      uInteractorPos: { value: new THREE.Vector3(0, 0, 0) },
      uInteractorRadius: { value: 5 },
      uInteractorStrength: { value: 1.25 },
      uInteractorEnabled: { value: 1 },
    };
    // Expose for GUI direct edits (radius/strength/enabled)
    (window as any).__grassUniforms = uniformsRef.current;
    (window as any).__grassInteractEnabled = true;
  }

  const geometry = useMemo(() => {
    // Minimal blade: single triangle (3 verts) -> base left, base right, tip
    const halfWidth = Math.max(0.0005, Math.min(0.5, bladeWidth * 0.5));
    const positions = new Float32Array([
      -halfWidth,
      0,
      0, // v0 base left at ground
      halfWidth,
      0,
      0, // v1 base right at ground
      0,
      1,
      0, // v2 tip (scaled in shader by bladeHeight and aScale)
    ]);
    const uvs = new Float32Array([0, 0, 1, 0, 0.5, 1]);
    const normals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]);
    const index = new Uint16Array([0, 1, 2]);
    const baseBlade = new THREE.BufferGeometry();
    baseBlade.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    baseBlade.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    baseBlade.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    baseBlade.setIndex(new THREE.BufferAttribute(index, 1));
    // Keep base at y=0 so instance offset lands the base exactly on the surface

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
        // If geometry carries a world matrix in userData (for external callers), clone and apply before sampling
        let geom = sourceGeometry;
        const mw: THREE.Matrix4 | undefined = (geom as any).userData
          ?.matrixWorld;
        if (mw) {
          geom = geom.clone();
          geom.applyMatrix4(mw);
        }
        sampled = sampleGeometrySurface(geom, bladeCount);
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

    return instGeom;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bladeCount, patchSize, sourceGeometry, bladeWidth]);

  // Update dynamic uniforms from store
  useEffect(() => {
    if (uniformsRef.current)
      uniformsRef.current.uWindStrength.value = windStrength;
  }, [windStrength]);
  useEffect(() => {
    if (uniformsRef.current)
      uniformsRef.current.uBladeHeight.value = bladeHeight;
  }, [bladeHeight]);
  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.uNoiseFreq.value = noiseFreq;
  }, [noiseFreq]);
  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.uNoiseAmp.value = noiseAmp;
  }, [noiseAmp]);
  useEffect(() => {
    if (uniformsRef.current)
      uniformsRef.current.uColorBottom.value.set(colorBottom);
  }, [colorBottom]);
  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.uColorTop.value.set(colorTop);
  }, [colorTop]);
  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.uCurvature.value = curvature;
  }, [curvature]);
  useEffect(() => {
    if (uniformsRef.current)
      uniformsRef.current.uFollowNormals.value = followNormals ? 1 : 0;
  }, [followNormals]);
  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.uWaveAmp.value = waveAmp;
  }, [waveAmp]);
  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.uWaveLength.value = waveLength;
  }, [waveLength]);
  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.uWaveSpeed.value = waveSpeed;
  }, [waveSpeed]);
  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.uWaveBlend.value = waveBlend;
  }, [waveBlend]);

  useFrame((_, delta) => {
    clockRef.current += delta * timeScale;
    if (uniformsRef.current) {
      uniformsRef.current.uTime.value = clockRef.current;

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
      uniformsRef.current.uWaveDir.value.set(base.x, base.z);
    }
    // If geometry changed, update mesh without re-instantiating material
    if (meshRef.current && meshRef.current.geometry !== geometry) {
      meshRef.current.geometry.dispose();
      meshRef.current.geometry = geometry;
    }
    if (materialRef.current) {
      materialRef.current.wireframe = !!wireframe;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} frustumCulled={false}>
        <rawShaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniformsRef.current as any}
          side={THREE.DoubleSide}
          wireframe={false}
        />
      </mesh>
      {sourceGeometry ? (
        <mesh
          geometry={sourceGeometry}
          receiveShadow
          castShadow
          onPointerMove={(e) => {
            e.stopPropagation();
            if (!uniformsRef.current) return;
            if ((window as any).__grassInteractEnabled === false) return;
            uniformsRef.current.uInteractorEnabled.value = 1;
            uniformsRef.current.uInteractorPos.value.copy(e.point);
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            if (!uniformsRef.current) return;
            if ((window as any).__grassInteractEnabled === false) return;
            uniformsRef.current.uInteractorEnabled.value = 1;
            uniformsRef.current.uInteractorPos.value.copy(e.point);
          }}
          onPointerLeave={() => {
            if (!uniformsRef.current) return;
            uniformsRef.current.uInteractorEnabled.value = 0;
          }}
        >
          <meshStandardMaterial
            color={colorBottom}
            roughness={0.9}
            metalness={0.0}
          />
        </mesh>
      ) : (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
          onPointerMove={(e) => {
            e.stopPropagation();
            if (!uniformsRef.current) return;
            if ((window as any).__grassInteractEnabled === false) return;
            uniformsRef.current.uInteractorEnabled.value = 1;
            uniformsRef.current.uInteractorPos.value.copy(e.point);
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            if (!uniformsRef.current) return;
            if ((window as any).__grassInteractEnabled === false) return;
            uniformsRef.current.uInteractorEnabled.value = 1;
            uniformsRef.current.uInteractorPos.value.copy(e.point);
          }}
          onPointerLeave={() => {
            if (!uniformsRef.current) return;
            uniformsRef.current.uInteractorEnabled.value = 0;
          }}
        >
          <planeGeometry args={[patchSize, patchSize, 1, 1]} />
          <meshStandardMaterial color={colorBottom} roughness={0.95} />
        </mesh>
      )}
    </group>
  );
};
