function resizeCanvas(gl, canvas) {

    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniformMatrix4fv(gl.u_Projection, false, flatten(perspective(45, canvas.width / canvas.height, 0.1, 50)));
    }
}

//Setup main scene (main user interface)
function setupMainScene() {

    //WebGL Setup
    const canvas = document.getElementById("obj-canvas");
    const gl = WebGLUtils.setupWebGL(canvas, { alpha: false });
    gl.canvas = canvas;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.enable(gl.DEPTH_TEST);
    var ext = gl.getExtension('OES_element_index_uint');
    if (!ext) { console.log('Warning: Unable to use an extension'); }

    const program = initShaders(gl, "obj-vertex-shader", "obj-fragment-shader");
    gl.useProgram(program);

    //Allow the canvas to be resized
    window.addEventListener("resize", render)

    //Setup Rotation
    const radius = { value: 10 };
    const currentAngle = [0.0, 0.0];
    initEventHandlers(canvas, currentAngle);
    initZoomHandlers(canvas, radius);

    //Camera Setup
    gl.u_Model = gl.getUniformLocation(program, "u_Model");
    gl.u_View = gl.getUniformLocation(program, "u_View");
    gl.u_Projection = gl.getUniformLocation(program, "u_Projection");

    //Object Setup
    const indexCount = { value: 0 };
    gl.a_Position = gl.getAttribLocation(program, "a_Position");
    gl.vertexBuffer = gl.createBuffer();
    gl.indexBuffer = gl.createBuffer();
    gl.a_Normal = gl.getAttribLocation(program, "a_Normal");
    gl.normalBuffer = gl.createBuffer();
    initObjUploadHandlers(gl, indexCount);
    insertObjFromURL(gl, './static/teapot.obj', indexCount);

    //MatCap Setup
    gl.u_MatcapTexture = gl.getUniformLocation(program, "u_MatcapTexture");
    gl.matcapTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, gl.matcapTexture);
    loadMatCap(gl, './static/matcaps/mose_matcap.png');
    initMatCapUploadHandlers(gl);
    drawMatCaps(gl);

    //Render Logic
    function render() {

        //Apply viewport changes
        resizeCanvas(gl, canvas);

        //Apply Rotation
        let rotationX = rotate(currentAngle[0], vec3(1, 0, 0));
        let rotationY = rotate(currentAngle[1], vec3(0, 1, 0));
        let rotatedViewMatrix = mult(
            lookAt(vec3(0, 0, radius.value), vec3(0, 0, 0), vec3(0, 1, 0)),
            mult(rotationX, rotationY)
        );
        gl.uniformMatrix4fv(gl.u_View, false, flatten(rotatedViewMatrix));

        //Render Object
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.vertexBuffer);
        gl.vertexAttribPointer(gl.a_Position, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(gl.a_Position);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.normalBuffer);
        gl.vertexAttribPointer(gl.a_Normal, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(gl.a_Normal);

        //Render MatCap
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, gl.matcapTexture);
        gl.uniform1i(gl.u_MatcapTexture, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.indexBuffer);
        gl.drawElements(gl.TRIANGLES, indexCount.value, gl.UNSIGNED_INT, 0);
    }
    function tick() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        render();
        requestAnimationFrame(tick);
    }
    tick(); //Start Loop

    //Handle modal logic
    initModalCloseHandler();

    return gl;
}

