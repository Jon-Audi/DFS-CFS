// tools.js — Drawing tools: post, rail, gate, fence run, measure, label, freehand, eraser

const Tools = {
    activeTool: 'select',
    drawPreview: null,

    // Interaction state
    isDragging: false,
    isPanning: false,
    dragStartX: 0,
    dragStartY: 0,
    dragStartWorldX: 0,
    dragStartWorldY: 0,
    lastMouseX: 0,
    lastMouseY: 0,

    // Tool-specific state
    railStartPost: null,    // post element for rail start
    fenceRunStart: null,    // {x, y} for fence run start point
    freehandPoints: [],     // points being drawn
    measureStart: null,     // {x, y} for measure start

    // Selection drag
    selectionDragStart: null,  // world coords when drag started
    isMovingSelection: false,
    hasMoved: false,
    moveAccumX: 0,             // accumulated sub-grid movement
    moveAccumY: 0,

    setTool(tool) {
        this.activeTool = tool;
        this.resetState();
        this.updateToolOptions();
        this.updateUI();
        Canvas.needsRedraw = true;
    },

    resetState() {
        this.isDragging = false;
        this.railStartPost = null;
        this.fenceRunStart = null;
        this.freehandPoints = [];
        this.measureStart = null;
        this.drawPreview = null;
        this.isMovingSelection = false;
        this.hasMoved = false;
    },

    updateToolOptions() {
        // Hide all option bars
        document.querySelectorAll('.tool-options').forEach(el => el.style.display = 'none');
        // Show relevant one
        const optMap = {
            post: 'post-options',
            rail: 'rail-options',
            gate: 'gate-options',
            fencerun: 'fencerun-options',
        };
        if (optMap[this.activeTool]) {
            document.getElementById(optMap[this.activeTool]).style.display = 'flex';
        }
    },

    updateUI() {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === this.activeTool);
        });
        document.getElementById('status-tool').textContent = `Tool: ${this.activeTool.charAt(0).toUpperCase() + this.activeTool.slice(1)}`;
        document.getElementById('canvas-container').dataset.tool = this.activeTool;
    },

    // ===== Mouse Handlers =====

    onMouseDown(e) {
        const rect = Canvas.container.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const world = Canvas.screenToWorld(sx, sy);
        const snapped = Canvas.snapPoint(world.x, world.y);

        this.lastMouseX = sx;
        this.lastMouseY = sy;

        // Middle mouse = pan
        if (e.button === 1) {
            this.isPanning = true;
            this.dragStartX = sx;
            this.dragStartY = sy;
            e.preventDefault();
            return;
        }

        // Right click = cancel current operation
        if (e.button === 2) {
            this.resetState();
            Canvas.needsRedraw = true;
            return;
        }

        // Left click tool actions
        switch (this.activeTool) {
            case 'select':
                this.handleSelectDown(sx, sy, world, e);
                break;
            case 'post':
                this.handlePostDown(snapped);
                break;
            case 'rail':
                this.handleRailDown(world, snapped);
                break;
            case 'gate':
                this.handleGateDown(snapped);
                break;
            case 'fencerun':
                this.handleFenceRunDown(snapped);
                break;
            case 'measure':
                this.handleMeasureDown(snapped);
                break;
            case 'label':
                this.handleLabelDown(snapped);
                break;
            case 'freehand':
                this.handleFreehandDown(world);
                break;
            case 'eraser':
                this.handleEraserDown(world);
                break;
        }
    },

    onMouseMove(e) {
        const rect = Canvas.container.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const world = Canvas.screenToWorld(sx, sy);
        const snapped = Canvas.snapPoint(world.x, world.y);

        Canvas.mouseWorldX = snapped.x;
        Canvas.mouseWorldY = snapped.y;

        // Update status bar
        document.getElementById('status-coords').textContent =
            `X: ${Drawing.formatDimension(snapped.x)}  Y: ${Drawing.formatDimension(snapped.y)}`;
        document.getElementById('status-zoom').textContent =
            `Zoom: ${Math.round(Canvas.zoom * 100)}%`;
        document.getElementById('status-elements').textContent =
            `Elements: ${Drawing.elements.length}`;

        // Panning
        if (this.isPanning) {
            Canvas.pan(sx - this.lastMouseX, sy - this.lastMouseY);
            this.lastMouseX = sx;
            this.lastMouseY = sy;
            return;
        }

        // Tool-specific move
        switch (this.activeTool) {
            case 'select':
                this.handleSelectMove(sx, sy, world, e);
                break;
            case 'rail':
                this.handleRailMove(snapped);
                break;
            case 'fencerun':
                this.handleFenceRunMove(snapped);
                break;
            case 'measure':
                this.handleMeasureMove(snapped);
                break;
            case 'freehand':
                this.handleFreehandMove(world);
                break;
            case 'eraser':
                this.handleEraserMove(world);
                break;
        }

        this.lastMouseX = sx;
        this.lastMouseY = sy;
        Canvas.needsRedraw = true;
    },

    onMouseUp(e) {
        const rect = Canvas.container.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const world = Canvas.screenToWorld(sx, sy);

        if (this.isPanning) {
            this.isPanning = false;
            return;
        }

        switch (this.activeTool) {
            case 'select':
                this.handleSelectUp(sx, sy, world, e);
                break;
            case 'freehand':
                this.handleFreehandUp();
                break;
        }

        Canvas.needsRedraw = true;
    },

    onWheel(e) {
        e.preventDefault();
        const rect = Canvas.container.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        Canvas.zoomAt(sx, sy, factor);
    },

    // ===== SELECT TOOL =====

    handleSelectDown(sx, sy, world, e) {
        const hit = Drawing.hitTest(world.x, world.y, 10 / (Canvas.zoom * Canvas.ppi));
        if (hit) {
            if (!Drawing.isSelected(hit.id)) {
                Drawing.select(hit.id, e.shiftKey);
            }
            this.isMovingSelection = true;
            this.hasMoved = false;
            this.moveAccumX = 0;
            this.moveAccumY = 0;
            this.selectionDragStart = { x: world.x, y: world.y };
            Drawing.pushUndo();
        } else {
            if (!e.shiftKey) Drawing.deselectAll();
            this.isDragging = true;
            this.dragStartWorldX = world.x;
            this.dragStartWorldY = world.y;
        }
        Canvas.needsRedraw = true;
    },

    handleSelectMove(sx, sy, world, e) {
        if (this.isMovingSelection && this.selectionDragStart) {
            const rawDx = world.x - this.selectionDragStart.x;
            const rawDy = world.y - this.selectionDragStart.y;
            this.moveAccumX += rawDx;
            this.moveAccumY += rawDy;
            this.selectionDragStart = { x: world.x, y: world.y };

            // Snap accumulated movement to grid for clean placement
            let dx, dy;
            if (Canvas.snapEnabled) {
                const grid = Canvas.gridSize;
                dx = Math.round(this.moveAccumX / grid) * grid;
                dy = Math.round(this.moveAccumY / grid) * grid;
                if (dx !== 0 || dy !== 0) {
                    this.moveAccumX -= dx;
                    this.moveAccumY -= dy;
                } else {
                    dx = 0;
                    dy = 0;
                }
            } else {
                dx = this.moveAccumX;
                dy = this.moveAccumY;
                this.moveAccumX = 0;
                this.moveAccumY = 0;
            }

            if (dx !== 0 || dy !== 0) {
                this.hasMoved = true;
                Drawing.moveSelected(dx, dy);
            }
        }

        // Hover cursor for select tool
        if (!this.isMovingSelection && !this.isDragging) {
            const hit = Drawing.hitTest(world.x, world.y, 10 / (Canvas.zoom * Canvas.ppi));
            Canvas.container.style.cursor = hit ? 'move' : 'default';
        } else if (this.isMovingSelection) {
            Canvas.container.style.cursor = 'grabbing';
        }

        if (this.isDragging) {
            // Draw selection rectangle
            const startX = this.dragStartWorldX;
            const startY = this.dragStartWorldY;
            Canvas.container.style.cursor = 'crosshair';
            this.drawPreview = (ctx) => {
                const s1 = Canvas.worldToScreen(startX, startY);
                const s2 = Canvas.worldToScreen(world.x, world.y);
                ctx.strokeStyle = 'rgba(233, 69, 96, 0.6)';
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.strokeRect(s1.x, s1.y, s2.x - s1.x, s2.y - s1.y);
                ctx.fillStyle = 'rgba(233, 69, 96, 0.05)';
                ctx.fillRect(s1.x, s1.y, s2.x - s1.x, s2.y - s1.y);
                ctx.setLineDash([]);
            };
        }
    },

    handleSelectUp(sx, sy, world, e) {
        if (this.isMovingSelection) {
            if (!this.hasMoved) {
                // It was a click, not a drag — re-evaluate selection
                const hit = Drawing.hitTest(world.x, world.y, 10 / (Canvas.zoom * Canvas.ppi));
                if (hit) {
                    Drawing.select(hit.id, e.shiftKey);
                }
                // Remove the undo entry we pushed in mousedown since nothing changed
                Drawing.undoStack.pop();
            }
            this.isMovingSelection = false;
            this.selectionDragStart = null;
            Canvas.container.style.cursor = 'default';
        }

        if (this.isDragging) {
            Drawing.selectInRect(
                this.dragStartWorldX, this.dragStartWorldY,
                world.x, world.y
            );
            this.isDragging = false;
            this.drawPreview = null;
            Canvas.container.style.cursor = 'default';
        }

        // Update properties panel
        App.updatePropertiesPanel();
    },

    // ===== POST TOOL =====

    handlePostDown(snapped) {
        const postType = document.getElementById('post-type').value;
        const postSize = parseFloat(document.getElementById('post-size').value);
        const el = Drawing.createPost(snapped.x, snapped.y, {
            postType,
            size: postSize,
        });
        Drawing.addElement(el);
        Canvas.needsRedraw = true;
    },

    // ===== RAIL TOOL =====

    handleRailDown(world, snapped) {
        const nearPost = Drawing.findNearestPost(world.x, world.y, 15 / (Canvas.zoom * Canvas.ppi));

        if (!this.railStartPost) {
            // First click: set start
            this.railStartPost = nearPost || { id: null, x: snapped.x, y: snapped.y };
        } else {
            // Second click: create rail
            const startX = this.railStartPost.x;
            const startY = this.railStartPost.y;
            const endPost = nearPost || { id: null, x: snapped.x, y: snapped.y };

            const railType = document.getElementById('rail-type').value;
            const railSize = parseFloat(document.getElementById('rail-size').value);

            const el = Drawing.createRail(startX, startY, endPost.x, endPost.y, {
                railType,
                size: railSize,
                postStartId: this.railStartPost.id || null,
                postEndId: endPost.id || null,
            });
            Drawing.addElement(el);
            // Auto-add dimension
            const dim = Drawing.createDimension(startX, startY, endPost.x, endPost.y, { offset: 15 });
            Drawing.addElement(dim);

            this.railStartPost = null;
            this.drawPreview = null;
        }
        Canvas.needsRedraw = true;
    },

    handleRailMove(snapped) {
        if (!this.railStartPost) return;
        const startX = this.railStartPost.x;
        const startY = this.railStartPost.y;

        this.drawPreview = (ctx) => {
            const s1 = Canvas.worldToScreen(startX, startY);

            // Angle snap from start to cursor
            const angleSnapped = Canvas.snapAngle(startX, startY, snapped.x, snapped.y);
            const s2 = Canvas.worldToScreen(angleSnapped.x, angleSnapped.y);

            ctx.beginPath();
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(s2.x, s2.y);
            ctx.strokeStyle = 'rgba(85, 85, 85, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Show distance
            const dist = Drawing.calcDistance(startX, startY, angleSnapped.x, angleSnapped.y);
            const midX = (s1.x + s2.x) / 2;
            const midY = (s1.y + s2.y) / 2;
            ctx.fillStyle = '#0066cc';
            ctx.font = 'bold 12px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(Drawing.formatDimension(dist), midX, midY - 10);
        };
    },

    // ===== GATE TOOL =====

    handleGateDown(snapped) {
        const gateType = document.getElementById('gate-type').value;
        const gateWidth = parseInt(document.getElementById('gate-width').value);
        const swingDir = document.getElementById('gate-swing').value;
        const frameSize = parseFloat(document.getElementById('gate-frame-size').value);
        const braced = document.getElementById('gate-braced').checked;
        const hingeSide = document.getElementById('gate-hinge-side').value;

        const el = Drawing.createGate(snapped.x, snapped.y, {
            gateType,
            width: gateWidth,
            swingDir,
            frameSize,
            braced,
            hingeSide,
        });
        Drawing.addElement(el);
        Canvas.needsRedraw = true;
    },

    // ===== FENCE RUN TOOL =====

    handleFenceRunDown(snapped) {
        if (!this.fenceRunStart) {
            this.fenceRunStart = { x: snapped.x, y: snapped.y };
        } else {
            this.createFenceRun(this.fenceRunStart, snapped);
            this.fenceRunStart = null;
            this.drawPreview = null;
        }
        Canvas.needsRedraw = true;
    },

    handleFenceRunMove(snapped) {
        if (!this.fenceRunStart) return;
        const start = this.fenceRunStart;

        this.drawPreview = (ctx) => {
            const angleSnapped = Canvas.snapAngle(start.x, start.y, snapped.x, snapped.y);
            const s1 = Canvas.worldToScreen(start.x, start.y);
            const s2 = Canvas.worldToScreen(angleSnapped.x, angleSnapped.y);

            // Preview line
            ctx.beginPath();
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(s2.x, s2.y);
            ctx.strokeStyle = 'rgba(78, 204, 163, 0.5)';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Post placement preview
            const dist = Drawing.calcDistance(start.x, start.y, angleSnapped.x, angleSnapped.y);
            const spacing = parseInt(document.getElementById('fencerun-spacing').value);
            const numSections = Math.max(1, Math.round(dist / spacing));
            const dx = (angleSnapped.x - start.x) / numSections;
            const dy = (angleSnapped.y - start.y) / numSections;

            for (let i = 0; i <= numSections; i++) {
                const px = start.x + dx * i;
                const py = start.y + dy * i;
                const ps = Canvas.worldToScreen(px, py);
                ctx.beginPath();
                ctx.arc(ps.x, ps.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(78, 204, 163, 0.6)';
                ctx.fill();
            }

            // Distance label
            const midX = (s1.x + s2.x) / 2;
            const midY = (s1.y + s2.y) / 2;
            ctx.fillStyle = '#4ecca3';
            ctx.font = 'bold 12px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${Drawing.formatDimension(dist)} (${numSections} sections)`, midX, midY - 14);
        };
    },

    createFenceRun(start, end) {
        const angleSnapped = Canvas.snapAngle(start.x, start.y, end.x, end.y);
        const endX = angleSnapped.x;
        const endY = angleSnapped.y;

        const spacing = parseInt(document.getElementById('fencerun-spacing').value);
        const height = parseInt(document.getElementById('fence-height').value);
        const railCount = parseInt(document.getElementById('fence-rails').value);
        const material = document.getElementById('fence-material').value;

        const dist = Drawing.calcDistance(start.x, start.y, endX, endY);
        const numSections = Math.max(1, Math.round(dist / spacing));
        const dx = (endX - start.x) / numSections;
        const dy = (endY - start.y) / numSections;

        Drawing.pushUndo();

        // Create posts
        const posts = [];
        for (let i = 0; i <= numSections; i++) {
            const px = start.x + dx * i;
            const py = start.y + dy * i;
            const postType = (i === 0 || i === numSections) ? 'end' : 'line';
            const post = Drawing.createPost(px, py, {
                postType,
                size: 2.375,
                height,
                material,
            });
            Drawing.elements.push(post);
            posts.push(post);
        }

        // Create rails between posts
        for (let i = 0; i < posts.length - 1; i++) {
            const railTypes = ['top'];
            if (railCount >= 2) railTypes.push('bottom');
            if (railCount >= 3) railTypes.push('mid');

            railTypes.forEach(rt => {
                const rail = Drawing.createRail(
                    posts[i].x, posts[i].y,
                    posts[i + 1].x, posts[i + 1].y,
                    {
                        railType: rt,
                        size: 1.625,
                        postStartId: posts[i].id,
                        postEndId: posts[i + 1].id,
                        material,
                    }
                );
                Drawing.elements.push(rail);
            });
        }

        // Overall dimension
        const dim = Drawing.createDimension(start.x, start.y, endX, endY, { offset: 20 });
        Drawing.elements.push(dim);
    },

    // ===== MEASURE TOOL =====

    handleMeasureDown(snapped) {
        if (!this.measureStart) {
            this.measureStart = { x: snapped.x, y: snapped.y };
        } else {
            // Create permanent dimension
            const dim = Drawing.createDimension(
                this.measureStart.x, this.measureStart.y,
                snapped.x, snapped.y,
                { offset: 15 }
            );
            Drawing.addElement(dim);
            this.measureStart = null;
            this.drawPreview = null;
        }
        Canvas.needsRedraw = true;
    },

    handleMeasureMove(snapped) {
        if (!this.measureStart) return;
        const start = this.measureStart;

        this.drawPreview = (ctx) => {
            const s1 = Canvas.worldToScreen(start.x, start.y);
            const s2 = Canvas.worldToScreen(snapped.x, snapped.y);

            // Measurement line
            ctx.beginPath();
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(s2.x, s2.y);
            ctx.strokeStyle = '#0066cc';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 3]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Distance text
            const dist = Drawing.calcDistance(start.x, start.y, snapped.x, snapped.y);
            const midX = (s1.x + s2.x) / 2;
            const midY = (s1.y + s2.y) / 2;

            // Background for text
            const text = Drawing.formatDimension(dist);
            ctx.font = 'bold 13px "Segoe UI", sans-serif';
            const tw = ctx.measureText(text).width;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(midX - tw / 2 - 6, midY - 20, tw + 12, 22);
            ctx.fillStyle = '#4ecca3';
            ctx.textAlign = 'center';
            ctx.fillText(text, midX, midY - 4);
        };
    },

    // ===== LABEL TOOL =====

    handleLabelDown(snapped) {
        const dialog = document.getElementById('label-dialog');
        const input = document.getElementById('label-text');
        input.value = '';
        dialog.style.display = 'flex';
        input.focus();

        const ok = () => {
            const text = input.value.trim();
            if (text) {
                const el = Drawing.createLabel(snapped.x, snapped.y, text);
                Drawing.addElement(el);
            }
            dialog.style.display = 'none';
            cleanup();
            Canvas.needsRedraw = true;
        };

        const cancel = () => {
            dialog.style.display = 'none';
            cleanup();
        };

        const keyHandler = (e) => {
            if (e.key === 'Enter') ok();
            if (e.key === 'Escape') cancel();
        };

        const cleanup = () => {
            document.getElementById('label-ok').removeEventListener('click', ok);
            document.getElementById('label-cancel').removeEventListener('click', cancel);
            input.removeEventListener('keydown', keyHandler);
        };

        document.getElementById('label-ok').addEventListener('click', ok);
        document.getElementById('label-cancel').addEventListener('click', cancel);
        input.addEventListener('keydown', keyHandler);
    },

    // ===== FREEHAND TOOL =====

    handleFreehandDown(world) {
        this.isDragging = true;
        this.freehandPoints = [{ x: world.x, y: world.y }];
    },

    handleFreehandMove(world) {
        if (!this.isDragging) return;
        this.freehandPoints.push({ x: world.x, y: world.y });

        this.drawPreview = (ctx) => {
            if (this.freehandPoints.length < 2) return;
            ctx.beginPath();
            const s0 = Canvas.worldToScreen(this.freehandPoints[0].x, this.freehandPoints[0].y);
            ctx.moveTo(s0.x, s0.y);
            for (let i = 1; i < this.freehandPoints.length; i++) {
                const s = Canvas.worldToScreen(this.freehandPoints[i].x, this.freehandPoints[i].y);
                ctx.lineTo(s.x, s.y);
            }
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        };
    },

    handleFreehandUp() {
        if (this.freehandPoints.length >= 2) {
            // Simplify points (keep every nth point to reduce data)
            const simplified = this.simplifyPoints(this.freehandPoints, 2);
            const el = Drawing.createFreehand(simplified);
            Drawing.addElement(el);
        }
        this.isDragging = false;
        this.freehandPoints = [];
        this.drawPreview = null;
    },

    simplifyPoints(points, tolerance) {
        if (points.length <= 2) return points;
        const result = [points[0]];
        let last = points[0];
        for (let i = 1; i < points.length - 1; i++) {
            if (Math.hypot(points[i].x - last.x, points[i].y - last.y) >= tolerance) {
                result.push(points[i]);
                last = points[i];
            }
        }
        result.push(points[points.length - 1]);
        return result;
    },

    // ===== ERASER TOOL =====

    handleEraserDown(world) {
        const hit = Drawing.hitTest(world.x, world.y, 12 / (Canvas.zoom * Canvas.ppi));
        if (hit) {
            Drawing.removeElement(hit.id);
            Canvas.needsRedraw = true;
        }
        this.isDragging = true;
    },

    handleEraserMove(world) {
        if (!this.isDragging) return;
        const hit = Drawing.hitTest(world.x, world.y, 12 / (Canvas.zoom * Canvas.ppi));
        if (hit) {
            Drawing.removeElement(hit.id);
        }
    },
};
