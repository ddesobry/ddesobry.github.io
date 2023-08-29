/*
  Copyright (C) 2022, Desobry David
  SPDX-License-Identifier: AGPL-3.0-or-later
  See <https://www.gnu.org/licenses/>
*/

class FireworkManager {
    constructor(maxFireworks) {
        this.maxFireworks = maxFireworks;
        this.activeFireworks = [];
        this.cur_id = 0;
        for(let i = 0; i < this.maxFireworks; i++){
            this.activeFireworks.push(new Firework(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0), 0, new THREE.Color(0,0,0)));
        }
    }
    add(firework) {
        this.activeFireworks[this.cur_id] = firework;
        this.cur_id = (this.cur_id + 1) % this.maxFireworks;
    }
    update(deltaTime){
        this.activeFireworks.forEach(firework => {firework.update(deltaTime);});
    }
}