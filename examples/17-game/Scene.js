export class Scene {

    constructor() {
        this.nodes = [];
    }

    addNode(node) {
        this.nodes.push(node);
    }

    removeNode(index) {
        this.nodes.splice(index, 1);
    }

    traverse(before, after) {
        this.nodes.forEach(node => node.traverse(before, after));
    }
}
