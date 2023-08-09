import * as THREE from 'three';
import * as SkeletonUtils from 'skeleton';

class Enemy {
    constructor(gltf) {
        this.hp =  3;//Math.floor(Math.random() * 5) + 1;
        this.speed = 6 - this.hp; // Enemy speed
        this.mesh = SkeletonUtils.clone(gltf.scene);
        this.radius = 0.5;
        this.mixer = new THREE.AnimationMixer(this.mesh); // Store the mixer on the enemy object for later reference
        this.mixer.clipAction(gltf.animations[1]).play(); // Assume the running animation is the first one

        const fullHealthBar = new THREE.Mesh(new THREE.PlaneGeometry(this.hp/3., 0.1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        const currentHealthBar = new THREE.Mesh(new THREE.PlaneGeometry(this.hp/3., 0.1), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));

        this.mesh.add(fullHealthBar);
        this.mesh.add(currentHealthBar);

        fullHealthBar.position.y = 2;
        currentHealthBar.position.y = 2;
        this.touched_by_w = false;
        this.touched_w_until = 0;

        this.healthBar = {green:currentHealthBar, red:fullHealthBar};
    }

    animate(delta, player, camera){

        if(this.touched_w_until > 1000*delta){
            this.touched_w_until -= 1000*delta;
        }else this.touched_by_w = false;
        this.healthBar.green.lookAt(camera.position);
        this.healthBar.red.lookAt(camera.position);
        
        this.mixer.update(delta);

        let direction = new THREE.Vector3().subVectors(player.mesh.position, this.mesh.position).normalize();
        this.mesh.position.add(direction.multiplyScalar(this.speed * delta));

        let angle = Math.atan2(direction.x, direction.z); // Get the angle between direction and the z-axis
        this.mesh.rotation.y = angle + Math.PI; // Apply the rotation to the player

        // Collision detection between player and fireballs
        let distance = this.mesh.position.distanceTo(player.mesh.position);
        if (distance < player.radius + this.radius) { // player's radius + fireball's radius
            this.hp = 0;
            player.hp -= 20;
        }
    }

    destroy(scene){
        this.healthBar.green.geometry.dispose();
        this.healthBar.red.geometry.dispose();
        scene.remove(this.mesh)
    }

    remove_hp(d_hp){
        if(this.touched_by_w) d_hp += 2;
        this.hp -= d_hp;
        this.healthBar.green.geometry.dispose();
        this.healthBar.red.geometry.dispose();
        this.healthBar.green.geometry = new THREE.PlaneGeometry(this.hp/3., 0.1); // Adjust based on your max health
        this.healthBar.green.geometry.translate(-(1-this.hp/3.)/2, 0, 0)
        this.healthBar.red.geometry = new THREE.PlaneGeometry((1-this.hp/3.), 0.1); // Adjust based on your max health
        this.healthBar.red.geometry.translate((this.hp/3.)/2. , 0, 0)
    }
}

export default Enemy;