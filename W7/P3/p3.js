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

    let u_P = gl.getUniformLocation(program, "u_P");
    let u_V = gl.getUniformLocation(program, "u_V");
    let u_M = gl.getUniformLocation(program, "u_M");

    let perspectiveMatrix = perspective(90, 1, 1, 20);
    let lookAtMatrix = lookAt(vec3(0, 0, 10), vec3(0, 0, 0), vec3(0, 1, 0));
    let modelMatrix = translate(0, 0, 0);

    gl.uniformMatrix4fv(u_P, false, flatten(perspectiveMatrix));
    gl.uniformMatrix4fv(u_V, false, flatten(lookAtMatrix));
    gl.uniformMatrix4fv(u_M, false, flatten(modelMatrix));

    let ambientLight = vec3(1, 1, 1); 

    var ambientLightLoc = gl.getUniformLocation(program, "u_AmbientLight");


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

    const cubemap = [
        '../cm_left.png',    
        '../cm_right.png',   
        '../cm_top.png',    
        '../cm_bottom.png', 
        '../cm_back.png',   
        '../cm_front.png' 
    ];

    let imagesLoaded = 0;
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

    cubemap.forEach((src, index) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = (event) => {
            const img = event.target;
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

            gl.texImage2D(
                gl.TEXTURE_CUBE_MAP_POSITIVE_X + index,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                img
            );

            imagesLoaded += 1;

            if (imagesLoaded === 6) {
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

                console.log("All cube map images loaded");

                tick();
            }
        };
        image.src = src;

    });


    const normals = vertices.map(v => normalize(v));

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program, "a_Normal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);



    function loadSphere() {

        const { vertices: subdividedVertices, triangles: subdividedTriangles } = loopSubdivision(numOfSubDivisions);

        triangleCount = flatten(subdividedTriangles).length;

        const normals = subdividedVertices.map(v => normalize(v));

        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(subdividedVertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(flatten(subdividedTriangles)), gl.STATIC_DRAW);

    }
    function drawSphere() {
        
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        const vPosition = gl.getAttribLocation(program, "a_Position");
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        const vNormal = gl.getAttribLocation(program, "a_Normal");
        gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vNormal);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);

        gl.drawElements(gl.TRIANGLES, triangleCount, gl.UNSIGNED_INT, 0);

    }
    function drawBackgroundQuad() {
        const quadVertices = new Float32Array([
            -1, -1, 0.999, 1,   
            1, -1, 0.999, 1,    
            -1, 1, 0.999, 1,   
            1, 1, 0.999, 1      
        ]);

        const quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

        const vPosition = gl.getAttribLocation(program, "a_Position");
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    let invProjectionMatrix = inverse(perspectiveMatrix);

    let viewRotationOnly = mat4(
        lookAtMatrix[0][0], lookAtMatrix[0][1], lookAtMatrix[0][2], 0,
        lookAtMatrix[1][0], lookAtMatrix[1][1], lookAtMatrix[1][2], 0,
        lookAtMatrix[2][0], lookAtMatrix[2][1], lookAtMatrix[2][2], 0,
        0, 0, 0, 1
    );
    let invViewRotation = inverse(viewRotationOnly);

    let Mtex = mult(invViewRotation, invProjectionMatrix);

    let u_Mtex = gl.getUniformLocation(program, "u_Mtex");
    gl.uniformMatrix4fv(u_Mtex, false, flatten(Mtex));

    let u_EyePosition = gl.getUniformLocation(program, "u_EyePosition");
    let u_Reflective = gl.getUniformLocation(program, "u_Reflective");
    gl.uniform3fv(u_EyePosition, flatten(vec3(0, 0, 10)));

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        if (orbiting) {
            let eye = vec3(radius * Math.sin(angle), 0, radius * Math.cos(angle));
            lookAtMatrix = lookAt(eye, vec3(0, 0, 0), vec3(0, 1, 0));
            gl.uniformMatrix4fv(u_V, false, flatten(lookAtMatrix));
            gl.uniform3fv(u_EyePosition, flatten(eye));
        }

        gl.uniform1i(u_Reflective, false); 
        gl.uniform1i(gl.getUniformLocation(program, "u_IsBackground"), true);
        drawBackgroundQuad();

        gl.uniform1i(u_Reflective, true); 
        gl.uniform1i(gl.getUniformLocation(program, "u_IsBackground"), false);



        let sphereScaleFactor = 3.0; 
        let scaledModelMatrix = mult(translate(0, 0, 0), scalem(sphereScaleFactor, sphereScaleFactor, sphereScaleFactor));
        gl.uniformMatrix4fv(u_M, false, flatten(scaledModelMatrix));

        drawSphere();
    }

    let angle = 0;
    let orbiting = false;
    const radius = 10;

    function tick() {
        if (orbiting) {
            angle += 0.01;
            let eye = vec3(radius * Math.sin(angle), 0, radius * Math.cos(angle));
            lookAtMatrix = lookAt(eye, vec3(0, 0, 0), vec3(0, 1, 0));
            gl.uniformMatrix4fv(u_V, false, flatten(lookAtMatrix));

        }
        render();
        requestAnimationFrame(tick);
    }

    const incrementButton = document.getElementById("increment-button");
    incrementButton.addEventListener("click", () => {
        if (numOfSubDivisions > 7) return;
        numOfSubDivisions++;
        loadSphere();
    });

    const decrementButton = document.getElementById("decrement-button");
    decrementButton.addEventListener("click", () => {
        if (numOfSubDivisions < 1) return;
        numOfSubDivisions--;
        loadSphere();
    });

    const orbitButton = document.getElementById("orbit-button");
    orbitButton.addEventListener("click", () => {
        orbiting = !orbiting;
    });
    loadSphere();

};