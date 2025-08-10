import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useControls } from '../store/useControls';
import vertexShader from '../shaders/grass.vert.glsl?raw';
import fragmentShader from '../shaders/grass.frag.glsl?raw';

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

export const Grass: React.FC = () => {
  const { bladeCount, patchSize, bladeHeight, windStrength, noiseFreq, noiseAmp, colorBottom, colorTop, curvature, timeScale } = useControls();
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
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
    for (let i = 0; i < bladeCount; i++) {
      const xi = (Math.random() - 0.5) * patchSize;
      const zi = (Math.random() - 0.5) * patchSize;
      const yi = 0; // ground level
      offsets[i * 3 + 0] = xi;
      offsets[i * 3 + 1] = yi;
      offsets[i * 3 + 2] = zi;
      scales[i] = 0.6 + Math.random() * 0.9; // variation height
      sway[i] = Math.random() * Math.PI * 2; // phase offset
    }
    instGeom.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 3));
    instGeom.setAttribute('aScale', new THREE.InstancedBufferAttribute(scales, 1));
    instGeom.setAttribute('aPhase', new THREE.InstancedBufferAttribute(sway, 1));
    instGeom.instanceCount = bladeCount;

    const uniforms: GrassMaterialUniforms = {
      uTime: { value: 0 },
      uWindStrength: { value: windStrength },
      uBladeHeight: { value: bladeHeight },
      uNoiseFreq: { value: noiseFreq },
      uNoiseAmp: { value: noiseAmp },
      uColorBottom: { value: new THREE.Color(colorBottom) },
      uColorTop: { value: new THREE.Color(colorTop) },
      uCurvature: { value: curvature }
    };

    return { geometry: instGeom, uniforms };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bladeCount, patchSize]);

  // Update dynamic uniforms from store
  useEffect(() => { if (materialRef.current) materialRef.current.uniforms.uWindStrength.value = windStrength; }, [windStrength]);
  useEffect(() => { if (materialRef.current) materialRef.current.uniforms.uBladeHeight.value = bladeHeight; }, [bladeHeight]);
  useEffect(() => { if (materialRef.current) materialRef.current.uniforms.uNoiseFreq.value = noiseFreq; }, [noiseFreq]);
  useEffect(() => { if (materialRef.current) materialRef.current.uniforms.uNoiseAmp.value = noiseAmp; }, [noiseAmp]);
  useEffect(() => { if (materialRef.current) materialRef.current.uniforms.uColorBottom.value.set(colorBottom); }, [colorBottom]);
  useEffect(() => { if (materialRef.current) materialRef.current.uniforms.uColorTop.value.set(colorTop); }, [colorTop]);
  useEffect(() => { if (materialRef.current) materialRef.current.uniforms.uCurvature.value = curvature; }, [curvature]);

  useFrame((_, delta) => {
    clockRef.current += delta * timeScale;
    if (materialRef.current) materialRef.current.uniforms.uTime.value = clockRef.current;
  });

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} frustumCulled={false} rotation={[-Math.PI / 2, 0, 0]}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
            fragmentShader={fragmentShader}
          uniforms={uniforms as any}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[patchSize * 1.2, patchSize * 1.2, 1, 1]} />
        <meshStandardMaterial color="#1d2d15" />
      </mesh>
    </group>
  );
};
