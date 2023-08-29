/*
  Copyright (C) 2022, Desobry David
  SPDX-License-Identifier: AGPL-3.0-or-later
  See <https://www.gnu.org/licenses/>
*/

import * as THREE from 'three';
import * as SkeletonUtils from 'skeleton';


class TrailEffect {
    constructor() {
        //this.gravity = new THREE.Vector3(0, -0.001, 0);
        this.gravity = new THREE.Vector3(0, 0, 0);  // adjust as needed
        this.particlesCount = 3000;
        this.shaderColor = new THREE.Color(0x00eeee);  // adjust as needed
        this.pointSize = 2.0;  // adjust as needed
        this.alphaDecay = 0.85;  // adjust as needed
        this.alphaThreshold = 0.001;  // adjust as needed
        this.iterationCount = 50;  // adjust as needed
        this.particleInitialRange = 0.15;  // adjust as needed
        this.particleInitialVelocity = -0.02;  // adjust as needed
        this.nb_created_particules = 50;
        this.velocityRandomness = 0.005;  // adjust as needed

        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.particlesCount * 3), 3));
        this.geometry.setAttribute('velocities', new THREE.BufferAttribute(new Float32Array(this.particlesCount * 3), 3));
        this.geometry.setAttribute('alpha', new THREE.BufferAttribute(new Float32Array(this.particlesCount), 1));
        this.geometry.attributes.alpha.array.fill(0);
        this.shaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(0x00eeee) }
            },
            vertexShader: `
                attribute float alpha;
                varying float vAlpha;
                void main() {
                    vAlpha = alpha;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = 2.0;
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                varying float vAlpha;
                void main() {
                    //if (vAlpha < 0.01) discard;
                    gl_FragColor = vec4(color, vAlpha);
                }
            `,
            transparent: true,
            depthWrite: false
        });
        this.points = new THREE.Points(this.geometry, this.shaderMaterial);
        this.points.frustumCulled = false;
    }

    make_disappear(){

        this.points.geometry.attributes.alpha.array.fill(0);
        this.points.geometry.attributes.alpha.needsUpdate = true;
    }

    animate(emitter_position) {
       
        const inactiveParticlesIndices = this.points.geometry.attributes.alpha.array.reduce((indices, alpha, i) => {
            if (alpha <= this.alphaThreshold) indices.push(i);
            return indices;
        }, []);
    
        for(let iter = 0; iter < this.nb_created_particules; iter++) {
            var particle = new THREE.Vector3((Math.random() - 0.5) * this.particleInitialRange, Math.random() * this.particleInitialRange, (Math.random() - 0.5) * this.particleInitialRange);
            var velocity = new THREE.Vector3(particle.x * this.particleInitialVelocity, particle.y * this.particleInitialVelocity, particle.z * this.particleInitialVelocity);
            velocity.add(new THREE.Vector3((Math.random() - 0.5) * this.velocityRandomness, Math.random() * this.velocityRandomness, (Math.random() - 0.5) * this.velocityRandomness));
            particle.add(emitter_position);
    
            if (iter < inactiveParticlesIndices.length) {
                // Reuse inactive particles if available
                let id = inactiveParticlesIndices[iter];
                this.points.geometry.attributes.position.array[id*3] = particle.x;
                this.points.geometry.attributes.position.array[id*3+1] = particle.y;
                this.points.geometry.attributes.position.array[id*3+2] = particle.z;
                this.points.geometry.attributes.alpha.array[id] = Math.random();
                this.points.geometry.attributes.velocities.array[id*3] = velocity.x;
                this.points.geometry.attributes.velocities.array[id*3+1] = velocity.y;
                this.points.geometry.attributes.velocities.array[id*3+2] = velocity.z;
            } 
        }
        for (let i = 0; i < this.particlesCount; i++) {
            for(let j = 0; j < 3; j++){
                this.points.geometry.attributes.position.array[i*3 + j] += this.points.geometry.attributes.velocities.array[i*3 + j]
            }
            //let velocity = this.velocities[i];
            //let particle = this.particles[i];
            //velocity.add(this.gravity); particle.add(velocity);
            this.points.geometry.attributes.position.array[i*3] += velocity.x//= particle.x;
            this.points.geometry.attributes.position.array[i*3+1] += velocity.y//= particle.y;
            this.points.geometry.attributes.position.array[i*3+2] += velocity.z//= particle.z;
            this.points.geometry.attributes.alpha.array[i] = Math.max(0.0, this.points.geometry.attributes.alpha.array[i] * this.alphaDecay - this.alphaThreshold);
        }
        this.points.geometry.attributes.position.needsUpdate = true;
        this.points.geometry.attributes.alpha.needsUpdate = true;
    }

}



