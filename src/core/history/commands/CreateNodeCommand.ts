import type { Command } from '../Command';
import type { SceneNode } from '../../../types/scene';
import { SceneGraph } from '../../scene/SceneGraph';

export class CreateNodeCommand implements Command {
    readonly description = 'Create Shape';
    private sceneGraph: SceneGraph;
    private node: SceneNode;
    private setSelectedIds?: (ids: Set<string>) => void;

    constructor(
        sceneGraph: SceneGraph,
        node: SceneNode,
        setSelectedIds?: (ids: Set<string>) => void
    ) {
        this.sceneGraph = sceneGraph;
        this.node = node;
        this.setSelectedIds = setSelectedIds;
    }

    public execute(): void {
        this.sceneGraph.addNode(this.node);
        this.setSelectedIds?.(new Set([this.node.id]));
    }

    public undo(): void {
        this.sceneGraph.deleteNode(this.node.id);
        this.setSelectedIds?.(new Set());
    }
}
