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

    public setNodes(newNodes: SceneNode[]): void {
        this.nodes.clear();
        for (const n of newNodes) {
            this.nodes.set(n.id, n);
        }
        this.notify('*', null);
    }

    public moveUp(id: string): void {
        const list = Array.from(this.nodes.values());
        const index = list.findIndex((n) => n.id === id);
        if (index === -1 || index === list.length - 1) return;
        // Swap with the element above (higher z-index)
        const temp = list[index];
        list[index] = list[index + 1];
        list[index + 1] = temp;
        this.setNodes(list);
    }

    public moveDown(id: string): void {
        const list = Array.from(this.nodes.values());
        const index = list.findIndex((n) => n.id === id);
        if (index <= 0) return;
        // Swap with the element below (lower z-index)
        const temp = list[index];
        list[index] = list[index - 1];
        list[index - 1] = temp;
        this.setNodes(list);
    }

    public bringToFront(id: string): void {
        const list = Array.from(this.nodes.values());
        const index = list.findIndex((n) => n.id === id);
        if (index === -1 || index === list.length - 1) return;
        const [node] = list.splice(index, 1);
        list.push(node);
        this.setNodes(list);
    }

    public sendToBack(id: string): void {
        const list = Array.from(this.nodes.values());
        const index = list.findIndex((n) => n.id === id);
        if (index <= 0) return;
        const [node] = list.splice(index, 1);
        list.unshift(node);
        this.setNodes(list);
    }

    public reorder(fromIndex: number, toIndex: number): void {
        const list = Array.from(this.nodes.values());
        if (
            fromIndex < 0 ||
            fromIndex >= list.length ||
            toIndex < 0 ||
            toIndex >= list.length ||
            fromIndex === toIndex
        ) {
            return;
        }
        const [moved] = list.splice(fromIndex, 1);
        list.splice(toIndex, 0, moved);
        this.setNodes(list);
    }

    public clear(): void {
        this.nodes.clear();
        this.notify('*', null);
    }
}