class Azril {
    constructor(gltf) {
        this.speed = 5.0; // Player's speed   
        this.radius = 0.5;
        this.mesh = SkeletonUtils.clone(gltf.scene);             
        this.mesh.traverse(function (node) {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = false;
            }
        });
        this.mesh.scale.x = 0.3; this.mesh.scale.y = 0.3; this.mesh.scale.z = 0.3; 
        this.mixer = new THREE.AnimationMixer(this.mesh);

        this.animation_time_delay = 0;
        //const states = [ 'Idle', 'Walking', 'Running', 'Dance', 'Death', 'Sitting', 'Standing' ];
        //const emotes = [ 'Jump', 'Yes', 'No', 'Wave', 'Punch', 'ThumbsUp' ];
        const action_names = ['Idle', 'Walking', 'Running', 'Death', 'Jump', 'Punch'];
        this.actions = {};

        for ( let i = 0; i < gltf.animations.length; i ++ ) {
            const clip = gltf.animations[ i ];
            if(action_names.includes(clip.name)){
                this.actions[ clip.name ] = this.mixer.clipAction( clip );
                if (action_names.indexOf( clip.name ) >= 3) {

                    this.actions[ clip.name ].clampWhenFinished = true;
                    this.actions[ clip.name ].loop = THREE.LoopOnce;

                }
            }
        }
        var originalDuration = this.actions['Punch'].getClip().duration;
        var desiredDuration = 0.2;  // 200 ms = 0.2 seconds
        var timeScale = originalDuration / desiredDuration;
        this.actions['Punch'].setEffectiveTimeScale(timeScale);

        let markerGeometry = new THREE.SphereGeometry(0.1, 32, 32), markerMaterial = new THREE.MeshBasicMaterial({color: 0x00ff00});
        this.marker = new THREE.Mesh(markerGeometry, markerMaterial);
        this.destination = new THREE.Vector3(0, 0, 0);
        this.hp = 1;

        this.spells = {
            Q : {range: 5, cd: 1000, speed:10, casting_time:200, delay:0, icone: document.getElementById('cooldown-q')},
            W : {range: 75, cd: 1000, speed:10, casting_time:200, delay:0, debuff_duration:3000, icone: document.getElementById('cooldown-w')},
            E : {range: 3, cd: 3000, speed:10, casting_time:200, delay:0, icone: document.getElementById('cooldown-e')},
            R : {range: 50, cd: 10000, speed:10, casting_time:400, delay:0, icone: document.getElementById('cooldown-r')}
        };
        this.q_s = []
        this.w_s = []
        this.e_s = []
        this.r_s = []

