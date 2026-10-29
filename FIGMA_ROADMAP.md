# Figma Feature Parity Roadmap for Cresco

This document outlines the core architecture and feature requirements needed to transition Cresco from its current canvas prototype into a full-featured collaborative design tool like Figma.

---

## 1. Canvas & Vector Engine (Core Graphics)

- [ ] **Transforms & Rotation**
  - Arbitrary rotation angle (`rotation` in degrees/radians) for any shape, frame, or text.
  - Interactive rotation handles on selection bounding box corners.
  - Affine transformation matrices for accurate child-to-parent spatial rendering and hit testing.
- [ ] **Advanced Vector Networks**
  - Branching paths (multiple edges connecting to a single vertex, beyond simple sequential anchor chains).
  - Vertex-level corner smoothing / individual corner radius.
  - Bend tool support with symmetric, mirrored, and disconnected bezier handles.
- [ ] **Boolean Operations**
  - Non-destructive and destructible path combinations: Union, Subtract, Intersect, and Exclude.
- [ ] **Advanced Fills, Strokes & Effects**
  - **Fills**: Solid colors, Linear, Radial, Angular, and Diamond gradients; Image & video fills (crop, tile, fit, fill).
  - **Multiple Fills & Strokes**: Stackable layer styling with per-fill opacity and visibility toggle.
  - **Stroke Options**: Inside, Center, and Outside alignment; Dash patterns, custom cap styles (round, square), and miter limits.
  - **Blend Modes & Opacity**: Layer blend modes (Multiply, Screen, Overlay, Soft Light, etc.) with overall and per-fill opacity.
  - **Effects**: Drop shadow, Inner shadow, Layer blur, and Background blur (frosted glass).
- [ ] **Smart Guides & Snapping**
  - Dynamic red alignment guides (edge-to-edge, center-to-center).
  - Equal spacing indicators and automatic snap-to-distance.
  - Pixel grid snapping and zoom-adaptive subpixel alignment.

---

## 2. Layout, Framing & Hierarchy

- [ ] **Responsive Constraints**
  - Pinning layers relative to parent frames: Left, Right, Left & Right, Center, Scale, Top, Bottom, Top & Bottom.
- [ ] **Nested Hierarchy & Canvas Parenting**
  - Deep nested container hierarchy with drag-and-drop layer reparenting into frames.
  - Frame clipping (`clipContent: boolean`) with independent coordinate spaces.
- [ ] **Multi-Selection & Alignment Tools**
  - Marquee drag selection and `Shift + Click` multi-select.
  - Alignment actions: Align Left, Horizontal Center, Right, Top, Vertical Center, Bottom.
  - Distribution actions: Distribute Horizontal Spacing, Distribute Vertical Spacing, and Tidy Up / Grid packing.

---

## 3. Components, Design Systems & Styles

- [ ] **Reusable Components & Instances**
  - Main Component (`Master Component`) definition.
  - Component instances with granular property overrides (text strings, colors, visibility, nested swap).
  - Reset overrides / Detach instance actions.
- [ ] **Component Variants & Component Properties**
  - Variant sets with configurable state properties (e.g., `State=Default | Hover | Disabled`, `Size=Sm | Md | Lg`).
  - Boolean visibility props, text replacement props, and instance swap props.
- [ ] **Design Tokens & Shared Styles**
  - Reusable color styles, typography presets, effect styles, and grid styles.
  - Centralized palette linked across elements in the document.

---

## 4. Interactive Prototyping

- [ ] **Interaction Triggers & Actions**
  - Triggers: On Click, While Hovering, While Pressing, Key/Gamepad, Mouse Enter/Leave, After Delay.
  - Actions: Navigate to frame, Open overlay, Scroll to, Close overlay, Back.
- [ ] **Animations & Smart Animate**
  - Instant, Dissolve, Slide In/Out, Push, Move In/Out.
  - Smart Animate: Automatically matches layer IDs/names across frames and interpolates positions, dimensions, rotation, and colors.
  - Custom easing curves (Linear, Ease-in, Ease-out, Ease-in-out, Cubic Bezier).
- [ ] **Presentation & Device Mockups**
  - Fullscreen interactive player mode.
  - Device frames (iPhone, Android, MacBook, Desktop, Custom).

---

## 5. Multiplayer Collaboration & Cloud Infrastructure

- [ ] **Real-time Multiplayer Collaboration**
  - Real-time cursors with user names and chat bubbles.
  - Conflict-free collaborative state synchronization using CRDTs (e.g., Yjs) or Operational Transformation (OT) over WebSockets.
- [ ] **Canvas Comments & Annotation**
  - Pin comment pins directly to coordinates or attach to specific frames/nodes.
  - Mention teammates, markdown support, thread resolution, and notifications.
- [ ] **Version History & Branching**
  - Autosave history checkpoints and named milestones.
  - Branching, review requests, and merging changes into main files.

---

## 6. Developer Handoff, Inspection & Export

- [ ] **Multi-Format Export Engine**
  - Export selected nodes, frames, or custom slices.
  - Formats: PNG, JPG, SVG, and PDF.
  - Scale multipliers: `@0.5x`, `@1x`, `@2x`, `@3x`, `@4x` with custom suffixes.
- [ ] **Dev Mode & Code Generation**
  - `Alt / Option + Hover` measurement tool showing pixel distance between selected element and hovered target.
  - CSS, Tailwind, Swift, and Jetpack Compose code snippets for layout, typography, colors, and shadows.
  - Asset downloading and SVG symbol copying.

---

## Suggested Implementation Phases

| Phase | Focus Areas | Key Deliverables |
| :--- | :--- | :--- |
| **Phase 1: Polish Fundamentals** | Multi-select & Canvas Control | Marquee multi-select, rotation handles, smart alignment guides, export to PNG/SVG. |
| **Phase 2: Modern Layout** | Framing & Constraints | Frame clipping, responsive frame constraints, canvas reparenting. |
| **Phase 3: Design Systems** | Components & Styles | Master components, instance overrides, variant sets, shared color/typography styles. |
| **Phase 4: Prototyping** | Interactions & Preview | Interaction links, transition animations, Smart Animate, device presentation viewer. |
| **Phase 5: Collaboration** | Multiplayer & Dev Mode | CRDT multiplayer sync (Yjs/WebSockets), live cursors, comments, Alt-hover measurement tool. |

