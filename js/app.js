// app.js — App init, state management, undo/redo, keyboard shortcuts, properties panel

const App = {
    currentPage: 'draw',

    init() {
        Canvas.init();
        Components.init();
        Estimator.init();
        this.bindEvents();
        this.bindKeyboard();
        this.bindToolbar();
        this.autoLoadFromStorage();

        // Auto-save every 30 seconds
        setInterval(() => this.autoSave(), 30000);

        console.log('CFS initialized');
    },

    // ===== Event Binding =====

    bindEvents() {
        const container = Canvas.container;

        container.addEventListener('mousedown', (e) => Tools.onMouseDown(e));
        container.addEventListener('mousemove', (e) => Tools.onMouseMove(e));
        container.addEventListener('mouseup', (e) => Tools.onMouseUp(e));
        container.addEventListener('wheel', (e) => Tools.onWheel(e), { passive: false });
        container.addEventListener('contextmenu', (e) => e.preventDefault());

        // Prevent middle-click auto-scroll
        container.addEventListener('auxclick', (e) => {
            if (e.button === 1) e.preventDefault();
        });
    },

    bindKeyboard() {
        document.addEventListener('keydown', (e) => {
            // Don't capture when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                return;
            }

            const ctrl = e.ctrlKey || e.metaKey;

            // Tool shortcuts
            if (!ctrl) {
                switch (e.key.toLowerCase()) {
                    case 'v': Tools.setTool('select'); break;
                    case 'p': Tools.setTool('post'); break;
                    case 'r': Tools.setTool('rail'); break;
                    case 'g': Tools.setTool('gate'); break;
                    case 'f': Tools.setTool('fencerun'); break;
                    case 'm': Tools.setTool('measure'); break;
                    case 'l': Tools.setTool('label'); break;
                    case 'd': Tools.setTool('freehand'); break;
                    case 'e': Tools.setTool('eraser'); break;
                    case 'escape':
                        Tools.resetState();
                        Drawing.deselectAll();
                        Canvas.needsRedraw = true;
                        break;
                    case 'delete':
                    case 'backspace':
                        Drawing.removeSelected();
                        this.updatePropertiesPanel();
                        Canvas.needsRedraw = true;
                        break;
                }
            }

            // Ctrl shortcuts
            if (ctrl) {
                switch (e.key.toLowerCase()) {
                    case 'z':
                        e.preventDefault();
                        Drawing.undo();
                        Canvas.needsRedraw = true;
                        break;
                    case 'y':
                        e.preventDefault();
                        Drawing.redo();
                        Canvas.needsRedraw = true;
                        break;
                    case 's':
                        e.preventDefault();
                        FileIO.save();
                        break;
                    case 'o':
                        e.preventDefault();
                        FileIO.load();
                        break;
                    case 'p':
                        e.preventDefault();
                        ShopDrawing.showDialog();
                        break;
                    case 'a':
                        e.preventDefault();
                        Drawing.selectAll();
                        Canvas.needsRedraw = true;
                        break;
                }
            }

            // Grid toggle
            if (e.key === '#') {
                Canvas.gridVisible = !Canvas.gridVisible;
                Canvas.needsRedraw = true;
            }

            // Snap toggle
            if (e.key === 's' && !ctrl && e.shiftKey) {
                Canvas.snapEnabled = !Canvas.snapEnabled;
                document.getElementById('status-snap').textContent =
                    `Snap: ${Canvas.snapEnabled ? 'ON' : 'OFF'}`;
                document.getElementById('status-snap').style.color =
                    Canvas.snapEnabled ? '#4ecca3' : '#8899aa';
                Canvas.needsRedraw = true;
            }
        });
    },

    bindToolbar() {
        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.dataset.tool) Tools.setTool(btn.dataset.tool);
            });
        });

        // Action buttons
        document.getElementById('btn-undo').addEventListener('click', () => {
            Drawing.undo();
            Canvas.needsRedraw = true;
        });
        document.getElementById('btn-redo').addEventListener('click', () => {
            Drawing.redo();
            Canvas.needsRedraw = true;
        });
        document.getElementById('btn-zoom-fit').addEventListener('click', () => Canvas.zoomToFit());
        document.getElementById('btn-zoom-100').addEventListener('click', () => Canvas.resetZoom());
        document.getElementById('btn-save').addEventListener('click', () => FileIO.save());
        document.getElementById('btn-load').addEventListener('click', () => FileIO.load());
        document.getElementById('btn-export').addEventListener('click', () => FileIO.exportPNG());
        document.getElementById('btn-print').addEventListener('click', () => ShopDrawing.showDialog());

        // Grid size control via status bar click
        document.getElementById('status-grid').addEventListener('click', () => {
            const sizes = [3, 6, 12, 24];
            const idx = sizes.indexOf(Canvas.gridSize);
            Canvas.gridSize = sizes[(idx + 1) % sizes.length];
            document.getElementById('status-grid').textContent = `Grid: ${Canvas.gridSize}"`;
            Canvas.needsRedraw = true;
        });
    },

    // ===== Properties Panel =====

    updatePropertiesPanel() {
        const panel = document.getElementById('properties-content');
        const selected = Drawing.getSelected();

        if (selected.length === 0) {
            panel.innerHTML = '<p class="placeholder-text">Select an element to view properties</p>';
            return;
        }

        if (selected.length > 1) {
            panel.innerHTML = `<p class="placeholder-text">${selected.length} elements selected</p>`;
            return;
        }

        const el = selected[0];
        const id = el.id;
        let html = '';

        // Helper to build a <select>
        const sel = (prop, options, current) => {
            const opts = options.map(o => {
                const val = typeof o === 'object' ? o.value : o;
                const label = typeof o === 'object' ? o.label : o;
                const s = String(val) === String(current) ? ' selected' : '';
                return `<option value="${val}"${s}>${label}</option>`;
            }).join('');
            return `<select onchange="App.setProp(${id}, '${prop}', this.value)">${opts}</select>`;
        };
        const numSel = (prop, options, current) => {
            const opts = options.map(o => {
                const val = typeof o === 'object' ? o.value : o;
                const label = typeof o === 'object' ? o.label : o;
                const s = parseFloat(val) === parseFloat(current) ? ' selected' : '';
                return `<option value="${val}"${s}>${label}</option>`;
            }).join('');
            return `<select onchange="App.setPropNum(${id}, '${prop}', this.value)">${opts}</select>`;
        };

        const postSizes = [
            { value: 1.625, label: '1-5/8"' },
            { value: 2.375, label: '2-3/8"' },
            { value: 2.875, label: '2-7/8"' },
            { value: 4, label: '4"' },
            { value: 6.625, label: '6-5/8"' },
        ];
        const railSizes = [
            { value: 1.375, label: '1-3/8"' },
            { value: 1.625, label: '1-5/8"' },
            { value: 2, label: '2"' },
        ];
        const frameSizes = [
            { value: 1.375, label: '1-3/8"' },
            { value: 1.625, label: '1-5/8"' },
            { value: 1.875, label: '1-7/8"' },
            { value: 2, label: '2"' },
            { value: 2.375, label: '2-3/8"' },
        ];
        const gateWidths = [
            { value: 36, label: "3'" }, { value: 48, label: "4'" },
            { value: 60, label: "5'" }, { value: 72, label: "6'" },
            { value: 96, label: "8'" }, { value: 120, label: "10'" },
            { value: 144, label: "12'" }, { value: 240, label: "20'" },
        ];
        const heights = [
            { value: 36, label: "3'" }, { value: 42, label: "3'-6\"" },
            { value: 48, label: "4'" }, { value: 60, label: "5'" },
            { value: 72, label: "6'" }, { value: 96, label: "8'" },
            { value: 120, label: "10'" }, { value: 144, label: "12'" },
        ];

        switch (el.type) {
            case 'post':
                html = `
                    <div class="prop-row"><label>Type</label>${sel('postType', [
                        { value: 'end', label: 'End Post' },
                        { value: 'corner', label: 'Corner Post' },
                        { value: 'line', label: 'Line Post' },
                        { value: 'gate', label: 'Gate Post' },
                    ], el.postType)}</div>
                    <div class="prop-row"><label>Size</label>${numSel('size', postSizes, el.size)}</div>
                    <div class="prop-row"><label>Height</label>${numSel('height', heights, el.height)}</div>
                    <div class="prop-row"><label>Material</label>${sel('material', [
                        { value: 'chainlink', label: 'Chainlink' },
                        { value: 'pvc', label: 'PVC / Vinyl' },
                        { value: 'ornamental', label: 'Ornamental' },
                    ], el.material)}</div>
                    <div class="prop-row"><label>Position</label><span>${Drawing.formatDimension(el.x)}, ${Drawing.formatDimension(el.y)}</span></div>
                    <div class="prop-row">
                        <label>Label</label>
                        <input type="text" value="${el.label}" onchange="App.setProp(${id}, 'label', this.value)">
                    </div>
                `;
                break;
            case 'rail':
                const len = Drawing.calcDistance(el.x1, el.y1, el.x2, el.y2);
                html = `
                    <div class="prop-row"><label>Type</label>${sel('railType', [
                        { value: 'top', label: 'Top Rail' },
                        { value: 'bottom', label: 'Bottom Rail' },
                        { value: 'mid', label: 'Mid Rail' },
                    ], el.railType)}</div>
                    <div class="prop-row"><label>Size</label>${numSel('size', railSizes, el.size)}</div>
                    <div class="prop-row"><label>Length</label><span>${Drawing.formatDimension(len)}</span></div>
                    <div class="prop-row"><label>Material</label>${sel('material', [
                        { value: 'chainlink', label: 'Chainlink' },
                        { value: 'pvc', label: 'PVC / Vinyl' },
                        { value: 'ornamental', label: 'Ornamental' },
                    ], el.material)}</div>
                `;
                break;
            case 'gate':
                html = `
                    <div class="prop-row"><label>Type</label>${sel('gateType', [
                        { value: 'swing', label: 'Swing Gate' },
                        { value: 'double-swing', label: 'Double Swing' },
                        { value: 'slide', label: 'Slide Gate' },
                        { value: 'cantilever', label: 'Cantilever' },
                    ], el.gateType)}</div>
                    <div class="prop-row"><label>Width</label>${numSel('width', gateWidths, el.width)}</div>
                    <div class="prop-row"><label>Height</label>${numSel('height', heights, el.height)}</div>
                    <div class="prop-row"><label>Frame Pipe</label>${numSel('frameSize', frameSizes, el.frameSize)}</div>
                    <div class="prop-row"><label>Swing Dir</label>${sel('swingDir', [
                        { value: 'in', label: 'Inward' },
                        { value: 'out', label: 'Outward' },
                    ], el.swingDir)}</div>
                    <div class="prop-row"><label>Hinge Side</label>${sel('hingeSide', [
                        { value: 'left', label: 'Left' },
                        { value: 'right', label: 'Right' },
                    ], el.hingeSide)}</div>
                    <div class="prop-row">
                        <label>Braced</label>
                        <input type="checkbox" ${el.braced ? 'checked' : ''} onchange="App.setPropBool(${id}, 'braced', this.checked)">
                    </div>
                    <div class="prop-row"><label>Position</label><span>${Drawing.formatDimension(el.x)}, ${Drawing.formatDimension(el.y)}</span></div>
                    <div class="prop-row">
                        <label>Label</label>
                        <input type="text" value="${el.label}" onchange="App.setProp(${id}, 'label', this.value)">
                    </div>
                `;
                break;
            case 'label':
                html = `
                    <div class="prop-row">
                        <label>Text</label>
                        <input type="text" value="${el.text}" onchange="App.setProp(${id}, 'text', this.value)">
                    </div>
                    <div class="prop-row"><label>Font Size</label>${numSel('fontSize', [
                        { value: 10, label: '10px' }, { value: 12, label: '12px' },
                        { value: 14, label: '14px' }, { value: 18, label: '18px' },
                        { value: 24, label: '24px' }, { value: 32, label: '32px' },
                    ], el.fontSize)}</div>
                    <div class="prop-row"><label>Position</label><span>${Drawing.formatDimension(el.x)}, ${Drawing.formatDimension(el.y)}</span></div>
                `;
                break;
            case 'dimension':
                const dist = Drawing.calcDistance(el.x1, el.y1, el.x2, el.y2);
                html = `
                    <div class="prop-row"><label>Distance</label><span>${Drawing.formatDimension(dist)}</span></div>
                    <div class="prop-row">
                        <label>Override</label>
                        <input type="text" value="${el.text}" placeholder="Auto" onchange="App.setProp(${id}, 'text', this.value)">
                    </div>
                `;
                break;
            case 'component':
                html = `
                    <div class="prop-row"><label>Name</label><span>${el.name}</span></div>
                    <div class="prop-row"><label>Category</label><span>${el.category}</span></div>
                    <div class="prop-row"><label>Size</label><span>${el.size}</span></div>
                    <div class="prop-row"><label>Position</label><span>${Drawing.formatDimension(el.x)}, ${Drawing.formatDimension(el.y)}</span></div>
                `;
                break;
            default:
                html = `<div class="prop-row"><label>Type</label><span>${el.type}</span></div>`;
        }

        panel.innerHTML = html;
    },

    setProp(id, prop, value) {
        const el = Drawing.getElementById(id);
        if (!el) return;
        Drawing.pushUndo();
        el[prop] = value;
        this.updatePropertiesPanel();
        Canvas.needsRedraw = true;
    },

    setPropNum(id, prop, value) {
        const el = Drawing.getElementById(id);
        if (!el) return;
        Drawing.pushUndo();
        el[prop] = parseFloat(value);
        this.updatePropertiesPanel();
        Canvas.needsRedraw = true;
    },

    setPropBool(id, prop, value) {
        const el = Drawing.getElementById(id);
        if (!el) return;
        Drawing.pushUndo();
        el[prop] = !!value;
        this.updatePropertiesPanel();
        Canvas.needsRedraw = true;
    },

    // ===== Page Navigation =====

    showPage(page) {
        this.currentPage = page;
        // Toggle pages
        document.querySelectorAll('.app-page').forEach(p => p.classList.remove('active'));
        const target = document.getElementById('page-' + page);
        if (target) target.classList.add('active');

        // Toggle nav tabs
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.page === page));

        // Resize canvas if switching back to draw
        if (page === 'draw') {
            setTimeout(() => {
                Canvas.resize();
                Canvas.needsRedraw = true;
            }, 50);
        }
    },

    // ===== Auto Save =====

    autoSave() {
        try {
            const data = Drawing.toJSON();
            data.jobName = document.getElementById('job-name').value;
            data.jobNumber = document.getElementById('job-number').value;
            localStorage.setItem('qwikdraw-autosave', JSON.stringify(data));
        } catch (e) {
            // localStorage might be full; silently ignore
        }
    },

    autoLoadFromStorage() {
        try {
            const raw = localStorage.getItem('qwikdraw-autosave');
            if (!raw) return;
            const data = JSON.parse(raw);
            Drawing.fromJSON(data);
            if (data.jobName) document.getElementById('job-name').value = data.jobName;
            if (data.jobNumber) document.getElementById('job-number').value = data.jobNumber;
            Canvas.needsRedraw = true;
        } catch (e) {
            // Corrupted data; ignore
        }
    },
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
