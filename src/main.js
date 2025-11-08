import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import particlePng from "../public/particle.png";
import { Float32BufferAttribute } from "three/webgpu";

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 500;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

const orbitControls = new OrbitControls(camera, renderer.domElement);

scene.background = new THREE.Color(0x2f005c);

const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load(particlePng, () => {});

/* svg cnv */
const canvasForSvg = document.createElement("canvas");
canvasForSvg.classList.add("canvas-svg");
const svgCnvCtx = canvasForSvg.getContext("2d");
const svgCnvSize = 50;
canvasForSvg.width = svgCnvSize;
canvasForSvg.height = svgCnvSize;
document.body.appendChild(canvasForSvg);

let material;
let geometry;
let pointClouds;

const imageElement = new Image();
const imageCoords = [];
imageElement.onload = () => {
  svgCnvCtx.drawImage(imageElement, 0, 0, svgCnvSize, svgCnvSize);

  const data = svgCnvCtx.getImageData(0, 0, svgCnvSize, svgCnvSize).data;
  for (let y = 0; y < svgCnvSize; y++) {
    for (let x = 0; x < svgCnvSize; x++) {
      const alpha = data[(svgCnvSize * y + x) * 4 + 3];

      if (alpha > 0) {
        imageCoords.push([
          10 * (x - svgCnvSize / 2),
          10 * (y - svgCnvSize / 2),
        ]);
      }
    }
  }

  material = new THREE.PointsMaterial({
    size: 10,
    vertexColors: THREE.VertexColors,
    map: texture,
    transparent: true,
    alphaTest: 0.5,
  });

  const vertices = [];
  geometry = new THREE.BufferGeometry();

  imageCoords.forEach((el) => {
    vertices.push(el[0], el[1], Math.random() * 100);
  });
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  pointClouds = new THREE.Points(geometry, material);
  scene.add(pointClouds);
};

imageElement.src = "../public/close.svg";

let index = 0;
function animate() {
  requestAnimationFrame(animate);

  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  if (geometry) {
    const positionAttribute = geometry.getAttribute("position");
    index++;

    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);

      const dx = Math.sin(index / 10 + i / 2) / 10;
      positionAttribute.setX(i, x + dx);
      positionAttribute.setY(i, y);
      positionAttribute.setZ(i, z);
    }

    positionAttribute.needsUpdate = true;
  }

  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
