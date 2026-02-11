// shopDrawEditor.js — Interactive shop drawing editor
// Allows building fence elevation drawings part-by-part with drag, select, properties

const ShopDrawEditor = {

    // ===== STATE =====
    elements: [],
    selectedId: null,
    nextId: 1,
    undoStack: [],
    redoStack: [],
    placingType: null,   // null or part type string
    placingStep: 0,      // for multi-click placement (rail, dimension)
    placingTemp: null,    // temp data during multi-click
    isDragging: false,
    dragOffset: { x: 0, y: 0 },

    // SVG coordinate system
    viewW: 1100,
    viewH: 480,
    groundY: 300,       // Y position of ground line

    // Zoom/pan
    scale: 1,
    panX: 0,
    panY: 0,

    // ===== INIT =====

    init() {
        this.svg = document.getElementById('sde-svg');
        this.workspace = document.getElementById('sde-workspace');
        if (!this.svg || !this.workspace) return;

        this.svg.setAttribute('viewBox', `0 0 ${this.viewW} ${this.viewH}`);
        this.svg.setAttribute('width', this.viewW);
        this.svg.setAttribute('height', this.viewH);

        this.bindPalette();
        this.bindSVGEvents();
        this.bindToolbar();
        this.render();
    },

    bindPalette() {
        // Template load
        document.getElementById('sde-load-template').addEventListener('click', () => {
            const tpl = document.getElementById('sde-template').value;
            this.pushUndo();
            this.loadTemplate(tpl);
            this.render();
        });

        // Part placement buttons
        document.querySelectorAll('.sde-part-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const part = btn.dataset.part;
                if (this.placingType === part) {
                    // Toggle off
                    this.cancelPlacing();
                } else {
                    this.startPlacing(part);
                }
            });
        });

        // Delete button
        document.getElementById('sde-delete-btn').addEventListener('click', () => {
            if (this.selectedId !== null) {
                this.pushUndo();
                this.elements = this.elements.filter(e => e.id !== this.selectedId);
                this.selectedId = null;
                this.render();
                this.updateProperties();
                this.updateStatus();
            }
        });
    },

    bindSVGEvents() {
        this.svg.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.svg.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.svg.addEventListener('mouseup', (e) => this.onMouseUp(e));
    },

    bindToolbar() {
        document.getElementById('sde-undo').addEventListener('click', () => this.undo());
        document.getElementById('sde-redo').addEventListener('click', () => this.redo());
        document.getElementById('sde-zoom-fit').addEventListener('click', () => this.zoomFit());
        document.getElementById('sde-zoom-reset').addEventListener('click', () => this.zoomReset());
        document.getElementById('sde-export').addEventListener('click', () => this.exportPrint());
    },

    // ===== SVG COORDINATE HELPERS =====

    svgPoint(e) {
        const rect = this.svg.getBoundingClientRect();
        const scaleX = this.viewW / rect.width;
        const scaleY = this.viewH / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    },

    snap(val, grid = 10) {
        return Math.round(val / grid) * grid;
    },

    // ===== PLACING MODE =====

    startPlacing(type) {
        this.placingType = type;
        this.placingStep = 0;
        this.placingTemp = null;
        this.selectedId = null;
        this.workspace.classList.add('placing');
        // Highlight active button
        document.querySelectorAll('.sde-part-btn').forEach(b => b.classList.toggle('active', b.dataset.part === type));
        this.updateStatus();
        this.render();
    },

    cancelPlacing() {
        this.placingType = null;
        this.placingStep = 0;
        this.placingTemp = null;
        this.workspace.classList.remove('placing');
        document.querySelectorAll('.sde-part-btn').forEach(b => b.classList.remove('active'));
        this.updateStatus();
    },

    // ===== MOUSE EVENTS =====

    onMouseDown(e) {
        if (e.button !== 0) return;
        const pt = this.svgPoint(e);

        // Placing mode
        if (this.placingType) {
            this.handlePlace(pt);
            return;
        }

        // Check if clicking on an element
        const g = e.target.closest('g[data-id]');
        if (g) {
            const id = parseInt(g.dataset.id);
            this.selectedId = id;
            this.isDragging = true;
            const el = this.getElementById(id);
            if (el) {
                this.pushUndo(); // Save state BEFORE drag begins
                const cx = el.x !== undefined ? el.x : (el.x1 !== undefined ? el.x1 : el.cx);
                const cy = el.y !== undefined ? el.y : (el.y1 !== undefined ? el.y1 : (el.topY !== undefined ? el.topY : 0));
                this.dragOffset = { x: pt.x - cx, y: pt.y - cy };
            }
            this.render();
            this.updateProperties();
            this.updateStatus();
        } else {
            // Deselect
            this.selectedId = null;
            this.render();
            this.updateProperties();
            this.updateStatus();
        }
    },

    onMouseMove(e) {
        if (!this.isDragging || this.selectedId === null) return;
        const pt = this.svgPoint(e);
        const el = this.getElementById(this.selectedId);
        if (!el) return;

        const nx = this.snap(pt.x - this.dragOffset.x);
        const ny = this.snap(pt.y - this.dragOffset.y);

        if (el.x !== undefined) {
            // Post, gate, hardware
            el.x = nx;
            el.y = ny;
        } else if (el.type === 'fabric') {
            // Fabric uses x1/x2/topY/botY (no y1/y2)
            const dx = nx - el.x1;
            const dy = ny - el.topY;
            el.x1 += dx;
            el.x2 += dx;
            el.topY += dy;
            el.botY += dy;
        } else if (el.x1 !== undefined) {
            // Rail, callout, dimension — uses x1/y1/x2/y2
            const dx = nx - el.x1;
            const dy = ny - el.y1;
            el.x1 += dx; el.y1 += dy;
            el.x2 += dx; el.y2 += dy;
        } else if (el.cx !== undefined) {
            // Footing — uses cx/topY
            el.cx = nx;
            el.topY = ny;
        }
        this.render();
    },

    onMouseUp(e) {
        this.isDragging = false;
    },

    // ===== PLACEMENT HANDLERS =====

    handlePlace(pt) {
        const x = this.snap(pt.x);
        const y = this.snap(pt.y);

        switch (this.placingType) {
            case 'post':
                this.pushUndo();
                this.addElement({
                    type: 'post', x: x, y: this.groundY,
                    postType: 'line', size: 2.375, height: 48, material: 'galvanized'
                });
                this.cancelPlacing();
                break;

            case 'rail':
                if (this.placingStep === 0) {
                    this.placingTemp = { x1: x, y1: y };
                    this.placingStep = 1;
                    this.updateStatus('Click second point for rail end');
                } else {
                    this.pushUndo();
                    this.addElement({
                        type: 'rail',
                        x1: this.placingTemp.x1, y1: this.placingTemp.y1,
                        x2: x, y2: this.placingTemp.y1, // keep horizontal
                        railType: 'top', size: 1.625, material: 'galvanized'
                    });
                    this.cancelPlacing();
                }
                break;

            case 'fabric':
                if (this.placingStep === 0) {
                    this.placingTemp = { x1: x };
                    this.placingStep = 1;
                    this.updateStatus('Click second point for fabric end');
                } else {
                    this.pushUndo();
                    const fx1 = Math.min(this.placingTemp.x1, x);
                    const fx2 = Math.max(this.placingTemp.x1, x);
                    this.addElement({
                        type: 'fabric', x1: fx1, x2: fx2,
                        topY: this.groundY - 160, botY: this.groundY,
                        fabricType: 'chainlink', mesh: '2"', gauge: '11-1/2'
                    });
                    this.cancelPlacing();
                }
                break;

            case 'gate':
                this.pushUndo();
                this.addElement({
                    type: 'gate', x: x, y: this.groundY,
                    gateType: 'swing', width: 48, height: 48, frameSize: 1.625
                });
                this.cancelPlacing();
                break;

            case 'footing':
                this.pushUndo();
                this.addElement({
                    type: 'footing', cx: x, topY: this.groundY,
                    width: 30, depth: 40
                });
                this.cancelPlacing();
                break;

            case 'hardware':
                this.pushUndo();
                this.addElement({
                    type: 'hardware', x: x, y: y,
                    hwType: 'tension-bar', label: 'Tension Bar'
                });
                this.cancelPlacing();
                break;

            case 'callout':
                if (this.placingStep === 0) {
                    this.placingTemp = { x1: x, y1: y };
                    this.placingStep = 1;
                    this.updateStatus('Click label position for callout');
                } else {
                    this.pushUndo();
                    this.addElement({
                        type: 'callout',
                        x1: this.placingTemp.x1, y1: this.placingTemp.y1,
                        x2: x, y2: y,
                        text: 'Label', align: x > this.placingTemp.x1 ? 'right' : 'left'
                    });
                    this.cancelPlacing();
                }
                break;

            case 'dimension':
                if (this.placingStep === 0) {
                    this.placingTemp = { x1: x, y1: y };
                    this.placingStep = 1;
                    this.updateStatus('Click second point for dimension');
                } else {
                    this.pushUndo();
                    this.addElement({
                        type: 'dimension',
                        x1: this.placingTemp.x1, y1: this.placingTemp.y1,
                        x2: x, y2: y,
                        text: '' // auto-calc
                    });
                    this.cancelPlacing();
                }
                break;
        }

        this.render();
        this.updateProperties();
        this.updateStatus();
    },

    // ===== ELEMENT MANAGEMENT =====

    addElement(props) {
        const el = { id: this.nextId++, ...props };
        this.elements.push(el);
        this.selectedId = el.id;
        return el;
    },

    getElementById(id) {
        return this.elements.find(e => e.id === id);
    },

    // ===== UNDO / REDO =====

    pushUndo() {
        this.undoStack.push(JSON.stringify({ elements: this.elements, selectedId: this.selectedId, nextId: this.nextId }));
        if (this.undoStack.length > 30) this.undoStack.shift();
        this.redoStack = [];
    },

    undo() {
        if (this.undoStack.length === 0) return;
        this.redoStack.push(JSON.stringify({ elements: this.elements, selectedId: this.selectedId, nextId: this.nextId }));
        const state = JSON.parse(this.undoStack.pop());
        this.elements = state.elements;
        this.selectedId = state.selectedId;
        this.nextId = state.nextId;
        this.render();
        this.updateProperties();
        this.updateStatus();
    },

    redo() {
        if (this.redoStack.length === 0) return;
        this.undoStack.push(JSON.stringify({ elements: this.elements, selectedId: this.selectedId, nextId: this.nextId }));
        const state = JSON.parse(this.redoStack.pop());
        this.elements = state.elements;
        this.selectedId = state.selectedId;
        this.nextId = state.nextId;
        this.render();
        this.updateProperties();
        this.updateStatus();
    },

    // ===== KEYBOARD =====

    onKeyDown(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

        const ctrl = e.ctrlKey || e.metaKey;

        if (ctrl && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            this.undo();
        } else if (ctrl && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            this.redo();
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            if (this.selectedId !== null) {
                this.pushUndo();
                this.elements = this.elements.filter(el => el.id !== this.selectedId);
                this.selectedId = null;
                this.render();
                this.updateProperties();
                this.updateStatus();
            }
        } else if (e.key === 'Escape') {
            this.cancelPlacing();
            this.selectedId = null;
            this.render();
            this.updateProperties();
        }
    },

    // ===== ZOOM =====

    zoomFit() {
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.svg.style.maxWidth = this.viewW + 'px';
        this.svg.style.maxHeight = this.viewH + 'px';
    },

    zoomReset() {
        this.svg.setAttribute('width', this.viewW);
        this.svg.setAttribute('height', this.viewH);
        this.svg.style.maxWidth = '';
        this.svg.style.maxHeight = '';
    },

    // ===== TEMPLATES =====

    loadTemplate(type) {
        this.elements = [];
        this.selectedId = null;
        this.nextId = 1;

        switch (type) {
            case 'chainlink':
                this.loadChainlinkTemplate();
                break;
            case 'swing-gate':
                this.loadSwingGateTemplate();
                break;
            case 'blank':
            default:
                // Just ground line, no elements
                break;
        }
    },

    loadChainlinkTemplate() {
        const gY = this.groundY;
        const h = 160; // 4' fence height in SVG units
        const topY = gY - h;
        const postH = h + 10; // posts extend above fabric

        // End post left
        this.addElement({ type: 'post', x: 250, y: gY, postType: 'end', size: 2.375, height: 48, material: 'galvanized' });
        // Line post center
        this.addElement({ type: 'post', x: 515, y: gY, postType: 'line', size: 1.625, height: 48, material: 'galvanized' });
        // End post right
        this.addElement({ type: 'post', x: 780, y: gY, postType: 'end', size: 2.375, height: 48, material: 'galvanized' });

        // Top rail
        this.addElement({ type: 'rail', x1: 250, y1: topY + 5, x2: 780, y2: topY + 5, railType: 'top', size: 1.625, material: 'galvanized' });

        // Fabric
        this.addElement({ type: 'fabric', x1: 250, x2: 780, topY: topY + 10, botY: gY, fabricType: 'chainlink', mesh: '2"', gauge: '11-1/2' });

        // Footings
        this.addElement({ type: 'footing', cx: 250, topY: gY, width: 30, depth: 45 });
        this.addElement({ type: 'footing', cx: 515, topY: gY, width: 24, depth: 36 });
        this.addElement({ type: 'footing', cx: 780, topY: gY, width: 30, depth: 45 });

        // Callouts
        this.addElement({ type: 'callout', x1: 250, y1: topY - 10, x2: 160, y2: topY - 20, text: 'End Post 2-3/8" O.D.', align: 'left' });
        this.addElement({ type: 'callout', x1: 515, y1: topY + 5, x2: 870, y2: topY - 10, text: 'Top Rail 1-5/8" O.D.', align: 'right' });
        this.addElement({ type: 'callout', x1: 600, y1: (topY + gY) / 2, x2: 870, y2: (topY + gY) / 2, text: 'Chain Link Fabric', align: 'right' });
        this.addElement({ type: 'callout', x1: 515, y1: topY + 30, x2: 870, y2: topY + 30, text: 'Line Post 1-5/8" O.D.', align: 'right' });

        // Dimensions
        this.addElement({ type: 'dimension', x1: 250, y1: gY + 60, x2: 780, y2: gY + 60, text: 'Section Width' });
        this.addElement({ type: 'dimension', x1: 200, y1: topY + 5, x2: 200, y2: gY, text: "4'-0\"" });

        this.selectedId = null;
    },

    loadSwingGateTemplate() {
        const gY = this.groundY;
        const h = 160;
        const topY = gY - h;
        const centerX = this.viewW / 2;
        const gateW = 160; // ~4' gate

        const leftPostX = centerX - gateW / 2 - 10;
        const rightPostX = centerX + gateW / 2 + 10;
        const frameLeft = centerX - gateW / 2;
        const frameRight = centerX + gateW / 2;
        const frameTop = topY + 10;

        // Gate posts
        this.addElement({ type: 'post', x: leftPostX, y: gY, postType: 'gate', size: 2.875, height: 48, material: 'galvanized' });
        this.addElement({ type: 'post', x: rightPostX, y: gY, postType: 'gate', size: 2.875, height: 48, material: 'galvanized' });

        // Gate frame (represented as a gate element)
        this.addElement({ type: 'gate', x: centerX, y: gY, gateType: 'swing', width: 48, height: 48, frameSize: 1.625 });

        // Footings
        this.addElement({ type: 'footing', cx: leftPostX, topY: gY, width: 32, depth: 48 });
        this.addElement({ type: 'footing', cx: rightPostX, topY: gY, width: 32, depth: 48 });

        // Hardware
        this.addElement({ type: 'hardware', x: leftPostX - 5, y: gY - h / 2 - 20, hwType: 'hinge', label: 'Hinges' });
        this.addElement({ type: 'hardware', x: rightPostX + 5, y: gY - h / 2, hwType: 'latch', label: 'Fork Latch' });

        // Callouts
        this.addElement({ type: 'callout', x1: leftPostX, y1: topY - 5, x2: 160, y2: topY - 15, text: 'Hinge Post', align: 'left' });
        this.addElement({ type: 'callout', x1: rightPostX, y1: topY - 5, x2: 870, y2: topY - 15, text: 'Latch Post', align: 'right' });
        this.addElement({ type: 'callout', x1: centerX, y1: frameTop, x2: 870, y2: frameTop + 10, text: 'Gate Frame 1-5/8"', align: 'right' });
        this.addElement({ type: 'callout', x1: centerX, y1: (frameTop + gY) / 2, x2: 870, y2: (frameTop + gY) / 2, text: 'Chain Link Fabric', align: 'right' });

        // Dimensions
        this.addElement({ type: 'dimension', x1: frameLeft, y1: gY + 60, x2: frameRight, y2: gY + 60, text: "4'-0\" Opening" });
        this.addElement({ type: 'dimension', x1: 200, y1: topY + 10, x2: 200, y2: gY, text: "4'-0\"" });

        this.selectedId = null;
    },

    // ===== RENDERING =====

    render() {
        if (!this.svg) return;

        let svg = '';

        // SVG defs (reuse from ShopDrawing)
        svg += ShopDrawing.svgDefs();

        // Background
        svg += `<rect x="0" y="0" width="${this.viewW}" height="${this.viewH}" fill="white"/>`;

        // Ground fill below ground line
        svg += `<rect x="0" y="${this.groundY}" width="${this.viewW}" height="${this.viewH - this.groundY}" fill="url(#ground-fill)" opacity="0.3"/>`;

        // Ground line
        svg += `<line x1="50" y1="${this.groundY}" x2="${this.viewW - 50}" y2="${this.groundY}" stroke="#444" stroke-width="2.5"/>`;
        svg += `<text x="${this.viewW - 45}" y="${this.groundY + 4}" font-size="10" fill="#666" font-family="Arial">GRADE</text>`;

        // Render elements in draw order
        const order = ['footing', 'fabric', 'rail', 'post', 'gate', 'hardware', 'dimension', 'callout'];
        for (const type of order) {
            this.elements.filter(e => e.type === type).forEach(el => {
                svg += this.renderElement(el);
            });
        }

        // Selection highlight
        if (this.selectedId !== null) {
            svg += this.renderSelectionHighlight();
        }

        this.svg.innerHTML = svg;
    },

    renderElement(el) {
        let svg = `<g data-id="${el.id}">`;

        switch (el.type) {
            case 'post':
                svg += this.renderPost(el);
                break;
            case 'rail':
                svg += this.renderRail(el);
                break;
            case 'fabric':
                svg += this.renderFabric(el);
                break;
            case 'gate':
                svg += this.renderGate(el);
                break;
            case 'footing':
                svg += this.renderFooting(el);
                break;
            case 'hardware':
                svg += this.renderHardware(el);
                break;
            case 'callout':
                svg += this.renderCallout(el);
                break;
            case 'dimension':
                svg += this.renderDimension(el);
                break;
        }

        svg += '</g>';
        return svg;
    },

    renderPost(el) {
        const h = (el.height / 12) * 40; // convert inches to SVG units (~40 per foot)
        const topY = el.y - h;
        const w = Math.max(el.size * 3, 6); // visual width based on pipe size

        let svg = '';
        // Post body
        svg += `<rect x="${el.x - w/2}" y="${topY}" width="${w}" height="${h}" fill="#aaa" stroke="#333" stroke-width="1.5"/>`;
        // Cap
        svg += `<rect x="${el.x - w/2 - 2}" y="${topY - 4}" width="${w + 4}" height="4" fill="#888" stroke="#333" stroke-width="1" rx="1"/>`;

        return svg;
    },

    renderRail(el) {
        const h = Math.max(el.size * 2.5, 4);
        return `<rect x="${el.x1}" y="${el.y1 - h/2}" width="${el.x2 - el.x1}" height="${h}" fill="#bbb" stroke="#555" stroke-width="1"/>`;
    },

    renderFabric(el) {
        let svg = '';
        const fill = el.fabricType === 'chainlink' ? 'url(#chainlink-fill)' :
                     el.fabricType === 'wire' ? 'url(#wire-grid)' :
                     el.fabricType === 'wood' ? 'url(#wood-grain)' :
                     'rgba(200,200,200,0.3)';
        svg += `<rect x="${el.x1}" y="${el.topY}" width="${el.x2 - el.x1}" height="${el.botY - el.topY}" fill="${fill}" stroke="#999" stroke-width="0.5"/>`;
        return svg;
    },

    renderGate(el) {
        const gateW = (el.width / 12) * 40; // convert to SVG units
        const gateH = (el.height / 12) * 40;
        const frameLeft = el.x - gateW / 2;
        const frameRight = el.x + gateW / 2;
        const frameTop = el.y - gateH;
        let svg = '';

        // Gate frame rectangle
        svg += `<rect x="${frameLeft}" y="${frameTop}" width="${gateW}" height="${gateH}" fill="none" stroke="#333" stroke-width="2.5"/>`;

        // Mid rail
        const midY = (frameTop + el.y) / 2;
        svg += `<line x1="${frameLeft}" y1="${midY}" x2="${frameRight}" y2="${midY}" stroke="#555" stroke-width="1.5"/>`;

        // Diagonal brace
        svg += `<line x1="${frameLeft}" y1="${el.y}" x2="${frameRight}" y2="${frameTop}" stroke="#777" stroke-width="1" stroke-dasharray="4,2"/>`;

        // Fabric fill inside
        svg += `<rect x="${frameLeft + 2}" y="${frameTop + 2}" width="${gateW - 4}" height="${gateH - 4}" fill="url(#chainlink-fill)" opacity="0.5"/>`;

        // Swing arc hint
        if (el.gateType === 'swing') {
            const arcR = gateW;
            svg += `<path d="M${frameRight},${el.y} A${arcR},${arcR} 0 0,0 ${frameRight},${el.y - arcR * 0.3}" fill="none" stroke="#999" stroke-width="0.75" stroke-dasharray="3,3"/>`;
        }

        return svg;
    },

    renderFooting(el) {
        return ShopDrawing.drawFooting(el.cx, el.topY, el.width, el.depth);
    },

    renderHardware(el) {
        let svg = '';
        switch (el.hwType) {
            case 'hinge':
                svg += `<circle cx="${el.x}" cy="${el.y}" r="4" fill="#666" stroke="#333" stroke-width="1"/>`;
                svg += `<circle cx="${el.x}" cy="${el.y + 15}" r="4" fill="#666" stroke="#333" stroke-width="1"/>`;
                svg += `<circle cx="${el.x}" cy="${el.y + 30}" r="4" fill="#666" stroke="#333" stroke-width="1"/>`;
                break;
            case 'latch':
                svg += `<rect x="${el.x - 3}" y="${el.y - 6}" width="6" height="12" fill="#888" stroke="#333" stroke-width="1" rx="1"/>`;
                svg += `<line x1="${el.x}" y1="${el.y - 6}" x2="${el.x + 10}" y2="${el.y}" stroke="#555" stroke-width="1.5"/>`;
                break;
            case 'tension-bar':
                svg += `<rect x="${el.x - 1.5}" y="${el.y - 20}" width="3" height="40" fill="#999" stroke="#333" stroke-width="0.75"/>`;
                break;
            default:
                svg += `<circle cx="${el.x}" cy="${el.y}" r="5" fill="#aaa" stroke="#333" stroke-width="1"/>`;
                break;
        }
        return svg;
    },

    renderCallout(el) {
        return ShopDrawing.callout(el.x1, el.y1, el.x2, el.y2, el.text, el.align);
    },

    renderDimension(el) {
        let text = el.text;
        if (!text) {
            // Auto-calculate
            const dx = Math.abs(el.x2 - el.x1);
            const dy = Math.abs(el.y2 - el.y1);
            const dist = Math.max(dx, dy);
            // Convert SVG units back to approx inches (40 units = 12 inches)
            const inches = dist / 40 * 12;
            text = ShopDrawing.fmtFt(Math.round(inches));
        }
        return ShopDrawing.dimLine(el.x1, el.y1, el.x2, el.y2, text);
    },

    renderSelectionHighlight() {
        const el = this.getElementById(this.selectedId);
        if (!el) return '';

        let x, y, w, h;

        switch (el.type) {
            case 'post': {
                const postH = (el.height / 12) * 40;
                const pw = Math.max(el.size * 3, 6);
                x = el.x - pw / 2 - 4;
                y = el.y - postH - 8;
                w = pw + 8;
                h = postH + 12;
                break;
            }
            case 'rail':
                x = el.x1 - 2;
                y = el.y1 - 6;
                w = el.x2 - el.x1 + 4;
                h = 12;
                break;
            case 'fabric':
                x = el.x1 - 2;
                y = el.topY - 2;
                w = el.x2 - el.x1 + 4;
                h = el.botY - el.topY + 4;
                break;
            case 'gate': {
                const gw = (el.width / 12) * 40;
                const gh = (el.height / 12) * 40;
                x = el.x - gw / 2 - 4;
                y = el.y - gh - 4;
                w = gw + 8;
                h = gh + 8;
                break;
            }
            case 'footing':
                x = el.cx - el.width / 2 - 2;
                y = el.topY - 2;
                w = el.width + 4;
                h = el.depth + 4;
                break;
            case 'hardware':
                x = el.x - 10;
                y = el.y - 10;
                w = 20;
                h = (el.hwType === 'hinge') ? 50 : 20;
                break;
            case 'callout':
            case 'dimension':
                x = Math.min(el.x1, el.x2) - 4;
                y = Math.min(el.y1, el.y2) - 10;
                w = Math.abs(el.x2 - el.x1) + 8;
                h = Math.abs(el.y2 - el.y1) + 20;
                break;
            default:
                return '';
        }

        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#e94560" stroke-width="1.5" stroke-dasharray="6,3" rx="3"/>`;
    },

    // ===== PROPERTIES PANEL =====

    updateProperties() {
        const panel = document.getElementById('sde-props-content');
        if (!panel) return;

        if (this.selectedId === null) {
            panel.innerHTML = '<p class="placeholder-text">Select an element to edit properties</p>';
            return;
        }

        const el = this.getElementById(this.selectedId);
        if (!el) {
            panel.innerHTML = '<p class="placeholder-text">Element not found</p>';
            return;
        }

        const id = el.id;
        let html = `<div class="prop-row"><label>Type</label><span style="color:var(--accent);font-weight:600;text-transform:capitalize">${el.type}</span></div>`;

        const opt = (val, label, current) =>
            `<option value="${val}"${String(val) === String(current) ? ' selected' : ''}>${label}</option>`;

        switch (el.type) {
            case 'post':
                html += `<div class="prop-row"><label>Post Type</label><select onchange="ShopDrawEditor.setProp(${id},'postType',this.value)">
                    ${opt('end','End Post',el.postType)}${opt('corner','Corner Post',el.postType)}${opt('line','Line Post',el.postType)}${opt('gate','Gate Post',el.postType)}
                </select></div>`;
                html += `<div class="prop-row"><label>Size (O.D.)</label><select onchange="ShopDrawEditor.setPropNum(${id},'size',this.value)">
                    ${opt(1.625,'1-5/8"',el.size)}${opt(2.375,'2-3/8"',el.size)}${opt(2.875,'2-7/8"',el.size)}${opt(4,'4"',el.size)}${opt(6.625,'6-5/8"',el.size)}
                </select></div>`;
                html += `<div class="prop-row"><label>Height</label><select onchange="ShopDrawEditor.setPropNum(${id},'height',this.value)">
                    ${opt(36,"3'",el.height)}${opt(42,"3'-6\"",el.height)}${opt(48,"4'",el.height)}${opt(60,"5'",el.height)}${opt(72,"6'",el.height)}${opt(96,"8'",el.height)}
                </select></div>`;
                html += `<div class="prop-row"><label>Material</label><select onchange="ShopDrawEditor.setProp(${id},'material',this.value)">
                    ${opt('galvanized','Galvanized',el.material)}${opt('black-vinyl','Black Vinyl',el.material)}${opt('green-vinyl','Green Vinyl',el.material)}
                </select></div>`;
                html += `<div class="prop-row"><label>X Position</label><input type="number" value="${el.x}" step="10" onchange="ShopDrawEditor.setPropNum(${id},'x',this.value)"></div>`;
                break;

            case 'rail':
                html += `<div class="prop-row"><label>Rail Type</label><select onchange="ShopDrawEditor.setProp(${id},'railType',this.value)">
                    ${opt('top','Top Rail',el.railType)}${opt('mid','Mid Rail',el.railType)}${opt('bottom','Bottom Rail',el.railType)}
                </select></div>`;
                html += `<div class="prop-row"><label>Size (O.D.)</label><select onchange="ShopDrawEditor.setPropNum(${id},'size',this.value)">
                    ${opt(1.375,'1-3/8"',el.size)}${opt(1.625,'1-5/8"',el.size)}${opt(2,'2"',el.size)}
                </select></div>`;
                html += `<div class="prop-row"><label>Material</label><select onchange="ShopDrawEditor.setProp(${id},'material',this.value)">
                    ${opt('galvanized','Galvanized',el.material)}${opt('black-vinyl','Black Vinyl',el.material)}
                </select></div>`;
                html += `<div class="prop-row"><label>X1</label><input type="number" value="${el.x1}" step="10" onchange="ShopDrawEditor.setPropNum(${id},'x1',this.value)"></div>`;
                html += `<div class="prop-row"><label>X2</label><input type="number" value="${el.x2}" step="10" onchange="ShopDrawEditor.setPropNum(${id},'x2',this.value)"></div>`;
                html += `<div class="prop-row"><label>Y</label><input type="number" value="${el.y1}" step="10" onchange="ShopDrawEditor.setRailY(${id},this.value)"></div>`;
                break;

            case 'fabric':
                html += `<div class="prop-row"><label>Type</label><select onchange="ShopDrawEditor.setProp(${id},'fabricType',this.value)">
                    ${opt('chainlink','Chain Link',el.fabricType)}${opt('wood','Wood Panel',el.fabricType)}${opt('vinyl','Vinyl Panel',el.fabricType)}${opt('wire','Wire Grid',el.fabricType)}
                </select></div>`;
                html += `<div class="prop-row"><label>Mesh</label><select onchange="ShopDrawEditor.setProp(${id},'mesh',this.value)">
                    ${opt('2"','2" Mesh',el.mesh)}${opt('2-1/4"','2-1/4" Mesh',el.mesh)}
                </select></div>`;
                html += `<div class="prop-row"><label>Gauge</label><select onchange="ShopDrawEditor.setProp(${id},'gauge',this.value)">
                    ${opt('9','9 Ga.',el.gauge)}${opt('11','11 Ga.',el.gauge)}${opt('11-1/2','11-1/2 Ga.',el.gauge)}${opt('6','6 Ga.',el.gauge)}
                </select></div>`;
                html += `<div class="prop-row"><label>X1</label><input type="number" value="${el.x1}" step="10" onchange="ShopDrawEditor.setPropNum(${id},'x1',this.value)"></div>`;
                html += `<div class="prop-row"><label>X2</label><input type="number" value="${el.x2}" step="10" onchange="ShopDrawEditor.setPropNum(${id},'x2',this.value)"></div>`;
                break;

            case 'gate':
                html += `<div class="prop-row"><label>Gate Type</label><select onchange="ShopDrawEditor.setProp(${id},'gateType',this.value)">
                    ${opt('swing','Swing',el.gateType)}${opt('double-swing','Double Swing',el.gateType)}${opt('slide','Slide',el.gateType)}${opt('cantilever','Cantilever',el.gateType)}
                </select></div>`;
                html += `<div class="prop-row"><label>Width</label><select onchange="ShopDrawEditor.setPropNum(${id},'width',this.value)">
                    ${opt(36,"3'",el.width)}${opt(48,"4'",el.width)}${opt(60,"5'",el.width)}${opt(72,"6'",el.width)}${opt(96,"8'",el.width)}${opt(120,"10'",el.width)}${opt(144,"12'",el.width)}${opt(240,"20'",el.width)}
                </select></div>`;
                html += `<div class="prop-row"><label>Height</label><select onchange="ShopDrawEditor.setPropNum(${id},'height',this.value)">
                    ${opt(36,"3'",el.height)}${opt(48,"4'",el.height)}${opt(60,"5'",el.height)}${opt(72,"6'",el.height)}${opt(96,"8'",el.height)}
                </select></div>`;
                html += `<div class="prop-row"><label>Frame Size</label><select onchange="ShopDrawEditor.setPropNum(${id},'frameSize',this.value)">
                    ${opt(1.375,'1-3/8"',el.frameSize)}${opt(1.625,'1-5/8"',el.frameSize)}${opt(1.875,'1-7/8"',el.frameSize)}${opt(2,'2"',el.frameSize)}${opt(2.375,'2-3/8"',el.frameSize)}
                </select></div>`;
                html += `<div class="prop-row"><label>X Position</label><input type="number" value="${el.x}" step="10" onchange="ShopDrawEditor.setPropNum(${id},'x',this.value)"></div>`;
                break;

            case 'footing':
                html += `<div class="prop-row"><label>Width</label><input type="number" value="${el.width}" step="2" onchange="ShopDrawEditor.setPropNum(${id},'width',this.value)"></div>`;
                html += `<div class="prop-row"><label>Depth</label><input type="number" value="${el.depth}" step="2" onchange="ShopDrawEditor.setPropNum(${id},'depth',this.value)"></div>`;
                html += `<div class="prop-row"><label>X Position</label><input type="number" value="${el.cx}" step="10" onchange="ShopDrawEditor.setPropNum(${id},'cx',this.value)"></div>`;
                break;

            case 'hardware':
                html += `<div class="prop-row"><label>HW Type</label><select onchange="ShopDrawEditor.setProp(${id},'hwType',this.value)">
                    ${opt('hinge','Hinges',el.hwType)}${opt('latch','Fork Latch',el.hwType)}${opt('tension-bar','Tension Bar',el.hwType)}${opt('tension-band','Tension Band',el.hwType)}${opt('brace-band','Brace Band',el.hwType)}${opt('rail-end','Rail End',el.hwType)}${opt('post-cap','Post Cap',el.hwType)}
                </select></div>`;
                html += `<div class="prop-row"><label>Label</label><input type="text" value="${el.label}" onchange="ShopDrawEditor.setProp(${id},'label',this.value)"></div>`;
                html += `<div class="prop-row"><label>X</label><input type="number" value="${el.x}" step="5" onchange="ShopDrawEditor.setPropNum(${id},'x',this.value)"></div>`;
                html += `<div class="prop-row"><label>Y</label><input type="number" value="${el.y}" step="5" onchange="ShopDrawEditor.setPropNum(${id},'y',this.value)"></div>`;
                break;

            case 'callout':
                html += `<div class="prop-row"><label>Text</label><input type="text" value="${el.text}" onchange="ShopDrawEditor.setProp(${id},'text',this.value)"></div>`;
                html += `<div class="prop-row"><label>Align</label><select onchange="ShopDrawEditor.setProp(${id},'align',this.value)">
                    ${opt('left','Left',el.align)}${opt('right','Right',el.align)}
                </select></div>`;
                break;

            case 'dimension':
                html += `<div class="prop-row"><label>Text</label><input type="text" value="${el.text}" placeholder="Auto" onchange="ShopDrawEditor.setProp(${id},'text',this.value)"></div>`;
                break;
        }

        panel.innerHTML = html;
    },

    setProp(id, prop, value) {
        const el = this.getElementById(id);
        if (!el) return;
        this.pushUndo();
        el[prop] = value;
        this.render();
        this.updateProperties();
    },

    setPropNum(id, prop, value) {
        const el = this.getElementById(id);
        if (!el) return;
        this.pushUndo();
        el[prop] = parseFloat(value);
        this.render();
        this.updateProperties();
    },

    setRailY(id, value) {
        const el = this.getElementById(id);
        if (!el) return;
        this.pushUndo();
        const y = parseFloat(value);
        el.y1 = y;
        el.y2 = y;
        this.render();
        this.updateProperties();
    },

    // ===== STATUS BAR =====

    updateStatus(tip) {
        const infoEl = document.getElementById('sde-status-info');
        const selEl = document.getElementById('sde-status-sel');
        const tipEl = document.getElementById('sde-status-tip');
        if (!infoEl) return;

        infoEl.textContent = `Elements: ${this.elements.length}`;

        if (this.selectedId !== null) {
            const el = this.getElementById(this.selectedId);
            selEl.textContent = el ? `Selected: ${el.type} #${el.id}` : 'No selection';
        } else {
            selEl.textContent = 'No selection';
        }

        if (tip) {
            tipEl.textContent = tip;
        } else if (this.placingType) {
            tipEl.textContent = `Placing: ${this.placingType} — click in workspace`;
        } else {
            tipEl.textContent = 'Click elements to select, drag to move';
        }
    },

    // ===== EXPORT / PRINT =====

    exportPrint() {
        // Build SVG content from current elements
        const svgContent = this.svg.innerHTML;
        const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.viewW} ${this.viewH}" width="${this.viewW}" height="${this.viewH}">${svgContent}</svg>`;

        // Build specs table from elements
        const specs = this.buildSpecsFromElements();

        // Open print window
        const win = window.open('', '_blank', 'width=1100,height=900');
        if (!win) { alert('Pop-up blocked.'); return; }

        const html = this.buildExportPage(fullSvg, specs);
        win.document.write(html);
        win.document.close();
    },

    buildSpecsFromElements() {
        const specs = [];
        const posts = this.elements.filter(e => e.type === 'post');
        const rails = this.elements.filter(e => e.type === 'rail');
        const fabrics = this.elements.filter(e => e.type === 'fabric');
        const gates = this.elements.filter(e => e.type === 'gate');

        if (posts.length > 0) {
            const types = {};
            posts.forEach(p => {
                const key = `${p.postType} ${p.size}"`;
                types[key] = (types[key] || 0) + 1;
            });
            Object.entries(types).forEach(([desc, qty]) => {
                specs.push({ item: `${desc.charAt(0).toUpperCase() + desc.slice(1)} Post`, qty, size: desc.split(' ').pop(), material: posts[0].material });
            });
        }
        if (rails.length > 0) {
            rails.forEach(r => {
                specs.push({ item: `${r.railType.charAt(0).toUpperCase() + r.railType.slice(1)} Rail`, qty: 1, size: `${r.size}" O.D.`, material: r.material });
            });
        }
        if (fabrics.length > 0) {
            fabrics.forEach(f => {
                specs.push({ item: 'Chain Link Fabric', qty: 1, size: `${f.gauge} Ga. / ${f.mesh} Mesh`, material: f.fabricType });
            });
        }
        if (gates.length > 0) {
            gates.forEach(g => {
                specs.push({ item: `${g.gateType.charAt(0).toUpperCase() + g.gateType.slice(1)} Gate`, qty: 1, size: `${ShopDrawing.fmtFt(g.width)} x ${ShopDrawing.fmtFt(g.height)}`, material: `${g.frameSize}" frame` });
            });
        }
        return specs;
    },

    buildExportPage(svgContent, specs) {
        let specsRows = specs.map(s =>
            `<tr><td>${s.item}</td><td style="text-align:center">${s.qty}</td><td>${s.size}</td><td>${s.material}</td></tr>`
        ).join('');

        return `<!DOCTYPE html>
<html><head><title>Shop Drawing - Editor Export</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: #fff; }
    .page { width: 10.5in; margin: 0.25in auto; border: 2px solid #000; padding: 0.2in; }
    .title-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 10px; }
    .title-bar h1 { font-size: 16px; }
    .title-bar .info { font-size: 10px; color: #555; }
    .drawing { text-align: center; margin: 10px 0; }
    .drawing svg { max-width: 100%; height: auto; border: 1px solid #ccc; }
    .specs { margin-top: 12px; }
    .specs h3 { font-size: 12px; border-bottom: 1px solid #000; margin-bottom: 4px; padding-bottom: 2px; }
    .specs table { width: 100%; border-collapse: collapse; font-size: 11px; }
    .specs th { text-align: left; padding: 3px 6px; background: #f0f0f0; border: 1px solid #ccc; font-size: 10px; }
    .specs td { padding: 3px 6px; border: 1px solid #ccc; }
    .footer { margin-top: 10px; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #ccc; padding-top: 4px; }
    @media print { .page { border: none; margin: 0; } }
</style>
</head><body>
<div class="page">
    <div class="title-bar">
        <h1>Shop Drawing</h1>
        <div class="info">Date: ${new Date().toLocaleDateString()}</div>
    </div>
    <div class="drawing">${svgContent}</div>
    <div class="specs">
        <h3>Material Specifications</h3>
        <table>
            <tr><th>Item</th><th>Qty</th><th>Size</th><th>Material</th></tr>
            ${specsRows}
        </table>
    </div>
    <div class="footer">Generated by CFS QwikDraw Editor</div>
</div>
<script>window.onload=()=>window.print();<\/script>
</body></html>`;
    },
};
