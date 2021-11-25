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
        this.parseMap(scene, map);
        this.spec.nodes.forEach(spec => scene.addNode(this.createNode(spec)));
        return scene;
    }

    parseMap(scene, map){
        console.log('parsing map');
        let offset = 1;
        let grid = map.grid;
        for(let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[0].length; j++) {
                let translationX = i * offset;
                let translationZ = j * offset;
                let tile = {};
                switch(grid[i][j]) {
                    case 0:
                        tile = map.maptile;
                        break;
                    case 1:
                        tile = map.pathtile;
                        break;
                }

                tile = JSON.parse(JSON.stringify(tile))
                tile.translation = [translationX, 0, translationZ];
                scene.addNode(this.createNode(tile));

            }
        }
    };



}
