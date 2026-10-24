import type { SceneNode } from '../../types/scene';

export type SceneChangeListener = (nodeId: string, node: SceneNode | null) => void;

export class SceneGraph {
    private nodes: Map<string, SceneNode> = new Map();
    private listeners: Set<SceneChangeListener> = new Set();

    public subscribe(listener: SceneChangeListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    private notify(nodeId: string, node: SceneNode | null): void {
        for (const listener of this.listeners) {
            listener(nodeId, node);
        }
    }

    public addNode(node: SceneNode): void {
        this.nodes.set(node.id, node);
        this.notify(node.id, node);
    }

    public getNode(id: string): SceneNode | undefined {
        return this.nodes.get(id);
    }

    public getAllNodes(): SceneNode[] {
        return Array.from(this.nodes.values());
    }

    public updateNode(id: string, updates: Partial<SceneNode>): void {
        const existing = this.nodes.get(id);
        if (!existing) return;
        const updated = { ...existing, ...updates } as SceneNode;
        this.nodes.set(id, updated);
        this.notify(id, updated);
    }

    public deleteNode(id: string): void {
        this.nodes.delete(id);
        this.notify(id, null);
    }

    public clear(): void {
        this.nodes.clear();
        this.notify('*', null);
    }
}
