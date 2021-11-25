import { Application } from '../../common/engine/Application.js';

import { Renderer } from './Renderer.js';
import { Physics } from './Physics.js';
import { SceneLoader } from './SceneLoader.js';
import { SceneBuilder } from './SceneBuilder.js';
import { Node } from './Node.js';
import { Model } from './Model.js';
import { Mesh } from './Mesh.js';


export default class Helper {

    constructor(scene, spec){
        this.scene = scene; // SCENE OBJEKT
        this.spec = spec;
        //console.log("created");
    }



    createTurretObject(){
		let spec = this.spec;
		let turret = this.spec.map.test;
		const mesh = new Mesh(spec.meshes[turret.mesh]);
        const texture = spec.textures[turret.texture];
        return new Model(mesh, texture, turret);
	}


    spawnTurret(){
        let model = this.createNode(this.spec.map.test);
        if (model == null) return false;

        //this.scene.addNode(model);
		return true;
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
}