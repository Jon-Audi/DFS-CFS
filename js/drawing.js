// drawing.js — Element model, selection, movement, labels, dimensions
// Each fence element is a plain object stored in Drawing.elements[]

const Drawing = {
    elements: [],
    selectedIds: [],
    nextId: 1,
    undoStack: [],
    redoStack: [],
    maxUndo: 50,

    // ===== Element Factories =====

    createPost(x, y, opts = {}) {
        return {
            id: this.nextId++,
            type: 'post',
            x, y,
            postType: opts.postType || 'end',       // end, corner, line, gate
            size: opts.size || 2.375,                // diameter in inches
            height: opts.height || 48,               // height in inches
            label: opts.label || '',
            labelOffset: { x: 0, y: -20 },
            showLabel: true,
            locked: false,
            material: opts.material || 'chainlink',
        };
    },

    createRail(x1, y1, x2, y2, opts = {}) {
        return {
            id: this.nextId++,
            type: 'rail',
            x1, y1, x2, y2,
            railType: opts.railType || 'top',        // top, bottom, mid
            size: opts.size || 1.625,                // diameter in inches
            postStartId: opts.postStartId || null,
            postEndId: opts.postEndId || null,
            label: opts.label || '',
            showLabel: false,
            locked: false,
            material: opts.material || 'chainlink',
        };
    },

    createGate(x, y, opts = {}) {
        return {
            id: this.nextId++,
            type: 'gate',
            x, y,
            width: opts.width || 48,                 // width in inches
            gateType: opts.gateType || 'swing',      // swing, double-swing, slide, cantilever
            swingDir: opts.swingDir || 'out',         // in, out
            angle: opts.angle || 0,                   // rotation degrees
            height: opts.height || 48,
            braced: opts.braced !== undefined ? opts.braced : true,  // diagonal bracing
            frameSize: opts.frameSize || 1.625,       // gate frame pipe O.D.
            hingeSide: opts.hingeSide || 'left',      // left or right hinge side
            label: opts.label || '',
            labelOffset: { x: 0, y: -20 },
            showLabel: true,
            locked: false,
            material: opts.material || 'chainlink',
        };
    },

    createLabel(x, y, text, opts = {}) {
        return {
            id: this.nextId++,
            type: 'label',
            x, y,
            text: text || 'Label',
            fontSize: opts.fontSize || 14,
            angle: opts.angle || 0,
            locked: false,
        };
    },

    createDimension(x1, y1, x2, y2, opts = {}) {
        return {
            id: this.nextId++,
            type: 'dimension',
            x1, y1, x2, y2,
            offset: opts.offset || 20,               // perpendicular offset for dimension line
            text: opts.text || '',                    // auto-calculated if empty
            locked: false,
        };
    },

    createFreehand(points, opts = {}) {
        return {
            id: this.nextId++,
            type: 'freehand',
            points: points || [],                    // [{x, y}, ...]
            color: opts.color || '#333333',
            width: opts.width || 2,
            locked: false,
        };
    },

    createComponent(x, y, compData, opts = {}) {
        return {
            id: this.nextId++,
            type: 'component',
            x, y,
            componentId: compData.id,
            name: compData.name,
            category: compData.category,
            size: compData.size || '',
            angle: opts.angle || 0,
            label: compData.name,
            labelOffset: { x: 0, y: -16 },
            showLabel: true,
            locked: false,
        };
    },

    // ===== Element Management =====

    addElement(el) {
        this.pushUndo();
        this.elements.push(el);
        return el;
    },

    removeElement(id) {
        this.pushUndo();
        this.elements = this.elements.filter(e => e.id !== id);
        this.selectedIds = this.selectedIds.filter(sid => sid !== id);
    },

    removeSelected() {
        if (this.selectedIds.length === 0) return;
        this.pushUndo();
        const ids = new Set(this.selectedIds);
        this.elements = this.elements.filter(e => !ids.has(e.id));
        this.selectedIds = [];
    },

    getElementById(id) {
        return this.elements.find(e => e.id === id);
    },

    // ===== Selection =====

    select(id, additive = false) {
        if (additive) {
            if (this.selectedIds.includes(id)) {
                this.selectedIds = this.selectedIds.filter(sid => sid !== id);
            } else {
                this.selectedIds.push(id);
            }
        } else {
            this.selectedIds = [id];
        }
    },

    selectAll() {
        this.selectedIds = this.elements.map(e => e.id);
    },

    deselectAll() {
        this.selectedIds = [];
    },

    isSelected(id) {
        return this.selectedIds.includes(id);
    },

    getSelected() {
        const ids = new Set(this.selectedIds);
        return this.elements.filter(e => ids.has(e.id));
    },

    selectInRect(x1, y1, x2, y2) {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);

        this.selectedIds = this.elements.filter(el => {
            const bounds = this.getElementBounds(el);
            return bounds.x >= minX && bounds.x + bounds.w <= maxX &&
                   bounds.y >= minY && bounds.y + bounds.h <= maxY;
        }).map(e => e.id);
    },

    // ===== Movement =====

    moveSelected(dx, dy) {
        const ids = new Set(this.selectedIds);
        this.elements.forEach(el => {
            if (!ids.has(el.id) || el.locked) return;
            if (el.type === 'post' || el.type === 'gate' || el.type === 'label' || el.type === 'component') {
                el.x += dx;
                el.y += dy;
            } else if (el.type === 'rail' || el.type === 'dimension') {
                el.x1 += dx; el.y1 += dy;
                el.x2 += dx; el.y2 += dy;
            } else if (el.type === 'freehand') {
                el.points.forEach(p => { p.x += dx; p.y += dy; });
            }
        });
        // Move connected rail endpoints when an unselected rail is attached to a selected post
        this.elements.forEach(el => {
            if (el.type !== 'rail' || ids.has(el.id)) return; // skip already-moved rails
            if (el.postStartId && ids.has(el.postStartId)) {
                el.x1 += dx; el.y1 += dy;
            }
            if (el.postEndId && ids.has(el.postEndId)) {
                el.x2 += dx; el.y2 += dy;
            }
        });
    },

    // ===== Hit Testing =====

    hitTest(x, y, tolerance = 8) {
        // Test in reverse order (top elements first)
        for (let i = this.elements.length - 1; i >= 0; i--) {
            const el = this.elements[i];
            if (this.isPointOnElement(x, y, el, tolerance)) {
                return el;
            }
        }
        return null;
    },

    isPointOnElement(px, py, el, tol = 8) {
        switch (el.type) {
            case 'post': {
                const r = Math.max(el.size * 3, 8);
                const dx = px - el.x, dy = py - el.y;
                return dx * dx + dy * dy <= (r + tol) * (r + tol);
            }
            case 'rail':
            case 'dimension': {
                return this.pointToSegmentDist(px, py, el.x1, el.y1, el.x2, el.y2) <= tol;
            }
            case 'gate': {
                const hw = el.width / 2 * 0.5; // half-width in canvas scale
                const hh = 10;
                return px >= el.x - hw - tol && px <= el.x + hw + tol &&
                       py >= el.y - hh - tol && py <= el.y + hh + tol;
            }
            case 'label': {
                const w = el.text.length * el.fontSize * 0.6;
                const h = el.fontSize;
                return px >= el.x - tol && px <= el.x + w + tol &&
                       py >= el.y - h - tol && py <= el.y + tol;
            }
            case 'component': {
                return px >= el.x - 12 - tol && px <= el.x + 12 + tol &&
                       py >= el.y - 12 - tol && py <= el.y + 12 + tol;
            }
            case 'freehand': {
                for (let j = 1; j < el.points.length; j++) {
                    if (this.pointToSegmentDist(px, py,
                        el.points[j-1].x, el.points[j-1].y,
                        el.points[j].x, el.points[j].y) <= tol + el.width) {
                        return true;
                    }
                }
                return false;
            }
            default: return false;
        }
    },

    pointToSegmentDist(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1, dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return Math.hypot(px - x1, py - y1);
        let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
    },

    getElementBounds(el) {
        switch (el.type) {
            case 'post': {
                const r = Math.max(el.size * 3, 8);
                return { x: el.x - r, y: el.y - r, w: r * 2, h: r * 2 };
            }
            case 'rail':
            case 'dimension': {
                const minX = Math.min(el.x1, el.x2);
                const minY = Math.min(el.y1, el.y2);
                return { x: minX, y: minY, w: Math.abs(el.x2 - el.x1), h: Math.abs(el.y2 - el.y1) };
            }
            case 'gate': {
                const hw = el.width / 2 * 0.5;
                return { x: el.x - hw, y: el.y - 10, w: hw * 2, h: 20 };
            }
            case 'label': {
                const w = el.text.length * el.fontSize * 0.6;
                return { x: el.x, y: el.y - el.fontSize, w, h: el.fontSize };
            }
            case 'component': {
                return { x: el.x - 12, y: el.y - 12, w: 24, h: 24 };
            }
            case 'freehand': {
                if (el.points.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                el.points.forEach(p => {
                    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
                    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
                });
                return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
            }
            default: return { x: 0, y: 0, w: 0, h: 0 };
        }
    },

    // ===== Dimension Calculation =====

    calcDistance(x1, y1, x2, y2) {
        return Math.hypot(x2 - x1, y2 - y1);
    },

    formatDimension(inches) {
        if (inches >= 12) {
            const feet = Math.floor(inches / 12);
            const rem = Math.round(inches % 12);
            if (rem === 0) return `${feet}'`;
            return `${feet}'-${rem}"`;
        }
        return `${Math.round(inches)}"`;
    },

    // ===== Post Finder (for snapping rails to posts) =====

    findNearestPost(x, y, maxDist = 20) {
        let nearest = null;
        let minDist = maxDist;
        this.elements.forEach(el => {
            if (el.type !== 'post') return;
            const d = Math.hypot(x - el.x, y - el.y);
            if (d < minDist) {
                minDist = d;
                nearest = el;
            }
        });
        return nearest;
    },

    // ===== Undo / Redo =====

    pushUndo() {
        this.undoStack.push({
            elements: JSON.parse(JSON.stringify(this.elements)),
            selectedIds: [...this.selectedIds],
            nextId: this.nextId,
        });
        if (this.undoStack.length > this.maxUndo) {
            this.undoStack.shift();
        }
        this.redoStack = [];
    },

    undo() {
        if (this.undoStack.length === 0) return;
        this.redoStack.push({
            elements: JSON.parse(JSON.stringify(this.elements)),
            selectedIds: [...this.selectedIds],
            nextId: this.nextId,
        });
        const state = this.undoStack.pop();
        this.elements = state.elements;
        this.selectedIds = state.selectedIds;
        this.nextId = state.nextId;
    },

    redo() {
        if (this.redoStack.length === 0) return;
        this.undoStack.push({
            elements: JSON.parse(JSON.stringify(this.elements)),
            selectedIds: [...this.selectedIds],
            nextId: this.nextId,
        });
        const state = this.redoStack.pop();
        this.elements = state.elements;
        this.selectedIds = state.selectedIds;
        this.nextId = state.nextId;
    },

    // ===== Clear =====

    clear() {
        this.pushUndo();
        this.elements = [];
        this.selectedIds = [];
    },

    // ===== Serialization =====

    toJSON() {
        return {
            version: 1,
            nextId: this.nextId,
            elements: this.elements,
        };
    },

    fromJSON(data) {
        if (!data || !data.elements) return;
        this.elements = data.elements;
        this.nextId = data.nextId || 1;
        this.selectedIds = [];
        this.undoStack = [];
        this.redoStack = [];
    },

    // ===== Bill of Materials =====

    getBillOfMaterials() {
        const bom = {};
        this.elements.forEach(el => {
            let key, desc;
            switch (el.type) {
                case 'post':
                    key = `post-${el.postType}-${el.size}`;
                    desc = `${el.size}" ${el.postType.charAt(0).toUpperCase() + el.postType.slice(1)} Post`;
                    break;
                case 'rail':
                    key = `rail-${el.railType}-${el.size}`;
                    desc = `${el.size}" ${el.railType.charAt(0).toUpperCase() + el.railType.slice(1)} Rail`;
                    break;
                case 'gate':
                    key = `gate-${el.gateType}-${el.width}`;
                    desc = `${this.formatDimension(el.width)} ${el.gateType.charAt(0).toUpperCase() + el.gateType.slice(1)} Gate`;
                    break;
                case 'component':
                    key = `comp-${el.componentId}`;
                    desc = el.name;
                    break;
                default:
                    return;
            }
            if (!bom[key]) {
                bom[key] = { description: desc, quantity: 0, lengths: [] };
            }
            bom[key].quantity++;
            if (el.type === 'rail') {
                const len = this.calcDistance(el.x1, el.y1, el.x2, el.y2);
                bom[key].lengths.push(len);
            }
        });
        return Object.values(bom);
    },
};
