//import * as THREE from './node_modules/three/build/three.module.js';
//import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { GLTFLoader } from 'gltf';



import Azril from './js/Azril.js';
import Enemy from './js/Enemy.js';

let scene, camera, renderer, player, plane, scoreDiv;
let mouse = new THREE.Vector2(), clock = new THREE.Clock(), raycaster = new THREE.Raycaster(), enemies = [];

let time_multiplier = 1.00;
let soldierGltf, robotGltf;

const enable_shadow = true;
const viewSize = 17; // Adjust as needed
const planeSize = 20;

let isGameRunning = true; // Add this line near the top of your script

//TODO : faire en sorte que la carte soit une lane du twisted treeline, et que les mobs surgissent des bushs! 
// Donc pour la position initial d'un ennemi, une position random parmis 6 (1 entree haut gauche, haud droite, bas gauche, bas droite, lane gauche, lane droite)


initVariables();
setInterval(createEnemy, 1000);
handleEvents();

function initVariables() {
    // Create a div for the score
    scoreDiv = document.createElement('div');
    scoreDiv.style.position = 'absolute';
    scoreDiv.style.top = '10px';
    scoreDiv.style.left = '10px';
    scoreDiv.style.fontSize = '4F8px';
    scoreDiv.style.color = 'black';
    document.body.appendChild(scoreDiv);

    // Create the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcce0ff);

    // Create the camera
    

    const aspectRatio = window.innerWidth / window.innerHeight;

    mouse.x = window.innerWidth/2;
    mouse.y = window.innerHeight/2;

    camera = new THREE.OrthographicCamera(
        (-aspectRatio * viewSize) / 2,
        (aspectRatio * viewSize) / 2,
        viewSize / 2,
        -viewSize / 2,
        1,
        200
    );
    camera.position.set(0, 100, 50); // Adjust as needed
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    let gltfLoader = new GLTFLoader();
    gltfLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Soldier.glb', function (gltf) {
        gltf.scene.traverse(function (object) {
            if (object.isMesh) object.castShadow = true;
        });
        soldierGltf = gltf
        new GLTFLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb', function(gltf){
            
            player = new Azril(gltf);
            robotGltf = gltf;
            scene.add(player.mesh);
            scene.add(player.qTrailEffect.points)
            animate();
        })
        
    });



    // Create the plane
    let planeGeometry = new THREE.PlaneGeometry(planeSize*aspectRatio, planeSize, 10, 10);
    let texture_loader = new THREE.TextureLoader();
    texture_loader.load('img/bg_1280_720.png', function (texture) {
        let planeMaterial = new THREE.MeshStandardMaterial({ map: texture });
        plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.receiveShadow = enable_shadow;
        plane.rotation.x = -Math.PI / 2; // Rotate the plane to be horizontal
        scene.add(plane);
    });
    

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 0.3);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, .3);
    dirLight.position.set(-planeSize / 2, 40, 0);
    dirLight.castShadow = enable_shadow;
    dirLight.shadow.mapSize.width = 4096; // increase for better shadow resolution
    dirLight.shadow.mapSize.height = 4096; // increase for better shadow resolution
    dirLight.shadow.camera.near = 0; // default
    dirLight.shadow.camera.far = 200; // default
    dirLight.shadow.camera.left = -planeSize / 2;
    dirLight.shadow.camera.right = planeSize / 2;
    dirLight.shadow.camera.top = planeSize / 2;
    dirLight.shadow.camera.bottom = -planeSize / 2;
    dirLight.shadow.camera.updateProjectionMatrix(); // important, don't forget this line
    scene.add(dirLight);

    // Create the renderer
    renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled = enable_shadow; // Enable Shadow
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Type of shadow
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

}


function createEnemy() {
    if(!isGameRunning) return;
    time_multiplier += 0.01;
    scoreDiv.innerText = 'Time multiplier: ' + Math.floor(100*time_multiplier) + ' %';
    let enemy = new Enemy(soldierGltf);

    let edgePosition = Math.random() < 0.5 ? -planeSize / 2 : planeSize / 2;
    if (Math.random() < 0.5) {
        enemy.mesh.position.x = Math.random() * planeSize - planeSize / 2;
        enemy.mesh.position.z = edgePosition;
    } else {
        enemy.mesh.position.x = edgePosition;
        enemy.mesh.position.z = Math.random() * planeSize - planeSize / 2;
    }
    //enemy.healthBar.lookAt(camera.position);
    scene.add(enemy.mesh);
    enemies.push(enemy);
}


