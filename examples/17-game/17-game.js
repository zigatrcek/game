import { GUI } from '../../lib/dat.gui.module.js';

import { Application } from '../../common/engine/Application.js';

import { Renderer } from './Renderer.js';
import { Physics } from './Physics.js';
import { Camera } from './Camera.js';
import { SceneLoader } from './SceneLoader.js';
import { SceneBuilder } from './SceneBuilder.js';
import { Mesh } from './Mesh.js';
import { Model } from './Model.js';
import { Light } from './Light.js';

import { UpdateWave } from './UpdateWave.js';

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
        this.map = this.builder.map;
        console.log(this.map);
        this.physics = new Physics(this.scene);
        // this.helper = new Helper(this.scene, scene);
        this.paused = false;
        this.waypoints = [[0, 1], [10, 1], [10, 5], [6, 5], [6, 3], [1, 3], [1, 10], [8, 10], [8, 8], [12, 8]];
        this.updateWave = new UpdateWave(this.spec, this.scene, this.waypoints);
        this.currentWave = 0;
        this.updateWave.isPlaying = false;

        //highlight coords
        this.i = 0;
        this.j = 0;

        this.setSelected(true);

        this.light = new Light();

        this.enemyTypes = [
            {
                "type": "wait"
            },
            {
                "type": "model",
                "mesh": 0,
                "texture": 13,
                "hp": 50,
                "aabb": {
                    "min": [-0.12, -0.12, -0.12],
                    "max": [0.12, 0.12, 0.12]
                },
                "translation": [0, -3, 0],
                "scale": [0.12, 0.12, 0.12],
            }, {
                "type": "model",
                "mesh": 0,
                "texture": 13,
                "hp": 100,
                "aabb": {
                    "min": [-0.25, -0.25, -0.25],
                    "max": [0.25, 0.25, 0.25]
                },
                "translation": [0, -3, 0],
                "scale": [0.25, 0.25, 0.25],
            },
            {
                "advanced": "snake",
                "type": "model",
                "mesh": 0,
                "texture": 13,
                "hp": 40,
                "aabb": {
                    "min": [-0.25, -0.25, -0.25],
                    "max": [0.25, 0.25, 0.25]
                },
                "translation": [0, -3, 0],
                "scale": [0.25, 0.25, 0.25],
            },
        ]
        this.waves = [
            [3],
            [1, 0, 0, 1],
            [2, 1],
            [1, 1, 0, 1],
            [2],
            [1, 1, 0, 2],
            [2, 0, 2],
        ]
        this.turretTypes = [
            {
                "type": "model",
                "mesh": 3,
                "texture": 5,
                "aabb": {
                    "min": [-0.2, -1, -0.2],
                    "max": [0.2, 1, 0.2]
                },
                "translation": [0, 0.5, 0],
                "scale": [1, 1, 1],
                "rotation": [0, -Math.PI / 2, 0],
            }
        ]
        console.log(this.turretTypes);


        this.end = this.waypoints[this.waypoints.length - 1]

        this.turretGrid = JSON.parse(JSON.stringify(this.spec.map.grid));
        console.log(this.turretGrid);
        for (let y in this.turretGrid) {
            for (let x in this.turretGrid) {
                if (this.turretGrid[y][x] == 1) {
                    this.turretGrid[y][x] = 'X';
                    this.map[y][x].colorM = [1, 0, 0];

                }
            }
        }

        // console.log(this.turretGrid);
        // console.log(this.map);
        // console.log("dis");
        // this.map[0][0].colorM = [1, 0, 0];
        // console.log(this.map[0][0]);
        // console.log(this.turretGrid);

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

    update() {
        const t = this.time = Date.now();
        const dt = (this.time - this.startTime) * 0.001;
        this.startTime = this.time;

        //console.log(this.map);

        if (this.updateWave) {
            if (this.updateWave.hp <= 0) {
                this.showLoss();
                document.getElementById('overlay').hidden = true;
            } else {
                let hpObj = document.getElementById('hp');
                hpObj.innerHTML = "HP: " + this.updateWave.hp;

                let moneyObj = document.getElementById('money');
                moneyObj.innerHTML = "Money: " + this.updateWave.money;
            }
        }

        if (this.camera) {
            this.camera.update(dt);
        }

        if (this.physics) {
            this.physics.update(dt);
        }
        if (!this.paused && this.updateWave) {
            this.updateWave.update_wave();
        }
        if (this.scene) {
            this.renderer.prepareNew(this.scene);
        }
    }

    spawnWave(wave) {
        let i = 1;
        let distance = 4; //distance_traveled between enemies, could also add delay object to the model
        console.log(wave);
        for (let enemyIndex of wave) {
            let enemy = this.enemyTypes[enemyIndex];
            //there's now also type "wait" to increment i and increase distance between objects
            if (enemy.type == "model") {
                let model = this.builder.createNode(enemy);
                model.id = i;
                model.distance_traveled = 0 - (i * distance);
                model.role = "enemy";
                this.scene.addNode(model);
                model.hp = enemy.hp;
                model.maxHp = enemy.hp;
                // console.log(model);
                if (enemy.advanced == "snake") {
                    this.getSnakeTails(i, distance, model, enemy);
                    model.advanced = "snake";
                }
            }
            i++;
        }
        this.renderer.prepareNew(this.scene);

    }



    getSnakeTails(i, distance, model, enemy) {
            let model1 = this.builder.createNode(this.enemyTypes[2]);
            //console.log("Snake tails");
            //console.log(model1);
            model1.id = i;
            model1.distance_traveled = 0 - (i * distance) - 0.5;
            model1.role = "snakeTail";
            this.scene.addNode(model1);
            model.child = model1;
            model1.hp = enemy.hp;
            model1.maxHp = enemy.hp;
    }

    spawnNextWave() {
        if (this.currentWave >= this.waves.length || this.updateWave.isPlaying == true) return;

        this.spawnWave(this.waves[this.currentWave]);
        this.currentWave++;
        this.updateWave.isPlaying = true;
    }

    spawnTurret(turretIndex, position) {
        let turret = this.turretTypes[turretIndex];
        let COST = 100;


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
        model.target = null;
        model.cooldown = 0;
        if (this.updateWave.money - COST < 0) return;
        if (this.turretGrid[position[0]][position[1]] == 'X') return;

        this.updateWave.money -= COST;

        this.scene.addNode(model);
        this.turretGrid[position[0]][position[1]] = 'X';
        this.map[position[0]][position[1]].colorM = [1, 0, 0]
    }
    // h>
    spawnTurret1() {
        this.spawnTurret(0, [this.i, this.j]);
        //console.log("cum");
        this.renderer.prepareNew(this.scene);
        //console.log("oh yeah");

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

    setSelected(tf) {
        this.map[this.i][this.j].selected = tf;
    }

    setSelectedGUI() {
        this.setSelected(true);
    }


    render() {
        if (this.scene) {
            this.renderer.render(this.scene, this.camera, this.light);
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

    arrAdd(arr1, arr2) {
        if (arr1.length != arr2.length) {
            console.log("ADDING ERROR");
            return;
        }
        let temp = [];
        for (let i = 0; i < arr1.length; i++) {
            temp.push(arr1[i] + arr2[i]);
        }
        return temp;
    }

    showLoss() {
        document.getElementById("loss").hidden = false;
    }

    pause_unpause() {
        this.paused = !this.paused;
    }


    increaseI() {
        if (this.i >= 11) return;
        this.setSelected(false);
        this.i++;
        this.setSelected(true);
    }

    decreaseI() {
        if (this.i <= 0) return;
        this.setSelected(false);
        this.i--;
        this.setSelected(true);
    }

    increaseJ() {
        if (this.j >= 11) return;
        this.setSelected(false);
        this.j++;
        this.setSelected(true);
    }

    decreaseJ() {
        if (this.j <= 0) return;
        this.setSelected(false);
        this.j--;
        this.setSelected(true);
    }
}


let turret1 = document.getElementById("turret1");

// turret1.addEventListener("click", (e) => {
//     console.log("we'be been clicked");
// })



document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('canvas');
    const app = new App(canvas);
    const gui = new GUI();
    gui.add(app, 'enableCamera');
    gui.add(app, 'spawnNextWave');
    gui.add(app, 'spawnTurret1');
    gui.add(app, 'pause_unpause');
    gui.add(app, 'showLoss');

    document.addEventListener("keydown", function (e) {
        //console.log(e.key);
        switch (e.key) {

            //model translation

            case "ArrowUp":
                app.increaseI();
                break;
            case "ArrowDown":
                app.decreaseI();
                break;
            case "ArrowRight":
                app.increaseJ();
                break;
            case "ArrowLeft":
                app.decreaseJ();
                break;
            case "Enter":
                app.spawnTurret1();
                break;
            case " ":
                app.spawnNextWave();
                break;
            case "p":
                app.pause_unpause();
                break;

        }
    });


    // gui.add(app, 'increaseI');
    // gui.add(app, 'decreaseI');
    // gui.add(app, 'increaseJ');
    // gui.add(app, 'decreaseJ');
});
