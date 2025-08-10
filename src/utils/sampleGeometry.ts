import * as THREE from 'three';

export interface SampledSurfaceData {
	positions: Float32Array; // xyz per sample
	normals: Float32Array;   // xyz per sample
}

// Area-weighted random triangle selection, then barycentric sampling.
export function sampleGeometrySurface(
	geometry: THREE.BufferGeometry,
	count: number,
	target: SampledSurfaceData = { positions: new Float32Array(count * 3), normals: new Float32Array(count * 3) }
): SampledSurfaceData {
	// Ensure we have an index
	let geom = geometry;
	if (!geom.index) {
		geom = geom.toNonIndexed();
	}
	const posAttr = geom.getAttribute('position');
	if (!posAttr) throw new Error('Geometry missing position attribute');
	// Ensure normals exist
	if (!geom.getAttribute('normal')) {
		geom.computeVertexNormals();
	}
	const normAttr = geom.getAttribute('normal');
	const index = geom.index ? geom.index.array as ArrayLike<number> : undefined;
	const triCount = index ? index.length / 3 : posAttr.count / 3;

	// Precompute cumulative areas
	const cumulative = new Float32Array(triCount);
	let totalArea = 0;
	const a = new THREE.Vector3();
	const b = new THREE.Vector3();
	const c = new THREE.Vector3();
	for (let i = 0; i < triCount; i++) {
		const i0 = index ? index[i * 3] : i * 3;
		const i1 = index ? index[i * 3 + 1] : i * 3 + 1;
		const i2 = index ? index[i * 3 + 2] : i * 3 + 2;
		a.fromBufferAttribute(posAttr as any, i0);
		b.fromBufferAttribute(posAttr as any, i1);
		c.fromBufferAttribute(posAttr as any, i2);
		const area = b.clone().sub(a).cross(c.clone().sub(a)).length() * 0.5;
		totalArea += area;
		cumulative[i] = totalArea;
	}

	const tmp = new THREE.Vector3();
	const nA = new THREE.Vector3();
	const nB = new THREE.Vector3();
	const nC = new THREE.Vector3();

	function pickTriangle(r: number) {
		// binary search
		let low = 0, high = triCount - 1;
		while (low < high) {
			const mid = (low + high) >>> 1;
			if (r <= cumulative[mid]) high = mid; else low = mid + 1;
		}
		return low;
	}

	for (let i = 0; i < count; i++) {
		const r = Math.random() * totalArea;
		const tri = pickTriangle(r);
		const i0 = index ? index[tri * 3] : tri * 3;
		const i1 = index ? index[tri * 3 + 1] : tri * 3 + 1;
		const i2 = index ? index[tri * 3 + 2] : tri * 3 + 2;
		a.fromBufferAttribute(posAttr as any, i0);
		b.fromBufferAttribute(posAttr as any, i1);
		c.fromBufferAttribute(posAttr as any, i2);
		nA.fromBufferAttribute(normAttr as any, i0);
		nB.fromBufferAttribute(normAttr as any, i1);
		nC.fromBufferAttribute(normAttr as any, i2);
		// barycentric random inside triangle
		let u = Math.random();
		let v = Math.random();
		if (u + v > 1) { u = 1 - u; v = 1 - v; }
		tmp.copy(a).add(b.clone().sub(a).multiplyScalar(u)).add(c.clone().sub(a).multiplyScalar(v));
		const normal = nA.clone().multiplyScalar(1 - u - v).add(nB.clone().multiplyScalar(u)).add(nC.clone().multiplyScalar(v)).normalize();
		target.positions[i * 3] = tmp.x;
		target.positions[i * 3 + 1] = tmp.y;
		target.positions[i * 3 + 2] = tmp.z;
		target.normals[i * 3] = normal.x;
		target.normals[i * 3 + 1] = normal.y;
		target.normals[i * 3 + 2] = normal.z;
	}
	return target;
}

// Helper to build a quaternion that rotates (0,1,0) to target normal.
export function quaternionFromUpToNormal(normal: THREE.Vector3, out = new THREE.Quaternion()): THREE.Quaternion {
	const up = new THREE.Vector3(0, 1, 0);
	// If nearly opposite
	if (up.dot(normal) < -0.9995) {
		// 180 degree rotate around arbitrary perpendicular axis
		const axis = new THREE.Vector3(1, 0, 0).cross(up);
		if (axis.lengthSq() < 1e-6) axis.set(0, 0, 1);
		axis.normalize();
		out.setFromAxisAngle(axis, Math.PI);
		return out;
	}
	out.setFromUnitVectors(up, normal.clone().normalize());
	return out;
}