function resetGame(){
    player.dies();
    // Add a restart button
    isGameRunning = false;
    let button = document.createElement('button');
    button.innerHTML = 'Restart';
    button.style.position = 'absolute';
    button.style.top = '50%';
    button.style.left = '50%';
    button.style.transform = 'translate(-50%, -50%)';
    button.style.padding = '10px 20px';
    button.style.fontSize = '24px';
    button.style.cursor = 'pointer';
    button.style.zIndex = '1';
    document.body.appendChild(button);

    // Handle button click
    button.onclick = function() {
        // Remove button
        document.body.removeChild(button);

        // Reset game variables
        time_multiplier = 1.00;

        // Reset player position
        player.delete_from_scene(scene);
        player = new Azril(robotGltf);
        scene.add(player.mesh);
        scene.add(player.qTrailEffect.points)

        // Reset enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            scene.remove(enemies[i].mesh);
        }
        enemies = [];

        clock.start(); // Reset the clock

        // Restart animation
        isGameRunning = true;
        animate();

    };
}


function animate() {
    if (!isGameRunning) return;
    requestAnimationFrame(animate);
    let delta = clock.getDelta(); // Get the amount of seconds passed since last frame
    delta *= time_multiplier;
    // Update the mixer
   
    player.animate(delta);
    player.update_q_spells(delta, enemies, scene);
    player.update_w_spells(delta, enemies, scene);
    player.update_r_spells(delta, enemies, scene);

    
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].animate(delta, player, camera);
        if (enemies[i].hp <= 0) {
            scene.remove(enemies[i].mesh);
            enemies.splice(i, 1);
        }
    }
    if(player.hp <= 0) {
        resetGame();
        return;
    } 
    renderer.render(scene, camera);
}


function handleEvents() {
    
    window.addEventListener('mousemove', function (event) {
        event.preventDefault();
        mouse.x = event.clientX;
        mouse.y = event.clientY;
        
    }, false);
    
    window.addEventListener('contextmenu', function (event) {
        event.preventDefault();

        let mouse_coords = new THREE.Vector2((mouse.x / window.innerWidth) * 2 - 1, -(mouse.y / window.innerHeight) * 2 + 1);
        raycaster.setFromCamera(mouse_coords, camera);

        // calculate objects intersecting the picking ray
        let intersects = raycaster.intersectObject(plane);

        if (intersects.length > 0) {
            let target = intersects[0].point;
            target.y = player.mesh.position.y; // Keep the Y position of the player constant
            player.click_move(target, scene);
        }

    }, false);


    window.addEventListener('keydown', function (event) {
        event.preventDefault();
        if(player.animation_time_delay > 0){
            return;
        }
        if (event.key === 's' || event.key === 'S') {
            player.stop_move(scene);
            return;
        }

        let mouse_centered = mouse.clone();
        mouse_centered.x = (mouse.x / window.innerWidth) * 2 - 1;
        mouse_centered.y = -(mouse.y / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse_centered, camera);

        // calculate objects intersecting the picking ray
        let intersects = raycaster.intersectObject(plane);
        if (intersects.length > 0){
            let target = intersects[0].point;
            target.y = player.mesh.position.y;
            if ((event.key === 'a' || event.key === 'A')){
                player.cast_q(target, scene);
            } if ((event.key === 'z' || event.key === 'Z')){
                player.cast_w(target, scene);
            }
            else if ((event.key === 'e' || event.key === 'E')) {
                player.cast_e(target, scene);
            }
            else if ((event.key === 'r' || event.key === 'R')) {
                player.cast_r(target, scene);
            }
        }
    }, false);

    window.addEventListener('resize', function () {
        // Update camera's aspect ratio
        const aspectRatio = window.innerWidth / window.innerHeight;
        camera.left = (-aspectRatio * viewSize) / 2;
        camera.right = (aspectRatio * viewSize) / 2;
        camera.top = viewSize / 2;
        camera.bottom = -viewSize / 2;
    
        // Update camera's projection matrix
        camera.updateProjectionMatrix();
    
        // Update renderer size
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, false);
    

}
