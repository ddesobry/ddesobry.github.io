/*
  Copyright (C) 2022, Desobry David
  SPDX-License-Identifier: AGPL-3.0-or-later
  See <https://www.gnu.org/licenses/>
*/

class ParticleManager {
    constructor(maxParticles) {
        this.maxParticles = maxParticles;
        this.currentParticleIndex = 0;
        this.velocities = new Array(maxParticles);
        this.transitionTimes = new Array(maxParticles);
        this.geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(maxParticles * 3);
        this.colors = new Float32Array(maxParticles * 4);
        this.radii = new Float32Array(maxParticles);
        this.colors.fill(0);
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 4));
        this.geometry.setAttribute('radius', new THREE.BufferAttribute(this.radii, 1));        
        this.particleMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                attribute vec4 color;
                attribute float radius;
                varying vec4 vColor;
                void main() {
                    vColor = color;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = radius; //1.0;
                }
            `,
            fragmentShader: `
                varying vec4 vColor;
                void main() {
                    float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); // Distance from the center of the particle
                    if(dist < 0.25){
                        gl_FragColor = mix(vec4(1.0,1.0,1.0, vColor.a), vColor, 4.0*dist); 
                    }
                    else if (dist < 0.5) {
                        gl_FragColor = mix(vColor, vec4(0.0,0.0,0.0, 0.0), 4.0*(dist-0.25)); 
                    } else {
                        discard; // Discard pixels outside of the outline
                    }
                }
            `,
            transparent: true,
            depthWrite: false,
            premultipliedAlpha: false // Disable premultiplied alpha
        });
        this.points = new THREE.Points(this.geometry, this.particleMaterial);
        this.points.frustumCulled = false;
    }
    addParticle(position, destination, transitionTime, color, radius=3.0) {
        let index = this.currentParticleIndex;
        this.positions.set([position.x, position.y, position.z], index * 3);
        this.colors.set([color.r, color.g, color.b, color.a], index * 4);
        let displacement = new THREE.Vector3().subVectors(destination, position);
        //$let gravityDisplacement = new THREE.Vector3().copy(gravity).multiplyScalar(0.5 * transitionTime * transitionTime);
        //displacement.sub(gravityDisplacement);
        let velocity = displacement.divideScalar(transitionTime);
        this.velocities[index] = velocity;
        this.transitionTimes[index] = transitionTime;
        this.radii[index] = radius;
        this.currentParticleIndex = (this.currentParticleIndex + 1) % this.maxParticles;
    }

    updateParticles(deltaTime) {
        for (let i = 0; i < this.maxParticles; i++) if(this.transitionTimes[i] > 0) {
            this.colors[4*i+3] *= (1- deltaTime / this.transitionTimes[i]);
            this.transitionTimes[i] -= deltaTime;
            let position = new THREE.Vector3().fromArray(this.positions.slice(i * 3, i * 3 + 3));
            let velocity = this.velocities[i];
            velocity.add(gravity.clone().multiplyScalar(deltaTime));
            position.add(velocity.clone().multiplyScalar(deltaTime));
            this.positions.set([position.x, position.y, position.z], i * 3);
        } else if(this.positions[3*i] < 1000){ this.positions[3*i] = this.positions[3*i+1] = this.positions[3*i+2] = 100000;}
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
        this.geometry.attributes.radius.needsUpdate = true;
    }
}