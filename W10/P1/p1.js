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
function initEventHandlers(canvas, currentAngle) {       
    var dragging = false; 
    var lastX = -1, lastY = -1;          
    
    canvas.onmousedown = function(ev) {         
        var x = ev.clientX, y = ev.clientY;      
        var rect = ev.target.getBoundingClientRect();     
        
        if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {       
            lastX = x; 
            lastY = y;
            dragging = true;
        }
    };  
    canvas.onmouseup = function(ev) { 
        dragging = false; 
    };  
    canvas.onmousemove  = function(ev) {        
        var x = ev.clientX, y = ev.clientY;  
        if (dragging) {  
            var factor = 200/canvas.height;  
            var dx = factor * (x - lastX);        
            var dy = factor * (y - lastY);   
            currentAngle[0] = Math.max(Math.min(currentAngle[0] + dy, 90.0), -90.0);
            currentAngle[1] = currentAngle[1] + dx;   
        }     
            lastX = x, lastY = y; 
    };
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

    var currentAngle = [0.0, 0.0];     
    initEventHandlers(canvas, currentAngle);

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
    let u_LightDirection = gl.getUniformLocation(program, "u_LightDirection");
    let u_kd = gl.getUniformLocation(program, "u_kd");

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
        let rotationX = rotate(currentAngle[0], vec3(1, 0, 0));
        let rotationY = rotate(currentAngle[1], vec3(0, 1, 0));
    
        let rotatedViewMatrix = mult(lookAt(vec3(0, 0, radius), vec3(0, 0, 0), vec3(0, 1, 0)), mult(rotationX, rotationY));
    
        gl.uniformMatrix4fv(u_V, false, flatten(rotatedViewMatrix));
    
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
