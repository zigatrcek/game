import { GUI } from '../../lib/dat.gui.module.js';

import { Application } from '../../common/engine/Application.js';

import { Renderer } from './Renderer.js';
import { Physics } from './Physics.js';
import { Camera } from './Camera.js';
import { SceneLoader } from './SceneLoader.js';
import { SceneBuilder } from './SceneBuilder.js';
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
        const scene = await new SceneLoader().loadScene(uri);
        const builder = new SceneBuilder(scene);
        this.scene = builder.build();
        this.physics = new Physics(this.scene);
        // this.helper = new Helper(this.scene, scene);
        // this.test = false;
        this.waypoints = [[0, 1], [10, 1], [10, 5], [6, 5], [6, 3], [1, 3], [1, 10], [8, 10], [8, 8], [11, 8]];
        

        this.spawnWave(this.scene, builder, [
        {
          "type": "model",
          "mesh": 0,
          "texture": 2,
          "aabb": {
            "min": [-1, -1, -1],
            "max": [1, 1, 1]
          },
          "translation": [0, 1, 0],
          "scale": [0.25, 0.25, 0.25],
        },]);

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

    spawnWave(scene, builder, wave) {
        let i = 1;
        for(let enemy of wave) {
            let model = builder.createNode(enemy);
            model.id = i;
            scene.addNode(model);
            i++;
            model.distance_traveled = 0;
        }
        console.log("this scene:");
        console.log(this.scene);
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
        update_wave(this.scene, this.waypoints);
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

}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('canvas');
    const app = new App(canvas);
    const gui = new GUI();
    gui.add(app, 'enableCamera');
});


