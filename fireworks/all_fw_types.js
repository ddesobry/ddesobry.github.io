/*
  Copyright (C) 2022, Desobry David
  SPDX-License-Identifier: AGPL-3.0-or-later
  See <https://www.gnu.org/licenses/>
*/
class ClusterBurst extends Firework {

    triggerExplosion() {
        let numClusters = 30;
        let clusterDelay = 4.0;

        for(let i = 0; i < numClusters; i++) {
            let destination = get_random_vec(10).add(this.position);
            let cluster = new this.MiniBurst(this.position.clone(), destination, clusterDelay, this.trail_color, this.explosion_color);
            fireworkManager.add(cluster);
            particleManager.addParticle(this.position.clone(), destination, clusterDelay, this.explosion_color, 4.);
        }
    }

    MiniBurst = class extends Firework {
        emit() {
            for(let count=0; count < 20; count ++){
                let destination = get_random_vec(.2).add(this.position).add(this.velocity.clone().multiplyScalar(count*0.01)); 
                particleManager.addParticle(this.position.clone(), destination, 1.5, this.trail_color, 2);
            }
        }
        triggerExplosion() {
            let numParticles = 30;

            for(let i = 0; i < numParticles; i++) {
                let destination = get_random_vec(1).add(this.position);
                particleManager.addParticle(this.position.clone(), destination, 3.0, this.explosion_color, 2);
            }
        }
    };
}
class TrailExplode extends Firework {
    triggerExplosion() {
        for (let i = 0; i < 1000; i++) {
            let destination = get_random_vec(10).add(this.position); 
            particleManager.addParticle(this.position.clone(), destination, 4., this.explosion_color, 3);
        }
    }
}

class Rings extends Firework {
    triggerExplosion() {
        // Create a random axis of rotation and a random angle of rotation
        let axis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
        let angle = Math.random() * Math.PI * 2;

        for(let ring_angle = 0; ring_angle < 2 * Math.PI - Math.PI/36; ring_angle += Math.PI / 18) {
            let r = 10;
            let point = new THREE.Vector3(Math.cos(ring_angle) * r, Math.sin(ring_angle) * r, 0);

            // Rotate the point around the random axis by the random angle
            point.applyAxisAngle(axis, angle);

            let destination = point.add(this.position);
            particleManager.addParticle(this.position.clone(), destination, 3., this.explosion_color, 10.);
            let cluster = new this.MiniBurst(this.position.clone(), destination, 3., this.trail_color, this.explosion_color);
            fireworkManager.add(cluster);
        }
    }
    MiniBurst = class extends Firework {
        emit() {
            for(let count=0; count < 20; count ++){
                let destination = get_random_vec(.2).add(this.position).add(this.velocity.clone().multiplyScalar(count*0.01)); 
                particleManager.addParticle(this.position.clone(), destination, .5, this.trail_color, 2);
            }
        }
        triggerExplosion() {
            let numParticles = 30;

            for(let i = 0; i < numParticles; i++) {
                let destination = get_random_vec(1).add(this.position);
                particleManager.addParticle(this.position.clone(), destination, 3.0, this.explosion_color, 2);
            }
        }
    };
}
