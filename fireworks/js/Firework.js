/*
  Copyright (C) 2022, Desobry David
  SPDX-License-Identifier: AGPL-3.0-or-later
  See <https://www.gnu.org/licenses/>
*/

class Firework {
    constructor(position, destination, delay_explosion, trail_color = new THREE.Color(1, 1, 1), explosion_color = new THREE.Color(1, 0, 0)) {
        this.delay_explosion = delay_explosion;
        this.position = position;
        this.destination = destination;
        let displacement = new THREE.Vector3().subVectors(this.destination, this.position);
        //let gravityDisplacement = new THREE.Vector3().copy(gravity).multiplyScalar(0.5 * this.delay_explosion * this.delay_explosion);
        //displacement.sub(gravityDisplacement);
        this.velocity = displacement.divideScalar(this.delay_explosion);
        this.exploded = false;
        this.trail_color = trail_color;
        this.trail_color.a = 1;
        this.explosion_color = explosion_color;
        this.explosion_color.a = 1;
    }
    emit() {
        for(let count=0; count < 20; count ++){
            let destination = get_random_vec(.2).add(this.position).add(this.velocity.clone().multiplyScalar(count*0.01)); 
            particleManager.addParticle(this.position.clone(), destination, .2, this.trail_color, 2);
        }
    }
    triggerExplosion() { }
    update(deltaTime){
        if(!this.exploded){
            this.delay_explosion -= deltaTime;
            if(this.delay_explosion <= 0){
                this.exploded = true;
                this.velocity.add(gravity.clone().multiplyScalar(deltaTime + this.delay_explosion));
                this.position.add(this.velocity.clone().multiplyScalar(deltaTime + this.delay_explosion));
                this.triggerExplosion();
            }else{
                this.velocity.add(gravity.clone().multiplyScalar(deltaTime));
                this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
                this.emit();
            }
        }

    }
}
