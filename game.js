import * as THREE from 'three';

const socket = io();
let isHost = window.location.hash === '#host'; // Type #host in URL to be the loader
const WORLD_SIZE = 100;
const RENDER_DIST = 6; // Your render limit
let camX = 50, camZ = 50;

// 1. Setup Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// 2. Generate 100x100 Grid
const tiles = [];
const tileGroup = new THREE.Group();
scene.add(tileGroup);

for (let x = 0; x < WORLD_SIZE; x++) {
    for (let z = 0; z < WORLD_SIZE; z++) {
        const geo = new THREE.BoxGeometry(0.9, 0.2, 0.9);
        const mat = new THREE.MeshStandardMaterial({ color: 0x556b2f });
        const tile = new THREE.Mesh(geo, mat);
        tile.position.set(x, 0, z);
        tile.userData = { x, z, type: 'dirt' };
        tileGroup.add(tile);
        tiles.push(tile);
    }
}

// 3. Render Limit Logic
function updateVisibility() {
    tiles.forEach(t => {
        const d = Math.sqrt(Math.pow(t.position.x - camX, 2) + Math.pow(t.position.z - camZ, 2));
        t.visible = d <= RENDER_DIST;
    });
}

// 4. Movement Logic
window.moveCam = (dx, dz) => {
    camX += dx; camZ += dz;
    camera.position.set(camX, 8, camZ + 5);
    camera.lookAt(camX, 0, camZ);
    updateVisibility();
};

// 5. Host "Loader" Logic
if (isHost) {
    console.log("I am the Loader/Host");
    socket.emit('host-start', { /* world data */ });
    
    // Resource Tick (Only Host calculates this)
    setInterval(() => {
        socket.emit('action', { type: 'resource-tick', amount: 5 });
    }, 5000);
} else {
    socket.emit('join-game');
}

// 6. Network Sync
socket.on('action', (data) => {
    if (data.type === 'resource-tick') {
        document.getElementById('stone').innerText = 
            parseInt(document.getElementById('stone').innerText) + data.amount;
    }
});

// Initial Camera View
moveCam(0,0);
function animate() { requestAnimationFrame(animate); renderer.render(scene, camera); }
animate();
