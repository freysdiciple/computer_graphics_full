const matcaps = [
    { src: './static/matcaps/mose_matcap.png', name: 'Mose MatCap' },
    { src: './static/matcaps/turkis_matcap.png', name: 'Turkis MatCap' },
    { src: './static/matcaps/rainbow.png', name: 'Rainbow MatCap' },
    { src: './static/matcaps/darthvaderRed.png', name: 'Darth Vader Red MatCap' },
    { src: './static/matcaps/aluminium.png', name: 'Aluminium MatCap' },
    { src: './static/matcaps/cartoonGrey.png', name: 'Cartoon Grey MatCap' },
    { src: './static/matcaps/EnergyFlow.png', name: 'Energy Flow MatCap' },
    { src: './static/matcaps/freakyBlack.png', name: 'Freaky Black MatCap' },
    { src: './static/matcaps/ZestyZebra.png', name: 'Zebra MatCap' }
];

function drawMatCaps(gl) {
    const imageList = document.getElementById('imageList');
    imageList.innerHTML = "";
    for (let i = 0; i < matcaps.length; i++) {
        const listItem = document.createElement('li');
        const img = document.createElement('img');

        img.src = matcaps[i].src;
        img.alt = matcaps[i].name;

        img.addEventListener('click', () => {
            loadMatCap(gl, img.src);
        });

        listItem.appendChild(img);
        imageList.append(listItem);
    }

    const plusDiv = document.createElement("div")
    plusDiv.id = "matcap-plus";
    plusDiv.classList.add("plus");
    plusDiv.addEventListener("click", () => openModal("upload-matcap"));
    imageList.append(plusDiv)

}

function loadMatCap(gl, imageURL) {

    const image = new Image();
    image.src = imageURL;
    image.onload = function () {
        //Bind image to the texture
        gl.bindTexture(gl.TEXTURE_2D, gl.matcapTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);

        //Sample the background of the matcap
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        const pixel = ctx.getImageData(0, 0, 1, 1).data;
        gl.clearColor(pixel[0] / 255, pixel[1] / 255, pixel[2] / 255, 1.0);
    };
}

const lightPositions = [
    vec3(2, 2, 2),
];
const lightColors = [
    vec3(1, 1, 1),
];
const lightStrengths = [
    0.8
]

function arrayToHex(array) {
    return "#" + array.map(c => Math.round(c * 255)
        .toString(16).padStart(2, "0")).join("");
}

function hexToArray(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    const r = ((bigint >> 16) & 255) / 255;
    const g = ((bigint >> 8) & 255) / 255;
    const b = (bigint & 255) / 255;
    return [r,g,b];
}

function clientToCanvas(x, y) {
    return vec3(
        2 * (x - 128) / 128,
        2 * (128 - y) / 128,
        2
    )
}
function canvasToClient(pos) {
    return {
        x: pos[0] * 128 / 2 + 128,
        y: 128 - pos[1] * 128 / 2
    }
}

function recolorSun(svg, color){
    for (let child of svg.children) {
        child.setAttribute("fill", color);
    }
}

function drawLights(canvas) {
    const sunSize = 20;

    const lightSourceList = document.getElementById("light-source-list");
    const sunContainer = document.getElementById("sun-container");
    lightSourceList.innerHTML = "";
    sunContainer.innerHTML = "";

    for(let i=0; i<lightPositions.length; i++) {

        //Insert suns to drag around
        const svg = createSunSVG(arrayToHex(lightColors[i]), sunSize);
        const startPosition = canvasToClient(lightPositions[i]); 
        svg.style.left = `${startPosition.x - sunSize}px`;
        svg.style.top = `${startPosition.y}px`;

        svg.addEventListener("mousedown", (e) => {
            e.preventDefault();
            svg.style.cursor = "grabbing";
            const rect = canvas.getBoundingClientRect();

            let offsetX = e.clientX - svg.getBoundingClientRect().left;
            let offsetY = e.clientY - svg.getBoundingClientRect().top;

            function onMouseMove(event) {
                let x = event.clientX - rect.left - offsetX;
                let y = event.clientY - rect.top - offsetY;

                // Constrain within canvas boundaries
                x = Math.max(0, Math.min(rect.width - svg.clientWidth, x));
                y = Math.max(0, Math.min(rect.height - svg.clientHeight, y));

                svg.style.left = `${x}px`;
                svg.style.top = `${y}px`;

                lightPositions[i] = clientToCanvas(x + sunSize/2, y + sunSize/2);
            }

            function onMouseUp() {
                svg.style.cursor = "grab";
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            }

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });

        sunContainer.append(svg);

        //Insert interactable UI elements in list below
        const container = document.createElement("div");
        container.classList.add("light-source");

        const colorPicker = document.createElement("input");
        colorPicker.type = "color";
        const convertedColor = arrayToHex(lightColors[i]);
        colorPicker.value = convertedColor;
        colorPicker.addEventListener("input", () => {
            lightColors[i] = hexToArray(colorPicker.value);
            recolorSun(svg, colorPicker.value);
        })

        const deleteButton = document.createElement("button");
        deleteButton.innerText = "Delete"
        deleteButton.addEventListener("click", () => {
            lightPositions.splice(i, 1);
            lightColors.splice(i, 1);
            container.remove();
            drawLights(canvas);
        });

        const strengthSlider = document.createElement("input");
        strengthSlider.classList.add("light-strength-slider");
        strengthSlider.type = "range";
        strengthSlider.value = lightStrengths[i] * 100;
        strengthSlider.min = 0;
        strengthSlider.max = 100;
        strengthSlider.addEventListener("input", () => {
            lightStrengths[i] = parseFloat(strengthSlider.value) / 100;
        });

        container.append(colorPicker, deleteButton, strengthSlider);
        lightSourceList.append(container);
    }
}

function createSunSVG(color, sunSize) {

    const SVG_NS = "http://www.w3.org/2000/svg";
    const rayLength = sunSize * 0.2; 
    const rayWidth = sunSize * 0.1; 
    const rayCount = 8;

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("width", sunSize);
    svg.setAttribute("height", sunSize);
    svg.setAttribute("viewBox", `0 0 ${sunSize} ${sunSize}`);
    svg.classList.add("sun-icon");

    const sunCore = document.createElementNS(SVG_NS, "circle");
    sunCore.setAttribute("cx", sunSize / 2);
    sunCore.setAttribute("cy", sunSize / 2);
    sunCore.setAttribute("r", sunSize / 5);
    sunCore.setAttribute("fill", color);
    svg.appendChild(sunCore);

    for (let i = 0; i < rayCount; i++) {
        const ray = document.createElementNS(SVG_NS, "rect");
        const angle = (i * 360) / rayCount; // Calculate the angle for the current ray

        // Position and size of the ray
        ray.setAttribute("x", (sunSize - rayWidth) /2);
        ray.setAttribute("y", 0);
        ray.setAttribute("width", rayWidth);
        ray.setAttribute("height", rayLength);
        ray.setAttribute("fill", color);

        // Transform to rotate the ray around the sun's center
        ray.setAttribute(
            "transform",
            `rotate(${angle}, ${sunSize / 2}, ${sunSize / 2})`
        );

        svg.appendChild(ray);
    }

    return svg;
}