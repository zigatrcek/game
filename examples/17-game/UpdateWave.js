import { Mesh } from './Mesh.js';
import { Model } from './Model.js';

export class UpdateWave {
    constructor(spec, scene, path) {
        this.spec = spec;
        this.scene = scene;
        this.path = path;
        this.hp = 500;
        this.bulletTypes = [
            {   "damage": 10,
                "type": "model",
                "mesh": 0,
                "texture": 13,
                "aabb": {
                    "min": [-0.1, -0.1, -0.1],
                    "max": [0.1, 0.1, 0.1]
                },
              "translation": [0, 0, 0],
              "scale": [0.1, 0.1, 0.1]
            },
        ]
        this.end = path[path.length-1];
    }
    // Run on every frame, if the wave is active. If we are between waves or the game is paused, this is not called.
    update_wave() {
        this.update_enemies();
        this.update_turrets(this.scene, this.path);
        this.find_stray_bullets();
        this.update_bullets();
    }

    update_turrets(scene, path) {
        if (scene != null){
            for (let enemy of scene.nodes){
                if (enemy != null) {
                    if (enemy.role == "turret"){
                        this.update_turret(scene, enemy, path);
                    }
                }
            }
        }
    }

    update_enemies(){
        if (this.scene != null){
            for (let enemy of this.scene.nodes){
                if (enemy.role == "enemy" && enemy != null) {
                    if (enemy.hp <= 0){
                        this.scene.removeNode(this.scene.nodes.indexOf(enemy));
                        return;
                    }
                    this.traverse_path(enemy, this.path);

                    let move = 0.05;
                    let res = this.get_path_position(enemy.distance_traveled + move, this.path);
                    enemy.distance_traveled += move;


                    // check if enemy has come to the end
                    if (this.distance(enemy.translation, [this.end[0], 0, this.end[1]]) < 0.1){
                        console.log("OH NO WE'VE BEEN HIT");
                        this.hp -= enemy.hp;
                        // enemy.translation = [0, -50, 0];
                        //console.log(enemy.hp);
                        //console.log(this.scene);
                        this.scene.removeNode(this.scene.nodes.indexOf(enemy));
                        //console.log(this.scene);
                        return;
                    }

                }
            }
        }
    }

    update_bullets() {
        if (this.scene != null){
            for (let bullet of this.scene.nodes){
                if (bullet != null) {
                    if (bullet.role == "bullet"){
                        // let target = this.findEnemyById(bullet.target);
                        this.update_bullet(bullet, bullet.target);
                    }
                }
            }
        }
    }

    update_bullet(bullet, target){
        let SPEED = 0.1;
        let direction = this.get_bullet_direction(bullet, target, SPEED);
        bullet.translation[0] += direction[0];
        bullet.translation[1] += direction[1];
        bullet.translation[2] += direction[2];
        bullet.updateTransform();
        if (this.distance(bullet.translation, target.translation) < 0.1) {
            target.hp -= bullet.damage;
            this.scene.removeNode(this.scene.nodes.indexOf(bullet));
        }
    }


    get_bullet_direction(bullet, target, speed){
        let direction = this.arrSub(target.translation, bullet.translation);
        let normalized = this.vectorNorm(direction);
        return this.arrScale(direction, speed/normalized);
    }

    spawn_bullet(bullet, target, translation){
        const mesh = new Mesh(this.spec.meshes[this.bulletTypes[bullet].mesh]);
        const texture = this.spec.textures[this.bulletTypes[bullet].texture];
        let bulletToRender = this.bulletTypes[bullet];
        bulletToRender.translation = translation;
        let model = new Model(mesh, texture, bulletToRender);
        model.target = target;
        model.role = "bullet";
        model.translation = JSON.parse(JSON.stringify(translation));
        model.translation = this.arrAdd(model.translation, [0, 0.3, 0]);
        model.damage = bulletToRender.damage;
        //console.log(model.damage);
        this.scene.addNode(model);
    }

    distance(pos1, pos2) {
        return Math.sqrt(Math.pow(pos1[0] - pos2[0], 2) + Math.pow(pos1[2] - pos2[2], 2));
    }


