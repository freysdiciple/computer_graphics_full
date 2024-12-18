function initEventHandlers(canvas, currentAngle) {
    var dragging = false;
    var lastX = -1, lastY = -1;

    canvas.onmousedown = function (ev) {
        var x = ev.clientX, y = ev.clientY;
        var rect = ev.target.getBoundingClientRect();

        if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
            lastX = x;
            lastY = y;
            dragging = true;
        }
    };
    canvas.onmouseup = function (ev) {
        dragging = false;
    };
    canvas.onmousemove = function (ev) {
        var x = ev.clientX, y = ev.clientY;
        if (dragging) {
            var factor = 200 / canvas.height;
            var dx = factor * (x - lastX);
            var dy = factor * (y - lastY);
            currentAngle[0] = Math.max(Math.min(currentAngle[0] + dy, 90.0), -90.0);
            currentAngle[1] = currentAngle[1] + dx;
        }
        lastX = x, lastY = y;
    };
}

function initZoomHandlers(canvas, radius) {
    canvas.onwheel = function (ev) {
        const delta = ev.deltaY > 0 ? 1 : -1;
        radius.value = Math.max(1, radius.value + delta * 0.5);
    };
}

function initMatCapUploadHandlers(gl) {
    //Allow user to upload their own matcaps
    const fileInputMatcap = document.getElementById('fileInputMatcap');
    const uploadButtonMatcap = document.getElementById('uploadButtonMatcap');
    uploadButtonMatcap.addEventListener('click', () => {

        //Validate user input
        const file = fileInputMatcap.files[0];
        if (!file) {
            alert('No file is selected');
            return;
        }
        if (!(file.name.split('.').pop().toLowerCase() === 'png')) {
            alert('Invalid file type! only use .png files!');
            return;
        }

        //Store file locally in browser
        const indexInMatCaps = matcaps.findIndex((m) => m.name === file.name);

        if (indexInMatCaps < 0) {
            const matcapURL = URL.createObjectURL(file);
            matcaps.push({
                name: file.name,
                src: matcapURL,
            });
            drawMatCaps(gl);

            //Exchange current matcap with the uploaded one
            loadMatCap(gl, matcapURL);
        }

        closeModal();

    });
}

function initObjUploadHandlers(gl, indexCount) {

    //Allow user to upload their own .obj file
    const fileInput = document.getElementById('fileInput');
    const uploadButton = document.getElementById('uploadButton');
    const objPlus = document.getElementById("obj-plus");
    objPlus.addEventListener("click", () => openModal("upload-obj"));

    const fileStore = [];
    uploadButton.addEventListener('click', async () => {

        //Validate user input
        const file = fileInput.files[0];
        if (!file) {
            alert('No file is selected');
            return;
        }
        if (!(file.name.split('.').pop().toLowerCase() === 'obj')) {
            alert('Invalid file type! only use .obj files!');
            return;
        }

        //Store file locally in browser
        const objectUrl = URL.createObjectURL(file);
        fileStore.push({
            name: file.name,
            url: objectUrl,
        });

        insertObjFromURL(gl, objectUrl, indexCount);
        closeModal();
    });
}

function initModalCloseHandler() {
    const modal = document.getElementById("modal");
    const modalBody = document.getElementById("modal-body");
    modal.addEventListener("click", (e) => {
        if (modalBody.contains(e.target)) return;
        else {
            closeModal();
        }
    })
}

function initLightHandlers(gl, main_gl) {
    //Here gl is the WebGL context for the edit scene
    //main_gl is the WebGL context for the main scene, where the main object is drawn
    const addLightButton = document.getElementById("add-light-button");
    const colorInput = document.getElementById("edit-matcap-color");
    const createButton = document.getElementById("create_button_matcap")

    //"Add Light" button
    addLightButton.addEventListener('click', () => {
        if (lightPositions.length < 5) {
            lightPositions.push(vec3(Math.random() * 2 - 1, Math.random() * 2 - 1, 2));
            lightColors.push(vec3(Math.random(), Math.random(), Math.random()));
            lightStrengths.push(0.8);
            drawLights(gl.canvas);
        }
    });

    //Sphere color input
    colorInput.addEventListener("input", () => {
        const bigint = parseInt(colorInput.value.slice(1), 16);
        const r = ((bigint >> 16) & 255) / 255;
        const g = ((bigint >> 8) & 255) / 255;
        const b = (bigint & 255) / 255;

        gl.background = { r, g, b };
        gl.uniform3fv(gl.u_SphereColor, vec3(r, g, b));
    });
    const initColorValue = [0.3921, 0.5843, 0.9294];
    colorInput.value = "#" + initColorValue.map(c => Math.round(c * 255)
        .toString(16).padStart(2, "0")).join("");
    gl.background = { r: initColorValue[0], g: initColorValue[1], b: initColorValue[2] };
    gl.uniform3fv(gl.u_SphereColor, initColorValue);

    //"Create Matcap" button
    createButton.addEventListener("click", () => {
        gl.blockRendering = true;
        gl.finish();
        gl.canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            matcaps.push({
                src: url,
                name: "Matcap-" + (matcaps.length + 1)
            })
            drawMatCaps(main_gl);
            loadMatCap(main_gl, url);
            gl.blockRendering = false;
        }, 'image/png');
    });


}

function initSphereTextureUploadHandlers(gl, useTexture) {
    //Allow user to upload their own matcaps
    const sphereTextureInput = document.getElementById('sphere-texture-input');
    sphereTextureInput.addEventListener('input', () => {

        //Validate user input
        const file = sphereTextureInput.files[0];
        if (!file) {
            useTexture.value = false;
            return;
        }
        const fileType = file.name.split('.').pop().toLowerCase();
        if (!(fileType === 'png' || fileType === 'jpg' || fileType === 'jpeg')) {
            alert('Invalid file type! Only use .png, .jpg or .jpeg files!');
            return;
        }

        const sphereTextureURL = URL.createObjectURL(file);
        const image = new Image();
        image.src = sphereTextureURL;
        image.onload = function () {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, gl.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.uniform1i(gl.u_Texture, 0);
            useTexture.value = true;
        };

    });
}