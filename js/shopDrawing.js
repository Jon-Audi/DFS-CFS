// shopDrawing.js — Technical shop drawing illustrations for chain link fencing
// Generates detailed SVG diagrams with labeled callouts, dimension lines,
// material specs table, and professional title block

const ShopDrawing = {

    onTypeChange() {
        const type = document.getElementById('sd-drawing-type').value;
        const isGate = type.includes('gate');
        const isChainlink = type.startsWith('chainlink') || isGate;

        document.getElementById('sd-gate-opts').style.display = isGate ? 'block' : 'none';
        document.getElementById('sd-chainlink-opts').style.display = isChainlink ? '' : 'none';
        document.getElementById('sd-wood-opts').style.display = type === 'wood-fence' ? '' : 'none';
        document.getElementById('sd-vinyl-opts').style.display = type === 'vinyl-fence' ? '' : 'none';
        document.getElementById('sd-orn-opts').style.display = type === 'ornamental-fence' ? '' : 'none';
        document.getElementById('sd-wp-opts').style.display = type === 'wirepanel-fence' ? '' : 'none';
    },

    showDialog() {
        const dialog = document.getElementById('shop-drawing-dialog');
        document.getElementById('sd-job-name').value = document.getElementById('job-name').value;
        document.getElementById('sd-job-number').value = document.getElementById('job-number').value;
        this.onTypeChange();
        dialog.style.display = 'flex';

        document.getElementById('sd-print').onclick = () => {
            this.generate();
            dialog.style.display = 'none';
        };
        document.getElementById('sd-cancel').onclick = () => {
            dialog.style.display = 'none';
        };
    },

    getOpts() {
        const type = document.getElementById('sd-drawing-type').value;
        const opts = {
            drawingType: type,
            fenceHeight: parseInt(document.getElementById('sd-fence-height').value),
            gateWidth: parseInt(document.getElementById('sd-gate-width').value),
            company: document.getElementById('sd-company').value || 'FENCE CO.',
            jobName: document.getElementById('sd-job-name').value || 'Untitled',
            jobNumber: document.getElementById('sd-job-number').value || '',
            customer: document.getElementById('sd-customer').value || '',
            address: document.getElementById('sd-address').value || '',
            estimator: document.getElementById('sd-estimator').value || '',
            drawingNo: document.getElementById('sd-drawing-no').value || '',
        };

        // Chainlink fields
        if (type.startsWith('chainlink') || type.includes('gate')) {
            const fabricVal = document.getElementById('sd-fabric').value;
            const [gage, mesh] = fabricVal.split('-');
            const selvageVal = document.getElementById('sd-selvage').value;
            const parts = selvageVal.split('-');
            opts.postOD = document.getElementById('sd-post-od').value;
            opts.railOD = document.getElementById('sd-rail-od').value;
            opts.gage = gage.replace('ga', ' Ga.');
            opts.mesh = mesh.replace('2.25', '2-1/4"').replace('2', '2"');
            opts.finish = document.getElementById('sd-finish').value.replace('-', ' ');
            opts.selvTop = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
            opts.selvBot = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : opts.selvTop;
            opts.braced = document.getElementById('sd-braced').checked;
            opts.tensionWire = document.getElementById('sd-tension-wire').checked;
            opts.barbWire = document.getElementById('sd-barb-wire').checked;
        }

        // Wood fields
        if (type === 'wood-fence') {
            opts.woodStyle = document.getElementById('sd-wood-style').value;
            opts.woodPost = document.getElementById('sd-wood-post').value;
            opts.woodRail = document.getElementById('sd-wood-rail').value;
            opts.woodPicket = document.getElementById('sd-wood-picket').value;
            opts.woodRails = parseInt(document.getElementById('sd-wood-rails').value);
            opts.woodType = document.getElementById('sd-wood-type').value;
            opts.woodPostCaps = document.getElementById('sd-wood-postcaps').checked;
            opts.woodKickboard = document.getElementById('sd-wood-kickboard').checked;
        }

        // Vinyl fields
        if (type === 'vinyl-fence') {
            opts.vinylStyle = document.getElementById('sd-vinyl-style').value;
            opts.vinylPost = document.getElementById('sd-vinyl-post').value;
            opts.vinylColor = document.getElementById('sd-vinyl-color').value;
            opts.vinylSection = parseInt(document.getElementById('sd-vinyl-section').value);
            opts.vinylPostCaps = document.getElementById('sd-vinyl-postcaps').checked;
            opts.vinylAlum = document.getElementById('sd-vinyl-alum').checked;
        }

        // Ornamental fields
        if (type === 'ornamental-fence') {
            opts.ornStyle = document.getElementById('sd-orn-style').value;
            opts.ornMaterial = document.getElementById('sd-orn-material').value;
            opts.ornPost = document.getElementById('sd-orn-post').value;
            opts.ornCap = document.getElementById('sd-orn-cap').value;
            opts.ornColor = document.getElementById('sd-orn-color').value;
        }

        // Wire panel fields
        if (type === 'wirepanel-fence') {
            opts.wpType = document.getElementById('sd-wp-type').value;
            opts.wpPost = document.getElementById('sd-wp-post').value;
            opts.wpGauge = document.getElementById('sd-wp-gauge').value;
            opts.wpTopRail = document.getElementById('sd-wp-toprail').checked;
            opts.wpTension = document.getElementById('sd-wp-tension').checked;
        }

        return opts;
    },

    generate() {
        const opts = this.getOpts();
        const win = window.open('', '_blank', 'width=1100,height=900');
        if (!win) { alert('Pop-up blocked.'); return; }

        let svgContent = '';
        let title = '';

        switch (opts.drawingType) {
            case 'chainlink-fence':
                svgContent = this.drawChainlinkFence(opts);
                title = `Standard Chain Link Fence W/Top Rail${opts.braced ? ' & Braced & Trussed' : ''}`;
                break;
            case 'swing-gate':
                svgContent = this.drawSwingGate(opts);
                title = `Chain Link Swing Gate - ${this.fmtFt(opts.gateWidth)} Opening`;
                break;
            case 'double-swing-gate':
                svgContent = this.drawDoubleSwingGate(opts);
                title = `Chain Link Double Swing Gate - ${this.fmtFt(opts.gateWidth)} Opening`;
                break;
            case 'cantilever-gate':
                svgContent = this.drawCantileverGate(opts);
                title = `Cantilever Slide Gate - ${this.fmtFt(opts.gateWidth)} Opening`;
                break;
            case 'slide-gate':
                svgContent = this.drawSlideGate(opts);
                title = `Roller Slide Gate - ${this.fmtFt(opts.gateWidth)} Opening`;
                break;
            case 'wood-fence':
                svgContent = this.drawWoodFence(opts);
                title = `${opts.woodStyle.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())} Wood Fence Section`;
                break;
            case 'vinyl-fence':
                svgContent = this.drawVinylFence(opts);
                title = `${opts.vinylStyle.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())} Vinyl Fence Section`;
                break;
            case 'ornamental-fence':
                svgContent = this.drawOrnamentalFence(opts);
                title = `${opts.ornStyle.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())} Ornamental ${opts.ornMaterial} Fence`;
                break;
            case 'wirepanel-fence':
                svgContent = this.drawWirePanelFence(opts);
                title = `${opts.wpType.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())} Panel Fence Section`;
                break;
            case 'canvas-drawing':
                svgContent = this.drawCanvasExport(opts);
                title = opts.jobName;
                break;
        }

        const html = this.buildPage(svgContent, title, opts);
        win.document.write(html);
        win.document.close();
    },

    // ===== UTILITY =====

    fmtFt(inches) {
        const ft = Math.floor(inches / 12);
        const rem = inches % 12;
        if (rem === 0) return `${ft}'`;
        return `${ft}'-${rem}"`;
    },

    callout(x1, y1, x2, y2, text, align = 'right') {
        const anchor = align === 'right' ? 'start' : 'end';
        const tx = align === 'right' ? x2 + 6 : x2 - 6;
        return `
            <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#222" stroke-width="1" marker-end="url(#arrowhead)"/>
            <text x="${tx}" y="${y2 + 5}" text-anchor="${anchor}" font-size="13" font-weight="600" font-family="Arial, sans-serif" fill="#111">${text}</text>
        `;
    },

    dimLine(x1, y1, x2, y2, text, offset = -20) {
        // Horizontal or vertical dimension line with arrows and text
        const isHoriz = Math.abs(y2 - y1) < Math.abs(x2 - x1);
        let svg = '';

        if (isHoriz) {
            const oy = y1 + offset;
            // Extension lines
            svg += `<line x1="${x1}" y1="${y1}" x2="${x1}" y2="${oy - 3}" stroke="#222" stroke-width="0.75"/>`;
            svg += `<line x1="${x2}" y1="${y2}" x2="${x2}" y2="${oy - 3}" stroke="#222" stroke-width="0.75"/>`;
            // Dimension line
            svg += `<line x1="${x1}" y1="${oy}" x2="${x2}" y2="${oy}" stroke="#222" stroke-width="1" marker-start="url(#arrowstart)" marker-end="url(#arrowhead)"/>`;
            // Text
            const mx = (x1 + x2) / 2;
            const tw = Math.max(text.length * 7, 48);
            svg += `<rect x="${mx - tw/2}" y="${oy - 12}" width="${tw}" height="16" fill="white"/>`;
            svg += `<text x="${mx}" y="${oy + 2}" text-anchor="middle" font-size="13" font-weight="bold" font-family="Arial, sans-serif" fill="#111">${text}</text>`;
        } else {
            const ox = x1 + offset;
            svg += `<line x1="${x1}" y1="${y1}" x2="${ox - 3}" y2="${y1}" stroke="#222" stroke-width="0.75"/>`;
            svg += `<line x1="${x2}" y1="${y2}" x2="${ox - 3}" y2="${y2}" stroke="#222" stroke-width="0.75"/>`;
            svg += `<line x1="${ox}" y1="${y1}" x2="${ox}" y2="${y2}" stroke="#222" stroke-width="1" marker-start="url(#arrowstart)" marker-end="url(#arrowhead)"/>`;
            const my = (y1 + y2) / 2;
            svg += `<text x="${ox - 5}" y="${my + 5}" text-anchor="end" font-size="13" font-weight="bold" font-family="Arial, sans-serif" fill="#111" transform="rotate(-90,${ox - 5},${my + 5})">${text}</text>`;
        }
        return svg;
    },

    svgDefs() {
        return `
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#222"/>
                </marker>
                <marker id="arrowstart" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                    <polygon points="10 0, 0 3.5, 10 7" fill="#222"/>
                </marker>
                <pattern id="chainlink-fill" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                    <path d="M0 6 L6 0 M6 12 L12 6 M0 6 L6 12 M6 0 L12 6" stroke="#888" stroke-width="0.6" fill="none"/>
                </pattern>
                <pattern id="ground-fill" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="10" x2="10" y2="0" stroke="#999" stroke-width="0.5"/>
                </pattern>
                <pattern id="wood-grain" x="0" y="0" width="6" height="20" patternUnits="userSpaceOnUse">
                    <rect width="6" height="20" fill="#c49a6c"/>
                    <path d="M0 4 Q3 3 6 5 M0 10 Q3 9 6 11 M0 16 Q3 15 6 17" stroke="#a0784a" stroke-width="0.5" fill="none"/>
                </pattern>
                <pattern id="wire-grid" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="7" x2="14" y2="7" stroke="#888" stroke-width="0.7"/>
                    <line x1="7" y1="0" x2="7" y2="14" stroke="#888" stroke-width="0.7"/>
                </pattern>
            </defs>
        `;
    },

    // Ground/concrete footing
    drawFooting(cx, topY, width = 30, depth = 40) {
        const x = cx - width / 2;
        return `
            <rect x="${x}" y="${topY}" width="${width}" height="${depth}" fill="#ddd" stroke="#999" stroke-width="1"/>
            <rect x="${x}" y="${topY}" width="${width}" height="${depth}" fill="url(#ground-fill)" opacity="0.4"/>
        `;
    },

    // Post (vertical pipe, side view)
    drawPostSide(cx, topY, bottomY, od = 8, label = '') {
        const w = od;
        return `
            <rect x="${cx - w/2}" y="${topY}" width="${w}" height="${bottomY - topY}" fill="#bbb" stroke="#555" stroke-width="1.5" rx="2"/>
            <line x1="${cx - w/2 + 1}" y1="${topY + 2}" x2="${cx - w/2 + 1}" y2="${bottomY - 2}" stroke="#ddd" stroke-width="1" opacity="0.6"/>
        `;
    },

    // Rail (horizontal pipe)
    drawRailHoriz(x1, x2, cy, od = 6) {
        const h = od;
        return `
            <rect x="${x1}" y="${cy - h/2}" width="${x2 - x1}" height="${h}" fill="#bbb" stroke="#555" stroke-width="1.2" rx="${h/2}"/>
            <line x1="${x1 + 2}" y1="${cy - h/2 + 1.5}" x2="${x2 - 2}" y2="${cy - h/2 + 1.5}" stroke="#ddd" stroke-width="0.8" opacity="0.5"/>
        `;
    },

    // ===== CHAIN LINK FENCE SECTION =====

    drawChainlinkFence(opts) {
        const W = 750, H = 420;
        const groundY = 320;
        const fenceH = opts.fenceHeight / 72 * 200; // scale fence height to drawing
        const topY = groundY - fenceH;
        const postTopY = topY - 15;
        const postBotY = groundY + 35;
        const leftPostX = 120, rightPostX = 600, linePostX = 360;
        const spacing = rightPostX - leftPostX;

        let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;
        svg += this.svgDefs();

        // Ground line
        svg += `<line x1="60" y1="${groundY}" x2="700" y2="${groundY}" stroke="#666" stroke-width="2"/>`;
        svg += `<rect x="60" y="${groundY}" width="640" height="8" fill="url(#ground-fill)" opacity="0.3"/>`;

        // Footings
        svg += this.drawFooting(leftPostX, groundY, 32, 45);
        svg += this.drawFooting(rightPostX, groundY, 32, 45);
        svg += this.drawFooting(linePostX, groundY, 24, 35);

        // Chain link fabric
        const fabricLeft = leftPostX + 6;
        const fabricRight = rightPostX - 6;
        svg += `<rect x="${fabricLeft}" y="${topY + 5}" width="${fabricRight - fabricLeft}" height="${fenceH - 10}" fill="url(#chainlink-fill)" opacity="0.5" stroke="#aaa" stroke-width="0.5"/>`;

        // Posts
        svg += this.drawPostSide(leftPostX, postTopY, postBotY, 10);
        svg += this.drawPostSide(rightPostX, postTopY, postBotY, 10);
        svg += this.drawPostSide(linePostX, postTopY + 8, postBotY - 8, 7);

        // Top rail
        svg += this.drawRailHoriz(leftPostX - 2, rightPostX + 2, topY + 3, 7);

        // Tension bars (vertical at terminal posts)
        svg += `<rect x="${leftPostX + 10}" y="${topY + 8}" width="3" height="${fenceH - 16}" fill="#999" stroke="#666" stroke-width="0.5"/>`;
        svg += `<rect x="${rightPostX - 13}" y="${topY + 8}" width="3" height="${fenceH - 16}" fill="#999" stroke="#666" stroke-width="0.5"/>`;

        // Post caps
        svg += `<ellipse cx="${leftPostX}" cy="${postTopY - 2}" rx="8" ry="4" fill="#999" stroke="#555" stroke-width="1"/>`;
        svg += `<ellipse cx="${rightPostX}" cy="${postTopY - 2}" rx="8" ry="4" fill="#999" stroke="#555" stroke-width="1"/>`;
        // Line post cap (loop cap)
        svg += `<path d="M${linePostX - 5} ${postTopY + 6} Q${linePostX} ${postTopY - 2} ${linePostX + 5} ${postTopY + 6}" fill="none" stroke="#555" stroke-width="1.5"/>`;

        // Rail end at terminal post
        svg += `<circle cx="${leftPostX}" cy="${topY + 3}" r="5" fill="#ccc" stroke="#555" stroke-width="1"/>`;
        svg += `<circle cx="${rightPostX}" cy="${topY + 3}" r="5" fill="#ccc" stroke="#555" stroke-width="1"/>`;

        // Tension bands (horizontal bands on terminal posts)
        for (let i = 0; i < 3; i++) {
            const by = topY + 20 + i * (fenceH / 4);
            svg += `<rect x="${leftPostX - 7}" y="${by}" width="14" height="4" rx="1" fill="#aaa" stroke="#666" stroke-width="0.5"/>`;
            svg += `<rect x="${rightPostX - 7}" y="${by}" width="14" height="4" rx="1" fill="#aaa" stroke="#666" stroke-width="0.5"/>`;
        }

        // Brace band
        svg += `<rect x="${leftPostX - 7}" y="${topY + 4}" width="14" height="5" rx="1" fill="#aaa" stroke="#666" stroke-width="0.5"/>`;
        svg += `<rect x="${rightPostX - 7}" y="${topY + 4}" width="14" height="5" rx="1" fill="#aaa" stroke="#666" stroke-width="0.5"/>`;

        // Truss rod (if braced)
        if (opts.braced) {
            const trussY1 = topY + 10;
            const trussY2 = groundY - 15;
            svg += `<line x1="${leftPostX + 6}" y1="${trussY2}" x2="${linePostX - 4}" y2="${trussY1}" stroke="#888" stroke-width="1.2" stroke-dasharray="4,2"/>`;
            svg += `<line x1="${rightPostX - 6}" y1="${trussY2}" x2="${linePostX + 4}" y2="${trussY1}" stroke="#888" stroke-width="1.2" stroke-dasharray="4,2"/>`;
        }

        // Tension wire at top (if selected)
        if (opts.tensionWire) {
            svg += `<line x1="${leftPostX}" y1="${topY - 3}" x2="${rightPostX}" y2="${topY - 3}" stroke="#777" stroke-width="1" stroke-dasharray="6,3"/>`;
        }

        // Barbed wire arms (if selected)
        if (opts.barbWire) {
            const armH = 25;
            [leftPostX, rightPostX, linePostX].forEach(px => {
                svg += `<line x1="${px}" y1="${postTopY - 2}" x2="${px + 15}" y2="${postTopY - armH}" stroke="#777" stroke-width="1.5"/>`;
                svg += `<line x1="${px + 12}" y1="${postTopY - armH + 2}" x2="${px + 18}" y2="${postTopY - armH - 2}" stroke="#777" stroke-width="0.8"/>`;
            });
            // Barbed wire strand
            svg += `<line x1="${leftPostX + 15}" y1="${postTopY - armH}" x2="${rightPostX + 15}" y2="${postTopY - armH}" stroke="#777" stroke-width="0.8" stroke-dasharray="3,2"/>`;
        }

        // Fabric selvage illustrations at bottom
        const selvY = H - 50;
        // Twist/barb selvage
        svg += `<text x="180" y="${selvY - 8}" text-anchor="middle" font-size="9" font-family="Arial" fill="#555">Twist or Barb Selvage</text>`;
        for (let i = 0; i < 5; i++) {
            svg += `<path d="M${155 + i * 12} ${selvY} L${161 + i * 12} ${selvY + 15} L${167 + i * 12} ${selvY}" fill="none" stroke="#888" stroke-width="1"/>`;
        }

        // Knuckle selvage
        svg += `<text x="500" y="${selvY - 8}" text-anchor="middle" font-size="9" font-family="Arial" fill="#555">Knuckle Selvage</text>`;
        for (let i = 0; i < 5; i++) {
            svg += `<path d="M${475 + i * 12} ${selvY} Q${481 + i * 12} ${selvY + 12} ${487 + i * 12} ${selvY}" fill="none" stroke="#888" stroke-width="1"/>`;
        }

        // ===== CALLOUT LABELS =====
        // Right side callouts
        svg += this.callout(rightPostX + 8, postTopY - 2, 680, postTopY - 20, 'Post Cap');
        svg += this.callout(rightPostX + 5, topY + 3, 680, topY - 10, 'Rail End');
        svg += this.callout(rightPostX + 8, topY + 6, 680, topY + 20, 'Brace Band');
        svg += this.callout(rightPostX + 8, topY + 45, 680, topY + 50, `Tension Band 15"`, 'right');
        svg += this.callout(rightPostX + 8, topY + 65, 680, topY + 75, 'On CTR.', 'right');
        svg += this.callout(rightPostX - 10, topY + fenceH / 2, 680, topY + 105, 'Tension Bar');
        svg += this.callout(rightPostX - 20, topY + fenceH / 2 + 20, 680, topY + 135, 'Chain Link');
        svg += this.callout(rightPostX - 20, topY + fenceH / 2 + 30, 680, topY + 155, 'Fabric');

        svg += this.callout(rightPostX + 3, groundY + 15, 680, groundY + 20, 'Corner/End');
        svg += this.callout(rightPostX + 3, groundY + 15, 680, groundY + 34, 'Post');

        // Top callouts
        svg += this.callout(linePostX, postTopY + 6, linePostX + 40, postTopY - 30, 'Line Post');
        svg += this.callout(linePostX, postTopY + 6, linePostX + 40, postTopY - 44, 'Cap');

        if (opts.tensionWire) {
            svg += this.callout(linePostX - 60, topY - 3, linePostX - 60, postTopY - 40, 'Tension Wire', 'left');
        }

        // Left side callouts
        svg += this.callout(leftPostX - 3, topY + 3, 70, topY - 10, 'Rail End', 'left');

        // Bottom callouts
        svg += this.callout(linePostX, groundY - 10, linePostX - 60, groundY + 40, 'Line Post', 'left');
        if (opts.braced) {
            svg += this.callout(linePostX + 40, groundY - 40, linePostX + 100, groundY + 30, 'Truss Rod');
        }
        svg += this.callout(leftPostX + 30, groundY - 5, leftPostX + 30, groundY + 50, 'Fabric', 'left');
        svg += this.callout(leftPostX + 30, groundY - 5, leftPostX + 30, groundY + 62, 'Selvage', 'left');

        // Dimension: post spacing
        svg += this.dimLine(leftPostX, postTopY - 30, rightPostX, postTopY - 30, `${this.fmtFt(Math.round(spacing / (rightPostX - leftPostX) * 120))} Max`, -25);

        // Dimension: fence height
        svg += this.dimLine(leftPostX - 35, topY, leftPostX - 35, groundY, this.fmtFt(opts.fenceHeight), -25);

        svg += '</svg>';
        return svg;
    },

    // ===== SWING GATE =====

    drawSwingGate(opts) {
        const W = 750, H = 420;
        const groundY = 300;
        const fenceH = opts.fenceHeight / 72 * 180;
        const topY = groundY - fenceH;
        const postTopY = topY - 15;
        const postBotY = groundY + 35;

        const gateScale = Math.min(1, 400 / opts.gateWidth);
        const gateW = opts.gateWidth * gateScale * 2.5;
        const centerX = W / 2;
        const leftPostX = centerX - gateW / 2;
        const rightPostX = centerX + gateW / 2;

        let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;
        svg += this.svgDefs();

        // Ground line
        svg += `<line x1="40" y1="${groundY}" x2="710" y2="${groundY}" stroke="#666" stroke-width="2"/>`;
        svg += `<rect x="40" y="${groundY}" width="670" height="6" fill="url(#ground-fill)" opacity="0.3"/>`;

        // Footings
        svg += this.drawFooting(leftPostX, groundY, 36, 48);
        svg += this.drawFooting(rightPostX, groundY, 36, 48);

        // Gate frame (rectangular frame with X bracing)
        const frameLeft = leftPostX + 8;
        const frameRight = rightPostX - 8;
        const frameTop = topY + 10;
        const frameBot = groundY - 10;

        // Frame outer rect
        svg += `<rect x="${frameLeft}" y="${frameTop}" width="${frameRight - frameLeft}" height="${frameBot - frameTop}" fill="none" stroke="#555" stroke-width="2.5" rx="1"/>`;

        // Fabric fill
        svg += `<rect x="${frameLeft + 3}" y="${frameTop + 3}" width="${frameRight - frameLeft - 6}" height="${frameBot - frameTop - 6}" fill="url(#chainlink-fill)" opacity="0.4"/>`;

        // Horizontal mid rail
        const midY = (frameTop + frameBot) / 2;
        svg += `<line x1="${frameLeft}" y1="${midY}" x2="${frameRight}" y2="${midY}" stroke="#555" stroke-width="1.5"/>`;

        // Diagonal bracing
        svg += `<line x1="${frameLeft}" y1="${frameTop}" x2="${frameRight}" y2="${midY}" stroke="#888" stroke-width="1" stroke-dasharray="4,2"/>`;
        svg += `<line x1="${frameLeft}" y1="${midY}" x2="${frameRight}" y2="${frameBot}" stroke="#888" stroke-width="1" stroke-dasharray="4,2"/>`;

        // Tension bars inside frame
        svg += `<rect x="${frameLeft + 5}" y="${frameTop + 3}" width="3" height="${frameBot - frameTop - 6}" fill="#999" stroke="#666" stroke-width="0.5"/>`;
        svg += `<rect x="${frameRight - 8}" y="${frameTop + 3}" width="3" height="${frameBot - frameTop - 6}" fill="#999" stroke="#666" stroke-width="0.5"/>`;

        // Gate posts (heavier than fence posts)
        svg += this.drawPostSide(leftPostX, postTopY, postBotY, 12);
        svg += this.drawPostSide(rightPostX, postTopY, postBotY, 12);

        // Post caps
        svg += `<ellipse cx="${leftPostX}" cy="${postTopY - 2}" rx="9" ry="4.5" fill="#999" stroke="#555" stroke-width="1"/>`;
        svg += `<ellipse cx="${rightPostX}" cy="${postTopY - 2}" rx="9" ry="4.5" fill="#999" stroke="#555" stroke-width="1"/>`;

        // Hinges (left side, 3 hinges)
        const hingePositions = [frameTop + 15, midY, frameBot - 15];
        hingePositions.forEach(hy => {
            svg += `<circle cx="${leftPostX + 1}" cy="${hy}" r="5" fill="#aaa" stroke="#555" stroke-width="1"/>`;
            svg += `<circle cx="${leftPostX + 1}" cy="${hy}" r="2" fill="#777"/>`;
        });

        // Latch (right side)
        const latchY = midY - 10;
        svg += `<rect x="${rightPostX - 5}" y="${latchY}" width="10" height="20" rx="2" fill="#aaa" stroke="#555" stroke-width="1"/>`;
        svg += `<line x1="${rightPostX}" y1="${latchY + 5}" x2="${rightPostX}" y2="${latchY + 15}" stroke="#777" stroke-width="1.5"/>`;

        // Swing arc
        svg += `<path d="M${frameRight} ${frameBot} A${frameRight - frameLeft} ${frameRight - frameLeft} 0 0 1 ${leftPostX + 8} ${frameBot + (frameRight - frameLeft) * 0.3}" fill="none" stroke="#999" stroke-width="1" stroke-dasharray="6,4"/>`;

        // ===== CALLOUTS =====
        svg += this.callout(leftPostX - 5, postTopY - 2, 55, postTopY - 25, 'Post Cap', 'left');
        svg += this.callout(leftPostX - 5, midY - 30, 55, midY - 45, 'Gate Post', 'left');

        // Hinges callout
        svg += this.callout(leftPostX + 8, hingePositions[0], 55, hingePositions[0] + 20, 'Hinges', 'left');

        // Latch callout
        svg += this.callout(rightPostX + 8, latchY + 10, 695, latchY - 10, 'Fork Latch');

        // Frame callouts
        svg += this.callout(frameRight + 3, frameTop, 695, frameTop - 15, 'Gate Frame');
        svg += this.callout(frameRight - 20, midY, 695, midY + 5, 'Mid Rail');
        svg += this.callout(frameRight - 30, midY + 30, 695, midY + 40, 'Chain Link Fabric');
        svg += this.callout(frameLeft + 8, frameTop + 30, 695, frameTop + 65, 'Tension Bar');

        // Diagonal brace callout
        svg += this.callout((frameLeft + frameRight) / 2 + 20, (frameTop + midY) / 2, 695, frameTop + 90, 'Diagonal Brace');

        // Post callouts at bottom
        svg += this.callout(leftPostX, groundY + 10, 55, groundY + 30, 'Gate Post', 'left');
        svg += this.callout(rightPostX, groundY + 10, 695, groundY + 30, 'Latch Post');

        // ===== DIMENSIONS =====
        svg += this.dimLine(leftPostX, postTopY - 45, rightPostX, postTopY - 45, this.fmtFt(opts.gateWidth), -20);
        svg += this.dimLine(leftPostX - 45, topY, leftPostX - 45, groundY, this.fmtFt(opts.fenceHeight), -20);

        svg += '</svg>';
        return svg;
    },

    // ===== DOUBLE SWING GATE =====

    drawDoubleSwingGate(opts) {
        const W = 750, H = 420;
        const groundY = 300;
        const fenceH = opts.fenceHeight / 72 * 180;
        const topY = groundY - fenceH;
        const postTopY = topY - 15;
        const postBotY = groundY + 35;

        const halfGateW = opts.gateWidth / 2;
        const gateScale = Math.min(1, 500 / opts.gateWidth);
        const gateW = opts.gateWidth * gateScale * 2;
        const centerX = W / 2;
        const leftPostX = centerX - gateW / 2;
        const rightPostX = centerX + gateW / 2;
        const midX = centerX;

        let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;
        svg += this.svgDefs();

        // Ground line
        svg += `<line x1="40" y1="${groundY}" x2="710" y2="${groundY}" stroke="#666" stroke-width="2"/>`;
        svg += `<rect x="40" y="${groundY}" width="670" height="6" fill="url(#ground-fill)" opacity="0.3"/>`;

        // Footings
        svg += this.drawFooting(leftPostX, groundY, 36, 48);
        svg += this.drawFooting(rightPostX, groundY, 36, 48);

        const frameTop = topY + 10;
        const frameBot = groundY - 10;
        const frameMidY = (frameTop + frameBot) / 2;

        // Left gate leaf
        const lFrameL = leftPostX + 8;
        const lFrameR = midX - 4;
        svg += `<rect x="${lFrameL}" y="${frameTop}" width="${lFrameR - lFrameL}" height="${frameBot - frameTop}" fill="none" stroke="#555" stroke-width="2.5" rx="1"/>`;
        svg += `<rect x="${lFrameL + 3}" y="${frameTop + 3}" width="${lFrameR - lFrameL - 6}" height="${frameBot - frameTop - 6}" fill="url(#chainlink-fill)" opacity="0.4"/>`;
        svg += `<line x1="${lFrameL}" y1="${frameMidY}" x2="${lFrameR}" y2="${frameMidY}" stroke="#555" stroke-width="1.5"/>`;
        svg += `<line x1="${lFrameL}" y1="${frameTop}" x2="${lFrameR}" y2="${frameMidY}" stroke="#888" stroke-width="1" stroke-dasharray="4,2"/>`;

        // Right gate leaf
        const rFrameL = midX + 4;
        const rFrameR = rightPostX - 8;
        svg += `<rect x="${rFrameL}" y="${frameTop}" width="${rFrameR - rFrameL}" height="${frameBot - frameTop}" fill="none" stroke="#555" stroke-width="2.5" rx="1"/>`;
        svg += `<rect x="${rFrameL + 3}" y="${frameTop + 3}" width="${rFrameR - rFrameL - 6}" height="${frameBot - frameTop - 6}" fill="url(#chainlink-fill)" opacity="0.4"/>`;
        svg += `<line x1="${rFrameL}" y1="${frameMidY}" x2="${rFrameR}" y2="${frameMidY}" stroke="#555" stroke-width="1.5"/>`;
        svg += `<line x1="${rFrameR}" y1="${frameTop}" x2="${rFrameL}" y2="${frameMidY}" stroke="#888" stroke-width="1" stroke-dasharray="4,2"/>`;

        // Gate posts
        svg += this.drawPostSide(leftPostX, postTopY, postBotY, 12);
        svg += this.drawPostSide(rightPostX, postTopY, postBotY, 12);

        // Post caps
        svg += `<ellipse cx="${leftPostX}" cy="${postTopY - 2}" rx="9" ry="4.5" fill="#999" stroke="#555" stroke-width="1"/>`;
        svg += `<ellipse cx="${rightPostX}" cy="${postTopY - 2}" rx="9" ry="4.5" fill="#999" stroke="#555" stroke-width="1"/>`;

        // Hinges
        [frameTop + 15, frameMidY, frameBot - 15].forEach(hy => {
            svg += `<circle cx="${leftPostX + 1}" cy="${hy}" r="5" fill="#aaa" stroke="#555" stroke-width="1"/>`;
            svg += `<circle cx="${rightPostX - 1}" cy="${hy}" r="5" fill="#aaa" stroke="#555" stroke-width="1"/>`;
        });

        // Center latch / drop rod
        svg += `<rect x="${midX - 3}" y="${frameTop + 5}" width="6" height="${frameBot - frameTop - 10}" rx="1" fill="none" stroke="#777" stroke-width="1.5" stroke-dasharray="4,3"/>`;
        svg += `<circle cx="${midX}" cy="${frameMidY}" r="4" fill="#aaa" stroke="#555" stroke-width="1"/>`;

        // Drop rod / cane bolt
        svg += `<line x1="${midX}" y1="${frameBot}" x2="${midX}" y2="${groundY + 15}" stroke="#777" stroke-width="2"/>`;
        svg += `<circle cx="${midX}" cy="${groundY + 15}" r="3" fill="#aaa" stroke="#555" stroke-width="1"/>`;

        // Swing arcs
        const leafW = lFrameR - lFrameL;
        svg += `<path d="M${lFrameR} ${frameBot} A${leafW} ${leafW} 0 0 1 ${leftPostX + 8} ${frameBot + leafW * 0.25}" fill="none" stroke="#999" stroke-width="1" stroke-dasharray="6,4"/>`;
        svg += `<path d="M${rFrameL} ${frameBot} A${leafW} ${leafW} 0 0 0 ${rightPostX - 8} ${frameBot + leafW * 0.25}" fill="none" stroke="#999" stroke-width="1" stroke-dasharray="6,4"/>`;

        // ===== CALLOUTS =====
        svg += this.callout(leftPostX - 5, postTopY - 2, 50, postTopY - 25, 'Post Cap', 'left');
        svg += this.callout(leftPostX - 5, frameMidY, 50, frameMidY - 15, 'Gate Post', 'left');
        svg += this.callout(leftPostX + 8, frameTop + 15, 50, frameTop + 30, 'Hinges', 'left');

        svg += this.callout(rightPostX + 5, frameTop + 15, 700, frameTop - 5, 'Hinges');
        svg += this.callout(rFrameR - 20, frameTop + 3, 700, frameTop + 20, 'Gate Frame');
        svg += this.callout(rFrameR - 30, frameMidY + 20, 700, frameMidY + 30, 'Chain Link Fabric');

        svg += this.callout(midX + 3, frameMidY, midX + 60, frameMidY + 60, 'Center Latch');
        svg += this.callout(midX, groundY + 15, midX + 60, groundY + 40, 'Drop Rod / Cane Bolt');

        // ===== DIMENSIONS =====
        svg += this.dimLine(leftPostX, postTopY - 45, rightPostX, postTopY - 45, this.fmtFt(opts.gateWidth), -20);
        svg += this.dimLine(leftPostX, postTopY - 25, midX, postTopY - 25, this.fmtFt(halfGateW), -15);
        svg += this.dimLine(midX, postTopY - 25, rightPostX, postTopY - 25, this.fmtFt(halfGateW), -15);
        svg += this.dimLine(leftPostX - 45, topY, leftPostX - 45, groundY, this.fmtFt(opts.fenceHeight), -20);

        svg += '</svg>';
        return svg;
    },

    // ===== CANTILEVER GATE =====

    drawCantileverGate(opts) {
        const W = 1100, H = 480;
        const groundY = 320;
        const fenceH = opts.fenceHeight / 72 * 175;
        const gateGap = 12; // ~6" ground clearance
        const topY = groundY - fenceH;
        const postTopY = topY - 15;
        const footingDepth = 55;

        // Layout: opening on left, counterbalance on right
        const openingW = Math.min(opts.gateWidth * 1.8, 320);
        const cbW = Math.round(openingW * 0.5);
        const totalGateW = openingW + cbW;

        // Center the whole drawing horizontally with margins for callouts
        const margin = 250; // wide margin so left-side callout text fits in viewBox
        const openingLeft = margin;
        const openingRight = openingLeft + openingW;
        const gateRight = openingLeft + totalGateW;

        // Posts
        const latchPostX = openingLeft - 20;
        const roller1X = openingRight + 25;
        const roller2X = gateRight + 15;

        // Gate frame
        const frameTop = topY + 5;
        const frameBot = groundY - gateGap;
        const frameH = frameBot - frameTop;
        const frameMidY = (frameTop + frameBot) / 2;
        const frameLeft = latchPostX + 12;
        const frameRight = roller2X - 12;
        const cbDivider = frameLeft + openingW; // opening/counterbalance divider

        let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;
        svg += this.svgDefs();

        // ===== BELOW GROUND =====
        svg += `<rect x="60" y="${groundY}" width="${W - 120}" height="${footingDepth + 15}" fill="#f5edd8" opacity="0.4"/>`;
        svg += `<rect x="60" y="${groundY}" width="${W - 120}" height="${footingDepth + 15}" fill="url(#ground-fill)" opacity="0.15"/>`;

        // Concrete footings
        const drawFooting = (cx, w) => {
            const x = cx - w / 2;
            svg += `<rect x="${x}" y="${groundY}" width="${w}" height="${footingDepth}" fill="#d0d0d0" stroke="#999" stroke-width="1.5"/>`;
            svg += `<text x="${cx}" y="${groundY + footingDepth / 2 + 4}" text-anchor="middle" font-size="8" fill="#888" font-family="Arial">CONC.</text>`;
        };
        drawFooting(latchPostX, 36);
        drawFooting(roller1X, 42);
        drawFooting(roller2X, 42);

        // Ground line
        svg += `<line x1="60" y1="${groundY}" x2="${W - 60}" y2="${groundY}" stroke="#222" stroke-width="3"/>`;
        svg += `<text x="${W - 65}" y="${groundY - 5}" text-anchor="end" font-size="11" font-weight="600" fill="#555" font-family="Arial">Ground Line</text>`;

        // ===== GATE FRAME =====
        // Bold outer frame
        svg += `<rect x="${frameLeft}" y="${frameTop}" width="${frameRight - frameLeft}" height="${frameH}" fill="none" stroke="#111" stroke-width="3.5"/>`;

        // Top horizontal rail (bold)
        svg += `<line x1="${frameLeft}" y1="${frameTop + 4}" x2="${frameRight}" y2="${frameTop + 4}" stroke="#333" stroke-width="2"/>`;
        // Bottom guide rail
        svg += `<line x1="${frameLeft}" y1="${frameBot - 4}" x2="${frameRight}" y2="${frameBot - 4}" stroke="#333" stroke-width="2"/>`;
        // Mid rail
        svg += `<line x1="${frameLeft}" y1="${frameMidY}" x2="${frameRight}" y2="${frameMidY}" stroke="#444" stroke-width="1.5"/>`;

        // ===== OPENING SECTION =====
        // Chain link fabric fill
        svg += `<rect x="${frameLeft + 3}" y="${frameTop + 3}" width="${cbDivider - frameLeft - 6}" height="${frameH - 6}" fill="url(#chainlink-fill)" opacity="0.3"/>`;

        // X-brace in opening (one large X spanning full opening)
        svg += `<line x1="${frameLeft}" y1="${frameTop}" x2="${cbDivider}" y2="${frameBot}" stroke="#555" stroke-width="2"/>`;
        svg += `<line x1="${cbDivider}" y1="${frameTop}" x2="${frameLeft}" y2="${frameBot}" stroke="#555" stroke-width="2"/>`;

        // ===== COUNTERBALANCE SECTION =====
        // Bold vertical divider
        svg += `<line x1="${cbDivider}" y1="${frameTop}" x2="${cbDivider}" y2="${frameBot}" stroke="#111" stroke-width="3"/>`;

        // X-braces in counterbalance (bold, no fabric)
        svg += `<line x1="${cbDivider}" y1="${frameTop}" x2="${frameRight}" y2="${frameBot}" stroke="#333" stroke-width="2.5"/>`;
        svg += `<line x1="${frameRight}" y1="${frameTop}" x2="${cbDivider}" y2="${frameBot}" stroke="#333" stroke-width="2.5"/>`;

        // "Counterbalance" label inside
        svg += `<text x="${(cbDivider + frameRight) / 2}" y="${frameMidY + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="#666" font-family="Arial">Counter</text>`;
        svg += `<text x="${(cbDivider + frameRight) / 2}" y="${frameMidY + 16}" text-anchor="middle" font-size="11" font-weight="700" fill="#666" font-family="Arial">Balance</text>`;

        // ===== POSTS =====
        // Latch post (left, 3" OD)
        svg += this.drawPostSide(latchPostX, postTopY, groundY + footingDepth - 8, 10);
        // Roller/support posts (right, 4" OD, heavier)
        svg += this.drawPostSide(roller1X, postTopY, groundY + footingDepth - 8, 14);
        svg += this.drawPostSide(roller2X, postTopY, groundY + footingDepth - 8, 14);

        // Post caps (simple dome)
        [latchPostX, roller1X, roller2X].forEach(px => {
            svg += `<ellipse cx="${px}" cy="${postTopY - 2}" rx="9" ry="4" fill="#aaa" stroke="#555" stroke-width="1.5"/>`;
        });

        // ===== CANTILEVER ROLLER ASSEMBLIES =====
        [roller1X, roller2X].forEach(px => {
            // Roller bracket (rectangular, bolted to post)
            svg += `<rect x="${px - 14}" y="${frameBot - 10}" width="28" height="14" rx="2" fill="#bbb" stroke="#333" stroke-width="2"/>`;
            // Two rollers gripping guide rail
            svg += `<circle cx="${px - 6}" cy="${frameBot + 5}" r="5.5" fill="#ddd" stroke="#333" stroke-width="1.5"/>`;
            svg += `<circle cx="${px + 6}" cy="${frameBot + 5}" r="5.5" fill="#ddd" stroke="#333" stroke-width="1.5"/>`;
            svg += `<circle cx="${px - 6}" cy="${frameBot + 5}" r="1.5" fill="#555"/>`;
            svg += `<circle cx="${px + 6}" cy="${frameBot + 5}" r="1.5" fill="#555"/>`;
        });

        // ===== GROUND CLEARANCE =====
        const gcX = frameLeft + 15;
        svg += `<line x1="${gcX}" y1="${frameBot + 2}" x2="${gcX}" y2="${groundY}" stroke="#c44" stroke-width="1.5" marker-start="url(#arrowstart)" marker-end="url(#arrowhead)"/>`;
        svg += `<text x="${gcX + 6}" y="${(frameBot + groundY) / 2 + 4}" font-size="11" font-weight="700" fill="#c44" font-family="Arial">~6"</text>`;

        // ===== CALLOUTS =====
        // Left side — x2=160 gives tx=154, enough room for ~140px of text with text-anchor="end"
        svg += this.callout(latchPostX, postTopY + 20, 160, postTopY + 5, 'Latch Post (3")', 'left');
        svg += this.callout(frameLeft + 5, frameMidY, 160, frameMidY + 25, 'Chain Link Fill', 'left');
        svg += this.callout(latchPostX, groundY + 25, 160, groundY + 40, 'Concrete Footing', 'left');

        // Right side
        const rCallX = roller2X + 25;
        svg += this.callout(roller2X, postTopY + 20, rCallX, postTopY - 5, 'Roller Posts (4")');
        svg += this.callout(roller1X + 8, frameBot + 5, rCallX, groundY + 25, 'Cantilever Rollers');

        // Top callouts
        const openCX = (frameLeft + cbDivider) / 2;
        svg += this.callout(openCX, frameTop + 2, openCX, frameTop - 30, 'Opening');

        // Gate travel arrow
        svg += `<line x1="${openingLeft + 20}" y1="${groundY + footingDepth + 12}" x2="${openingLeft + 100}" y2="${groundY + footingDepth + 12}" stroke="#c44" stroke-width="2.5" marker-end="url(#arrowhead)"/>`;
        svg += `<text x="${openingLeft + 110}" y="${groundY + footingDepth + 16}" font-size="13" font-weight="700" fill="#c44" font-family="Arial">GATE TRAVEL</text>`;

        // ===== DIMENSIONS =====
        svg += this.dimLine(openingLeft, 25, openingRight, 25, this.fmtFt(opts.gateWidth), -16);
        svg += this.dimLine(openingLeft, 50, gateRight, 50, `${this.fmtFt(Math.round(opts.gateWidth * 1.5))} Total Gate`, -14);
        svg += this.dimLine(40, topY, 40, groundY, this.fmtFt(opts.fenceHeight), -18);

        svg += '</svg>';
        return svg;
    },

    // ===== ROLLER SLIDE GATE =====

    drawSlideGate(opts) {
        const W = 750, H = 420;
        const groundY = 300;
        const fenceH = opts.fenceHeight / 72 * 180;
        const topY = groundY - fenceH;
        const postTopY = topY - 15;
        const postBotY = groundY + 35;

        const openingW = Math.min(opts.gateWidth * 2.2, 400);
        const centerX = W / 2;
        const leftPostX = centerX - openingW / 2;
        const rightPostX = centerX + openingW / 2;

        let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;
        svg += this.svgDefs();

        // Ground line
        svg += `<line x1="40" y1="${groundY}" x2="710" y2="${groundY}" stroke="#666" stroke-width="2"/>`;
        svg += `<rect x="40" y="${groundY}" width="670" height="6" fill="url(#ground-fill)" opacity="0.3"/>`;

        // V-track on ground
        svg += `<line x1="${leftPostX - 10}" y1="${groundY + 3}" x2="${rightPostX + openingW * 0.6}" y2="${groundY + 3}" stroke="#777" stroke-width="2.5"/>`;
        svg += `<text x="${(leftPostX + rightPostX + openingW * 0.6) / 2}" y="${groundY + 16}" text-anchor="middle" font-size="9" fill="#777" font-family="Arial">V-TRACK</text>`;

        // Footings
        svg += this.drawFooting(leftPostX, groundY, 36, 48);
        svg += this.drawFooting(rightPostX, groundY, 36, 48);

        // Gate frame
        const frameTop = topY + 10;
        const frameBot = groundY - 8;
        const frameLeft = leftPostX + 8;
        const frameRight = rightPostX - 8;
        const frameMidY = (frameTop + frameBot) / 2;

        svg += `<rect x="${frameLeft}" y="${frameTop}" width="${frameRight - frameLeft}" height="${frameBot - frameTop}" fill="none" stroke="#555" stroke-width="2.5" rx="1"/>`;
        svg += `<rect x="${frameLeft + 3}" y="${frameTop + 3}" width="${frameRight - frameLeft - 6}" height="${frameBot - frameTop - 6}" fill="url(#chainlink-fill)" opacity="0.4"/>`;
        svg += `<line x1="${frameLeft}" y1="${frameMidY}" x2="${frameRight}" y2="${frameMidY}" stroke="#555" stroke-width="1.5"/>`;
        svg += `<line x1="${frameLeft}" y1="${frameTop}" x2="${frameRight}" y2="${frameMidY}" stroke="#888" stroke-width="1" stroke-dasharray="4,2"/>`;

        // Roller wheels on bottom of gate
        const wheel1X = frameLeft + 30;
        const wheel2X = frameRight - 30;
        [wheel1X, wheel2X].forEach(wx => {
            svg += `<circle cx="${wx}" cy="${frameBot + 4}" r="7" fill="#ccc" stroke="#555" stroke-width="1.5"/>`;
            svg += `<circle cx="${wx}" cy="${frameBot + 4}" r="2" fill="#777"/>`;
        });

        // Posts
        svg += this.drawPostSide(leftPostX, postTopY, postBotY, 14);
        svg += this.drawPostSide(rightPostX, postTopY, postBotY, 14);

        // Post caps
        svg += `<ellipse cx="${leftPostX}" cy="${postTopY - 2}" rx="10" ry="5" fill="#999" stroke="#555" stroke-width="1"/>`;
        svg += `<ellipse cx="${rightPostX}" cy="${postTopY - 2}" rx="10" ry="5" fill="#999" stroke="#555" stroke-width="1"/>`;

        // Guide brackets on posts
        [leftPostX, rightPostX].forEach(px => {
            svg += `<rect x="${px - 10}" y="${frameTop}" width="20" height="8" rx="2" fill="#aaa" stroke="#555" stroke-width="1"/>`;
        });

        // Latch
        svg += `<rect x="${rightPostX - 5}" y="${frameMidY - 10}" width="10" height="20" rx="2" fill="#aaa" stroke="#555" stroke-width="1"/>`;

        // Slide direction arrow
        const arrowY = groundY + 35;
        svg += `<line x1="${centerX}" y1="${arrowY}" x2="${centerX + 70}" y2="${arrowY}" stroke="#c44" stroke-width="1.5" marker-end="url(#arrowhead)"/>`;
        svg += `<text x="${centerX + 35}" y="${arrowY - 5}" text-anchor="middle" font-size="9" fill="#c44" font-family="Arial">SLIDE OPEN</text>`;

        // ===== CALLOUTS =====
        svg += this.callout(leftPostX - 5, frameMidY, 40, frameMidY - 25, 'Gate Post', 'left');
        svg += this.callout(leftPostX + 3, frameTop + 3, 40, frameTop - 15, 'Top Guide', 'left');
        svg += this.callout(rightPostX + 5, frameMidY - 5, 700, frameMidY - 25, 'Latch Post');
        svg += this.callout(rightPostX + 5, frameMidY + 5, 700, frameMidY + 5, 'Fork Latch');
        svg += this.callout(wheel1X, frameBot + 8, wheel1X - 30, groundY + 50, 'Roller Wheels', 'left');
        svg += this.callout(frameLeft + (frameRight - frameLeft) / 2, frameTop + 3, frameLeft + (frameRight - frameLeft) / 2, frameTop - 20, 'Gate Frame');
        svg += this.callout(frameLeft + (frameRight - frameLeft) / 2, frameMidY + 20, 700, frameMidY + 35, 'Chain Link Fabric');

        // ===== DIMENSIONS =====
        svg += this.dimLine(leftPostX, postTopY - 45, rightPostX, postTopY - 45, this.fmtFt(opts.gateWidth), -20);
        svg += this.dimLine(leftPostX - 50, topY, leftPostX - 50, groundY, this.fmtFt(opts.fenceHeight), -20);

        svg += '</svg>';
        return svg;
    },

    // ===== WOOD FENCE SECTION =====

    drawWoodFence(opts) {
        const W = 750, H = 420;
        const groundY = 320;
        const fenceH = opts.fenceHeight / 72 * 200;
        const topY = groundY - fenceH;
        const postTopY = topY - 8;
        const postBotY = groundY + 40;
        const leftPostX = 130, rightPostX = 590, linePostX = 360;
        const postW = opts.woodPost === '6x6' ? 14 : 10;
        const railH = 6;

        let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;
        svg += this.svgDefs();

        // Ground line
        svg += `<line x1="60" y1="${groundY}" x2="700" y2="${groundY}" stroke="#666" stroke-width="2"/>`;
        svg += `<rect x="60" y="${groundY}" width="640" height="8" fill="url(#ground-fill)" opacity="0.3"/>`;

        // Footings
        svg += this.drawFooting(leftPostX, groundY, 28, 45);
        svg += this.drawFooting(rightPostX, groundY, 28, 45);
        svg += this.drawFooting(linePostX, groundY, 24, 38);

        // Rail positions
        const railPositions = [];
        if (opts.woodStyle === 'split-rail') {
            // Split rail: rails go through the post
            for (let i = 0; i < opts.woodRails; i++) {
                railPositions.push(topY + 20 + i * (fenceH - 30) / Math.max(1, opts.woodRails - 1));
            }
        } else {
            // Standard rails: top and bottom (and optional mid)
            railPositions.push(topY + 12); // top rail near top
            if (opts.woodRails >= 3) railPositions.push(topY + fenceH / 2); // mid
            railPositions.push(groundY - 15); // bottom rail near bottom
        }

        // Pickets / boards (between posts, in front of rails)
        if (opts.woodStyle !== 'split-rail') {
            const sectionL = leftPostX + postW / 2 + 1;
            const sectionR = linePostX - postW / 2 - 1;
            const sectionW = sectionR - sectionL;
            let picketW, gap;
            if (opts.woodPicket === '1x4') { picketW = 5; } else { picketW = 7; }

            if (opts.woodStyle === 'privacy' || opts.woodStyle === 'stockade') {
                gap = 0;
            } else if (opts.woodStyle === 'shadow-box') {
                gap = picketW * 0.8;
            } else { // picket
                gap = 4;
            }

            const stride = picketW + gap;
            const numPickets = gap === 0 ? Math.ceil(sectionW / picketW) : Math.floor(sectionW / stride);

            // Draw pickets for left section
            for (let i = 0; i < numPickets && i < 30; i++) {
                const px = sectionL + i * stride;
                if (px + picketW > sectionR + 2) break;
                const pTop = opts.woodPicket === 'dog-ear' ? topY + 6 : topY + 4;
                svg += `<rect x="${px}" y="${pTop}" width="${picketW}" height="${groundY - pTop - 3}" fill="url(#wood-grain)" stroke="#8B6914" stroke-width="0.5"/>`;
                // Dog ear top
                if (opts.woodPicket === 'dog-ear' && i % 3 === 0) {
                    svg += `<polygon points="${px},${pTop + 4} ${px + picketW / 2},${pTop - 3} ${px + picketW},${pTop + 4}" fill="#c49a6c" stroke="#8B6914" stroke-width="0.5"/>`;
                }
            }

            // Shadow box: back pickets (slightly offset, shown with opacity)
            if (opts.woodStyle === 'shadow-box') {
                for (let i = 0; i < numPickets && i < 30; i++) {
                    const px = sectionL + i * stride + stride / 2;
                    if (px + picketW > sectionR + 2) break;
                    svg += `<rect x="${px}" y="${topY + 6}" width="${picketW}" height="${groundY - topY - 9}" fill="#a07840" stroke="#8B6914" stroke-width="0.4" opacity="0.5"/>`;
                }
            }

            // Repeat for right section (fewer pickets for visual)
            const sec2L = linePostX + postW / 2 + 1;
            const sec2R = rightPostX - postW / 2 - 1;
            const numPickets2 = Math.min(numPickets, 15);
            for (let i = 0; i < numPickets2; i++) {
                const px = sec2L + i * stride;
                if (px + picketW > sec2R + 2) break;
                const pTop = opts.woodPicket === 'dog-ear' ? topY + 6 : topY + 4;
                svg += `<rect x="${px}" y="${pTop}" width="${picketW}" height="${groundY - pTop - 3}" fill="url(#wood-grain)" stroke="#8B6914" stroke-width="0.5"/>`;
            }
        }

        // Rails
        railPositions.forEach(ry => {
            if (opts.woodStyle === 'split-rail') {
                // Split rail style — zig-zag through post
                svg += `<rect x="${leftPostX + postW / 2}" y="${ry - railH / 2}" width="${linePostX - leftPostX - postW}" height="${railH}" fill="#c49a6c" stroke="#8B6914" stroke-width="1"/>`;
                svg += `<rect x="${linePostX + postW / 2}" y="${ry - railH / 2}" width="${rightPostX - linePostX - postW}" height="${railH}" fill="#c49a6c" stroke="#8B6914" stroke-width="1"/>`;
            } else {
                svg += `<rect x="${leftPostX - 2}" y="${ry - railH / 2}" width="${rightPostX - leftPostX + 4}" height="${railH}" fill="#c49a6c" stroke="#8B6914" stroke-width="1"/>`;
            }
        });

        // Posts (drawn on top of rails/pickets)
        [leftPostX, linePostX, rightPostX].forEach(px => {
            svg += `<rect x="${px - postW / 2}" y="${postTopY}" width="${postW}" height="${postBotY - postTopY}" fill="#b8860b" stroke="#6B4226" stroke-width="1.5"/>`;
            // Wood texture lines
            for (let ly = postTopY + 8; ly < postBotY - 5; ly += 12) {
                svg += `<line x1="${px - postW / 2 + 2}" y1="${ly}" x2="${px + postW / 2 - 2}" y2="${ly + 3}" stroke="#9B7530" stroke-width="0.5" opacity="0.5"/>`;
            }
        });

        // Post caps
        if (opts.woodPostCaps) {
            [leftPostX, linePostX, rightPostX].forEach(px => {
                svg += `<polygon points="${px - postW / 2 - 2},${postTopY} ${px},${postTopY - 8} ${px + postW / 2 + 2},${postTopY}" fill="#a07840" stroke="#6B4226" stroke-width="1"/>`;
            });
        }

        // Kickboard
        if (opts.woodKickboard) {
            svg += `<rect x="${leftPostX + postW / 2}" y="${groundY - 10}" width="${rightPostX - leftPostX - postW}" height="8" fill="#a07840" stroke="#8B6914" stroke-width="0.5"/>`;
        }

        // ===== CALLOUTS =====
        svg += this.callout(rightPostX + postW / 2 + 3, postTopY, 690, postTopY - 20, opts.woodPostCaps ? 'Post Cap' : `${opts.woodPost} Post`);
        svg += this.callout(rightPostX + postW / 2 + 3, railPositions[0], 690, railPositions[0] - 5, `${opts.woodRail} Rail`);
        if (opts.woodStyle !== 'split-rail') {
            svg += this.callout(rightPostX - 20, topY + fenceH / 2, 690, topY + fenceH / 2 + 20, `${opts.woodPicket} ${opts.woodStyle === 'privacy' ? 'Board' : 'Picket'}`);
        }
        svg += this.callout(rightPostX + 3, groundY + 15, 690, groundY + 25, `${opts.woodPost} Post`);
        if (opts.woodKickboard) {
            svg += this.callout(leftPostX + 50, groundY - 6, 70, groundY + 40, 'Kickboard', 'left');
        }
        svg += this.callout(leftPostX - 5, topY + fenceH / 2, 65, topY + fenceH / 2, `${opts.woodType}`, 'left');
        svg += this.callout(linePostX, postTopY - 3, linePostX + 50, postTopY - 30, 'Line Post');

        // ===== DIMENSIONS =====
        svg += this.dimLine(leftPostX, postTopY - 45, rightPostX, postTopY - 45, `10' Max Post Spacing`, -20);
        svg += this.dimLine(leftPostX - 40, topY, leftPostX - 40, groundY, this.fmtFt(opts.fenceHeight), -20);

        svg += '</svg>';
        return svg;
    },

    // ===== VINYL / PVC FENCE SECTION =====

    drawVinylFence(opts) {
        const W = 750, H = 420;
        const groundY = 320;
        const fenceH = opts.fenceHeight / 72 * 200;
        const topY = groundY - fenceH;
        const postTopY = topY - 10;
        const postBotY = groundY + 40;
        const leftPostX = 140, rightPostX = 580;
        const postW = opts.vinylPost === '5x5' ? 14 : 12;
        const vinylWall = 2; // vinyl wall thickness visual

        let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;
        svg += this.svgDefs();

        // Ground line
        svg += `<line x1="60" y1="${groundY}" x2="700" y2="${groundY}" stroke="#666" stroke-width="2"/>`;
        svg += `<rect x="60" y="${groundY}" width="640" height="8" fill="url(#ground-fill)" opacity="0.3"/>`;

        // Footings
        svg += this.drawFooting(leftPostX, groundY, 30, 45);
        svg += this.drawFooting(rightPostX, groundY, 30, 45);

        // Color mapping
        const vinylFill = opts.vinylColor === 'Tan' ? '#e8d5b0' : opts.vinylColor === 'Gray' ? '#c8c8c8' : '#f5f5f0';
        const vinylStroke = opts.vinylColor === 'Tan' ? '#b8a080' : opts.vinylColor === 'Gray' ? '#999' : '#ccc';

        // Determine rail positions
        const railPositions = [];
        if (opts.vinylStyle === 'ranch-rail') {
            for (let i = 0; i < 3; i++) {
                railPositions.push(topY + 15 + i * (fenceH - 30) / 2);
            }
        } else {
            railPositions.push(topY + 10); // top
            railPositions.push(topY + fenceH / 2); // mid
            railPositions.push(groundY - 12); // bottom
        }

        // Panel fill between rails (privacy/semi-privacy)
        if (opts.vinylStyle === 'privacy') {
            svg += `<rect x="${leftPostX + postW / 2 + 2}" y="${topY + 5}" width="${rightPostX - leftPostX - postW - 4}" height="${fenceH - 10}" fill="${vinylFill}" stroke="${vinylStroke}" stroke-width="1"/>`;
            // T&G lines
            const panelL = leftPostX + postW / 2 + 2;
            const panelR = rightPostX - postW / 2 - 2;
            for (let lx = panelL + 8; lx < panelR; lx += 8) {
                svg += `<line x1="${lx}" y1="${topY + 6}" x2="${lx}" y2="${groundY - 6}" stroke="${vinylStroke}" stroke-width="0.3"/>`;
            }
        } else if (opts.vinylStyle === 'semi-privacy') {
            const panelL = leftPostX + postW / 2 + 4;
            const panelR = rightPostX - postW / 2 - 4;
            for (let lx = panelL; lx < panelR; lx += 12) {
                svg += `<rect x="${lx}" y="${topY + 8}" width="7" height="${fenceH - 16}" fill="${vinylFill}" stroke="${vinylStroke}" stroke-width="0.5"/>`;
            }
        } else if (opts.vinylStyle === 'picket') {
            const panelL = leftPostX + postW / 2 + 4;
            const panelR = rightPostX - postW / 2 - 4;
            const picketH = fenceH * 0.7;
            for (let lx = panelL; lx < panelR; lx += 10) {
                const pTop = topY + 15;
                svg += `<rect x="${lx}" y="${pTop}" width="4" height="${picketH}" fill="${vinylFill}" stroke="${vinylStroke}" stroke-width="0.5"/>`;
                // Pointed top
                svg += `<polygon points="${lx},${pTop} ${lx + 2},${pTop - 6} ${lx + 4},${pTop}" fill="${vinylFill}" stroke="${vinylStroke}" stroke-width="0.5"/>`;
            }
        }

        // Rails
        railPositions.forEach(ry => {
            svg += `<rect x="${leftPostX + postW / 2}" y="${ry - 4}" width="${rightPostX - leftPostX - postW}" height="8" fill="${vinylFill}" stroke="${vinylStroke}" stroke-width="1" rx="1"/>`;
        });

        // Bracket indicators at rail-post connections
        railPositions.forEach(ry => {
            [leftPostX, rightPostX].forEach(px => {
                const bx = px === leftPostX ? px + postW / 2 - 2 : px - postW / 2 - 4;
                svg += `<rect x="${bx}" y="${ry - 5}" width="6" height="10" rx="1" fill="#ddd" stroke="#aaa" stroke-width="0.8"/>`;
            });
        });

        // Posts (hollow vinyl with optional aluminum insert)
        [leftPostX, rightPostX].forEach(px => {
            // Outer vinyl post
            svg += `<rect x="${px - postW / 2}" y="${postTopY}" width="${postW}" height="${postBotY - postTopY}" fill="${vinylFill}" stroke="${vinylStroke}" stroke-width="1.5"/>`;
            // Inner wall (hollow)
            svg += `<rect x="${px - postW / 2 + vinylWall}" y="${postTopY + vinylWall}" width="${postW - vinylWall * 2}" height="${postBotY - postTopY - vinylWall * 2}" fill="white" stroke="${vinylStroke}" stroke-width="0.5"/>`;
            // Aluminum insert
            if (opts.vinylAlum) {
                svg += `<rect x="${px - 2}" y="${postTopY + 4}" width="4" height="${postBotY - postTopY - 8}" fill="#c0c0c0" stroke="#999" stroke-width="0.5"/>`;
            }
        });

        // Post caps
        if (opts.vinylPostCaps) {
            [leftPostX, rightPostX].forEach(px => {
                // Pyramid/gothic cap
                svg += `<polygon points="${px - postW / 2 - 1},${postTopY} ${px},${postTopY - 10} ${px + postW / 2 + 1},${postTopY}" fill="${vinylFill}" stroke="${vinylStroke}" stroke-width="1"/>`;
            });
        }

        // ===== CALLOUTS =====
        svg += this.callout(rightPostX + postW / 2 + 3, postTopY - 5, 690, postTopY - 25, 'Post Cap');
        svg += this.callout(rightPostX + postW / 2 + 3, topY + 20, 690, topY + 5, `${opts.vinylPost} Vinyl Post`);
        if (opts.vinylAlum) {
            svg += this.callout(rightPostX + 3, topY + fenceH / 3, 690, topY + 40, 'Aluminum Insert');
        }
        svg += this.callout(rightPostX - 15, railPositions[0], 690, railPositions[0] + 20, 'Vinyl Rail');
        svg += this.callout(rightPostX - 15, railPositions[0] + 3, 690, railPositions[0] + 35, 'w/ Bracket');
        if (opts.vinylStyle !== 'ranch-rail') {
            const panelLabel = opts.vinylStyle === 'picket' ? 'Vinyl Pickets' : 'T&G Panel';
            svg += this.callout(rightPostX - 40, topY + fenceH / 2, 690, topY + fenceH / 2 + 10, panelLabel);
        }
        svg += this.callout(leftPostX - postW / 2 - 3, topY + fenceH / 2, 60, topY + fenceH / 2, `${opts.vinylColor} Vinyl`, 'left');
        svg += this.callout(rightPostX + 3, groundY + 15, 690, groundY + 30, 'Concrete Footing');

        // ===== DIMENSIONS =====
        svg += this.dimLine(leftPostX, postTopY - 40, rightPostX, postTopY - 40, `${opts.vinylSection}' Section`, -20);
        svg += this.dimLine(leftPostX - 40, topY, leftPostX - 40, groundY, this.fmtFt(opts.fenceHeight), -20);

        svg += '</svg>';
        return svg;
    },

    // ===== ORNAMENTAL IRON / ALUMINUM SECTION =====

    drawOrnamentalFence(opts) {
        const W = 750, H = 420;
        const groundY = 320;
        const fenceH = opts.fenceHeight / 72 * 200;
        const topY = groundY - fenceH;
        const postTopY = topY - 10;
        const postBotY = groundY + 35;
        const leftPostX = 120, rightPostX = 600;
        const postW = opts.ornPost === '3x3' ? 12 : opts.ornPost === '2.5x2.5' ? 10 : 8;

        // Color mapping
        const metalFill = opts.ornColor === 'Bronze' ? '#5c4033' : opts.ornColor === 'White' ? '#e8e8e8' : opts.ornColor === 'Green' ? '#2d5a3d' : '#333';
        const metalStroke = opts.ornColor === 'Bronze' ? '#3a2518' : opts.ornColor === 'White' ? '#bbb' : opts.ornColor === 'Green' ? '#1a3a25' : '#111';

        let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;
        svg += this.svgDefs();

        // Ground line
        svg += `<line x1="50" y1="${groundY}" x2="710" y2="${groundY}" stroke="#666" stroke-width="2"/>`;
        svg += `<rect x="50" y="${groundY}" width="660" height="8" fill="url(#ground-fill)" opacity="0.3"/>`;

        // Footings
        svg += this.drawFooting(leftPostX, groundY, 26, 40);
        svg += this.drawFooting(rightPostX, groundY, 26, 40);

        // Horizontal rails
        const topRailY = topY + 15;
        const botRailY = groundY - 15;
        svg += `<rect x="${leftPostX + postW / 2}" y="${topRailY - 3}" width="${rightPostX - leftPostX - postW}" height="6" fill="${metalFill}" stroke="${metalStroke}" stroke-width="1" rx="1"/>`;
        svg += `<rect x="${leftPostX + postW / 2}" y="${botRailY - 3}" width="${rightPostX - leftPostX - postW}" height="6" fill="${metalFill}" stroke="${metalStroke}" stroke-width="1" rx="1"/>`;

        // Pickets
        const panelL = leftPostX + postW / 2 + 6;
        const panelR = rightPostX - postW / 2 - 6;
        const picketSpacing = 12;
        const picketW = 3;
        const numPickets = Math.floor((panelR - panelL) / picketSpacing);

        // Puppy picket: additional close-spaced pickets in lower half
        const isPuppy = opts.ornStyle === 'puppy-picket';
        const puppyMidY = topRailY + (botRailY - topRailY) * 0.55;

        for (let i = 0; i <= numPickets; i++) {
            const px = panelL + i * picketSpacing;
            if (px > panelR) break;

            // Main picket
            const picketTop = topRailY - 8;
            svg += `<rect x="${px - picketW / 2}" y="${picketTop}" width="${picketW}" height="${botRailY - picketTop + 3}" fill="${metalFill}" stroke="${metalStroke}" stroke-width="0.5"/>`;

            // Picket top style
            if (opts.ornStyle === 'spear-top') {
                svg += `<polygon points="${px - 3},${picketTop} ${px},${picketTop - 10} ${px + 3},${picketTop}" fill="${metalFill}" stroke="${metalStroke}" stroke-width="0.5"/>`;
                // Small ball under spear
                svg += `<circle cx="${px}" cy="${picketTop - 1}" r="2" fill="${metalFill}" stroke="${metalStroke}" stroke-width="0.3"/>`;
            } else if (opts.ornStyle === 'flat-top') {
                svg += `<rect x="${px - 2}" y="${picketTop - 2}" width="4" height="2" fill="${metalFill}" stroke="${metalStroke}" stroke-width="0.3"/>`;
            }

            // Puppy picket: intermediate pickets in lower portion
            if (isPuppy && i < numPickets) {
                const midPx = px + picketSpacing / 2;
                if (midPx < panelR) {
                    svg += `<rect x="${midPx - picketW / 2}" y="${puppyMidY}" width="${picketW}" height="${botRailY - puppyMidY + 3}" fill="${metalFill}" stroke="${metalStroke}" stroke-width="0.4"/>`;
                }
            }
        }

        // Puppy picket mid rail
        if (isPuppy) {
            svg += `<rect x="${leftPostX + postW / 2}" y="${puppyMidY - 2}" width="${rightPostX - leftPostX - postW}" height="4" fill="${metalFill}" stroke="${metalStroke}" stroke-width="0.8"/>`;
        }

        // Posts
        [leftPostX, rightPostX].forEach(px => {
            svg += `<rect x="${px - postW / 2}" y="${postTopY}" width="${postW}" height="${postBotY - postTopY}" fill="${metalFill}" stroke="${metalStroke}" stroke-width="1.5"/>`;
            // Highlight line
            svg += `<line x1="${px - postW / 2 + 1.5}" y1="${postTopY + 3}" x2="${px - postW / 2 + 1.5}" y2="${postBotY - 3}" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>`;
        });

        // Post caps
        [leftPostX, rightPostX].forEach(px => {
            if (opts.ornCap === 'ball') {
                svg += `<rect x="${px - postW / 2 - 1}" y="${postTopY - 2}" width="${postW + 2}" height="4" fill="${metalFill}" stroke="${metalStroke}" stroke-width="0.8"/>`;
                svg += `<circle cx="${px}" cy="${postTopY - 8}" r="6" fill="${metalFill}" stroke="${metalStroke}" stroke-width="1"/>`;
                svg += `<ellipse cx="${px - 1.5}" cy="${postTopY - 10}" rx="2" ry="1.5" fill="rgba(255,255,255,0.2)"/>`;
            } else if (opts.ornCap === 'finial') {
                svg += `<rect x="${px - postW / 2 - 1}" y="${postTopY - 2}" width="${postW + 2}" height="3" fill="${metalFill}" stroke="${metalStroke}" stroke-width="0.8"/>`;
                svg += `<polygon points="${px - 3},${postTopY - 2} ${px},${postTopY - 16} ${px + 3},${postTopY - 2}" fill="${metalFill}" stroke="${metalStroke}" stroke-width="0.8"/>`;
            } else {
                // Flat cap
                svg += `<rect x="${px - postW / 2 - 2}" y="${postTopY - 4}" width="${postW + 4}" height="5" rx="1" fill="${metalFill}" stroke="${metalStroke}" stroke-width="0.8"/>`;
            }
        });

        // Panel brackets at post connections
        [leftPostX, rightPostX].forEach(px => {
            [topRailY, botRailY].forEach(ry => {
                const bx = px === leftPostX ? px + postW / 2 - 1 : px - postW / 2 - 5;
                svg += `<rect x="${bx}" y="${ry - 5}" width="6" height="10" rx="1" fill="${metalFill}" stroke="${metalStroke}" stroke-width="0.5" opacity="0.7"/>`;
            });
        });

        // ===== CALLOUTS =====
        const capLabel = opts.ornCap.charAt(0).toUpperCase() + opts.ornCap.slice(1) + ' Cap';
        svg += this.callout(rightPostX + postW / 2 + 3, postTopY - 5, 695, postTopY - 30, capLabel);
        svg += this.callout(rightPostX + postW / 2 + 3, topRailY, 695, topRailY - 10, 'Top Rail');
        svg += this.callout(rightPostX + postW / 2 + 3, botRailY, 695, botRailY + 5, 'Bottom Rail');
        svg += this.callout(rightPostX - 20, (topRailY + botRailY) / 2, 695, (topRailY + botRailY) / 2 + 20, `${opts.ornStyle.replace('-', ' ')} Pickets`);
        svg += this.callout(rightPostX + 3, groundY + 10, 695, groundY + 25, `${opts.ornPost} ${opts.ornMaterial} Post`);

        svg += this.callout(leftPostX + postW / 2 + 2, topRailY, 60, topRailY + 20, 'Panel Bracket', 'left');
        if (isPuppy) {
            svg += this.callout(leftPostX + 40, puppyMidY, 60, puppyMidY + 40, 'Puppy Picket Rail', 'left');
        }

        // ===== DIMENSIONS =====
        svg += this.dimLine(leftPostX, postTopY - 50, rightPostX, postTopY - 50, `6' Panel Width`, -20);
        svg += this.dimLine(leftPostX - 40, topY, leftPostX - 40, groundY, this.fmtFt(opts.fenceHeight), -20);

        svg += '</svg>';
        return svg;
    },

    // ===== WELDED WIRE PANEL SECTION =====

    drawWirePanelFence(opts) {
        const W = 750, H = 420;
        const groundY = 320;
        const fenceH = opts.fenceHeight / 72 * 200;
        const topY = groundY - fenceH;
        const postTopY = topY - 8;
        const postBotY = groundY + 35;
        const leftPostX = 120, rightPostX = 600, linePostX = 360;

        let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;
        svg += this.svgDefs();

        // Ground line
        svg += `<line x1="50" y1="${groundY}" x2="710" y2="${groundY}" stroke="#666" stroke-width="2"/>`;
        svg += `<rect x="50" y="${groundY}" width="660" height="8" fill="url(#ground-fill)" opacity="0.3"/>`;

        // Footings (T-posts don't get concrete footings visually)
        if (opts.wpPost !== 't-post') {
            svg += this.drawFooting(leftPostX, groundY, 26, 40);
            svg += this.drawFooting(rightPostX, groundY, 26, 40);
            svg += this.drawFooting(linePostX, groundY, 22, 32);
        }

        // Wire panel (grid fill)
        const panelLeft = leftPostX + 8;
        const panelRight = rightPostX - 8;
        svg += `<rect x="${panelLeft}" y="${topY + 5}" width="${panelRight - panelLeft}" height="${fenceH - 10}" fill="url(#wire-grid)" stroke="#888" stroke-width="1"/>`;

        // Top rail (optional pipe)
        if (opts.wpTopRail) {
            svg += this.drawRailHoriz(leftPostX - 2, rightPostX + 2, topY + 3, 6);
        }

        // Tension wire at bottom
        if (opts.wpTension) {
            svg += `<line x1="${leftPostX}" y1="${groundY - 5}" x2="${rightPostX}" y2="${groundY - 5}" stroke="#777" stroke-width="1.5" stroke-dasharray="8,3"/>`;
        }

        // Posts
        if (opts.wpPost === 't-post') {
            // T-post shape (T cross-section)
            [leftPostX, linePostX, rightPostX].forEach(px => {
                // Main flange
                svg += `<rect x="${px - 1.5}" y="${postTopY}" width="3" height="${postBotY - postTopY + 10}" fill="#666" stroke="#444" stroke-width="1"/>`;
                // Anchor plate / studs
                for (let sy = topY + 20; sy < groundY - 10; sy += 25) {
                    svg += `<rect x="${px - 4}" y="${sy}" width="8" height="3" rx="1" fill="#888" stroke="#555" stroke-width="0.5"/>`;
                }
                // T-post safety cap
                svg += `<rect x="${px - 4}" y="${postTopY - 5}" width="8" height="6" rx="2" fill="#4a4" stroke="#383" stroke-width="1"/>`;
            });
        } else if (opts.wpPost === 'pipe') {
            [leftPostX, linePostX, rightPostX].forEach(px => {
                svg += this.drawPostSide(px, postTopY, postBotY, 8);
                svg += `<ellipse cx="${px}" cy="${postTopY - 2}" rx="6" ry="3" fill="#999" stroke="#555" stroke-width="1"/>`;
            });
        } else {
            // Wood 4x4
            [leftPostX, linePostX, rightPostX].forEach(px => {
                svg += `<rect x="${px - 5}" y="${postTopY}" width="10" height="${postBotY - postTopY}" fill="#b8860b" stroke="#6B4226" stroke-width="1.5"/>`;
                // Wood texture
                for (let ly = postTopY + 8; ly < postBotY - 5; ly += 14) {
                    svg += `<line x1="${px - 3}" y1="${ly}" x2="${px + 3}" y2="${ly + 2}" stroke="#9B7530" stroke-width="0.5" opacity="0.5"/>`;
                }
            });
        }

        // Wire clips at posts
        [leftPostX, linePostX, rightPostX].forEach(px => {
            const clipX = px + (opts.wpPost === 't-post' ? 3 : 6);
            for (let cy = topY + 25; cy < groundY - 20; cy += 50) {
                svg += `<path d="M${clipX} ${cy - 3} L${clipX + 5} ${cy} L${clipX} ${cy + 3}" fill="none" stroke="#666" stroke-width="1"/>`;
            }
        });

        // ===== CALLOUTS =====
        const postLabel = opts.wpPost === 't-post' ? 'Steel T-Post' : opts.wpPost === 'pipe' ? 'Pipe Post (2-3/8")' : '4x4 Wood Post';
        svg += this.callout(rightPostX + 8, postTopY, 695, postTopY - 20, postLabel);
        if (opts.wpPost === 't-post') {
            svg += this.callout(rightPostX + 5, postTopY - 2, 695, postTopY - 40, 'Safety Cap');
        }
        svg += this.callout(rightPostX - 15, topY + fenceH / 3, 695, topY + fenceH / 3, `${opts.wpType.replace('-', ' ')} Panel`);
        svg += this.callout(rightPostX - 15, topY + fenceH / 3, 695, topY + fenceH / 3 + 14, `${opts.wpGauge} Ga.`);
        svg += this.callout(rightPostX + 10, topY + fenceH / 2, 695, topY + fenceH / 2 + 20, 'Wire Clips');
        if (opts.wpTopRail) {
            svg += this.callout(linePostX + 40, topY + 3, linePostX + 40, topY - 25, 'Top Rail (Pipe)');
        }
        if (opts.wpTension) {
            svg += this.callout(linePostX - 40, groundY - 5, 60, groundY + 30, 'Tension Wire', 'left');
        }

        svg += this.callout(linePostX, postTopY - 3, linePostX + 60, postTopY - 35, 'Line Post');

        // ===== DIMENSIONS =====
        svg += this.dimLine(leftPostX, postTopY - 50, rightPostX, postTopY - 50, `8' Max Post Spacing`, -20);
        svg += this.dimLine(leftPostX - 40, topY, leftPostX - 40, groundY, this.fmtFt(opts.fenceHeight), -20);

        svg += '</svg>';
        return svg;
    },

    // ===== CANVAS EXPORT (original behavior) =====

    drawCanvasExport(opts) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        Drawing.elements.forEach(el => {
            const b = Drawing.getElementBounds(el);
            minX = Math.min(minX, b.x);
            minY = Math.min(minY, b.y);
            maxX = Math.max(maxX, b.x + b.w);
            maxY = Math.max(maxY, b.y + b.h);
        });
        if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 100; maxY = 100; }
        const pad = 24;
        minX -= pad; minY -= pad; maxX += pad; maxY += pad;
        const drawW = maxX - minX;
        const drawH = maxY - minY;
        const scale = Math.min(700 / drawW, 400 / drawH, 3);

        const tx = (x) => (x - minX) * scale;
        const ty = (y) => (y - minY) * scale;

        let svg = `<svg viewBox="0 0 ${Math.ceil(drawW * scale)} ${Math.ceil(drawH * scale)}" width="${Math.ceil(drawW * scale)}" height="${Math.ceil(drawH * scale)}" xmlns="http://www.w3.org/2000/svg">`;

        Drawing.elements.forEach(el => {
            switch (el.type) {
                case 'post': {
                    const r = Math.max(el.size * 1.5 * scale, 3);
                    svg += `<circle cx="${tx(el.x)}" cy="${ty(el.y)}" r="${r}" fill="#444" stroke="#222" stroke-width="1"/>`;
                    if (el.showLabel) {
                        const label = el.label || el.postType.charAt(0).toUpperCase() + el.postType.slice(1);
                        svg += `<text x="${tx(el.x)}" y="${ty(el.y) - r - 4}" text-anchor="middle" font-size="9" fill="#333">${label}</text>`;
                    }
                    break;
                }
                case 'rail':
                    svg += `<line x1="${tx(el.x1)}" y1="${ty(el.y1)}" x2="${tx(el.x2)}" y2="${ty(el.y2)}" stroke="#555" stroke-width="${Math.max(el.size * scale * 0.5, 1.5)}" stroke-linecap="round"/>`;
                    break;
                case 'gate': {
                    const hw = el.width * 0.5 * scale * 0.4;
                    svg += `<rect x="${tx(el.x) - hw}" y="${ty(el.y) - 6}" width="${hw * 2}" height="12" fill="none" stroke="#c44" stroke-width="1.5"/>`;
                    break;
                }
                case 'dimension': {
                    const dist = Drawing.calcDistance(el.x1, el.y1, el.x2, el.y2);
                    svg += `<line x1="${tx(el.x1)}" y1="${ty(el.y1)}" x2="${tx(el.x2)}" y2="${ty(el.y2)}" stroke="#06c" stroke-width="0.75"/>`;
                    svg += `<text x="${(tx(el.x1) + tx(el.x2)) / 2}" y="${(ty(el.y1) + ty(el.y2)) / 2 - 4}" text-anchor="middle" font-size="10" font-weight="bold" fill="#06c">${Drawing.formatDimension(dist)}</text>`;
                    break;
                }
                case 'label':
                    svg += `<text x="${tx(el.x)}" y="${ty(el.y)}" font-size="${Math.max(9, el.fontSize * scale * 0.5)}" fill="#333">${el.text}</text>`;
                    break;
                case 'freehand': {
                    if (el.points.length < 2) break;
                    let d = `M${tx(el.points[0].x)} ${ty(el.points[0].y)}`;
                    el.points.slice(1).forEach(p => d += ` L${tx(p.x)} ${ty(p.y)}`);
                    svg += `<path d="${d}" fill="none" stroke="#333" stroke-width="${Math.max(el.width * scale * 0.3, 0.75)}" stroke-linecap="round"/>`;
                    break;
                }
            }
        });

        svg += '</svg>';
        return svg;
    },

    // ===== SPECS TABLE BUILDER =====

    buildSpecsTable(opts, fenceHt) {
        const type = opts.drawingType;

        // Chainlink & gate types
        if (type.startsWith('chainlink') || type.includes('gate')) {
            return this.buildChainlinkSpecs(opts, fenceHt);
        }
        if (type === 'wood-fence') return this.buildWoodSpecs(opts, fenceHt);
        if (type === 'vinyl-fence') return this.buildVinylSpecs(opts, fenceHt);
        if (type === 'ornamental-fence') return this.buildOrnamentalSpecs(opts, fenceHt);
        if (type === 'wirepanel-fence') return this.buildWirePanelSpecs(opts, fenceHt);
        return '';
    },

    buildChainlinkSpecs(opts, fenceHt) {
        const isGate = opts.drawingType.includes('gate');
        return `
            <table class="specs-table">
                <tr>
                    <th colspan="5" class="section-header">Fabric</th>
                    <th colspan="3" class="section-header">Notes</th>
                </tr>
                <tr>
                    <td class="spec-label">Height</td>
                    <td class="spec-label">Mesh</td>
                    <td class="spec-label">Gage</td>
                    <td class="spec-label">Selvage</td>
                    <td class="spec-label">Finish</td>
                    <td colspan="3" rowspan="3" class="notes-cell">
                        &bull; Core fabric to match fence<br>
                        ${opts.braced ? '&bull; Braced and trussed terminal posts<br>' : ''}
                        ${isGate ? '&bull; Gate frame welded corners<br>' : ''}
                        ${opts.barbWire ? '&bull; Barbed wire arms on all posts<br>' : ''}
                    </td>
                </tr>
                <tr>
                    <td>${fenceHt}</td>
                    <td>${opts.mesh}</td>
                    <td>${opts.gage}</td>
                    <td>${opts.selvTop}/${opts.selvBot}</td>
                    <td>${opts.finish}</td>
                </tr>
                <tr>
                    <th colspan="5" class="section-header">Framework</th>
                </tr>
                <tr>
                    <td class="spec-label">Component</td>
                    <td class="spec-label">O.D.</td>
                    <td class="spec-label">Wall</td>
                    <td class="spec-label">Wt. per ft.</td>
                    <td class="spec-label">Length</td>
                    <td colspan="3" class="spec-label"></td>
                </tr>
                <tr>
                    <td>${isGate ? 'Gate Post' : 'End/Corner Post'}</td>
                    <td>${opts.postOD}"</td>
                    <td>.065</td>
                    <td>—</td>
                    <td>—</td>
                    <td colspan="3"></td>
                </tr>
                ${!isGate ? `<tr><td>Line Post</td><td>1-5/8"</td><td>.065</td><td>—</td><td>—</td><td colspan="3"></td></tr>` : ''}
                <tr>
                    <td>${isGate ? 'Gate Frame' : 'Top Rail'}</td>
                    <td>${opts.railOD}"</td>
                    <td>.065</td>
                    <td>—</td>
                    <td>—</td>
                    <td colspan="3"></td>
                </tr>
                ${isGate ? `<tr><td>Gate Opening</td><td colspan="4">${this.fmtFt(opts.gateWidth)}</td><td colspan="3"></td></tr>` : ''}
            </table>`;
    },

    buildWoodSpecs(opts, fenceHt) {
        const styleLabel = {
            'privacy': 'Privacy (Board-on-Board)',
            'stockade': 'Stockade',
            'picket': 'Picket',
            'shadow-box': 'Shadow Box',
            'split-rail': 'Split Rail'
        }[opts.woodStyle] || opts.woodStyle;
        const typeLabel = {
            'cedar': 'Western Red Cedar',
            'pine-pt': 'Pressure Treated Pine',
            'spruce': 'Spruce',
            'redwood': 'Redwood'
        }[opts.woodType] || opts.woodType;
        return `
            <table class="specs-table">
                <tr>
                    <th colspan="4" class="section-header">Fence Specifications</th>
                    <th colspan="4" class="section-header">Notes</th>
                </tr>
                <tr>
                    <td class="spec-label">Style</td>
                    <td class="spec-label">Height</td>
                    <td class="spec-label">Wood Type</td>
                    <td class="spec-label">Rails</td>
                    <td colspan="4" rowspan="4" class="notes-cell">
                        &bull; All lumber to be ${typeLabel}<br>
                        ${opts.woodPostCaps ? '&bull; Post caps on all posts<br>' : ''}
                        ${opts.woodKickboard ? '&bull; Kickboard at ground line<br>' : ''}
                        &bull; Posts set in concrete, min 24" depth<br>
                        &bull; Fasteners: galvanized or stainless steel
                    </td>
                </tr>
                <tr>
                    <td>${styleLabel}</td>
                    <td>${fenceHt}</td>
                    <td>${typeLabel}</td>
                    <td>${opts.woodRails} per section</td>
                </tr>
                <tr>
                    <th colspan="4" class="section-header">Lumber</th>
                </tr>
                <tr>
                    <td class="spec-label">Component</td>
                    <td class="spec-label">Size</td>
                    <td class="spec-label">Spacing</td>
                    <td class="spec-label">Material</td>
                </tr>
                <tr>
                    <td>Posts</td>
                    <td>${opts.woodPost}</td>
                    <td>8' O.C.</td>
                    <td>${typeLabel}</td>
                    <td colspan="4"></td>
                </tr>
                <tr>
                    <td>Rails</td>
                    <td>${opts.woodRail}</td>
                    <td>—</td>
                    <td>${typeLabel}</td>
                    <td colspan="4"></td>
                </tr>
                ${opts.woodStyle !== 'split-rail' ? `
                <tr>
                    <td>Pickets / Boards</td>
                    <td>${opts.woodPicket}</td>
                    <td>${opts.woodStyle === 'privacy' || opts.woodStyle === 'stockade' ? 'Flush' : opts.woodStyle === 'shadow-box' ? 'Alternating' : '~3.5" O.C.'}</td>
                    <td>${typeLabel}</td>
                    <td colspan="4"></td>
                </tr>` : ''}
            </table>`;
    },

    buildVinylSpecs(opts, fenceHt) {
        const styleLabel = {
            'privacy': 'Privacy',
            'semi-privacy': 'Semi-Privacy',
            'picket': 'Picket',
            'ranch-rail': 'Ranch Rail'
        }[opts.vinylStyle] || opts.vinylStyle;
        return `
            <table class="specs-table">
                <tr>
                    <th colspan="4" class="section-header">Fence Specifications</th>
                    <th colspan="4" class="section-header">Notes</th>
                </tr>
                <tr>
                    <td class="spec-label">Style</td>
                    <td class="spec-label">Height</td>
                    <td class="spec-label">Color</td>
                    <td class="spec-label">Section Width</td>
                    <td colspan="4" rowspan="4" class="notes-cell">
                        &bull; Virgin vinyl construction<br>
                        ${opts.vinylAlum ? '&bull; Aluminum inserts in all posts<br>' : ''}
                        ${opts.vinylPostCaps ? '&bull; Decorative post caps included<br>' : ''}
                        &bull; UV-stabilized material<br>
                        &bull; Posts set in concrete, min 24" depth
                    </td>
                </tr>
                <tr>
                    <td>${styleLabel}</td>
                    <td>${fenceHt}</td>
                    <td>${opts.vinylColor}</td>
                    <td>${opts.vinylSection}'</td>
                </tr>
                <tr>
                    <th colspan="4" class="section-header">Components</th>
                </tr>
                <tr>
                    <td class="spec-label">Component</td>
                    <td class="spec-label">Size</td>
                    <td class="spec-label">Type</td>
                    <td class="spec-label">Color</td>
                </tr>
                <tr>
                    <td>Posts</td>
                    <td>${opts.vinylPost}</td>
                    <td>Routed vinyl</td>
                    <td>${opts.vinylColor}</td>
                    <td colspan="4"></td>
                </tr>
                <tr>
                    <td>Rails</td>
                    <td>—</td>
                    <td>Snap-in vinyl</td>
                    <td>${opts.vinylColor}</td>
                    <td colspan="4"></td>
                </tr>
                ${opts.vinylStyle !== 'ranch-rail' ? `
                <tr>
                    <td>${opts.vinylStyle === 'privacy' ? 'Panels (T&G)' : 'Pickets'}</td>
                    <td>—</td>
                    <td>Vinyl ${opts.vinylStyle === 'privacy' ? 'tongue & groove' : 'picket'}</td>
                    <td>${opts.vinylColor}</td>
                    <td colspan="4"></td>
                </tr>` : ''}
                ${opts.vinylAlum ? `
                <tr>
                    <td>Aluminum Insert</td>
                    <td>—</td>
                    <td>Structural reinforcement</td>
                    <td>—</td>
                    <td colspan="4"></td>
                </tr>` : ''}
            </table>`;
    },

    buildOrnamentalSpecs(opts, fenceHt) {
        const styleLabel = {
            'flat-top': 'Flat Top',
            'spear-top': 'Spear Top',
            'puppy-picket': 'Puppy Picket'
        }[opts.ornStyle] || opts.ornStyle;
        const matLabel = opts.ornMaterial === 'aluminum' ? 'Aluminum' : 'Steel';
        const capLabel = {
            'ball': 'Ball Cap',
            'finial': 'Finial Cap',
            'flat': 'Flat Cap'
        }[opts.ornCap] || opts.ornCap;
        return `
            <table class="specs-table">
                <tr>
                    <th colspan="4" class="section-header">Fence Specifications</th>
                    <th colspan="4" class="section-header">Notes</th>
                </tr>
                <tr>
                    <td class="spec-label">Style</td>
                    <td class="spec-label">Height</td>
                    <td class="spec-label">Material</td>
                    <td class="spec-label">Color</td>
                    <td colspan="4" rowspan="4" class="notes-cell">
                        &bull; ${matLabel} ornamental fence<br>
                        &bull; ${styleLabel} picket design<br>
                        &bull; ${capLabel}s on all posts<br>
                        &bull; Pre-fabricated panels<br>
                        &bull; Powder-coated ${opts.ornColor} finish
                    </td>
                </tr>
                <tr>
                    <td>${styleLabel}</td>
                    <td>${fenceHt}</td>
                    <td>${matLabel}</td>
                    <td>${opts.ornColor}</td>
                </tr>
                <tr>
                    <th colspan="4" class="section-header">Components</th>
                </tr>
                <tr>
                    <td class="spec-label">Component</td>
                    <td class="spec-label">Size</td>
                    <td class="spec-label">Material</td>
                    <td class="spec-label">Finish</td>
                </tr>
                <tr>
                    <td>Posts</td>
                    <td>${opts.ornPost}</td>
                    <td>${matLabel}</td>
                    <td>Powder coat</td>
                    <td colspan="4"></td>
                </tr>
                <tr>
                    <td>Rails (Top/Bottom)</td>
                    <td>—</td>
                    <td>${matLabel}</td>
                    <td>Powder coat</td>
                    <td colspan="4"></td>
                </tr>
                <tr>
                    <td>Pickets</td>
                    <td>5/8" or 3/4"</td>
                    <td>${matLabel}</td>
                    <td>Powder coat</td>
                    <td colspan="4"></td>
                </tr>
                <tr>
                    <td>Post Caps</td>
                    <td>—</td>
                    <td>${capLabel}</td>
                    <td>Powder coat</td>
                    <td colspan="4"></td>
                </tr>
            </table>`;
    },

    buildWirePanelSpecs(opts, fenceHt) {
        const panelLabel = {
            'welded': 'Welded Wire',
            'cattle': 'Cattle Panel',
            'hog': 'Hog Panel'
        }[opts.wpType] || opts.wpType;
        const postLabel = {
            't-post': 'T-Post (Steel)',
            'pipe': 'Pipe Post',
            'wood': 'Wood 4x4'
        }[opts.wpPost] || opts.wpPost;
        return `
            <table class="specs-table">
                <tr>
                    <th colspan="4" class="section-header">Fence Specifications</th>
                    <th colspan="4" class="section-header">Notes</th>
                </tr>
                <tr>
                    <td class="spec-label">Panel Type</td>
                    <td class="spec-label">Height</td>
                    <td class="spec-label">Post Type</td>
                    <td class="spec-label">Wire Gauge</td>
                    <td colspan="4" rowspan="4" class="notes-cell">
                        &bull; ${panelLabel} panels<br>
                        &bull; ${postLabel} posts<br>
                        ${opts.wpTopRail ? '&bull; Pipe top rail included<br>' : ''}
                        ${opts.wpTension ? '&bull; Tension wire at bottom<br>' : ''}
                        &bull; Wire clips at each post<br>
                        ${opts.wpPost === 't-post' ? '&bull; Safety caps on all T-posts<br>' : '&bull; Posts set in concrete<br>'}
                    </td>
                </tr>
                <tr>
                    <td>${panelLabel}</td>
                    <td>${fenceHt}</td>
                    <td>${postLabel}</td>
                    <td>${opts.wpGauge}</td>
                </tr>
                <tr>
                    <th colspan="4" class="section-header">Components</th>
                </tr>
                <tr>
                    <td class="spec-label">Component</td>
                    <td class="spec-label">Type</td>
                    <td class="spec-label">Size</td>
                    <td class="spec-label">Finish</td>
                </tr>
                <tr>
                    <td>Posts</td>
                    <td>${postLabel}</td>
                    <td>${opts.wpPost === 't-post' ? '1.25 lb/ft' : opts.wpPost === 'pipe' ? '2-3/8" O.D.' : '4x4'}</td>
                    <td>${opts.wpPost === 'wood' ? 'Pressure treated' : 'Galvanized'}</td>
                    <td colspan="4"></td>
                </tr>
                <tr>
                    <td>Panels</td>
                    <td>${panelLabel}</td>
                    <td>${opts.wpGauge} gauge</td>
                    <td>Galvanized</td>
                    <td colspan="4"></td>
                </tr>
                ${opts.wpTopRail ? `
                <tr>
                    <td>Top Rail</td>
                    <td>Pipe</td>
                    <td>1-3/8" O.D.</td>
                    <td>Galvanized</td>
                    <td colspan="4"></td>
                </tr>` : ''}
                ${opts.wpTension ? `
                <tr>
                    <td>Tension Wire</td>
                    <td>7 gauge</td>
                    <td>—</td>
                    <td>Galvanized</td>
                    <td colspan="4"></td>
                </tr>` : ''}
            </table>`;
    },

    // ===== PAGE BUILDER =====

    buildPage(svgContent, title, opts) {
        const date = new Date().toLocaleDateString();
        const bom = Drawing.getBillOfMaterials();
        const fenceHt = this.fmtFt(opts.fenceHeight);

        // Build specs table based on drawing type
        let specsHTML = this.buildSpecsTable(opts, fenceHt);

        return `<!DOCTYPE html>
<html>
<head>
    <title>Shop Drawing - ${title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #fff; color: #000; }
        .page {
            width: 10in;
            min-height: 7.5in;
            margin: 20px auto;
            border: 3px solid #000;
            display: flex;
            flex-direction: column;
        }
        .drawing-area {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 15px 20px;
            border-bottom: 2px solid #000;
            min-height: 420px;
            background: #fff;
        }
        .drawing-area svg { max-width: 100%; max-height: 100%; }
        .specs-area {
            border-bottom: 2px solid #000;
        }
        .specs-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }
        .specs-table th, .specs-table td {
            border: 1px solid #999;
            padding: 4px 8px;
            text-align: left;
        }
        .specs-table .section-header {
            background: #e8e8e8;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-align: center;
        }
        .specs-table .spec-label {
            background: #f5f5f5;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            color: #555;
        }
        .notes-cell {
            font-size: 11px;
            vertical-align: top;
            line-height: 1.6;
        }
        .title-block {
            display: grid;
            grid-template-columns: 2fr 3fr 2fr 1.5fr;
            border-top: 2px solid #000;
            min-height: 50px;
        }
        .title-block .cell {
            border-right: 1px solid #000;
            padding: 4px 8px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .title-block .cell:last-child { border-right: none; }
        .title-block .tb-label {
            font-size: 9px;
            text-transform: uppercase;
            color: #777;
            letter-spacing: 0.5px;
        }
        .title-block .tb-value {
            font-size: 13px;
            font-weight: 600;
            margin-top: 1px;
        }
        .title-block .company-cell {
            border-right: 2px solid #000;
            text-align: center;
            justify-content: center;
            align-items: center;
        }
        .title-block .company-name {
            font-size: 16px;
            font-weight: bold;
            letter-spacing: 2px;
        }
        .title-main {
            grid-column: 2 / 4;
            border-bottom: 1px solid #000;
        }
        .title-main .tb-value {
            font-size: 14px;
        }
        .title-block .row2 {
            display: contents;
        }
        .drawing-title {
            text-align: center;
            padding: 8px;
            font-size: 14px;
            font-weight: bold;
            border-bottom: 2px solid #000;
            background: #f0f0f0;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .selvage-section {
            display: flex;
            justify-content: center;
            gap: 80px;
            padding: 8px;
            border-bottom: 1px solid #000;
        }
        @media print {
            body { padding: 0; margin: 0; }
            .page { margin: 0; border: 2px solid #000; width: 100%; height: 100vh; }
            .no-print { display: none !important; }
        }
        .no-print {
            text-align: center;
            padding: 12px;
            background: #f5f5f5;
        }
        .no-print button {
            padding: 10px 30px;
            font-size: 15px;
            cursor: pointer;
            background: #e94560;
            color: #fff;
            border: none;
            border-radius: 4px;
            margin: 0 8px;
        }
        .no-print button:hover { background: #ff6b81; }
    </style>
</head>
<body>
    <div class="no-print">
        <button onclick="window.print()">Print / Save as PDF</button>
        <button onclick="window.close()">Close</button>
    </div>
    <div class="page">
        <div class="drawing-title">
            ${fenceHt} ${title}
        </div>
        <div class="drawing-area">
            ${svgContent}
        </div>
        <div class="specs-area">
            ${specsHTML}
        </div>
        <div class="title-block">
            <div class="cell company-cell" style="grid-row: 1 / 3;">
                <div class="company-name">${opts.company.toUpperCase()}</div>
            </div>
            <div class="cell title-main">
                <div class="tb-label">Drawing Title</div>
                <div class="tb-value">${fenceHt} ${title}</div>
            </div>
            <div class="cell">
                <div class="tb-label">Drawing No.</div>
                <div class="tb-value">${opts.drawingNo || '—'}</div>
            </div>
            <div class="cell">
                <div class="tb-label">Job Name</div>
                <div class="tb-value">${opts.jobName}</div>
            </div>
            <div class="cell">
                <div class="tb-label">Job Number</div>
                <div class="tb-value">${opts.jobNumber || '—'}</div>
            </div>
            <div class="cell">
                <div class="tb-label">Date</div>
                <div class="tb-value">${date}</div>
            </div>
            <div class="cell">
                <div class="tb-label">Customer</div>
                <div class="tb-value">${opts.customer || '—'}</div>
            </div>
            <div class="cell">
                <div class="tb-label">Address</div>
                <div class="tb-value">${opts.address || '—'}</div>
            </div>
            <div class="cell">
                <div class="tb-label">Estimator</div>
                <div class="tb-value">${opts.estimator || '—'}</div>
            </div>
            <div class="cell">
                <div class="tb-label">Last Revised</div>
                <div class="tb-value">${date}</div>
            </div>
        </div>
    </div>
</body>
</html>`;
    },
};