//Setup Matcap creation scene
function setupEditScene(main_gl) {
    //WebGL Setup
    const canvas = document.getElementById("edit-matcap-canvas");
    const gl = WebGLUtils.setupWebGL(canvas, { alpha: false, preserveDrawingBuffer: true});
    gl.canvas = canvas;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.background = { r: 0, g: 0, b: 0 }
    gl.clearColor(gl.background.r, gl.background.g, gl.background.b, 1.0);
    var ext = gl.getExtension('OES_element_index_uint');
    if (!ext) { console.log('Warning: Unable to use an extension'); }

    const program = initShaders(gl, "edit-vertex-shader", "edit-fragment-shader");
    gl.useProgram(program);

    //Camera Setup
    gl.u_Model = gl.getUniformLocation(program, "u_Model");
    gl.u_View = gl.getUniformLocation(program, "u_View");
    gl.u_Projection = gl.getUniformLocation(program, "u_Projection");
    
    const viewPosition = vec3(0, 0, 2);
    gl.uniformMatrix4fv(gl.u_View, false, flatten(lookAt(viewPosition, vec3(0, 0, 0), vec3(0, 1, 0))));
    gl.uniformMatrix4fv(gl.u_Model, false, flatten(translate(0, 0, 0)));
    gl.uniformMatrix4fv(gl.u_Projection, false, flatten(perspective(90, canvas.width / canvas.height, 0.1, 10)));

    //Sphere Setup
    const { vertices, triangles, normals } = loopSubdivision(8);

    gl.a_Position = gl.getAttribLocation(program, "a_Position");
    gl.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(gl.a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.a_Position);

    gl.a_Normal = gl.getAttribLocation(program, "a_Normal");
    gl.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
    gl.vertexAttribPointer(gl.a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.a_Normal);

    gl.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(flatten(triangles)), gl.STATIC_DRAW);

    gl.u_SphereColor = gl.getUniformLocation(program, "u_SphereColor");
    gl.uniform3fv(gl.u_SphereColor, vec3(0, 0, 0));

    //Setup Lighting Logic
    gl.u_LightPositions = gl.getUniformLocation(program, "u_LightPositions");
    gl.u_LightColors = gl.getUniformLocation(program, "u_LightColors");
    gl.u_LightStrengths = gl.getUniformLocation(program, "u_LightStrengths")
    gl.u_LightCount = gl.getUniformLocation(program, "u_LightCount");
    gl.u_ViewPosition = gl.getUniformLocation(program, "u_ViewPosition");
    gl.uniform3fv(gl.u_ViewPosition, viewPosition);
    gl.u_Shininess = gl.getUniformLocation(program, "u_Shininess");
    const shininessInput = document.getElementById("shininess");
    gl.u_AmbientStrength = gl.getUniformLocation(program, "u_AmbientStrength");
    const ambientInput = document.getElementById("ambient-strength");
    initLightHandlers(gl, main_gl);
    drawLights(canvas);

    //Sphere Image Logic
    const useTexture = {value: false};
    gl.u_Texture = gl.getUniformLocation(program, "u_Texture");
    gl.u_UseTexture = gl.getUniformLocation(program, "u_UseTexture");
    gl.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, gl.matcapTexture);
    initSphereTextureUploadHandlers(gl, useTexture)

    //Render Logic
    gl.blockRendering = false;
    function render() {

        //Apply changes to background
        const ambientStrength = parseFloat(ambientInput.value) / 100;
        gl.clearColor(gl.background.r * ambientStrength, gl.background.g * ambientStrength, gl.background.b * ambientStrength, 1.0);

        //Apply Image
        gl.uniform1i(gl.u_UseTexture, useTexture.value);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, gl.texture);
        gl.uniform1i(gl.u_Texture, 0);

        //Apply Lighting
        gl.uniform3fv(gl.u_LightPositions, new Float32Array(flatten(lightPositions)));
        gl.uniform3fv(gl.u_LightColors, new Float32Array(flatten(lightColors)));
        gl.uniform1fv(gl.u_LightStrengths, new Float32Array(flatten(lightStrengths)))
        gl.uniform1i(gl.u_LightCount, lightPositions.length);
        gl.uniform1f(gl.u_Shininess, parseFloat(shininessInput.value));
        gl.uniform1f(gl.u_AmbientStrength, ambientStrength)

        //Render Object
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.vertexBuffer);
        gl.vertexAttribPointer(gl.a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(gl.a_Position);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.normalBuffer);
        gl.vertexAttribPointer(gl.a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(gl.a_Normal);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.indexBuffer);
        gl.drawElements(gl.TRIANGLES, flatten(triangles).length, gl.UNSIGNED_INT, 0);

    }
    function tick() {
        if(!gl.blockRendering) {
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            render();
        }
        requestAnimationFrame(tick);
    }
    tick(); //Start Loop
}

window.addEventListener("DOMContentLoaded", () => {
    const main_gl = setupMainScene();
    setupEditScene(main_gl);
})

