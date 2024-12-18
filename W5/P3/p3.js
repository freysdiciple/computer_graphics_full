
window.onload = async () => {
    let canvas = document.getElementById("c");
    let gl = WebGLUtils.setupWebGL(canvas);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    let program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST)

    var ext = gl.getExtension('OES_element_index_uint');
    if (!ext) { console.log('Warning: Unable to use an extension'); }

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

    // Setup light parameters
    gl.uniform3fv(lightPositionLoc, flatten(lightPosition));
    gl.uniform3fv(lightColorLoc, flatten(lightColor));
    gl.uniform3fv(ambientLightLoc, flatten(ambientLight));

    // Add uniform locations for the material and light parameters
    let u_Kd = gl.getUniformLocation(program, "u_Kd");
    let u_Ks = gl.getUniformLocation(program, "u_Ks");
    let u_Shininess = gl.getUniformLocation(program, "u_Shininess");

    // Set initial values for material parameters
    gl.uniform1f(u_Kd, 0.5); // initial diffuse coefficient
    gl.uniform1f(u_Ks, 0.5); // initial specular coefficient
    gl.uniform1f(u_Shininess, 10); // initial shininess factor

    let iBuffer = gl.createBuffer();
    let vBuffer = gl.createBuffer();
    const drawingInfo = await readOBJFile("./dyret.obj", 0.5, true);
    console.log(drawingInfo);
    let triangleCount = drawingInfo.indices.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(drawingInfo.indices), gl.STATIC_DRAW);
    
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
        gl.drawElements(gl.TRIANGLES, triangleCount, gl.UNSIGNED_INT, 0);
    }
    render();

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

    const orbitButton = document.getElementById("orbit-button");
    orbitButton.addEventListener("click", () => {
        orbiting = !orbiting;
    })

    // Event listeners for the sliders
    document.getElementById('kd').addEventListener('input', (event) => {
        gl.uniform1f(u_Kd, event.target.value);
        render();
    });

    document.getElementById('ks').addEventListener('input', (event) => {
        gl.uniform1f(u_Ks, event.target.value);
        render();
    });

    document.getElementById('shininess').addEventListener('input', (event) => {
        gl.uniform1f(u_Shininess, event.target.value);
        render();
    });

    document.getElementById('light-intensity').addEventListener('input', (event) => {
        const intensity = event.target.value;
        gl.uniform3f(lightColorLoc, intensity, intensity, intensity); // Adjust light color based on intensity
        render();
    });
};
