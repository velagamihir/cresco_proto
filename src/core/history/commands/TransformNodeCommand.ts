import type { Command } from '../Command';
import { SceneGraph } from '../../scene/SceneGraph';

export interface NodeBounds {
    x: number;
    y: number;
    width: number;
    height: number;
    anchors?: any[];
}

export interface TransformRecord {
    id: string;
    before: NodeBounds;
    after: NodeBounds;
}

export class TransformNodeCommand implements Command {
    readonly description = 'Transform Shapes';
    private sceneGraph: SceneGraph;
    private records: TransformRecord[];
    private setSelectedIds?: (ids: Set<string>) => void;

    constructor(
        sceneGraph: SceneGraph,
        records: TransformRecord[],
        setSelectedIds?: (ids: Set<string>) => void
    ) {
        this.sceneGraph = sceneGraph;
        this.records = records;
        this.setSelectedIds = setSelectedIds;
    }

    public execute(): void {
        const ids = new Set<string>();
        for (const record of this.records) {
            this.sceneGraph.updateNode(record.id, record.after);
            ids.add(record.id);
        }
        this.setSelectedIds?.(ids);
    }

    public undo(): void {
        const ids = new Set<string>();
        for (const record of this.records) {
            this.sceneGraph.updateNode(record.id, record.before);
            ids.add(record.id);
        }
        this.setSelectedIds?.(ids);
    }
}
