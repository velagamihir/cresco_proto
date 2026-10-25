import type { Command } from './Command';

export type HistoryChangeListener = (canUndo: boolean, canRedo: boolean) => void;

export class HistoryManager {
    private undoStack: Command[] = [];
    private redoStack: Command[] = [];
    private maxHistory: number = 50;
    private listeners: Set<HistoryChangeListener> = new Set();

    constructor(maxHistory: number = 50) {
        this.maxHistory = maxHistory;
    }

    public subscribe(listener: HistoryChangeListener): () => void {
        this.listeners.add(listener);
        listener(this.canUndo(), this.canRedo());
        return () => {
            this.listeners.delete(listener);
        };
    }

    private notify(): void {
        const undoable = this.canUndo();
        const redoable = this.canRedo();
        for (const listener of this.listeners) {
            listener(undoable, redoable);
        }
    }

    /**
     * Executes a command and pushes it onto the undo stack while clearing redo.
     */
    public execute(command: Command): void {
        command.execute();
        this.push(command);
    }

    /**
     * Directly pushes an already executed command onto the undo stack (useful when
     * tools perform the mutation progressively e.g. mouse drag, then commit).
     */
    public push(command: Command): void {
        this.undoStack.push(command);
        if (this.undoStack.length > this.maxHistory) {
            this.undoStack.shift();
        }
        this.redoStack = [];
        this.notify();
    }

    public undo(): void {
        const command = this.undoStack.pop();
        if (!command) return;

        command.undo();
        this.redoStack.push(command);
        this.notify();
    }

    public redo(): void {
        const command = this.redoStack.pop();
        if (!command) return;

        command.execute();
        this.undoStack.push(command);
        this.notify();
    }

    public canUndo(): boolean {
        return this.undoStack.length > 0;
    }

    public canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    public clear(): void {
        this.undoStack = [];
        this.redoStack = [];
        this.notify();
    }
}
