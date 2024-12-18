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
function initEventHandlers(canvas, qrot, qinc) {
    var dragging = false;         // Dragging or not
    var lastX = -1, lastY = -1;   // Last position of the mouse

    canvas.onmousedown = function (ev) {   // Mouse is pressed
        var x = ev.clientX, y = ev.clientY;
        // Start dragging if a mouse is in <canvas>
        var rect = ev.target.getBoundingClientRect();
        if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
        lastX = x; lastY = y;
        dragging = true;
        }
    };

    canvas.onmouseup = function (ev) {
        qinc.setIdentity();
        dragging = false;
    }; // Mouse is released

    canvas.onmousemove = function (ev) { // Mouse is moved
        var x = ev.clientX, y = ev.clientY;
        if (dragging) {
            var rect = ev.target.getBoundingClientRect();
            var s_x = ((x - rect.left) / rect.width - 0.5) * 2;
            var s_y = (0.5 - (y - rect.top) / rect.height) * 2;
            var s_last_x = ((lastX - rect.left) / rect.width - 0.5) * 2;
            var s_last_y = (0.5 - (lastY - rect.top) / rect.height) * 2;
            var v1 = vec3([s_x, s_y, mapToSphere(s_x, s_y)]);
            var v2 = vec3([s_last_x, s_last_y, mapToSphere(s_last_x, s_last_y)]);
            qinc = qinc.make_rot_vec2vec(normalize(v1), normalize(v2));
            qrot = qrot.multiply(qinc);
        }
        lastX = x, lastY = y;
    };
}
function mapToSphere(x, y) {
    var r = 2;
    var d = Math.sqrt(x * x + y * y);
    var t = r * Math.sqrt(2);
    var z;
    if (d < r) // Inside sphere
        z = Math.sqrt(r * r - d * d);
    else if (d < t)
        z = 0;
    else       // On hyperbola
        z = t * t / d;
    return z;
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

    let qrot = new Quaternion(); 
    let qinc = new Quaternion();
    initEventHandlers(canvas, qrot, qinc);

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

    let numOfSubDivisions = 0;
    let triangleCount = flatten(triangles).length;

    // Uniform locations
    let u_P = gl.getUniformLocation(program, "u_P");
    let u_V = gl.getUniformLocation(program, "u_V");
    let u_M = gl.getUniformLocation(program, "u_M");

    let perspectiveMatrix = perspective(45, 1, 1, 20);
    let lookAtMatrix = lookAt(vec3(0, 0, 10), vec3(0, 0, 0), vec3(0, 1, 0));
    let modelMatrix = translate(0,0,0)

    gl.uniformMatrix4fv(u_P, false, flatten(perspectiveMatrix));
    gl.uniformMatrix4fv(u_V, false, flatten(lookAtMatrix));
    gl.uniformMatrix4fv(u_M, false, flatten(modelMatrix));

    let lightPosition = vec3(0, 0, 2);
    let lightColor = vec3(1, 0.4, 0.4);
    let ambientLight = vec3(0, 0, 0);

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

    function loadSphere() {
        const { vertices: subdividedVertices, triangles: subdividedTriangles } = loopSubdivision(numOfSubDivisions);

        triangleCount = flatten(subdividedTriangles).length

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(flatten(subdividedTriangles)), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(subdividedVertices), gl.STATIC_DRAW);

        var vPosition = gl.getAttribLocation(program, "a_Position");
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        render();
    }
    
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
        gl.drawElements(gl.TRIANGLES, triangleCount, gl.UNSIGNED_INT, 0);
    }

    const radius = 10;

    function tick() {
        var up = qrot.apply(vec3(0, 1, 0));
        var rot_eye = qrot.apply(vec3(0, 0, radius));
    
        gl.uniformMatrix4fv(u_V, false, flatten(lookAt(rot_eye, vec3(0, 0, 0), up)));
        
        render();
        requestAnimationFrame(tick);
    }
    

    tick(); 

    const incrementButton = document.getElementById("increment-button");
    incrementButton.addEventListener("click", () => {
        if(numOfSubDivisions > 7) return;
        numOfSubDivisions++;
        loadSphere();
    })
    const decrementButton = document.getElementById("decrement-button");
    decrementButton.addEventListener("click", () => {
        if(numOfSubDivisions < 1) return;
        numOfSubDivisions--;
        loadSphere();
    })

    loadSphere();
};
