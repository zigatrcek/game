import {vec3, mat4 } from '../../lib/gl-matrix-module.js';

import { WebGL } from '../../common/engine/WebGL.js';

import { shaders } from './shaders.js';

export class Renderer {

    constructor(gl) {
        this.gl = gl;
        gl.clearColor(0.06640625, 0.23828125, 0.328125, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        this.programs = WebGL.buildPrograms(gl, shaders);

        this.defaultTexture = WebGL.createTexture(gl, {
            width  : 1,
            height : 1,
            data   : new Uint8Array([255, 255, 255, 255])
        });
    }

    prepare(scene) {
        scene.nodes.forEach(node => {
            node.gl = {};
            if (node.mesh) {
                Object.assign(node.gl, this.createModel(node.mesh));
            }
            if (node.image) {
                node.gl.texture = this.createTexture(node.image);
            }
        });
    }

    render(scene, camera, light) {
        const gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const program = this.programs.simple;
        gl.useProgram(program.program);

        let matrix = mat4.create();
        let matrixStack = [];

        const viewMatrix = camera.getGlobalTransform();
        mat4.invert(viewMatrix, viewMatrix);
        mat4.copy(matrix, viewMatrix);
        gl.uniformMatrix4fv(program.uniforms.uProjection, false, camera.projection);

        scene.traverse(
            node => {
                matrixStack.push(mat4.clone(matrix));
                mat4.mul(matrix, matrix, node.transform);
                if (node.gl.vao) {
                    gl.bindVertexArray(node.gl.vao);
                    gl.uniformMatrix4fv(program.uniforms.uViewModel, false, matrix);
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, node.gl.texture);
                    gl.uniform1i(program.uniforms.uTexture, 0);

                    gl.uniform1f(program.uniforms.uAmbient, light.ambient);
                    gl.uniform1f(program.uniforms.uDiffuse, light.diffuse);
                    gl.uniform1f(program.uniforms.uSpecular, light.specular);
                    gl.uniform1f(program.uniforms.uShininess, light.shininess);
                    gl.uniform3fv(program.uniforms.uLightPosition, light.position);
                    let color = vec3.clone(light.color);
                    vec3.scale(color, color, 1.0 / 255.0);
                    gl.uniform3fv(program.uniforms.uLightColor,  color);
                    gl.uniform3fv(program.uniforms.uLightAttenuation, light.attenuatuion);

                    
                    var healthLoc = gl.getUniformLocation(program.program, "healthIn");
                    let health = 1;
                    if (node.role == "enemy") {
                        health = node.hp / node.maxHp;
                        //console.log(health);
                    }
                    gl.uniform1f(healthLoc, health);

                    let colorC = [1, 1, 1];

                    if (node.colorM && node.selected){
                        colorC = node.colorM;
                    }
                    var colorLoc = gl.getUniformLocation(program.program, "highlightedColor");
                    gl.uniform3fv(colorLoc, colorC);

                    gl.drawElements(gl.TRIANGLES, node.gl.indices, gl.UNSIGNED_SHORT, 0);
                }
            },
            node => {
                matrix = matrixStack.pop();
            }
        );
    }

    prepareNew(scene){
        scene.nodes.forEach(node => {
            if(!node.gl){
                node.gl = {};
                if (node.mesh) {
                    Object.assign(node.gl, this.createModel(node.mesh));
                }
                if (node.image) {
                    node.gl.texture = this.createTexture(node.image);
                }
            }
        });
    }


    createModel(model) {
        const gl = this.gl;

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertices), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.texcoords), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.normals), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);

        const indices = model.indices.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW);

        return { vao, indices };
    }

    createTexture(texture) {
        const gl = this.gl;
        return WebGL.createTexture(gl, {
            image : texture,
            min   : gl.NEAREST,
            mag   : gl.NEAREST
        });
    }

}
