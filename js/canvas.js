// canvas.js — HTML5 Canvas engine: pan, zoom, grid, snap, rendering

const Canvas = {
    el: null,
    ctx: null,
    container: null,
    width: 0,
    height: 0,

    // View transform
    offsetX: 0,
    offsetY: 0,
    zoom: 1.0,
    minZoom: 0.1,
    maxZoom: 10,

    // Grid
    gridSize: 6,           // inches (snap unit)
    gridVisible: true,
    snapEnabled: true,
    angleSnap: 45,          // degrees
    angleSnapEnabled: true,

    // Guide lines
    guideLinesEnabled: true,
    mouseWorldX: 0,
    mouseWorldY: 0,

    // Pixels per inch at zoom 1.0 — controls how big things look
    ppi: 4,

    // Animation
    rafId: null,
    needsRedraw: true,

    init() {
        this.el = document.getElementById('draw-canvas');
        this.ctx = this.el.getContext('2d');
        this.container = document.getElementById('canvas-container');

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Center the view with some padding
        this.offsetX = this.width / 2;
        this.offsetY = this.height / 2;

        this.startRenderLoop();
    },

    resize() {
        const rect = this.container.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        const dpr = window.devicePixelRatio || 1;
        this.el.width = this.width * dpr;
        this.el.height = this.height * dpr;
        this.el.style.width = this.width + 'px';
        this.el.style.height = this.height + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.needsRedraw = true;
    },

    // ===== Coordinate Transforms =====

    screenToWorld(sx, sy) {
        return {
            x: (sx - this.offsetX) / (this.zoom * this.ppi),
            y: (sy - this.offsetY) / (this.zoom * this.ppi),
        };
    },

    worldToScreen(wx, wy) {
        return {
            x: wx * this.zoom * this.ppi + this.offsetX,
            y: wy * this.zoom * this.ppi + this.offsetY,
        };
    },

    // ===== Snap =====

    snapToGrid(val) {
        if (!this.snapEnabled) return val;
        return Math.round(val / this.gridSize) * this.gridSize;
    },

    snapPoint(x, y) {
        return {
            x: this.snapToGrid(x),
            y: this.snapToGrid(y),
        };
    },

    snapAngle(x1, y1, x2, y2) {
        if (!this.angleSnapEnabled) return { x: x2, y: y2 };
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.hypot(dx, dy);
        if (dist < 1) return { x: x2, y: y2 };
        const rawAngle = Math.atan2(dy, dx) * 180 / Math.PI;
        const snapped = Math.round(rawAngle / this.angleSnap) * this.angleSnap;
        const rad = snapped * Math.PI / 180;
        return {
            x: x1 + dist * Math.cos(rad),
            y: y1 + dist * Math.sin(rad),
        };
    },

    // ===== Pan & Zoom =====

    pan(dx, dy) {
        this.offsetX += dx;
        this.offsetY += dy;
        this.needsRedraw = true;
    },

    zoomAt(sx, sy, factor) {
        const oldZoom = this.zoom;
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * factor));
        const ratio = this.zoom / oldZoom;
        this.offsetX = sx - (sx - this.offsetX) * ratio;
        this.offsetY = sy - (sy - this.offsetY) * ratio;
        this.needsRedraw = true;
    },

    zoomToFit() {
        if (Drawing.elements.length === 0) {
            this.zoom = 1.0;
            this.offsetX = this.width / 2;
            this.offsetY = this.height / 2;
            this.needsRedraw = true;
            return;
        }
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        Drawing.elements.forEach(el => {
            const b = Drawing.getElementBounds(el);
            minX = Math.min(minX, b.x);
            minY = Math.min(minY, b.y);
            maxX = Math.max(maxX, b.x + b.w);
            maxY = Math.max(maxY, b.y + b.h);
        });
        const padding = 60;
        const contentW = (maxX - minX) * this.ppi;
        const contentH = (maxY - minY) * this.ppi;
        if (contentW <= 0 || contentH <= 0) return;
        this.zoom = Math.min(
            (this.width - padding * 2) / contentW,
            (this.height - padding * 2) / contentH,
            5
        );
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        this.offsetX = this.width / 2 - cx * this.zoom * this.ppi;
        this.offsetY = this.height / 2 - cy * this.zoom * this.ppi;
        this.needsRedraw = true;
    },

    resetZoom() {
        this.zoom = 1.0;
        this.offsetX = this.width / 2;
        this.offsetY = this.height / 2;
        this.needsRedraw = true;
    },

    // ===== Render Loop =====

    startRenderLoop() {
        const loop = () => {
            if (this.needsRedraw) {
                this.draw();
                this.needsRedraw = false;
            }
            this.rafId = requestAnimationFrame(loop);
        };
        loop();
    },

    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        // Clear
        ctx.fillStyle = '#2a2a3e';
        ctx.fillRect(0, 0, w, h);

        // Draw white canvas area (represents the drawing surface)
        this.drawCanvasSurface(ctx);

        // Grid
        if (this.gridVisible) {
            this.drawGrid(ctx);
        }

        // Guide lines at cursor
        if (this.guideLinesEnabled && Tools.activeTool !== 'select') {
            this.drawGuideLines(ctx);
        }

        // Draw all elements
        this.drawElements(ctx);

        // Draw tool preview (temp lines, selection box, etc.)
        if (Tools.drawPreview) {
            Tools.drawPreview(ctx);
        }
    },

    drawCanvasSurface(ctx) {
        // Large white rectangle representing the drawing area
        // 100 feet x 80 feet default
        const tl = this.worldToScreen(-600, -480);
        const br = this.worldToScreen(600, 480);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
        // Light border
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
    },

    drawGrid(ctx) {
        const scale = this.zoom * this.ppi;
        let gridWorld = this.gridSize;

        // Adaptive grid: show bigger increments when zoomed out
        const gridScreen = gridWorld * scale;
        if (gridScreen < 8) gridWorld *= 12;       // show feet lines
        else if (gridScreen < 4) gridWorld *= 24;
        const gridPx = gridWorld * scale;
        if (gridPx < 3) return; // too dense

        // Visible world bounds
        const topLeft = this.screenToWorld(0, 0);
        const botRight = this.screenToWorld(this.width, this.height);
        const startX = Math.floor(topLeft.x / gridWorld) * gridWorld;
        const startY = Math.floor(topLeft.y / gridWorld) * gridWorld;

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.07)';
        ctx.lineWidth = 0.5;

        for (let x = startX; x <= botRight.x; x += gridWorld) {
            const s = this.worldToScreen(x, 0);
            ctx.moveTo(s.x, 0);
            ctx.lineTo(s.x, this.height);
        }
        for (let y = startY; y <= botRight.y; y += gridWorld) {
            const s = this.worldToScreen(0, y);
            ctx.moveTo(0, s.y);
            ctx.lineTo(this.width, s.y);
        }
        ctx.stroke();

        // Major grid lines at every foot (12 inches)
        const majorGrid = 12;
        const majorPx = majorGrid * scale;
        if (majorPx >= 10) {
            const mStartX = Math.floor(topLeft.x / majorGrid) * majorGrid;
            const mStartY = Math.floor(topLeft.y / majorGrid) * majorGrid;
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
            ctx.lineWidth = 0.5;
            for (let x = mStartX; x <= botRight.x; x += majorGrid) {
                const s = this.worldToScreen(x, 0);
                ctx.moveTo(s.x, 0);
                ctx.lineTo(s.x, this.height);
            }
            for (let y = mStartY; y <= botRight.y; y += majorGrid) {
                const s = this.worldToScreen(0, y);
                ctx.moveTo(0, s.y);
                ctx.lineTo(this.width, s.y);
            }
            ctx.stroke();
        }

        // Origin crosshair
        const origin = this.worldToScreen(0, 0);
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(233, 69, 96, 0.3)';
        ctx.lineWidth = 1;
        ctx.moveTo(origin.x, 0);
        ctx.lineTo(origin.x, this.height);
        ctx.moveTo(0, origin.y);
        ctx.lineTo(this.width, origin.y);
        ctx.stroke();
    },

    drawGuideLines(ctx) {
        const s = this.worldToScreen(this.mouseWorldX, this.mouseWorldY);
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(233, 69, 96, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
        ctx.moveTo(s.x, 0);
        ctx.lineTo(s.x, this.height);
        ctx.moveTo(0, s.y);
        ctx.lineTo(this.width, s.y);
        ctx.stroke();
        ctx.setLineDash([]);
    },

    // ===== Element Rendering =====

    drawElements(ctx) {
        // Draw in order: freehand, rails, gates, posts, dimensions, labels, components
        const order = ['freehand', 'rail', 'gate', 'post', 'dimension', 'label', 'component'];
        order.forEach(type => {
            Drawing.elements.filter(e => e.type === type).forEach(el => {
                this.drawElement(ctx, el);
            });
        });
    },

    drawElement(ctx, el) {
        const selected = Drawing.isSelected(el.id);

        switch (el.type) {
            case 'post': this.drawPost(ctx, el, selected); break;
            case 'rail': this.drawRail(ctx, el, selected); break;
            case 'gate': this.drawGate(ctx, el, selected); break;
            case 'label': this.drawLabel(ctx, el, selected); break;
            case 'dimension': this.drawDimension(ctx, el, selected); break;
            case 'freehand': this.drawFreehand(ctx, el, selected); break;
            case 'component': this.drawComponent(ctx, el, selected); break;
        }
    },

    drawPost(ctx, el, selected) {
        const s = this.worldToScreen(el.x, el.y);
        const r = Math.max(el.size * 2 * this.zoom * this.ppi, 4);

        // Post fill
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);

        // Color by type
        const colors = {
            end: '#444444',
            corner: '#666666',
            line: '#888888',
            gate: '#cc4444',
        };
        ctx.fillStyle = colors[el.postType] || '#444444';
        ctx.fill();

        // Outline
        ctx.strokeStyle = selected ? '#e94560' : '#222222';
        ctx.lineWidth = selected ? 2.5 : 1.5;
        ctx.stroke();

        // Center dot
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Type indicator for corner/gate posts
        if (el.postType === 'corner') {
            ctx.beginPath();
            ctx.moveTo(s.x - r * 0.5, s.y - r * 0.5);
            ctx.lineTo(s.x + r * 0.5, s.y + r * 0.5);
            ctx.moveTo(s.x + r * 0.5, s.y - r * 0.5);
            ctx.lineTo(s.x - r * 0.5, s.y + r * 0.5);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Label
        if (el.showLabel && (el.label || el.postType)) {
            const labelText = el.label || (el.postType.charAt(0).toUpperCase() + el.postType.slice(1));
            ctx.fillStyle = selected ? '#e94560' : '#333333';
            ctx.font = `${Math.max(10, 11 * this.zoom)}px "Segoe UI", sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(labelText, s.x + el.labelOffset.x, s.y + el.labelOffset.y);
        }

        // Selection box
        if (selected) {
            ctx.strokeStyle = 'rgba(233, 69, 96, 0.4)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.strokeRect(s.x - r - 4, s.y - r - 4, (r + 4) * 2, (r + 4) * 2);
            ctx.setLineDash([]);
        }
    },

    drawRail(ctx, el, selected) {
        const s1 = this.worldToScreen(el.x1, el.y1);
        const s2 = this.worldToScreen(el.x2, el.y2);

        // Rail line
        ctx.beginPath();
        ctx.moveTo(s1.x, s1.y);
        ctx.lineTo(s2.x, s2.y);
        ctx.strokeStyle = selected ? '#e94560' : '#555555';
        ctx.lineWidth = Math.max(el.size * this.zoom * this.ppi * 0.8, 2);
        ctx.lineCap = 'round';
        ctx.stroke();

        // Rail type dash pattern for mid/bottom rails
        if (el.railType === 'mid') {
            ctx.beginPath();
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(s2.x, s2.y);
            ctx.strokeStyle = '#888888';
            ctx.lineWidth = 1;
            ctx.setLineDash([8, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Selection highlight
        if (selected) {
            ctx.beginPath();
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(s2.x, s2.y);
            ctx.strokeStyle = 'rgba(233, 69, 96, 0.3)';
            ctx.lineWidth = Math.max(el.size * this.zoom * this.ppi * 0.8, 2) + 6;
            ctx.stroke();
        }
    },

    drawGate(ctx, el, selected) {
        const s = this.worldToScreen(el.x, el.y);
        const halfW = el.width * 0.5 * this.zoom * this.ppi;
        const gateH = 8 * this.zoom * this.ppi;
        // Frame line width scales with pipe size
        const frameLW = Math.max(2, (el.frameSize || 1.625) * this.zoom * this.ppi * 0.5);

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(el.angle * Math.PI / 180);

        // Gate frame
        ctx.strokeStyle = selected ? '#e94560' : '#cc4444';
        ctx.lineWidth = frameLW;
        ctx.strokeRect(-halfW, -gateH / 2, halfW * 2, gateH);

        // Diagonal bracing (X pattern) or mesh fill
        if (el.braced) {
            ctx.beginPath();
            ctx.moveTo(-halfW, -gateH / 2);
            ctx.lineTo(halfW, gateH / 2);
            ctx.moveTo(halfW, -gateH / 2);
            ctx.lineTo(-halfW, gateH / 2);
            ctx.strokeStyle = selected ? '#e94560' : 'rgba(204, 68, 68, 0.7)';
            ctx.lineWidth = Math.max(1.5, frameLW * 0.6);
            ctx.stroke();
        } else {
            // No bracing — show chain link fill pattern
            ctx.fillStyle = 'rgba(204, 68, 68, 0.08)';
            ctx.fillRect(-halfW, -gateH / 2, halfW * 2, gateH);
        }

        // Hinge indicators (small filled circles on hinge side)
        const hingeX = (el.hingeSide === 'right') ? halfW : -halfW;
        const hingeR = Math.max(3, frameLW * 0.8);
        ctx.beginPath();
        ctx.arc(hingeX, -gateH / 2 + hingeR + 2, hingeR, 0, Math.PI * 2);
        ctx.arc(hingeX, gateH / 2 - hingeR - 2, hingeR, 0, Math.PI * 2);
        ctx.fillStyle = selected ? '#e94560' : '#cc4444';
        ctx.fill();

        // Swing arc (from hinge side)
        if (el.gateType === 'swing' || el.gateType === 'double-swing') {
            const arcDir = el.swingDir === 'in' ? -1 : 1;
            const arcHinge = (el.hingeSide === 'right') ? halfW : -halfW;
            const arcRadius = halfW * 2;

            ctx.beginPath();
            ctx.setLineDash([4, 3]);
            if (el.hingeSide === 'right') {
                ctx.arc(arcHinge, 0, arcRadius, Math.PI, Math.PI - arcDir * Math.PI / 4, arcDir > 0);
            } else {
                ctx.arc(arcHinge, 0, arcRadius, 0, arcDir * Math.PI / 4, arcDir < 0);
            }
            ctx.strokeStyle = 'rgba(204, 68, 68, 0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.setLineDash([]);

            if (el.gateType === 'double-swing') {
                const otherHinge = -arcHinge;
                ctx.beginPath();
                ctx.setLineDash([4, 3]);
                if (el.hingeSide === 'right') {
                    ctx.arc(otherHinge, 0, arcRadius, 0, arcDir * Math.PI / 4, arcDir < 0);
                } else {
                    ctx.arc(otherHinge, 0, arcRadius, Math.PI, Math.PI - arcDir * Math.PI / 4, arcDir > 0);
                }
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        // Slide / cantilever indicator
        if (el.gateType === 'slide' || el.gateType === 'cantilever') {
            // Track line
            ctx.beginPath();
            ctx.moveTo(halfW, gateH / 2 + 4);
            ctx.lineTo(halfW + halfW * 0.8, gateH / 2 + 4);
            ctx.strokeStyle = 'rgba(204, 68, 68, 0.5)';
            ctx.setLineDash([3, 3]);
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.setLineDash([]);
            // Arrow
            ctx.beginPath();
            ctx.moveTo(halfW + halfW * 0.8, gateH / 2 + 4);
            ctx.lineTo(halfW + halfW * 0.7, gateH / 2);
            ctx.lineTo(halfW + halfW * 0.7, gateH / 2 + 8);
            ctx.closePath();
            ctx.fillStyle = 'rgba(204, 68, 68, 0.5)';
            ctx.fill();

            // Cantilever counterbalance line
            if (el.gateType === 'cantilever') {
                ctx.beginPath();
                ctx.moveTo(-halfW, gateH / 2 + 4);
                ctx.lineTo(-halfW - halfW * 0.5, gateH / 2 + 4);
                ctx.strokeStyle = 'rgba(204, 68, 68, 0.3)';
                ctx.setLineDash([2, 3]);
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.setLineDash([]);
                // "CB" label for counterbalance
                ctx.fillStyle = 'rgba(204, 68, 68, 0.5)';
                ctx.font = `${Math.max(8, 9 * this.zoom)}px "Segoe UI", sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText('CB', -halfW - halfW * 0.25, gateH / 2 + 14);
            }

            // Roller wheels
            const wheelR = Math.max(3, 4 * this.zoom);
            ctx.beginPath();
            ctx.arc(-halfW + wheelR * 2, gateH / 2 + 4, wheelR, 0, Math.PI * 2);
            ctx.arc(halfW - wheelR * 2, gateH / 2 + 4, wheelR, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(204, 68, 68, 0.6)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.restore();

        // Label
        if (el.showLabel) {
            const labelText = el.label || `${Drawing.formatDimension(el.width)} ${el.gateType}`;
            ctx.fillStyle = selected ? '#e94560' : '#cc4444';
            ctx.font = `${Math.max(10, 11 * this.zoom)}px "Segoe UI", sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(labelText, s.x, s.y + el.labelOffset.y);
        }

        // Selection box
        if (selected) {
            ctx.strokeStyle = 'rgba(233, 69, 96, 0.4)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.strokeRect(s.x - halfW - 4, s.y - gateH / 2 - 4, halfW * 2 + 8, gateH + 8);
            ctx.setLineDash([]);
        }
    },

    drawLabel(ctx, el, selected) {
        const s = this.worldToScreen(el.x, el.y);
        const fontSize = Math.max(10, el.fontSize * this.zoom);

        ctx.font = `${fontSize}px "Segoe UI", sans-serif`;
        ctx.fillStyle = selected ? '#e94560' : '#333333';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(el.text, s.x, s.y);

        if (selected) {
            const metrics = ctx.measureText(el.text);
            ctx.strokeStyle = 'rgba(233, 69, 96, 0.4)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.strokeRect(s.x - 2, s.y - fontSize - 2, metrics.width + 4, fontSize + 4);
            ctx.setLineDash([]);
        }
    },

    drawDimension(ctx, el, selected) {
        const s1 = this.worldToScreen(el.x1, el.y1);
        const s2 = this.worldToScreen(el.x2, el.y2);

        // Dimension line
        const dist = Drawing.calcDistance(el.x1, el.y1, el.x2, el.y2);
        const text = el.text || Drawing.formatDimension(dist);

        // Perpendicular offset direction
        const dx = el.x2 - el.x1;
        const dy = el.y2 - el.y1;
        const len = Math.hypot(dx, dy);
        if (len === 0) return;
        const nx = -dy / len * el.offset * this.zoom;
        const ny = dx / len * el.offset * this.zoom;

        const ds1 = { x: s1.x + nx, y: s1.y + ny };
        const ds2 = { x: s2.x + nx, y: s2.y + ny };

        // Extension lines
        ctx.beginPath();
        ctx.strokeStyle = selected ? '#e94560' : '#0066cc';
        ctx.lineWidth = 1;
        ctx.moveTo(s1.x, s1.y);
        ctx.lineTo(ds1.x, ds1.y);
        ctx.moveTo(s2.x, s2.y);
        ctx.lineTo(ds2.x, ds2.y);
        ctx.stroke();

        // Dimension line
        ctx.beginPath();
        ctx.moveTo(ds1.x, ds1.y);
        ctx.lineTo(ds2.x, ds2.y);
        ctx.stroke();

        // Arrows
        const arrowSize = 8;
        const angle = Math.atan2(ds2.y - ds1.y, ds2.x - ds1.x);
        this.drawArrowHead(ctx, ds1.x, ds1.y, angle, arrowSize);
        this.drawArrowHead(ctx, ds2.x, ds2.y, angle + Math.PI, arrowSize);

        // Text
        const midX = (ds1.x + ds2.x) / 2;
        const midY = (ds1.y + ds2.y) / 2;
        ctx.fillStyle = selected ? '#e94560' : '#0066cc';
        ctx.font = `bold ${Math.max(10, 12 * this.zoom)}px "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(text, midX, midY - 4);
    },

    drawArrowHead(ctx, x, y, angle, size) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - size * Math.cos(angle - 0.4), y - size * Math.sin(angle - 0.4));
        ctx.moveTo(x, y);
        ctx.lineTo(x - size * Math.cos(angle + 0.4), y - size * Math.sin(angle + 0.4));
        ctx.stroke();
    },

    drawFreehand(ctx, el, selected) {
        if (el.points.length < 2) return;
        ctx.beginPath();
        const s0 = this.worldToScreen(el.points[0].x, el.points[0].y);
        ctx.moveTo(s0.x, s0.y);
        for (let i = 1; i < el.points.length; i++) {
            const s = this.worldToScreen(el.points[i].x, el.points[i].y);
            ctx.lineTo(s.x, s.y);
        }
        ctx.strokeStyle = selected ? '#e94560' : (el.color || '#333333');
        ctx.lineWidth = Math.max(el.width * this.zoom, 1);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    },

    drawComponent(ctx, el, selected) {
        const s = this.worldToScreen(el.x, el.y);
        const size = 10 * this.zoom * this.ppi;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(el.angle * Math.PI / 180);

        // Diamond shape for components
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size, 0);
        ctx.closePath();
        ctx.fillStyle = selected ? 'rgba(233, 69, 96, 0.2)' : 'rgba(0, 102, 204, 0.15)';
        ctx.fill();
        ctx.strokeStyle = selected ? '#e94560' : '#0066cc';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Component icon (small circle)
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = selected ? '#e94560' : '#0066cc';
        ctx.fill();

        ctx.restore();

        // Label
        if (el.showLabel && el.label) {
            ctx.fillStyle = selected ? '#e94560' : '#0066cc';
            ctx.font = `${Math.max(9, 10 * this.zoom)}px "Segoe UI", sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(el.label, s.x, s.y + el.labelOffset.y);
        }
    },
};
