// Run on every frame, if the wave is active. If we are between waves or the game is paused, this function is not called.
export function update_wave(scene, path) {
    traverse_paths(scene, path);
}

function update_turrets() {
    // locking, rotation, shooting
}

function update_bullets() {
    // movement, collision
}

function update_enemies() {
    // TODO update enemies
        // movement, hp calculation

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
    let move = 0.02;
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