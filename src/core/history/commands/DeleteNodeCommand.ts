import type { Command } from '../Command';
import type { SceneNode } from '../../../types/scene';
import { SceneGraph } from '../../scene/SceneGraph';

export interface DeletedNodeRecord {
    node: SceneNode;
    index: number;
}

export class DeleteNodeCommand implements Command {
    readonly description = 'Delete Shapes';
    private sceneGraph: SceneGraph;
    private records: DeletedNodeRecord[];
    private setSelectedIds?: (ids: Set<string>) => void;

    constructor(
        sceneGraph: SceneGraph,
        records: DeletedNodeRecord[],
        setSelectedIds?: (ids: Set<string>) => void
    ) {
        this.sceneGraph = sceneGraph;
        this.records = records;
        this.setSelectedIds = setSelectedIds;
    }

    public execute(): void {
        for (const record of this.records) {
            this.sceneGraph.deleteNode(record.node.id);
        }
        this.setSelectedIds?.(new Set());
    }

    public undo(): void {
        // Re-insert nodes sorted by their original z-index to preserve order
        const sorted = [...this.records].sort((a, b) => a.index - b.index);
        const restoredIds = new Set<string>();

        for (const record of sorted) {
            this.sceneGraph.insertNodeAt(record.node, record.index);
            restoredIds.add(record.node.id);
        }

        this.setSelectedIds?.(restoredIds);
    }
}
