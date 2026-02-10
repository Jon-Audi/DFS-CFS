// fileIO.js — Save/load JSON (.qdf), export PNG, print PDF

const FileIO = {
    save() {
        const data = Drawing.toJSON();
        data.jobName = document.getElementById('job-name').value;
        data.jobNumber = document.getElementById('job-number').value;
        data.savedAt = new Date().toISOString();
        data.format = 'QwikDraw';

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const filename = (data.jobName || 'drawing').replace(/[^a-zA-Z0-9_-]/g, '_') + '.qdf';

        this.downloadBlob(blob, filename);
    },

    load() {
        const input = document.getElementById('file-input');
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    Drawing.fromJSON(data);
                    if (data.jobName) document.getElementById('job-name').value = data.jobName;
                    if (data.jobNumber) document.getElementById('job-number').value = data.jobNumber;
                    Canvas.zoomToFit();
                    Canvas.needsRedraw = true;
                    App.updatePropertiesPanel();
                } catch (err) {
                    alert('Failed to load file: ' + err.message);
                }
            };
            reader.readAsText(file);
            input.value = '';
        };
        input.click();
    },

    exportPNG() {
        // Render to an offscreen canvas
        const padding = 40;

        // Calculate bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        Drawing.elements.forEach(el => {
            const b = Drawing.getElementBounds(el);
            minX = Math.min(minX, b.x);
            minY = Math.min(minY, b.y);
            maxX = Math.max(maxX, b.x + b.w);
            maxY = Math.max(maxY, b.y + b.h);
        });

        if (!isFinite(minX)) {
            alert('Nothing to export — add some elements first.');
            return;
        }

        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        const ppi = 4; // pixels per inch
        const scale = 3; // higher res export
        const w = (maxX - minX) * ppi * scale;
        const h = (maxY - minY) * ppi * scale;

        const offscreen = document.createElement('canvas');
        offscreen.width = w;
        offscreen.height = h;
        const ctx = offscreen.getContext('2d');

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);

        // Save current canvas state
        const savedOffset = { x: Canvas.offsetX, y: Canvas.offsetY };
        const savedZoom = Canvas.zoom;

        // Set transform for export
        Canvas.zoom = scale;
        Canvas.offsetX = -minX * ppi * scale;
        Canvas.offsetY = -minY * ppi * scale;

        // Swap context temporarily
        const savedCtx = Canvas.ctx;
        const savedW = Canvas.width;
        const savedH = Canvas.height;
        Canvas.ctx = ctx;
        Canvas.width = w;
        Canvas.height = h;

        // Draw grid
        Canvas.drawGrid(ctx);

        // Draw elements
        Canvas.drawElements(ctx);

        // Restore
        Canvas.ctx = savedCtx;
        Canvas.width = savedW;
        Canvas.height = savedH;
        Canvas.offsetX = savedOffset.x;
        Canvas.offsetY = savedOffset.y;
        Canvas.zoom = savedZoom;

        // Export
        offscreen.toBlob((blob) => {
            const filename = (document.getElementById('job-name').value || 'drawing').replace(/[^a-zA-Z0-9_-]/g, '_') + '.png';
            this.downloadBlob(blob, filename);
        }, 'image/png');
    },

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
};
