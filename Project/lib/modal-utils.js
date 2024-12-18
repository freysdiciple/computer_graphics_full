function openModal(modalToOpen) {
    const modal = document.getElementById("modal");
    const uploadObjModalBody = document.getElementById("upload-obj-modal-body");
    const uploadMatcapModalBody = document.getElementById("upload-matcap-modal-body");

    modal.classList.add("open");
    if (modalToOpen === "upload-obj") {
        uploadObjModalBody.style.display = "block";
        uploadMatcapModalBody.style.display = "none";
    } else if (modalToOpen === "upload-matcap") {
        uploadObjModalBody.style.display = "none";
        uploadMatcapModalBody.style.display = "block";
    } else {
        uploadObjModalBody.style.display = "none";
        uploadMatcapModalBody.style.display = "none";
    }
}
function closeModal() {
    const modal = document.getElementById("modal");
    modal.classList.remove("open");
}

function setupTabs() {
    const tabsHeader = document.getElementsByClassName("tabs-header")[0];
    const tabsBody = document.getElementsByClassName("tabs-body")[0];

    if(!tabsHeader || !tabsBody) return;

    for(let i=0; i < tabsHeader.children.length; i++) {
        tabsHeader.children[i].addEventListener("click", () => {
            for(let child of tabsHeader.children) {
                child.classList.remove("chosen");
            }
            for(let child of tabsBody.children) {
                child.classList.remove("chosen")
            }
            tabsHeader.children[i].classList.add("chosen");
            tabsBody.children[i].classList.add("chosen");
        });
    }
}

window.addEventListener("DOMContentLoaded", setupTabs)