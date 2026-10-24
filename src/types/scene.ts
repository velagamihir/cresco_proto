export type NodeType = 'rectangle' | 'frame';

export interface BaseNode {
    id: string;
    type: NodeType;
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    stroke?: string;
    strokeWidth?: number;
}

export interface RectangleNode extends BaseNode {
    type: 'rectangle';
    cornerRadius?: number;
}

export type SceneNode = RectangleNode;