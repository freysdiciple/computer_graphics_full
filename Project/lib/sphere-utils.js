function midpoint(v1, v2) {
    const mid = [
        (v1[0] + v2[0]) / 2,
        (v1[1] + v2[1]) / 2,
        (v1[2] + v2[2]) / 2
    ];
    return normalize(mid);
}

function subdivide(triangles, vertices) {
    const newTriangles = [];

    function createMidpoint(i1, i2) {
        const mid = midpoint(vertices[i1], vertices[i2]);
        vertices.push(mid);
        const index = vertices.length - 1;
        return index;
    }

    for (const [v0, v1, v2] of triangles) {
        const a = createMidpoint(v0, v1);
        const b = createMidpoint(v1, v2);
        const c = createMidpoint(v2, v0);

        newTriangles.push(vec3(v0, a, c));
        newTriangles.push(vec3(v1, b, a));
        newTriangles.push(vec3(v2, c, b));
        newTriangles.push(vec3(a, b, c));
    }

    return newTriangles;
}

function loopSubdivision(n) {
    let currentVertices = [
        vec3(0, 0, -1),
        vec3(0, 2 * Math.sqrt(2) / 3, 1 / 3),
        vec3(-Math.sqrt(6) / 3, -Math.sqrt(2) / 3, 1 / 3),
        vec3(Math.sqrt(6) / 3, -Math.sqrt(2) / 3, 1 / 3)
    ];

    let currentTriangles = [
        vec3(0, 1, 3),
        vec3(0, 3, 2),
        vec3(0, 2, 1),
        vec3(1, 2, 3)
    ];

    for (let i = 0; i < n; i++) {
        currentTriangles = subdivide(currentTriangles, currentVertices);
    }

    return { vertices: currentVertices, triangles: currentTriangles, normals: currentVertices.map(normalize) };
}