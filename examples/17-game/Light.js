import { Node } from './Node.js';

export class Light extends Node {

    constructor() {
        super();

        Object.assign(this, {
            position         : [0, -5, 0],
            ambient          : 0.5,
            diffuse          : 0.8,
            specular         : 0.5,
            shininess        : 5,
            color            : [170, 212, 255],
            attenuatuion     : [1.0, 0, 0.02]
        });
    }

}