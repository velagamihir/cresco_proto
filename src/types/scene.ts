export type NodeType = 'rectangle' | 'ellipse' | 'frame' | 'text';

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

export interface EllipseNode extends BaseNode {
    type: 'ellipse';
}

export interface TextNode extends BaseNode {
    type: 'text';
    text: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: number | string;
    textAlign: 'left' | 'center' | 'right';
    lineHeight?: number;
    autoWidth?: boolean;
}

export type SceneNode = RectangleNode | EllipseNode | TextNode;