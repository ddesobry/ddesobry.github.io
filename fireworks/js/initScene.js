/*
  Copyright (C) 2022, Desobry David
  SPDX-License-Identifier: AGPL-3.0-or-later
  See <https://www.gnu.org/licenses/>
*/

function initScene(){

    let scene = new THREE.Scene();
    //scene.fog = new THREE.FogExp2(0xAAAAAA, 0.1); //brouillard gris clair


    const camera = new THREE.PerspectiveCamera(45, 1920/1024, 0.1, 1000);    
    camera.position.z = 50;
    camera.position.y = 60;  // Eye level for an average human
    camera.lookAt(new THREE.Vector3(0, 80, 0));

    let renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(1920, 1024);
    renderer.setClearColor(0x000000, 1); // Set clear color to a light blue color

    document.body.appendChild(renderer.domElement);


    //const ambientLight = new THREE.AmbientLight(0x404040, 10); // augmenter l'intensité
    //scene.add(ambientLight);

    //const pointLight = new THREE.PointLight(0xffffff, 0.8, 200); // ajoute une lumière ponctuelle
    //pointLight.position.set(50, 50, 50); // changez cette position si nécessaire
    //scene.add(pointLight);

    // Create a geometry for the stars (just points in random positions within a cube)
    /*
    let starGeometry = new THREE.BufferGeometry();
    let starVertices = [];
    for (let i = 0; i < 10000; i++) {
        let x = THREE.MathUtils.randFloatSpread(2000); 
        let y = THREE.MathUtils.randFloatSpread(2000); 
        let z = THREE.MathUtils.randFloatSpread(2000); 
        if(x*x + y*y + z*z > 100000)
        starVertices.push(x, y, z);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));

    // Create a material for the stars (just white dots)
    // Create a canvas and get its 2D context
    let canvas = document.createElement('canvas');
    canvas.width = 64;  // Can be any size, but power-of-two sizes can be more efficient
    canvas.height = 64;
    let context = canvas.getContext('2d');

    // Draw a filled white circle in the center of the canvas
    context.beginPath();
    context.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, 2 * Math.PI, false);
    context.fillStyle = 'white';
    context.fill();

    let starTexture = new THREE.CanvasTexture(canvas);
    let starMaterial = new THREE.PointsMaterial({ color: 0xFFFFFF, map: starTexture, transparent: true, size: 1.5 });
    let starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);
    
    return [scene, camera, renderer]
    */
    // Initialize EffectComposer
    let composer = new POSTPROCESSING.EffectComposer(renderer);

    // Add RenderPass
    let renderPass = new POSTPROCESSING.RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Add BloomEffect and EffectPass
    let bloomEffect = new POSTPROCESSING.BloomEffect({
        distinction: 0.5 // Adjust this value between 0 and 1
    });
    let effectPass = new POSTPROCESSING.EffectPass(camera, bloomEffect);
    effectPass.renderToScreen = true;
    composer.addPass(effectPass);

    bloomEffect.blendMode.opacity.value = 5;
    
    return [scene, camera, composer]
}