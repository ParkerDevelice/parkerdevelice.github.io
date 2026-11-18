import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import RAPIER from '@dimforge/rapier3d';
import floorVideoUrl from './assets/rickyboy.mp4';

// 1. Initialize Rapier World
const world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });

// 2. Scene, Camera, & Renderer
const scene = new THREE.Scene();
const bgColor = 0x000000;
scene.background = new THREE.Color(bgColor);

// Exponential fog fades distant tiles seamlessly into pure black
// Increase 0.045 for a tighter circle of light, or decrease for a wider view
scene.fog = new THREE.FogExp2(bgColor, 0.045);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 6, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// 3. User-Controlled Camera
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2 - 0.05;
controls.maxDistance = 30; // Keeps the user near the lit center

// 4. Center Light (Fades to black naturally with distance)
// Parameters: color, intensity, max distance (0 = infinite), decay rate (2 = physically accurate)
const centerLight = new THREE.PointLight(0xffffff, 40, 35, 2);
centerLight.position.set(0, 4, 0);
scene.add(centerLight);

// 5. "Infinite" Tiling Animated Floor
const video = document.createElement('video');
video.src = floorVideoUrl;
video.crossOrigin = 'anonymous';
video.loop = true;
video.muted = true;
video.playsInline = true;
video.play();

const floorTexture = new THREE.VideoTexture(video);
floorTexture.colorSpace = THREE.SRGBColorSpace;
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;

// Make the floor massive and scale repeat proportionally so tile sizes stay crisp
const floorSize = 200;
const tileCount = 50; // 50x50 grid = each tile is 4x4 units
floorTexture.repeat.set(tileCount, tileCount);

const floorGeo = new THREE.PlaneGeometry(floorSize, floorSize);
const floorMat = new THREE.MeshStandardMaterial({
  map: floorTexture,
  roughness: 0.85,
  metalness: 0.1,
});

const floorMesh = new THREE.Mesh(floorGeo, floorMat);
floorMesh.rotation.x = -Math.PI / 2;
scene.add(floorMesh);

// 6. Matching Massive Floor Physics Collider (Rapier)
const floorThickness = 0.2;
const floorBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(
  0,
  -floorThickness / 2,
  0
);
const floorBody = world.createRigidBody(floorBodyDesc);
const floorColliderDesc = RAPIER.ColliderDesc.cuboid(
  floorSize / 2,
  floorThickness / 2,
  floorSize / 2
);
world.createCollider(floorColliderDesc, floorBody);

// 7. Handle Window Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 8. Animation & Physics Loop
function animate(): void {
  requestAnimationFrame(animate);

  world.step();
  controls.update();
  renderer.render(scene, camera);
}

animate();