    update_turret(scene, turret, path) {
        let RANGE = 3;
        let COOLDOWN = 60;


        // let target = this.findEnemyById(turret.target);
        if (turret.target) {
            if (this.distance(turret.target.translation, turret.translation) > RANGE
                || this.scene.nodes.indexOf(turret.target) == -1) {
                turret.target = null;
            }
        }


        if (turret.target == null) {
            turret.target = this.find_target(scene, turret, path, RANGE);
        }

        if (turret.target == null) {
            return;
        }

        let turretLocation = [turret.translation[0], turret.translation[2]];
        let targetLocation = [turret.target.translation[0], turret.target.translation[2]];
        if (targetLocation[0] == -100 || targetLocation[1] == -100) {
            turret.target = null;
            return;
        }
        //console.log(turretLocation + " -> " + targetLocation);
        let Y = turretLocation[1] - targetLocation[1];
        let X = turretLocation[0] - targetLocation[0];
        let vec = [X, Y];
        let norm = this.vectorNorm(vec);
        let fi = 0;
        if (Y == 0){

        } else {
            fi = Math.acos(X / norm) * (Y / Math.abs(Y));
        }

        let start = 0;
        fi = fi + start;
        turret.rotation[1] = -Math.PI/2 - fi;
        turret.updateTransform();

        if (turret.cooldown == 0) {
            this.spawn_bullet(0, turret.target, turret.translation);
            turret.cooldown = COOLDOWN;
        }
        if (turret.cooldown != 0) {
            turret.cooldown--;
        }

    }

    findEnemyById(id){
        if (id == -1) return;
        if (this.scene != null){
            for (let enemy of this.scene.nodes){
                if (enemy != null) {
                    if (enemy.id = id){
                        return enemy;
                    }
                }
            }
        }
        return;
    }

    vectorNorm(v){
        return Math.sqrt(this.scalarProd(v, v));
    }

    scalarProd(v1, v2){

        if(v1.length != v2.length){
            console.log("ERROR");
            return -1;
        }
        let v = 0;
        for(let i = 0; i < v1.length; i++){
            v += v1[i]*v2[i];
        }
        return v;

    }


    find_target(scene, turret, path, range) {
        if (scene != null){
            let best_dist = 2000000;
            let best = null;
            for (let enemy of scene.nodes){
                if (enemy != null) {
                    if (enemy.role == "enemy"){
                        let dist = this.distance(turret.translation, enemy.translation);
                        if (dist <= range && dist < best_dist){
                            //console.log(dist);
                            best = enemy;
                            best_dist = dist;
                        }
                    }
                }
            }
            return best;
        }
        return;
    }

    get_path_position(distance_to_travel, path) {
        if (distance_to_travel < 0) return [-100, -100];

        let prevIt = path[0];

        for (let it of path) {
            // calculate segment length
            let segment_len = Math.max(Math.abs(it[0] - prevIt[0]), Math.abs(it[1] - prevIt[1]));

            // calculate exactly where you end up
            if (segment_len > distance_to_travel) {
                let end_move = distance_to_travel / segment_len;
                return [
                    prevIt[0] + end_move * (it[0] - prevIt[0]),
                    prevIt[1] + end_move * (it[1] - prevIt[1]),
                ];
            }

            prevIt = it;
            distance_to_travel -= segment_len;
        }

        return [
            path[path.length - 1][0],
            path[path.length - 1][1],
        ];
    }

    traverse_path(enemy, path){

        //speed = get_path_position()
        let move = 0.005;
        let res = this.get_path_position(enemy.distance_traveled + move, path);
        enemy.distance_traveled += move;


        //console.log(enemy.distance_traveled);
        //console.log(res);




        enemy.translation[0] = res[0];
        enemy.translation[1] = 1;
        enemy.translation[2] = res[1];

        enemy.updateTransform();
    }

    find_stray_bullets(){
        if (this.scene != null){
            for (let bullet of this.scene.nodes){
                if (bullet != null) {
                    if (bullet.role == "bullet" && this.scene.nodes.indexOf(bullet.target) == -1){
                        this.scene.removeNode(this.scene.nodes.indexOf(bullet));
                    }
                }
            }
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

    arrSub(arr1, arr2){
        if(arr1.length != arr2.length){
            console.log("ADDING ERROR");
            return;
        }
        let temp = [];
        for(let i = 0; i < arr1.length; i++){
            temp.push(arr1[i] - arr2[i]);
        }
        return temp;
    }

    arrScale(arr1, scalar){
        let temp = [];
        for(let i = 0; i < arr1.length; i++){
            temp.push(arr1[i] * scalar);
        }
        return temp;
    }
}