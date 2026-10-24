import type { SceneNode } from '../../types/scene';

export class SceneGraph {
    private nodes: Map<string, SceneNode> = new Map();

    public addNode(node: SceneNode): void {
        this.nodes.set(node.id, node);
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
        this.nodes.set(id, { ...existing, ...updates } as SceneNode);
    }

    public deleteNode(id: string): void {
        this.nodes.delete(id);
    }

    public clear(): void {
        this.nodes.clear();
    }
}
