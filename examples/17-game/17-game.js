import { GUI } from '../../lib/dat.gui.module.js';

import { Application } from '../../common/engine/Application.js';

import { Renderer } from './Renderer.js';
import { Physics } from './Physics.js';
import { Camera } from './Camera.js';
import { SceneLoader } from './SceneLoader.js';
import { SceneBuilder } from './SceneBuilder.js';
import { Mesh } from './Mesh.js';
import { Model } from './Model.js';

import { update_wave } from './UpdateWave.js';

// import Helper from './Helper.js';

class App extends Application {

    start() {
        const gl = this.gl;

        this.renderer = new Renderer(gl);
        this.time = Date.now();
        this.startTime = this.time;
        this.aspect = 1;
        
        this.pointerlockchangeHandler = this.pointerlockchangeHandler.bind(this);
        document.addEventListener('pointerlockchange', this.pointerlockchangeHandler);
        
        this.load('scene.json');
    }
    
    async load(uri) {
        this.spec = await new SceneLoader().loadScene(uri);
        this.builder = new SceneBuilder(this.spec);
        this.scene = this.builder.build();
        this.physics = new Physics(this.scene);
        // this.helper = new Helper(this.scene, scene);
        this.paused = false;
        this.waypoints = [[0, 1], [10, 1], [10, 5], [6, 5], [6, 3], [1, 3], [1, 10], [8, 10], [8, 8], [11, 8]];
        this.currentWave = 0;
        this.enemyTypes = [
            {
                "type": "wait"
            },
            {
            "type": "model",
            "mesh": 0,
            "texture": 3,
            "aabb": {
                "min": [-1, -1, -1],
                "max": [1, 1, 1]
            },
            "translation": [0, 3, 0],
            "scale": [0.25, 0.25, 0.25],
        },
        ]
        this.waves = [
            [1],
            [1, 0, 1, 1, 0, 0, 1, 1, 1, 1],
            [1, 0, 1, 1, 0, 0, 1, 1, 1, 1],
            [1, 0, 1, 1, 0, 0, 1, 1, 1, 1],
        ]
        this.turretTypes = [
            {
                "type": "model",
                "mesh": 2,
                "texture": 2,
                "aabb": {
                    "min": [-0.2, -1, -0.2],
                    "max": [0.2, 1, 0.2]
                },
              "translation": [0, 0.5, 0],
              "scale": [0.03, 0.03, 0.03]
            }
        ]
        this.turretGrid = JSON.parse(JSON.stringify(this.spec.map.grid));
        console.log(this.turretGrid);
        for (let y in this.turretGrid) {
            for (let x in this.turretGrid) {
                if (this.turretGrid[y][x] == 1) {
                    this.turretGrid[y][x] = 'X';
                }
            }
        }
        console.log(this.turretGrid);

// Find first camera.
this.camera = null;
this.scene.traverse(node => {
    if (node instanceof Camera) {
        this.camera = node;
    }
});
        this.camera.aspect = this.aspect;
        this.camera.updateProjection();
        this.renderer.prepare(this.scene);
    }

    spawnWave(wave) {
        let i = 1;
        let distance = 4; //distance_traveled between enemies, could also add delay object to the model
        console.log(wave);
        for(let enemyIndex of wave) {
            let enemy = this.enemyTypes[enemyIndex];
            //there's now also type "wait" to increment i and increase distance between objects
            if (enemy.type == "model"){
                let model = this.builder.createNode(enemy);
                model.id = i;
                model.distance_traveled = 0 - (i * distance);
                model.role = "enemy";
                this.scene.addNode(model);
                // console.log(model);
            }
            i++;
        }
        this.renderer.prepare(this.scene);
        
    }

    spawnNextWave() {
        if(this.currentWave >= this.waves.length) return;
        
        this.spawnWave(this.waves[this.currentWave]);
        this.currentWave++;
    }
    
    spawnTurret(turretIndex, position){
        let turret = this.turretTypes[turretIndex];
        
        
        const mesh = new Mesh(this.spec.meshes[turret.mesh]);
        const texture = this.spec.textures[turret.texture];
        let model = new Model(mesh, texture, turret);


        let x = model.translation[0];
        let y = model.translation[1];
        let z = model.translation[2];
        
        //console.log(position);
        //console.log(position[1]);
        
        model.translation = [position[0], y, position[1]];
        
        model.updateTransform();
        model.role = "turret";
        model.target = -1;
        
        this.scene.addNode(model);
        this.turretGrid[position[1]][position[0]] = 'X';
    }
    // h>
    spawnTurret1(){
        this.spawnTurret(0, [8, 3]);
        this.spawnTurret(0, [5, 5]);
        this.spawnTurret(0, [7, 8]);
        this.spawnTurret(0, [10, 10]);
        this.renderer.prepare(this.scene); 
    }

    enableCamera() {
        this.canvas.requestPointerLock();
    }

    pointerlockchangeHandler() {
        if (!this.camera) {
            return;
        }

        if (document.pointerLockElement === this.canvas) {
            this.camera.enable();
        } else {
            this.camera.disable();
        }
    }

    update() {
        const t = this.time = Date.now();
        const dt = (this.time - this.startTime) * 0.001;
        this.startTime = this.time;

        if (this.camera) {
            this.camera.update(dt);
        }

        if (this.physics) {
            this.physics.update(dt);
        }
        if (!this.paused) {
            update_wave(this.scene, this.waypoints);
        }
        // this.update_game()

        // if (this.helper != null && !this.test) {
        //     this.helper.spawnTurret();
        //     this.test = true;
        // } 
        //console.log(this.scene)

    }

    render() {
        if (this.scene) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    resize() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        this.aspect = w / h;
        if (this.camera) {
            this.camera.aspect = this.aspect;
            this.camera.updateProjection();
        }
    }

    arrAdd(arr1, arr2){
		if(arr1.length != arr2.length){
			console.log("ADDING ERROR");
			return;
		}
		let temp = [];
		for(let i = 0; i < arr1.length; i++){
			temp.push(arr1[i] + arr2[i]);
		}
		return temp;
	}

    pause_unpause() {
        this.paused = !this.paused;
    }

}


document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('canvas');
    const app = new App(canvas);
    const gui = new GUI();
    gui.add(app, 'enableCamera');
    gui.add(app, 'spawnNextWave');
    gui.add(app, 'spawnTurret1');
    gui.add(app, 'pause_unpause');
});