        this.qTrailEffect = new TrailEffect();
    }

    animate(delta){
        this.reduce_spell_delays(1000*delta);
        this.animation_time_delay -= 1000*delta;

        this.mixer.update(delta);
        if(this.animation_time_delay > 0) return;
        let distance = this.mesh.position.distanceTo(this.destination);
        // Update player position if it should be moving
        if (distance > 0.1) {
            let direction = new THREE.Vector3().subVectors(this.destination, this.mesh.position).normalize();
            this.mesh.position.add(direction.multiplyScalar(this.speed * delta));
            this.actions['Running'].play();//this.runAction.play();
            this.actions['Idle'].stop();//this.idleAction.stop();
        }
        else {
            this.actions['Idle'].play();//this.idleAction.play();
            this.actions['Running'].stop();//this.runAction.stop();
        }
    }
    click_move(target, scene){
        let distance = this.mesh.position.distanceTo(target);
        this.destination = target;
        if(distance < 0.1) return;
        this.actions['Running'].play();//this.runAction.play();
        this.actions['Idle'].stop();//this.idleAction.stop();
        let direction = new THREE.Vector3().subVectors(target, this.mesh.position).normalize();
        let angle = Math.atan2(direction.x, direction.z); // Get the angle between direction and the z-axis
        this.mesh.rotation.y = angle ; // Apply the rotation to the player

        scene.remove(this.marker);
        this.marker.position.copy(target);
        scene.add(this.marker);
    }

    stop_move(scene){
        this.destination = this.mesh.position;
        scene.remove(this.marker);
    }

    dies(){
        //this.actions['Death'].stop();
        this.actions['Death'].play();
    }
    delete_from_scene(scene){
        for(let q of this.q_s) scene.remove(q);
        for(let w of this.w_s) scene.remove(w);
        for(let e of this.e_s) scene.remove(e);
        for(let r of this.r_s) scene.remove(r);
        this.qTrailEffect.make_disappear();
        this.q_s = [];
        this.w_s = [];
        this.e_s = [];
        this.r_s = [];
        scene.remove(this.marker);
        scene.remove(this.mesh);
    }

    update_q_spells(delta, enemies, scene){
        if(this.spells.Q.delay>this.spells.Q.cd - this.spells.Q.casting_time/2.) return;
        
        // Update bullet positions and check for collisions
        for (let i = this.q_s.length - 1; i >= 0; i--) {
            let bullet = this.q_s[i];
            let distance = bullet.position.distanceTo(bullet.from);
            if(distance > this.spells.Q.range){
                //scene.remove(bullet);
                this.qTrailEffect.make_disappear();
                this.q_s.splice(i, 1);
                continue;
            }
            bullet.position.add(bullet.velocity.clone().multiplyScalar(delta));
            // Update the trail effect
            this.qTrailEffect.animate(bullet.position);
            // Collision detection between bullets and fireballs
            for (let j = enemies.length - 1; j >= 0; j--) {
                let enemy = enemies[j];
                let distance = enemy.mesh.position.distanceTo(bullet.position);
                if (distance < 1 + 0.2) { // fireball's radius + bullet's radius

                    this.reduce_spell_delays(1000);
                    // Remove fireball and bullet
                    enemy.remove_hp(1);
                    //scene.remove(bullet);
                    this.qTrailEffect.make_disappear();
                    //scene.remove(this.qTrailEffect.points)
                    this.q_s.splice(i, 1);
                    break;
                }
            }
        }
    }
    update_w_spells(delta, enemies, scene){
        if(this.spells.W.delay>this.spells.W.cd - this.spells.W.casting_time/2.) return;
        // Update bullet positions and check for collisions
        for (let i = this.w_s.length - 1; i >= 0; i--) {
            let bullet = this.w_s[i];
            if(bullet.attached_to !== undefined){
                let enemy = bullet.attached_to;
                //console.log(enemy.mesh.position)
                if(enemy.touched_by_w && enemy.hp > 0) bullet.position.copy(enemy.mesh.position);
                else{
                    scene.remove(bullet);
                    this.w_s.splice(i, 1);
                }
            }else{
                let distance = bullet.position.distanceTo(bullet.from);
                if(distance > this.spells.W.range){
                    scene.remove(bullet);
                    this.w_s.splice(i, 1);
                    continue;
                }
                bullet.position.add(bullet.velocity.clone().multiplyScalar(delta));
                // Collision detection between bullets and fireballs
                for (let j = enemies.length - 1; j >= 0; j--) {
                    let enemy = enemies[j];
                    let distance = enemy.mesh.position.distanceTo(bullet.position);
                    if (distance < 1 + 0.2) { // fireball's radius + bullet's radius

                        // Remove fireball and bullet
                        enemy.touched_by_w = true;
                        enemy.touched_w_until = this.spells.W.debuff_duration;
                        bullet.attached_to = enemy;
                        //scene.remove(bullet);
                        //this.w_s.splice(i, 1);
                        break;
                    }
                }
            }
        }
    }



    update_r_spells(delta, enemies, scene){
        if(this.spells.R.delay>this.spells.R.cd - this.spells.R.casting_time/2.) return;
        // Move projectiles and check for collisions
        for (let i = this.r_s.length - 1; i >= 0; i--) {
            let ulti = this.r_s[i];
            //let direction = new THREE.Vector3().subVectors(this.position, enemy.mesh.position).normalize();
            let distance = ulti.position.distanceTo(ulti.from);
            if(distance > this.spells.R.range){
                scene.remove(ulti);
                this.r_s.splice(i, 1);
                continue;
            }
            ulti.position.add(ulti.velocity.clone().multiplyScalar(delta));

            // Check for collisions with enemies
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                const distance = ulti.position.distanceTo(enemy.mesh.position);
                
                // Assuming the radius of the enemy and projectile are both 0.5
                if (distance < 1 && enemy.touched_ulti !== ulti) {
                    enemy.touched_ulti = ulti;
                    enemy.remove_hp(2);
                    /*if (enemy.healthBar) {
                        enemy.healthBar.scale.x = enemy.hp / 3.; // Adjust based on your max health
                    }*/

                    // Remove the projectile from the scene and array
                    //scene.remove(ulti);
                    //ultimates.splice(i, 1);
                    break;
                }
            }
        }
    }
    reduce_spell_delays(dt){
        for(let key in this.spells) {
            if(this.spells[key].delay > 0) {
                this.spells[key].delay -= dt;
                let heightPercentage = (this.spells[key].delay / this.spells[key].cd) * 100;
                this.spells[key].icone.style.height = `${heightPercentage}%`;
            } else {
                this.spells[key].delay = 0;
                this.spells[key].icone.style.height = '0%';
            }
        }
    }
    cast_q(target, scene){
        if(this.spells.Q.delay > 0) return;
        this.stop_move(scene)
        //this.actions['Idle'].stop();
        this.actions['Punch'].stop();
        this.actions['Punch'].play();
        //target.y = this.mesh.position.y; // Keep the Y position of the player constant
        let direction = new THREE.Vector3().subVectors(target, this.mesh.position).normalize();
        let angle = Math.atan2(direction.x, direction.z); // Get the angle between direction and the z-axis
        this.mesh.rotation.y = angle ; // Apply the rotation to the player

        const geometry = new THREE.SphereGeometry(0.2, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // Yellow
        let bullet = new THREE.Mesh(geometry, material);
        bullet.position.copy(this.mesh.position);
        bullet.position.y = 1;
    
        //scene.add(bullet);
        // Bullet velocity is in the direction of the target position
        bullet.velocity = new THREE.Vector3().subVectors(target, this.mesh.position).normalize().multiplyScalar(this.spells.Q.speed);
    
        bullet.from = bullet.position.clone();
        this.q_s.push(bullet);
        this.destination = this.mesh.position; // Stop moving the player
        this.spells.Q.delay = this.spells.Q.cd;
        this.animation_time_delay = this.spells.Q.casting_time;
    }
    cast_w(target, scene){
        if(this.spells.W.delay > 0) return;
        this.stop_move(scene)
        //this.actions['Idle'].stop();
        this.actions['Jump'].stop();
        this.actions['Jump'].play();
        //target.y = this.mesh.position.y; // Keep the Y position of the player constant
        let direction = new THREE.Vector3().subVectors(target, this.mesh.position).normalize();
        let angle = Math.atan2(direction.x, direction.z); // Get the angle between direction and the z-axis
        this.mesh.rotation.y = angle ; // Apply the rotation to the player

        const geometry = new THREE.SphereGeometry(0.2, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red
        let bullet = new THREE.Mesh(geometry, material);
        bullet.position.copy(this.mesh.position);
        bullet.position.y = 1;
    
        scene.add(bullet);
        // Bullet velocity is in the direction of the target position
        bullet.velocity = new THREE.Vector3().subVectors(target, this.mesh.position).normalize().multiplyScalar(this.spells.W.speed);
    
        bullet.from = bullet.position.clone();
        this.w_s.push(bullet);
        this.destination = this.mesh.position; // Stop moving the player
        this.spells.W.delay = this.spells.W.cd;
        this.animation_time_delay = this.spells.W.casting_time;
    }
    cast_e(target, scene){
        if(this.spells.E.delay > 0) return;

        // We move the player to the position where the ray intersects the plane
        this.stop_move(scene)
        this.actions['Jump'].stop();
        this.actions['Jump'].play();

        this.spells.E.delay = this.spells.E.cd;
        let distance = this.mesh.position.distanceTo(target);
        let direction = new THREE.Vector3().subVectors(target, this.mesh.position).normalize();
        let angle = Math.atan2(direction.x, direction.z); // Get the angle between direction and the z-axis
        this.mesh.rotation.y = angle ; // Apply the rotation to the player
        //this.mesh.position.add(direction.multiplyScalar(Math.min(this.spells.E.range, distance)));
        this.animation_time_delay = this.spells.E.casting_time;
        setTimeout(() => {
            this.mesh.position.add(direction.multiplyScalar(Math.min(this.spells.E.range, distance)));
        }, this.spells.E.casting_time/2);
    }
    cast_r(target, scene){
        if(this.spells.R.delay > 0) return;
        this.stop_move(scene)
        this.actions['Jump'].stop();
        this.actions['Punch'].stop();
        this.actions['Jump'].play();
        this.actions['Punch'].play();

        //target.y = this.mesh.position.y; // Keep the Y position of the player constant
        let direction = new THREE.Vector3().subVectors(target, this.mesh.position).normalize();
        let angle = Math.atan2(direction.x, direction.z); // Get the angle between direction and the z-axis
        this.mesh.rotation.y = angle ; // Apply the rotation to the player
        // Assuming the ultimate is a simple sphere
        const geometry = new THREE.SphereGeometry(0.5, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Yellow
        let ultimate = new THREE.Mesh(geometry, material);

        // Set the position of the projectile to the player's position
        ultimate.position.copy(this.mesh.position);

        ultimate.velocity = new THREE.Vector3().subVectors(target, this.mesh.position).normalize().multiplyScalar(this.spells.R.speed);
        // Add the projectile to the scene and the projectiles array
        ultimate.from = ultimate.position.clone();
        scene.add(ultimate);
        this.r_s.push(ultimate);
        this.spells.R.delay = this.spells.R.cd;
        this.animation_time_delay = this.spells.R.casting_time;
    }
}

export default Azril;