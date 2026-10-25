import type { Point } from './camera';

export type NodeType = 'rectangle' | 'ellipse' | 'frame' | 'text' | 'path';

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
    verticalAlign?: 'top' | 'middle' | 'bottom';
    lineHeight?: number;
    autoWidth?: boolean;
}

export interface VectorAnchor {
    x: number;
    y: number;
    handleIn?: Point;
    handleOut?: Point;
}

export interface PathNode extends BaseNode {
    type: 'path';
    anchors: VectorAnchor[];
    closed: boolean;
}

export type SceneNode = RectangleNode | EllipseNode | TextNode | PathNode;