import React, { useEffect, useRef, useState } from 'react';
import { Camera } from '../../core/camera/Camera';
import { CANVAS_CONFIG } from '../../constants/canvas';
import { SceneGraph } from '../../core/scene/SceneGraph';
import { Renderer } from '../../core/engine/Renderer';
import { SelectTool } from '../../core/tools/SelectTool';

export const CanvasViewport: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef<Camera>(new Camera(window.innerWidth / 2, window.innerHeight / 2, 1));
  const sceneGraphRef = useRef<SceneGraph>(new SceneGraph());
  const selectToolRef = useRef<SelectTool>(new SelectTool());

  const isPanningRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const isSpacePressedRef = useRef(false);

  // Selected shapes state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectedIdsRef = useRef<Set<string>>(selectedIds);

  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  const [zoomPercent, setZoomPercent] = useState(100);

  // Add initial dummy shapes
  useEffect(() => {
    sceneGraphRef.current.addNode({
      id: 'rect-1',
      type: 'rectangle',
      x: -120,
      y: -80,
      width: 240,
      height: 160,
      fill: '#0d99ff',
      cornerRadius: 8,
    });

    sceneGraphRef.current.addNode({
      id: 'rect-2',
      type: 'rectangle',
      x: 180,
      y: -40,
      width: 140,
      height: 140,
      fill: '#ff5c5c',
      cornerRadius: 16,
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Render loop
    const render = () => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const dpr = window.devicePixelRatio || 1;
      ctx.scale(dpr, dpr);

      // Background
      ctx.fillStyle = CANVAS_CONFIG.BACKGROUND_COLOR;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      // Grid
      cameraRef.current.renderGrid(ctx, {
        width: window.innerWidth,
        height: window.innerHeight,
      });

      // World Objects & Selection
      ctx.save();
      cameraRef.current.applyTransform(ctx);
      Renderer.renderScene(
        ctx,
        sceneGraphRef.current.getAllNodes(),
        selectedIdsRef.current,
        cameraRef.current.getState().zoom
      );
      ctx.restore();

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Event Handlers
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const focalPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      cameraRef.current.handleWheel(e, focalPoint);
      setZoomPercent(Math.round(cameraRef.current.getState().zoom * 100));
    };

    const onMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const worldPoint = cameraRef.current.toWorld(screenPoint);

      // Pan with middle click or space + left click
      if (e.button === 1 || (e.button === 0 && isSpacePressedRef.current)) {
        isPanningRef.current = true;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      // Left click without space -> Select / Drag tool
      if (e.button === 0) {
        selectToolRef.current.onPointerDown(
          worldPoint,
          sceneGraphRef.current,
          selectedIdsRef.current,
          (newSelected) => {
            selectedIdsRef.current = newSelected;
            setSelectedIds(newSelected);
          }
        );
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const worldPoint = cameraRef.current.toWorld(screenPoint);

      if (isPanningRef.current) {
        const dx = e.clientX - lastMousePosRef.current.x;
        const dy = e.clientY - lastMousePosRef.current.y;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        cameraRef.current.pan(dx, dy);
        return;
      }

      // Drag shape
      selectToolRef.current.onPointerMove(worldPoint, sceneGraphRef.current);
    };

    const onMouseUp = () => {
      isPanningRef.current = false;
      selectToolRef.current.onPointerUp();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        isSpacePressedRef.current = true;
        canvas.style.cursor = 'grab';
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
        canvas.style.cursor = 'default';
      }
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          background: '#2b2b2b',
          color: '#fff',
          padding: '4px 10px',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '12px',
          userSelect: 'none',
        }}
      >
        {zoomPercent}%
      </div>
    </div>
  );
};