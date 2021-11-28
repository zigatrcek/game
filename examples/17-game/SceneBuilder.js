import { Mesh } from './Mesh.js';

import { Node } from './Node.js';
import { Model } from './Model.js';
import { Camera } from './Camera.js';

import { Scene } from './Scene.js';

export class SceneBuilder {

    constructor(spec) {
        this.spec = spec;
    }

    createNode(spec) {
        switch (spec.type) {
            case 'camera': return new Camera(spec);
            case 'model': {
                const mesh = new Mesh(this.spec.meshes[spec.mesh]);
                const texture = this.spec.textures[spec.texture];
                return new Model(mesh, texture, spec);
            };
            default: return new Node(spec);
        }
    }

    build() {
        console.log("building");
        let scene = new Scene();
        let map = this.spec.map;

        this.map = this.parseMap(scene, map); 
        this.spec.nodes.forEach(spec => scene.addNode(this.createNode(spec)));
        return scene;
    }

    parseMap(scene, map){
        console.log('parsing map');
        let offset = 1;
        let grid = map.grid;
        let map1 = new Array()
        for(let i = 0; i < grid.length; i++) {
            map1.push(new Array())
            for (let j = 0; j < grid[0].length; j++) {
                let translationX = i * offset;
                let translationZ = j * offset;
                let tile = {};
                let colorM = []
                switch(grid[i][j]) {
                    case 0:
                        tile = map.maptile;
                        colorM = [0, 1, 0];
                        break;
                    case 1:
                        tile = map.pathtile;
                        colorM = [1, 0, 0];
                        break;
                }

                tile = JSON.parse(JSON.stringify(tile))
                tile.translation = [translationX, 0, translationZ];
                //scene.addNode(this.createNode(tile));

                const mesh = new Mesh(this.spec.meshes[tile.mesh]);
                const texture = this.spec.textures[tile.texture];
                let tileModel = new Model(mesh, texture, tile);

                tileModel.i = i;
                tileModel.j = j;
                tileModel.selected = false;
                tileModel.colorM = colorM;

                scene.addNode(tileModel);
                map1[i].push(tileModel);

            }
        }
        return map1;
    };



}
