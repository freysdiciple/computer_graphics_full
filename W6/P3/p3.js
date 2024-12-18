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

window.onload = () => {
    let canvas = document.getElementById("c");
    let gl = WebGLUtils.setupWebGL(canvas);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    let program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var ext = gl.getExtension('OES_element_index_uint');
    if (!ext) { console.log('Warning: Unable to use an extension'); }

    const vertices = [
        vec3(0, 0, -1),
        vec3(0, 2 * Math.sqrt(2) / 3, 1 / 3),
        vec3(-Math.sqrt(6) / 3, -Math.sqrt(2) / 3, 1 / 3),
        vec3(Math.sqrt(6) / 3, -Math.sqrt(2) / 3, 1 / 3)
    ];

    let triangles = [
        vec3(0, 1, 3),
        vec3(0, 3, 2),
        vec3(0, 2, 1),
        vec3(1, 2, 3)
    ];

    let numOfSubDivisions = 6;
    let triangleCount = flatten(triangles).length;

    // Uniform locations
    let u_P = gl.getUniformLocation(program, "u_P");
    let u_V = gl.getUniformLocation(program, "u_V");
    let u_M = gl.getUniformLocation(program, "u_M");

    let perspectiveMatrix = perspective(45, 1, 1, 20);
    let lookAtMatrix = lookAt(vec3(0, 0, 10), vec3(0, 0, 0), vec3(0, 1, 0));
    let modelMatrix = translate(0, 0, 0);

    gl.uniformMatrix4fv(u_P, false, flatten(perspectiveMatrix));
    gl.uniformMatrix4fv(u_V, false, flatten(lookAtMatrix));
    gl.uniformMatrix4fv(u_M, false, flatten(modelMatrix));

    let lightPosition = vec3(0, 0, 2);
    let lightColor = vec3(1, 1, 1); // Set to white light
    let ambientLight = vec3(0.5, 0.5, 0.5); // Set ambient light to a non-zero value

    var lightPositionLoc = gl.getUniformLocation(program, "u_LightPosition");
    var lightColorLoc = gl.getUniformLocation(program, "u_LightColor");
    var ambientLightLoc = gl.getUniformLocation(program, "u_AmbientLight");

    gl.uniform3fv(lightPositionLoc, flatten(lightPosition));
    gl.uniform3fv(lightColorLoc, flatten(lightColor));
    gl.uniform3fv(ambientLightLoc, flatten(ambientLight));

    let iBuffer = gl.createBuffer();
    let vBuffer = gl.createBuffer();

    function loopSubdivision(n) {
        let currentTriangles = triangles;

        for (let i = 0; i < n; i++) {
            currentTriangles = subdivide(currentTriangles, vertices);
        }

        return { vertices, triangles: currentTriangles };
    }

    // Load texture
    texture = gl.createTexture();
    const earthImage = new Image();
    earthImage.crossOrigin = 'anonymous'; // Enable CORS
    earthImage.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, earthImage);
        gl.generateMipmap(gl.TEXTURE_2D);
        // Set texture parameters to improve minification issues
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        render(); // Render after texture loads
        console.log(earthImage.src, " loaded")
    };
    earthImage.src = "./earth.jpg"; // Path to the image file

    // Create vertex normals for the sphere
    const normals = vertices.map(v => normalize(v));

    // Update vertex buffer to include normals
    // Create buffer for normals
    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
    
    var vNormal = gl.getAttribLocation(program, "a_Normal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    function loadSphere() {
        const { vertices: subdividedVertices, triangles: subdividedTriangles } = loopSubdivision(numOfSubDivisions);
        
        // Ensure you calculate normals based on new vertices
        triangleCount = flatten(subdividedTriangles).length;
        const normals = subdividedVertices.map(v => normalize(v));
    
        // Bind buffers for vertices, normals, and texture coordinates
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(flatten(subdividedTriangles)), gl.STATIC_DRAW);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(subdividedVertices), gl.STATIC_DRAW);
    
        var vPosition = gl.getAttribLocation(program, "a_Position");
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
    
        // Update normals buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
    
        var vNormal = gl.getAttribLocation(program, "a_Normal");
        gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vNormal);
    
        render();
    }
    
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        // Activate texture unit and bind texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0); // Set the sampler uniform
    
        // Draw the sphere
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.drawElements(gl.TRIANGLES, triangleCount, gl.UNSIGNED_INT, 0);
    }

    // Implement orbiting camera
    let angle = 0;
    let orbiting = false;
    const radius = 10;

    function tick() {
        if (orbiting) {
            angle += 0.01; // Increment angle for orbiting
            let eye = vec3(radius * Math.sin(angle), 0, radius * Math.cos(angle));
            lookAtMatrix = lookAt(eye, vec3(0, 0, 0), vec3(0, 1, 0));
            gl.uniformMatrix4fv(u_V, false, flatten(lookAtMatrix));
            render();
        }
        requestAnimationFrame(tick);
    }

    tick(); // Start the animation loop

    const incrementButton = document.getElementById("increment-button");
    incrementButton.addEventListener("click", () => {
        if(numOfSubDivisions > 7) return;
        numOfSubDivisions++;
        loadSphere();
    });
    
    const decrementButton = document.getElementById("decrement-button");
    decrementButton.addEventListener("click", () => {
        if(numOfSubDivisions < 1) return;
        numOfSubDivisions--;
        loadSphere();
    });

    const orbitButton = document.getElementById("orbit-button");
    orbitButton.addEventListener("click", () => {
        orbiting = !orbiting;
    });

    loadSphere();
};
