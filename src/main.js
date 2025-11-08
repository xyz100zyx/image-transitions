import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import particlePng from "../public/particle.png";
import { Float32BufferAttribute } from "three/webgpu";
import { loadImages } from "./load-images";
import { fillImageDataToNext, getProcessedImageData } from "./image-processing";

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

let imageCoords = [];
let images = [];

loadImages(
  ["../public/close.svg", "../public/arrow.svg", "../public/place.svg"],
  (imageElements) => {
    images = imageElements;
    const imageElement = imageElements[0];

    svgCnvCtx.drawImage(imageElement, 0, 0, svgCnvSize, svgCnvSize);

    imageCoords = getProcessedImageData(svgCnvCtx, svgCnvSize);

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
  }
);

let transitionState = {
  isActive: false,
  startVertices: [],
  targetVertices: [],
  progress: 0,
  duration: 2.0,
};

let index = 0;
function animate() {
  requestAnimationFrame(animate);

  updateTransition();

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

const easeOutCubic = (t) => {
  return 1 - Math.pow(1 - t, 3);
};

const easeInOutQuad = (t) => {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};

const lerp = (a, b, t) => {
  return a + (b - a) * t;
};

const clock = new THREE.Clock();

function updateTransition() {
  if (!transitionState.isActive) return;

  const delta = clock.getDelta();
  transitionState.progress += delta / transitionState.duration;
  transitionState.progress = Math.min(transitionState.progress, 1);

  const t = easeOutCubic(transitionState.progress);
  const positions = geometry.attributes.position.array;

  for (let i = 0; i < positions.length; i++) {
    positions[i] = lerp(
      transitionState.startVertices[i],
      transitionState.targetVertices[i],
      t
    );
  }

  geometry.attributes.position.needsUpdate = true;

  if (transitionState.progress >= 1) {
    transitionState.isActive = false;
  }
}

let activemImage = 0;

document.body.addEventListener("click", () => {
  activemImage = (activemImage + 1) % 3;
  const nextImage = images[activemImage];

  svgCnvCtx.drawImage(nextImage, 0, 0, svgCnvSize, svgCnvSize);

  const nextImageCoords = getProcessedImageData(svgCnvCtx, svgCnvSize);
  const transitionImageData = fillImageDataToNext(imageCoords, nextImageCoords);

  const transitionVertices = [];
  transitionImageData.forEach((el) => {
    transitionVertices.push(el[0], el[1], Math.random() * 100);
  });
  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(transitionVertices, 3)
  );

  const nextVertices = [];

  transitionState.startVertices = [...geometry.getAttribute("position").array];

  nextImageCoords.forEach((el) => {
    nextVertices.push(el[0], el[1], Math.random() * 100);
  });
  transitionState.targetVertices = nextVertices;

  transitionState.progress = 0;
  transitionState.isActive = true;
});
