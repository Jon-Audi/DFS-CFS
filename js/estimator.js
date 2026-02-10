// estimator.js — Multi-type fence material estimator
// Supports: Chain Link, Wood, PVC/Vinyl, Ornamental, Welded Wire Panel

const Estimator = {
    runs: [],
    gates: [],
    runCounter: 0,
    gateCounter: 0,

    init() {
        this.addRun();
        this.onTypeChange();
    },

    // ===== FENCE TYPE SWITCHING =====

    onTypeChange() {
        const type = document.getElementById('est-fence-type').value;
        // Hide all spec sections
        ['chainlink', 'wood', 'vinyl', 'ornamental', 'wirepanel'].forEach(t => {
            const el = document.getElementById('est-specs-' + t);
            if (el) el.style.display = 'none';
        });
        // Show the active one
        const active = document.getElementById('est-specs-' + type);
        if (active) active.style.display = '';

        // Adjust default post spacing by type
        const spacingEl = document.getElementById('est-post-spacing');
        if (type === 'chainlink') spacingEl.value = '8';
        else if (type === 'wood') spacingEl.value = '8';
        else if (type === 'vinyl') spacingEl.value = '6';
        else if (type === 'ornamental') spacingEl.value = '6';
        else if (type === 'wirepanel') spacingEl.value = '8';
    },

    // ===== RUN MANAGEMENT =====

    addRun() {
        const id = ++this.runCounter;
        this.runs.push({ id, length: 0, terminals: 2, corners: 0 });
        this.renderRuns();
    },

    removeRun(id) {
        this.runs = this.runs.filter(r => r.id !== id);
        this.renderRuns();
    },

    renderRuns() {
        const container = document.getElementById('est-runs-list');
        container.innerHTML = this.runs.map((run, i) => `
            <div class="est-run-entry" data-run-id="${run.id}">
                <label>Run ${i + 1}:</label>
                <input type="number" min="0" step="1" value="${run.length}" placeholder="Feet"
                    onchange="Estimator.updateRun(${run.id}, 'length', this.value)" title="Length in feet">
                <label>ft</label>
                <label style="margin-left:6px;">Ends:</label>
                <select onchange="Estimator.updateRun(${run.id}, 'terminals', this.value)" title="End/Terminal posts">
                    <option value="0" ${run.terminals === 0 ? 'selected' : ''}>0</option>
                    <option value="1" ${run.terminals === 1 ? 'selected' : ''}>1</option>
                    <option value="2" ${run.terminals === 2 ? 'selected' : ''}>2</option>
                </select>
                <label>Corners:</label>
                <select onchange="Estimator.updateRun(${run.id}, 'corners', this.value)" title="Corner posts in this run">
                    <option value="0" ${run.corners === 0 ? 'selected' : ''}>0</option>
                    <option value="1" ${run.corners === 1 ? 'selected' : ''}>1</option>
                    <option value="2" ${run.corners === 2 ? 'selected' : ''}>2</option>
                    <option value="3" ${run.corners === 3 ? 'selected' : ''}>3</option>
                    <option value="4" ${run.corners === 4 ? 'selected' : ''}>4</option>
                </select>
                <button class="est-run-remove" onclick="Estimator.removeRun(${run.id})" title="Remove run">&times;</button>
            </div>
        `).join('');
    },

    updateRun(id, field, value) {
        const run = this.runs.find(r => r.id === id);
        if (run) run[field] = parseFloat(value) || 0;
    },

    // ===== GATE MANAGEMENT =====

    addGate() {
        const id = ++this.gateCounter;
        this.gates.push({ id, type: 'swing', width: 4, quantity: 1 });
        this.renderGates();
    },

    removeGate(id) {
        this.gates = this.gates.filter(g => g.id !== id);
        this.renderGates();
    },

    renderGates() {
        const container = document.getElementById('est-gates-list');
        container.innerHTML = this.gates.map((gate, i) => `
            <div class="est-run-entry" data-gate-id="${gate.id}">
                <label>Gate ${i + 1}:</label>
                <select onchange="Estimator.updateGate(${gate.id}, 'type', this.value)">
                    <option value="swing" ${gate.type === 'swing' ? 'selected' : ''}>Swing</option>
                    <option value="double" ${gate.type === 'double' ? 'selected' : ''}>Double Swing</option>
                    <option value="slide" ${gate.type === 'slide' ? 'selected' : ''}>Slide</option>
                    <option value="cantilever" ${gate.type === 'cantilever' ? 'selected' : ''}>Cantilever</option>
                </select>
                <input type="number" min="1" step="1" value="${gate.width}" placeholder="Width (ft)"
                    style="width:55px;" onchange="Estimator.updateGate(${gate.id}, 'width', this.value)">
                <label>ft</label>
                <label>Qty:</label>
                <input type="number" min="1" max="20" value="${gate.quantity}" style="width:45px;"
                    onchange="Estimator.updateGate(${gate.id}, 'quantity', this.value)">
                <button class="est-run-remove" onclick="Estimator.removeGate(${gate.id})" title="Remove gate">&times;</button>
            </div>
        `).join('');
    },

    updateGate(id, field, value) {
        const gate = this.gates.find(g => g.id === id);
        if (gate) gate[field] = field === 'type' ? value : (parseFloat(value) || 0);
    },

    // ===== SHARED HELPERS =====

    aggregateRuns() {
        let totalFeet = 0, totalTerminals = 0, totalCorners = 0;
        this.runs.forEach(run => {
            totalFeet += run.length;
            totalTerminals += run.terminals;
            totalCorners += run.corners;
        });
        return { totalFeet, totalTerminals, totalCorners };
    },

    aggregateGates(heightFt) {
        let totalGates = { swing: 0, double: 0, slide: 0, cantilever: 0 };
        let totalGatePosts = 0;
        let totalGateOpeningFt = 0;

        this.gates.forEach(gate => {
            const qty = gate.quantity || 1;
            totalGates[gate.type] = (totalGates[gate.type] || 0) + qty;
            totalGateOpeningFt += gate.width * qty;
            if (gate.type === 'cantilever') {
                totalGatePosts += 3 * qty;
            } else {
                totalGatePosts += 2 * qty;
            }
        });

        const totalGateCount = Object.values(totalGates).reduce((a, b) => a + b, 0);
        return { totalGates, totalGatePosts, totalGateOpeningFt, totalGateCount };
    },

    // ===== MAIN CALCULATE DISPATCHER =====

    calculate() {
        const type = document.getElementById('est-fence-type').value;
        const { totalFeet } = this.aggregateRuns();

        if (totalFeet === 0) {
            document.getElementById('est-results').innerHTML = '<p class="placeholder-text">Add at least one fence run with a length.</p>';
            document.getElementById('est-summary').innerHTML = '';
            return;
        }

        switch (type) {
            case 'chainlink':    this.calcChainlink(); break;
            case 'wood':         this.calcWood(); break;
            case 'vinyl':        this.calcVinyl(); break;
            case 'ornamental':   this.calcOrnamental(); break;
            case 'wirepanel':    this.calcWirePanel(); break;
        }
    },

    // ===== CHAIN LINK ESTIMATOR =====

    calcChainlink() {
        const specs = {
            fenceHeight: parseInt(document.getElementById('est-fence-height').value),
            fabric: document.getElementById('est-fabric').value,
            finish: document.getElementById('est-finish').value,
            selvage: document.getElementById('est-selvage').value,
            termPost: document.getElementById('est-term-post').value,
            linePost: document.getElementById('est-line-post').value,
            railOD: document.getElementById('est-rail-od').value,
            postSpacing: parseInt(document.getElementById('est-post-spacing').value),
            topRail: document.getElementById('est-top-rail').checked,
            bottomRail: document.getElementById('est-bottom-rail').checked,
            braced: document.getElementById('est-braced').checked,
            tensionWire: document.getElementById('est-tension-wire').checked,
            barbArms: document.getElementById('est-barb-arms').checked,
            privacySlats: document.getElementById('est-privacy-slats').checked,
        };

        const heightFt = specs.fenceHeight / 12;
        const heightIn = specs.fenceHeight;
        const { totalFeet, totalTerminals, totalCorners } = this.aggregateRuns();
        const { totalGates, totalGatePosts, totalGateOpeningFt, totalGateCount } = this.aggregateGates(heightFt);

        const fenceFeet = Math.max(0, totalFeet - totalGateOpeningFt);
        const terminalPosts = totalTerminals + totalCorners;
        const linePosts = Math.max(0, Math.round(fenceFeet / specs.postSpacing) - terminalPosts);
        const totalFencePosts = terminalPosts + linePosts;
        const totalPosts = totalFencePosts + totalGatePosts;
        const postLengthFt = heightFt + 3;

        // Rails
        const railLengthPerPiece = 21;
        const totalRailFeet = specs.topRail ? fenceFeet : 0;
        const railPieces = specs.topRail ? Math.ceil(totalRailFeet / railLengthPerPiece) : 0;
        const bottomRailPieces = specs.bottomRail ? Math.ceil(fenceFeet / railLengthPerPiece) : 0;
        const railEnds = terminalPosts * (specs.topRail ? 1 : 0) + terminalPosts * (specs.bottomRail ? 1 : 0);

        // Fabric
        const fabricFeet = fenceFeet + 2;

        // Fittings
        const tensionBandsPerPost = Math.ceil(heightIn / 15) + 1;
        const totalTensionBands = tensionBandsPerPost * terminalPosts;
        const braceBandsPerPost = (specs.topRail ? 1 : 0) + (specs.bottomRail ? 1 : 0);
        const totalBraceBands = braceBandsPerPost * terminalPosts;
        const tensionBars = terminalPosts;
        const domeCaps = terminalPosts + totalGatePosts;
        const loopCaps = linePosts;
        const tiesPerLinePost = Math.ceil(heightIn / 12) + 1;
        const totalTieWires = tiesPerLinePost * linePosts;
        const trussRods = specs.braced ? terminalPosts : 0;
        const carriageBolts = totalTensionBands + totalBraceBands;
        const concreteBags = (linePosts * 1) + (terminalPosts * 2) + (totalGatePosts * 2);
        const tensionWireFt = specs.tensionWire ? fenceFeet : 0;
        const barbArms = specs.barbArms ? totalPosts : 0;
        const barbWireFt = specs.barbArms ? totalFeet : 0;
        const privacySlats = specs.privacySlats ? Math.ceil(fenceFeet / 1) : 0;

        // Gate hardware
        let gateHardware = [];
        if (totalGates.swing > 0) {
            gateHardware.push(
                { item: 'Male Hinge (Swing Gate)', qty: totalGates.swing * 3, size: specs.termPost, note: '3 per gate' },
                { item: 'Female Hinge (Swing Gate)', qty: totalGates.swing * 3, size: specs.termPost, note: '3 per gate' },
                { item: 'Fork Latch', qty: totalGates.swing, size: specs.termPost, note: '1 per gate' },
            );
        }
        if (totalGates.double > 0) {
            gateHardware.push(
                { item: 'Male Hinge (Dbl Gate)', qty: totalGates.double * 6, size: specs.termPost, note: '3 per leaf' },
                { item: 'Female Hinge (Dbl Gate)', qty: totalGates.double * 6, size: specs.termPost, note: '3 per leaf' },
                { item: 'Fork Latch', qty: totalGates.double, size: '', note: '1 per gate' },
                { item: 'Drop Rod / Cane Bolt', qty: totalGates.double, size: '', note: '1 per gate' },
                { item: 'Center Latch', qty: totalGates.double, size: '', note: '1 per gate' },
            );
        }
        if (totalGates.slide > 0) {
            gateHardware.push(
                { item: 'Slide Gate Roller Assembly', qty: totalGates.slide * 2, size: '', note: '2 per gate' },
                { item: 'Slide Gate Track', qty: totalGates.slide, size: '', note: '1 per gate' },
                { item: 'Slide Gate Guide', qty: totalGates.slide * 2, size: '', note: 'Top & bottom' },
                { item: 'Fork Latch', qty: totalGates.slide, size: '', note: '1 per gate' },
            );
        }
        if (totalGates.cantilever > 0) {
            gateHardware.push(
                { item: 'Cantilever Roller Assembly', qty: totalGates.cantilever * 2, size: '', note: '2 per gate' },
                { item: 'Top Guide Bracket', qty: totalGates.cantilever * 2, size: '', note: '2 per gate' },
                { item: 'Gate Receiver/Catch', qty: totalGates.cantilever * 2, size: '', note: 'Top & bottom' },
                { item: 'Cantilever Latch', qty: totalGates.cantilever, size: '', note: '1 per gate' },
            );
        }

        this.gates.forEach(gate => {
            const qty = gate.quantity || 1;
            const label = gate.type === 'double' ? 'Double Swing' :
                         gate.type === 'cantilever' ? 'Cantilever' :
                         gate.type === 'slide' ? 'Slide' : 'Swing';
            gateHardware.push({
                item: `${label} Gate Frame`,
                qty: qty,
                size: `${gate.width}' x ${heightFt}'`,
                note: gate.type === 'cantilever' ? `${Math.ceil(gate.width * 1.5)}' total panel` : '',
            });
        });

        // Build results
        const materials = {
            'Framework': [
                { item: 'Terminal / End Post', qty: totalTerminals, size: `${specs.termPost} x ${postLengthFt}'`, note: '' },
                totalCorners > 0 ? { item: 'Corner Post', qty: totalCorners, size: `${specs.termPost} x ${postLengthFt}'`, note: '' } : null,
                { item: 'Line Post', qty: linePosts, size: `${specs.linePost} x ${postLengthFt}'`, note: `@ ${specs.postSpacing}' O.C.` },
                totalGatePosts > 0 ? { item: 'Gate Post', qty: totalGatePosts, size: `${specs.termPost} x ${postLengthFt}'`, note: '' } : null,
                specs.topRail ? { item: 'Top Rail', qty: railPieces, size: `${specs.railOD} x 21'`, note: `${totalRailFeet} LF total` } : null,
                specs.bottomRail ? { item: 'Bottom Rail', qty: bottomRailPieces, size: `${specs.railOD} x 21'`, note: `${fenceFeet} LF total` } : null,
            ].filter(Boolean),
            'Fabric & Wire': [
                { item: 'Chain Link Fabric', qty: `${fabricFeet} LF`, size: `${heightFt}' x ${specs.fabric.replace('-', ' Ga / ')}`, note: specs.finish },
                specs.tensionWire ? { item: 'Tension Wire', qty: `${tensionWireFt} LF`, size: '', note: 'Coil' } : null,
                specs.barbArms ? { item: 'Barbed Wire', qty: `${barbWireFt} LF`, size: '12.5 Ga', note: 'Per strand' } : null,
            ].filter(Boolean),
            'Fittings': [
                { item: 'Tension Band', qty: totalTensionBands, size: specs.termPost, note: `${tensionBandsPerPost} per terminal @ 15" O.C.` },
                { item: 'Brace Band', qty: totalBraceBands, size: specs.termPost, note: `${braceBandsPerPost} per terminal` },
                { item: 'Tension Bar', qty: tensionBars, size: `3/16" x ${heightFt}'`, note: '1 per terminal' },
                railEnds > 0 ? { item: 'Rail End / Cup', qty: railEnds, size: specs.railOD, note: '1 per terminal per rail' } : null,
                { item: 'Dome Cap (Terminal)', qty: domeCaps, size: specs.termPost, note: 'Terminal + gate posts' },
                { item: 'Loop Cap (Line)', qty: loopCaps, size: specs.linePost, note: 'Line posts' },
                { item: 'Tie Wire / Hog Rings', qty: totalTieWires, size: '', note: `${tiesPerLinePost} per line post` },
                specs.braced ? { item: 'Truss Rod w/ Tightener', qty: trussRods, size: '', note: '1 per terminal' } : null,
                { item: 'Carriage Bolt 5/16" x 1-1/4"', qty: carriageBolts, size: '', note: '1 per band' },
                specs.barbArms ? { item: 'Barbed Wire Arm', qty: barbArms, size: '', note: '1 per post' } : null,
                specs.privacySlats ? { item: 'Privacy Slats', qty: privacySlats, size: `${heightFt}'`, note: '' } : null,
            ].filter(Boolean),
            'Concrete': [
                { item: 'Concrete (80 lb bag)', qty: concreteBags, size: '', note: `${terminalPosts + totalGatePosts} terminal @ 2 bags + ${linePosts} line @ 1 bag` },
            ],
        };

        if (gateHardware.length > 0) {
            materials['Gate Hardware'] = gateHardware;
        }

        this.renderResults('Chain Link', materials, {
            totalFeet, fenceFeet, totalPosts, terminalPosts, linePosts, totalGateCount, concreteBags,
        });
    },

    // ===== WOOD FENCE ESTIMATOR =====

    calcWood() {
        const heightIn = parseInt(document.getElementById('est-fence-height').value);
        const heightFt = heightIn / 12;
        const postSpacing = parseInt(document.getElementById('est-post-spacing').value);
        const style = document.getElementById('est-wood-style').value;
        const postSize = document.getElementById('est-wood-post-size').value;
        const railSize = document.getElementById('est-wood-rail-size').value;
        const picketSize = document.getElementById('est-wood-picket-size').value;
        const railsPerSection = parseInt(document.getElementById('est-wood-rails').value);
        const woodType = document.getElementById('est-wood-type').value;
        const kickboard = document.getElementById('est-wood-kickboard').checked;
        const postCaps = document.getElementById('est-wood-postcaps').checked;

        const { totalFeet, totalTerminals, totalCorners } = this.aggregateRuns();
        const { totalGates, totalGatePosts, totalGateOpeningFt, totalGateCount } = this.aggregateGates(heightFt);
        const fenceFeet = Math.max(0, totalFeet - totalGateOpeningFt);

        // Posts
        const terminalPosts = totalTerminals + totalCorners;
        const totalSections = Math.ceil(fenceFeet / postSpacing);
        const linePosts = Math.max(0, totalSections - terminalPosts);
        const totalFencePosts = terminalPosts + linePosts;
        const totalPosts = totalFencePosts + totalGatePosts;
        const postLengthFt = heightFt + 3; // 3' buried

        // Rails
        const totalRails = totalSections * railsPerSection;
        const railLength = postSpacing; // each rail spans one section

        // Pickets
        let picketWidth; // in inches
        if (picketSize === '1x4') picketWidth = 3.5;
        else if (picketSize === '1x6' || picketSize === 'dog-ear') picketWidth = 5.5;
        else picketWidth = 5.5;

        let picketSpacingIn; // gap between pickets in inches
        let picketsPerSection;
        const sectionIn = postSpacing * 12;

        if (style === 'privacy' || style === 'stockade') {
            // No gap between pickets
            picketsPerSection = Math.ceil(sectionIn / picketWidth);
        } else if (style === 'shadow-box') {
            // Board-on-board both sides, overlapping by half
            // Front side: pickets with gap = picketWidth, back side fills gaps
            const frontPickets = Math.ceil(sectionIn / (picketWidth * 2));
            const backPickets = frontPickets;
            picketsPerSection = frontPickets + backPickets;
        } else if (style === 'picket') {
            // Picket with ~2.5" gap (standard)
            picketSpacingIn = 2.5;
            picketsPerSection = Math.ceil(sectionIn / (picketWidth + picketSpacingIn));
        } else if (style === 'split-rail') {
            // No pickets for split rail
            picketsPerSection = 0;
        }

        const totalPickets = picketsPerSection * totalSections;
        const picketLength = heightFt; // pickets are fence height

        // Screws/nails — 2 per picket per rail attachment point
        const screwsPerPicket = railsPerSection * 2;
        const totalScrews = totalPickets * screwsPerPicket;
        const screwBoxes = Math.ceil(totalScrews / 100); // 100 per box

        // Kickboard
        const kickboardPieces = kickboard ? Math.ceil(fenceFeet / 8) : 0; // 8' boards

        // Concrete
        const concreteBags = (terminalPosts * 3) + (linePosts * 2) + (totalGatePosts * 3);

        // Gate hardware for wood
        let gateHardware = [];
        if (totalGateCount > 0) {
            this.gates.forEach(gate => {
                const qty = gate.quantity || 1;
                if (gate.type === 'swing') {
                    gateHardware.push(
                        { item: 'T-Hinge (Heavy Duty)', qty: qty * 3, size: '8"', note: '3 per gate' },
                        { item: 'Thumb Latch', qty: qty, size: '', note: '1 per gate' },
                    );
                } else if (gate.type === 'double') {
                    gateHardware.push(
                        { item: 'T-Hinge (Heavy Duty)', qty: qty * 6, size: '8"', note: '3 per leaf' },
                        { item: 'Thumb Latch', qty: qty, size: '', note: '1 per gate' },
                        { item: 'Drop Bolt / Cane Bolt', qty: qty, size: '', note: '1 per gate' },
                    );
                }
                gateHardware.push({
                    item: `Wood ${gate.type === 'double' ? 'Double' : 'Swing'} Gate Frame`,
                    qty: qty,
                    size: `${gate.width}' x ${heightFt}'`,
                    note: woodType,
                });
            });
        }

        const materials = {
            'Posts': [
                { item: `${postSize} Post (Terminal/Corner)`, qty: terminalPosts, size: `${postSize} x ${Math.ceil(postLengthFt)}'`, note: woodType },
                { item: `${postSize} Post (Line)`, qty: linePosts, size: `${postSize} x ${Math.ceil(postLengthFt)}'`, note: `@ ${postSpacing}' O.C.` },
                totalGatePosts > 0 ? { item: `${postSize} Post (Gate)`, qty: totalGatePosts, size: `${postSize} x ${Math.ceil(postLengthFt)}'`, note: woodType } : null,
            ].filter(Boolean),
            'Rails': [
                { item: `${railSize} Rail`, qty: totalRails, size: `${railSize} x ${postSpacing}'`, note: `${railsPerSection} per section` },
                kickboard ? { item: 'Kickboard (1x6 or 1x8)', qty: kickboardPieces, size: `8'`, note: `${fenceFeet} LF total` } : null,
            ].filter(Boolean),
        };

        if (style !== 'split-rail') {
            materials['Pickets'] = [
                { item: `${picketSize} Picket`, qty: totalPickets, size: `${picketSize} x ${picketLength}'`, note: `${picketsPerSection} per section (${style})` },
            ];
        }

        materials['Hardware'] = [
            style !== 'split-rail' ? { item: 'Deck Screws (box of 100)', qty: screwBoxes, size: '#8 x 2"', note: `${totalScrews} total screws` } : null,
            postCaps ? { item: 'Post Cap', qty: totalPosts, size: postSize, note: '' } : null,
        ].filter(Boolean);

        materials['Concrete'] = [
            { item: 'Concrete (80 lb bag)', qty: concreteBags, size: '', note: `Terminal @ 3 bags, Line @ 2 bags` },
        ];

        if (gateHardware.length > 0) {
            materials['Gate Hardware'] = gateHardware;
        }

        this.renderResults('Wood Fence', materials, {
            totalFeet, fenceFeet, totalPosts, terminalPosts, linePosts, totalGateCount, concreteBags,
            extra: `Style: ${style} | Wood: ${woodType}`,
        });
    },

    // ===== PVC / VINYL FENCE ESTIMATOR =====

    calcVinyl() {
        const heightIn = parseInt(document.getElementById('est-fence-height').value);
        const heightFt = heightIn / 12;
        const postSpacing = parseInt(document.getElementById('est-post-spacing').value);
        const style = document.getElementById('est-vinyl-style').value;
        const postSize = document.getElementById('est-vinyl-post-size').value;
        const color = document.getElementById('est-vinyl-color').value;
        const sectionWidth = parseInt(document.getElementById('est-vinyl-section').value);
        const postCaps = document.getElementById('est-vinyl-postcaps').checked;
        const alumInserts = document.getElementById('est-vinyl-alum-insert').checked;

        const { totalFeet, totalTerminals, totalCorners } = this.aggregateRuns();
        const { totalGates, totalGatePosts, totalGateOpeningFt, totalGateCount } = this.aggregateGates(heightFt);
        const fenceFeet = Math.max(0, totalFeet - totalGateOpeningFt);

        // Vinyl fence uses pre-fab sections
        const totalSections = Math.ceil(fenceFeet / sectionWidth);
        const terminalPosts = totalTerminals + totalCorners;
        const linePosts = Math.max(0, totalSections - terminalPosts);
        const totalFencePosts = terminalPosts + linePosts;
        const totalPosts = totalFencePosts + totalGatePosts;

        // Post height = fence height + 3' buried (vinyl posts are longer)
        const postLengthFt = heightFt + 3;

        // Rails per section based on style
        let railsPerSection;
        if (style === 'privacy') railsPerSection = 3; // top, mid, bottom
        else if (style === 'semi-privacy') railsPerSection = 3;
        else if (style === 'picket') railsPerSection = 2;
        else if (style === 'ranch-rail') railsPerSection = 3; // 2,3, or 4 — default 3
        else railsPerSection = 2;

        const totalRails = totalSections * railsPerSection;

        // Panels / pickets
        let panels = 0;
        let pickets = 0;
        if (style === 'privacy' || style === 'semi-privacy') {
            // Pre-fab panels per section
            panels = totalSections;
        } else if (style === 'picket') {
            // Individual vinyl pickets — approx 16 per 8' section or 12 per 6'
            const picketsPerSec = sectionWidth === 8 ? 16 : 12;
            pickets = picketsPerSec * totalSections;
        }

        // Brackets — 2 per rail (one each end)
        const brackets = totalRails * 2;

        // Aluminum inserts for wind load (one per post)
        const alumInsertCount = alumInserts ? totalPosts : 0;

        // Concrete — vinyl posts need extra support
        const concreteBags = (terminalPosts * 3) + (linePosts * 2) + (totalGatePosts * 3);

        // Routed posts vs blank — terminal/corner posts are typically routed, line posts are routed both sides
        // Post caps
        const capCount = postCaps ? totalPosts : 0;

        let gateHardware = [];
        if (totalGateCount > 0) {
            this.gates.forEach(gate => {
                const qty = gate.quantity || 1;
                gateHardware.push(
                    { item: 'Vinyl Gate Hinge (Self-Closing)', qty: qty * 2, size: '', note: '2 per gate' },
                    { item: 'Vinyl Gate Latch', qty: qty, size: '', note: '1 per gate' },
                    { item: `Vinyl ${gate.type === 'double' ? 'Double' : 'Swing'} Gate Kit`, qty: qty, size: `${gate.width}' x ${heightFt}'`, note: color },
                );
            });
        }

        const materials = {
            'Posts': [
                { item: `${postSize} Vinyl Post (Terminal)`, qty: terminalPosts, size: `${postSize} x ${Math.ceil(postLengthFt)}'`, note: color },
                { item: `${postSize} Vinyl Post (Line)`, qty: linePosts, size: `${postSize} x ${Math.ceil(postLengthFt)}'`, note: `@ ${sectionWidth}' O.C.` },
                totalGatePosts > 0 ? { item: `${postSize} Vinyl Post (Gate)`, qty: totalGatePosts, size: `${postSize} x ${Math.ceil(postLengthFt)}'`, note: color } : null,
                alumInserts ? { item: 'Aluminum Post Insert', qty: alumInsertCount, size: postSize, note: 'Wind load reinforcement' } : null,
            ].filter(Boolean),
            'Rails & Panels': [
                { item: 'Vinyl Rail', qty: totalRails, size: `${sectionWidth}'`, note: `${railsPerSection} per section` },
                panels > 0 ? { item: 'Vinyl Panel Section', qty: panels, size: `${sectionWidth}' x ${heightFt}'`, note: `${style} style - ${color}` } : null,
                pickets > 0 ? { item: 'Vinyl Picket', qty: pickets, size: `${heightFt}'`, note: color } : null,
            ].filter(Boolean),
            'Hardware': [
                { item: 'Rail Bracket', qty: brackets, size: '', note: '2 per rail end' },
                postCaps ? { item: 'Vinyl Post Cap', qty: capCount, size: postSize, note: color } : null,
            ].filter(Boolean),
            'Concrete': [
                { item: 'Concrete (80 lb bag)', qty: concreteBags, size: '', note: `Terminal @ 3 bags, Line @ 2 bags` },
            ],
        };

        if (gateHardware.length > 0) {
            materials['Gate Hardware'] = gateHardware;
        }

        this.renderResults('PVC / Vinyl Fence', materials, {
            totalFeet, fenceFeet, totalPosts, terminalPosts, linePosts, totalGateCount, concreteBags,
            extra: `Style: ${style} | Color: ${color}`,
        });
    },

    // ===== ORNAMENTAL IRON / ALUMINUM ESTIMATOR =====

    calcOrnamental() {
        const heightIn = parseInt(document.getElementById('est-fence-height').value);
        const heightFt = heightIn / 12;
        const postSpacing = parseInt(document.getElementById('est-post-spacing').value);
        const style = document.getElementById('est-orn-style').value;
        const ornMaterial = document.getElementById('est-orn-material').value;
        const panelWidth = parseInt(document.getElementById('est-orn-panel-width').value);
        const postSize = document.getElementById('est-orn-post-size').value;
        const capStyle = document.getElementById('est-orn-cap').value;
        const color = document.getElementById('est-orn-color').value;

        const { totalFeet, totalTerminals, totalCorners } = this.aggregateRuns();
        const { totalGates, totalGatePosts, totalGateOpeningFt, totalGateCount } = this.aggregateGates(heightFt);
        const fenceFeet = Math.max(0, totalFeet - totalGateOpeningFt);

        // Ornamental uses pre-fabricated panels
        const totalPanels = Math.ceil(fenceFeet / panelWidth);
        const terminalPosts = totalTerminals + totalCorners;
        const linePosts = Math.max(0, totalPanels - terminalPosts);
        const totalFencePosts = terminalPosts + linePosts;
        const totalPosts = totalFencePosts + totalGatePosts;

        // Post length: ornamental posts are fence height + ~2' buried
        const postLengthFt = heightFt + 2;

        // Panel brackets — 4 per panel (2 top, 2 bottom on each post)
        const panelBrackets = totalPanels * 4;

        // Post caps
        const capCount = totalPosts;

        // Concrete — ornamental posts need solid set
        const concreteBags = (terminalPosts * 2) + (linePosts * 2) + (totalGatePosts * 3);

        // Screws for brackets
        const screws = panelBrackets * 2; // 2 self-tapping screws per bracket

        let gateHardware = [];
        if (totalGateCount > 0) {
            this.gates.forEach(gate => {
                const qty = gate.quantity || 1;
                gateHardware.push(
                    { item: 'Self-Closing Hinge (Pair)', qty: qty * 2, size: '', note: '2 pair per gate' },
                    { item: 'Magna-Latch / Gate Latch', qty: qty, size: '', note: '1 per gate' },
                );
                if (gate.type === 'double') {
                    gateHardware.push(
                        { item: 'Drop Rod', qty: qty, size: '', note: '1 per double gate' },
                    );
                }
                gateHardware.push({
                    item: `Ornamental ${gate.type === 'double' ? 'Double' : 'Swing'} Gate`,
                    qty: qty,
                    size: `${gate.width}' x ${heightFt}'`,
                    note: `${ornMaterial} - ${color}`,
                });
            });
        }

        const materials = {
            'Posts': [
                { item: `${postSize} Post (Terminal)`, qty: terminalPosts, size: `${postSize} x ${Math.ceil(postLengthFt)}'`, note: `${ornMaterial} - ${color}` },
                { item: `${postSize} Post (Line)`, qty: linePosts, size: `${postSize} x ${Math.ceil(postLengthFt)}'`, note: `@ ${panelWidth}' O.C.` },
                totalGatePosts > 0 ? { item: `${postSize} Post (Gate)`, qty: totalGatePosts, size: `${postSize} x ${Math.ceil(postLengthFt)}'`, note: '' } : null,
            ].filter(Boolean),
            'Panels': [
                { item: `${style} Panel`, qty: totalPanels, size: `${panelWidth}' x ${heightFt}'`, note: `${ornMaterial} - ${color}` },
            ],
            'Hardware': [
                { item: 'Panel Bracket', qty: panelBrackets, size: '', note: '4 per panel' },
                { item: `${capStyle.charAt(0).toUpperCase() + capStyle.slice(1)} Post Cap`, qty: capCount, size: postSize, note: color },
                { item: 'Self-Tapping Screw', qty: screws, size: '#10 x 3/4"', note: '2 per bracket' },
            ],
            'Concrete': [
                { item: 'Concrete (80 lb bag)', qty: concreteBags, size: '', note: `All posts @ 2 bags, gate posts @ 3` },
            ],
        };

        if (gateHardware.length > 0) {
            materials['Gate Hardware'] = gateHardware;
        }

        this.renderResults('Ornamental Fence', materials, {
            totalFeet, fenceFeet, totalPosts, terminalPosts, linePosts, totalGateCount, concreteBags,
            extra: `Style: ${style} | ${ornMaterial} - ${color}`,
        });
    },

    // ===== WELDED WIRE PANEL ESTIMATOR =====

    calcWirePanel() {
        const heightIn = parseInt(document.getElementById('est-fence-height').value);
        const heightFt = heightIn / 12;
        const postSpacing = parseInt(document.getElementById('est-post-spacing').value);
        const panelType = document.getElementById('est-wp-type').value;
        const postType = document.getElementById('est-wp-post-type').value;
        const panelWidth = parseInt(document.getElementById('est-wp-panel-width').value);
        const wireGauge = document.getElementById('est-wp-gauge').value;
        const topRail = document.getElementById('est-wp-top-rail').checked;
        const tensionWire = document.getElementById('est-wp-tension-wire').checked;

        const { totalFeet, totalTerminals, totalCorners } = this.aggregateRuns();
        const { totalGates, totalGatePosts, totalGateOpeningFt, totalGateCount } = this.aggregateGates(heightFt);
        const fenceFeet = Math.max(0, totalFeet - totalGateOpeningFt);

        const terminalPosts = totalTerminals + totalCorners;
        // Posts based on panel width or post spacing (whichever is smaller)
        const effectiveSpacing = Math.min(postSpacing, panelWidth);
        const totalSections = Math.ceil(fenceFeet / effectiveSpacing);
        const linePosts = Math.max(0, totalSections - terminalPosts);
        const totalFencePosts = terminalPosts + linePosts;
        const totalPosts = totalFencePosts + totalGatePosts;

        // Panels
        const totalPanels = Math.ceil(fenceFeet / panelWidth);

        // Post dimensions
        let postDesc, postLength;
        if (postType === 't-post') {
            postDesc = 'T-Post (Steel)';
            postLength = heightFt + 2; // 2' driven
        } else if (postType === 'pipe') {
            postDesc = 'Pipe Post (2-3/8")';
            postLength = heightFt + 3;
        } else {
            postDesc = 'Wood Post (4x4)';
            postLength = heightFt + 3;
        }

        // Clips — wire panel clips, 4 per post-panel connection (top, bottom, and 2 mid)
        const clipsPerPost = 4;
        const totalClips = totalFencePosts * clipsPerPost;

        // Top rail (optional pipe rail)
        const railPieces = topRail ? Math.ceil(fenceFeet / 21) : 0; // 21' lengths

        // Tension wire at bottom
        const tensionWireFt = tensionWire ? fenceFeet : 0;

        // Concrete (not needed for T-posts, needed for pipe/wood)
        let concreteBags = 0;
        if (postType === 'pipe' || postType === 'wood') {
            concreteBags = (terminalPosts * 2) + (linePosts * 1) + (totalGatePosts * 2);
        }

        let gateHardware = [];
        if (totalGateCount > 0) {
            this.gates.forEach(gate => {
                const qty = gate.quantity || 1;
                gateHardware.push(
                    { item: 'Gate Hinge', qty: qty * 2, size: '', note: '2 per gate' },
                    { item: 'Gate Latch', qty: qty, size: '', note: '1 per gate' },
                    { item: `Wire Panel Gate Frame`, qty: qty, size: `${gate.width}' x ${heightFt}'`, note: panelType },
                );
            });
        }

        const materials = {
            'Posts': [
                { item: `${postDesc} (Terminal)`, qty: terminalPosts, size: `${Math.ceil(postLength)}'`, note: '' },
                { item: `${postDesc} (Line)`, qty: linePosts, size: `${Math.ceil(postLength)}'`, note: `@ ${effectiveSpacing}' O.C.` },
                totalGatePosts > 0 ? { item: `${postDesc} (Gate)`, qty: totalGatePosts, size: `${Math.ceil(postLength)}'`, note: '' } : null,
            ].filter(Boolean),
            'Panels & Wire': [
                { item: `${panelType.replace('-', ' ')} Panel`, qty: totalPanels, size: `${panelWidth}' x ${heightFt}'`, note: `${wireGauge} Ga.` },
                topRail ? { item: 'Top Rail (Pipe)', qty: railPieces, size: `1-5/8" x 21'`, note: `${fenceFeet} LF total` } : null,
                tensionWire ? { item: 'Tension Wire', qty: `${tensionWireFt} LF`, size: '', note: 'Bottom line' } : null,
            ].filter(Boolean),
            'Hardware': [
                { item: postType === 't-post' ? 'T-Post Wire Clip' : 'U-Bolt / Panel Clip', qty: totalClips, size: '', note: `${clipsPerPost} per post` },
                postType === 't-post' ? { item: 'T-Post Cap', qty: totalPosts, size: '', note: 'Safety cap' } : null,
                postType === 't-post' ? { item: 'T-Post Driver', qty: 1, size: '', note: 'Tool (rental/own)' } : null,
            ].filter(Boolean),
        };

        if (concreteBags > 0) {
            materials['Concrete'] = [
                { item: 'Concrete (80 lb bag)', qty: concreteBags, size: '', note: `Terminal @ 2 bags, Line @ 1 bag` },
            ];
        }

        if (gateHardware.length > 0) {
            materials['Gate Hardware'] = gateHardware;
        }

        this.renderResults('Welded Wire Panel', materials, {
            totalFeet, fenceFeet, totalPosts, terminalPosts, linePosts, totalGateCount, concreteBags,
            extra: `Panel: ${panelType} | Posts: ${postType} | ${wireGauge} Ga.`,
        });
    },

    // ===== RENDERING =====

    renderResults(typeLabel, materials, stats) {
        // Summary
        let summaryHtml = `
            <div class="est-stat"><span class="stat-value">${typeLabel}</span><span class="stat-label">Fence Type</span></div>
            <div class="est-stat"><span class="stat-value">${stats.totalFeet}'</span><span class="stat-label">Total Footage</span></div>
            <div class="est-stat"><span class="stat-value">${stats.fenceFeet}'</span><span class="stat-label">Fence Line</span></div>
            <div class="est-stat"><span class="stat-value">${stats.totalPosts}</span><span class="stat-label">Total Posts</span></div>
            <div class="est-stat"><span class="stat-value">${stats.terminalPosts}</span><span class="stat-label">Terminal Posts</span></div>
            <div class="est-stat"><span class="stat-value">${stats.linePosts}</span><span class="stat-label">Line Posts</span></div>
            ${stats.totalGateCount > 0 ? `<div class="est-stat"><span class="stat-value">${stats.totalGateCount}</span><span class="stat-label">Gates</span></div>` : ''}
            ${stats.concreteBags > 0 ? `<div class="est-stat"><span class="stat-value">${stats.concreteBags}</span><span class="stat-label">Bags Concrete</span></div>` : ''}
        `;
        document.getElementById('est-summary').innerHTML = summaryHtml;

        // Material table
        let html = '';
        if (stats.extra) {
            html += `<div class="mat-category"><div class="mat-category-header" style="font-style:italic;font-size:11px;color:#666;">${stats.extra}</div></div>`;
        }
        for (const [category, items] of Object.entries(materials)) {
            html += `
                <div class="mat-category">
                    <div class="mat-category-header">${category}</div>
                    <table class="mat-table">
                        <tr><th>Qty</th><th>Item</th><th>Size</th><th>Notes</th></tr>
                        ${items.map(item => `
                            <tr>
                                <td class="qty">${item.qty}</td>
                                <td>${item.item}</td>
                                <td class="size-col">${item.size || ''}</td>
                                <td class="notes-col">${item.note || ''}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            `;
        }

        document.getElementById('est-results').innerHTML = html;

        this.lastMaterials = materials;
        this.lastStats = stats;
        this.lastTypeLabel = typeLabel;
    },

    // ===== EXPORT =====

    printResults() {
        window.print();
    },

    exportCSV() {
        if (!this.lastMaterials) { alert('Calculate materials first.'); return; }

        const jobName = document.getElementById('est-job-name').value || 'estimate';
        const fenceType = document.getElementById('est-fence-type').value;
        const heightIn = parseInt(document.getElementById('est-fence-height').value);
        let csv = `CFS Material Estimate\n`;
        csv += `Job: ${jobName}\n`;
        csv += `Fence Type: ${this.lastTypeLabel || fenceType}\n`;
        csv += `Fence Height: ${heightIn / 12}'\n`;
        csv += `\nQty,Item,Size,Notes\n`;

        for (const [category, items] of Object.entries(this.lastMaterials)) {
            csv += `\n--- ${category} ---\n`;
            items.forEach(item => {
                csv += `"${item.qty}","${item.item}","${item.size || ''}","${item.note || ''}"\n`;
            });
        }

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = jobName.replace(/[^a-zA-Z0-9_-]/g, '_') + '_materials.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // ===== CLEAR =====

    clearAll() {
        this.runs = [];
        this.gates = [];
        this.runCounter = 0;
        this.gateCounter = 0;
        this.addRun();
        this.renderGates();
        document.getElementById('est-results').innerHTML = '<p class="placeholder-text">Enter fence runs and click "Calculate Materials" to see results.</p>';
        document.getElementById('est-summary').innerHTML = '';
    },
};
