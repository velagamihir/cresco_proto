import type { Point } from './camera';

export type NodeType = 'rectangle' | 'ellipse' | 'frame' | 'text' | 'path' | 'line';

export interface BaseNode {
    id: string;
    type: NodeType;
    name?: string;
    parentId?: string;
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

export interface FrameNode extends BaseNode {
    type: 'frame';
    cornerRadius?: number;
    clipContent?: boolean;
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

export type MarkerType = 'none' | 'arrow' | 'triangle' | 'circle';

export interface LineNode extends BaseNode {
    type: 'line';
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    startMarker?: MarkerType;
    endMarker?: MarkerType;
}

export type SceneNode = RectangleNode | EllipseNode | FrameNode | TextNode | PathNode | LineNode;