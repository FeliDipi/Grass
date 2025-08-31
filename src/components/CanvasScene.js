import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, OrbitControls, PerformanceMonitor, PerspectiveCamera, Sky, Stats, useGLTF, } from "@react-three/drei";
import { Grass } from "./Grass";
import { setupGUI } from "../gui/setupGUI";
import * as THREE from "three";
import { useControls } from "../store/useControls";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
export const CanvasScene = () => {
    const [dpr, setDpr] = useState([1, 2]);
    useEffect(() => {
        const gui = setupGUI();
        return () => gui.destroy();
    }, []);
    const { distribution, patchSize } = useControls();
    const gltf = useGLTF(`${import.meta.env.BASE_URL}models/rabbit.glb`, true, true);
    const sourceGeometry = useMemo(() => {
        if (distribution === "custom") {
            if (gltf && gltf.scene) {
                const geometries = [];
                gltf.scene.updateMatrixWorld(true);
                gltf.scene.traverse((child) => {
                    if (child.isMesh && child.geometry) {
                        const cloned = child.geometry.clone();
                        cloned.applyMatrix4(child.matrixWorld);
                        geometries.push(cloned);
                    }
                });
                if (geometries.length) {
                    let merged = geometries.length === 1
                        ? geometries[0]
                        : mergeGeometries(geometries, true);
                    if (!merged.getAttribute("normal"))
                        merged.computeVertexNormals();
                    merged.computeBoundingSphere();
                    merged.computeBoundingBox();
                    return merged;
                }
            }
            return null;
        }
        switch (distribution) {
            case "sphere": {
                const g = new THREE.SphereGeometry(patchSize * 0.5, 32, 32);
                g.computeBoundingSphere();
                g.computeBoundingBox();
                return g;
            }
            case "torus": {
                const g = new THREE.TorusKnotGeometry(patchSize * 0.2, patchSize * 0.06, 128, 16);
                g.computeBoundingSphere();
                g.computeBoundingBox();
                return g;
            }
            case "plane":
            default: {
                const g = new THREE.PlaneGeometry(patchSize, patchSize, 1, 1);
                const rot = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
                g.applyMatrix4(rot);
                g.computeVertexNormals();
                g.computeBoundingSphere();
                g.computeBoundingBox();
                return g;
            }
        }
    }, [distribution, patchSize, gltf]);
    return (_jsxs(Canvas, { dpr: dpr, shadows: false, gl: {
            autoClear: true,
            powerPreference: "high-performance",
            antialias: true,
            alpha: false,
            stencil: false,
            depth: true,
            preserveDrawingBuffer: false,
        }, "aria-hidden": true, role: "scene", tabIndex: -1, children: [_jsx(PerformanceMonitor, { onDecline: () => setDpr(1), onIncline: () => setDpr([1, 2]) }), _jsx(AdaptiveDpr, { pixelated: true }), _jsx(Stats, {}), _jsx("ambientLight", { intensity: 0.5 }), _jsx("directionalLight", { position: [10, 15, 5], intensity: 1.2 }), _jsx(Sky, { sunPosition: [50, 30, -10], turbidity: 8, mieCoefficient: 0.02 }), _jsx(OrbitControls, { enableDamping: true, target: [0, 8, 0] }), _jsx(PerspectiveCamera, { makeDefault: true, position: [12, 15, 50], fov: 50 }), _jsx(Grass, { sourceGeometry: sourceGeometry || undefined })] }));
};
