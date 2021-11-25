// Run on every frame, if the wave is active. If we are between waves or the game is paused, this function is not called.
export function update_wave(scene, path) {
    traverse_paths(scene, path);
    update_turrets(scene, path);
}

function update_turrets(scene, path) {
    if (scene != null){
        for (let enemy of scene.nodes){
            if (enemy != null) {
                if (enemy.role == "turret"){
                    update_turret(scene, enemy, path);
                }   
            }
        }
    }
}

function update_bullets() {
    // movement, collision
}

function update_enemies() {
    // TODO update enemies
        // movement, hp calculation

}

function distance(pos1, pos2) {
    return Math.sqrt(Math.pow(pos1[0] - pos2[0], 2) + Math.pow(pos1[2] - pos2[2], 2));
}


function update_turret(scene, turret, path) {
    let RANGE = 5;

    let target = findEnemyById(scene, turret.target);
    
    if (target == null || turret.target == -1) {
        target = find_target(scene, turret, path, RANGE);
    }


    
    //console.log("target")
    //console.log(target);

    if (target == null) {
        return;
    }

    
    let turretLocation = [turret.translation[0], turret.translation[2]];
    let targetLocation = [target.translation[0], target.translation[2]];
    if (targetLocation[0] == -100 || targetLocation[1] == -100) {
        turret.target = -1;
        return;
    }
    //console.log(turretLocation + " -> " + targetLocation);
    let Y = turretLocation[1] - targetLocation[1];
    let X = turretLocation[0] - targetLocation[0];
    let vec = [X, Y];
    let norm = vectorNorm(vec);
    let fi = 0;
    if (Y == 0){

    } else {
        fi = Math.acos(X / norm) * (Y / Math.abs(Y));
    }
    
    let start = 0;
    fi = fi + start;
    turret.rotation[1] = -Math.PI / 2 - fi;
    turret.updateTransform();    
}

function findEnemyById(scene, id){
    if (id == -1) return;
    if (scene != null){
        for (let enemy of scene.nodes){
            if (enemy != null) {
                if (enemy.id = id){
                    return enemy;
                }   
            }
        }
    }
    return;
}

function vectorNorm(v){
    return Math.sqrt(scalarProd(v, v));
}

function scalarProd(v1, v2){

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


function find_target(scene, turret, path, range) {
    if (scene != null){
        let best_dist = 2000000;
        let best = null;
        for (let enemy of scene.nodes){
            if (enemy != null) {
                if (enemy.role == "enemy"){
                    let dist = distance(turret.translation, enemy.translation);
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

function get_path_position(distance_to_travel, path) {
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

function traverse_path(enemy, path){

    //speed = get_path_position()
    let move = 0.05;
    let res = get_path_position(enemy.distance_traveled + move, path);
    enemy.distance_traveled += move;


    //console.log(enemy.distance_traveled);
    //console.log(res);


    enemy.translation[0] = res[0];
    enemy.translation[1] = 1;
    enemy.translation[2] = res[1];

    enemy.updateTransform();
}

function arrAdd(arr1, arr2){
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

function traverse_paths(scene, path){
    if (scene != null){
        for (let enemy of scene.nodes){
            if (enemy != null) {
                if (enemy.id > 0){
                    traverse_path(enemy, path);
                }
            }
        }
    }
}