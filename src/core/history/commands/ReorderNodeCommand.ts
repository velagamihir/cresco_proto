import type { Command } from '../Command';
import type { SceneNode } from '../../../types/scene';
import { SceneGraph } from '../../scene/SceneGraph';

export class ReorderNodeCommand implements Command {
    readonly description = 'Reorder Layers';
    private sceneGraph: SceneGraph;
    private beforeNodes: SceneNode[];
    private afterNodes: SceneNode[];
    private selectedIds?: Set<string>;
    private setSelectedIds?: (ids: Set<string>) => void;

    constructor(
        sceneGraph: SceneGraph,
        beforeNodes: SceneNode[],
        afterNodes: SceneNode[],
        selectedIds?: Set<string>,
        setSelectedIds?: (ids: Set<string>) => void
    ) {
        this.sceneGraph = sceneGraph;
        this.beforeNodes = beforeNodes;
        this.afterNodes = afterNodes;
        this.selectedIds = selectedIds;
        this.setSelectedIds = setSelectedIds;
    }

    public execute(): void {
        this.sceneGraph.setNodes(this.afterNodes);
        if (this.selectedIds && this.setSelectedIds) {
            this.setSelectedIds(new Set(this.selectedIds));
        }
    }

    public undo(): void {
        this.sceneGraph.setNodes(this.beforeNodes);
        if (this.selectedIds && this.setSelectedIds) {
            this.setSelectedIds(new Set(this.selectedIds));
        }
    }
}
