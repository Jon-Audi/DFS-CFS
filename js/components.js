// components.js — Fence component catalog and sidebar UI
// Component data based on original CFS CAP files and hardware catalog

const Components = {
    catalog: [
        {
            category: 'Posts',
            items: [
                { id: 'post-end-2375', name: '2-3/8" End Post', size: '2-3/8"', desc: 'Standard terminal/end post' },
                { id: 'post-end-2875', name: '2-7/8" End Post', size: '2-7/8"', desc: 'Heavy duty end post' },
                { id: 'post-corner-2375', name: '2-3/8" Corner Post', size: '2-3/8"', desc: 'Standard corner post' },
                { id: 'post-corner-2875', name: '2-7/8" Corner Post', size: '2-7/8"', desc: 'Heavy duty corner post' },
                { id: 'post-line-1625', name: '1-5/8" Line Post', size: '1-5/8"', desc: 'Standard line post' },
                { id: 'post-line-2375', name: '2-3/8" Line Post', size: '2-3/8"', desc: 'Heavy duty line post' },
                { id: 'post-gate-2375', name: '2-3/8" Gate Post', size: '2-3/8"', desc: 'Standard gate post' },
                { id: 'post-gate-2875', name: '2-7/8" Gate Post', size: '2-7/8"', desc: 'Heavy gate post' },
                { id: 'post-gate-4', name: '4" Gate Post', size: '4"', desc: 'Industrial gate post' },
                { id: 'post-gate-6625', name: '6-5/8" Gate Post', size: '6-5/8"', desc: 'Slide gate post' },
            ],
        },
        {
            category: 'Caps',
            items: [
                { id: 'cap-dome-1625', name: '1-5/8" Dome Cap', size: '1-5/8"', desc: 'Aluminum die cast dome cap' },
                { id: 'cap-dome-2375', name: '2-3/8" Dome Cap', size: '2-3/8"', desc: 'Aluminum die cast dome cap' },
                { id: 'cap-dome-2875', name: '2-7/8" Dome Cap', size: '2-7/8"', desc: 'Aluminum die cast dome cap' },
                { id: 'cap-loop-1625', name: '1-5/8" Loop Cap', size: '1-5/8"', desc: 'Pressed steel loop cap' },
                { id: 'cap-loop-2375', name: '2-3/8" Loop Cap', size: '2-3/8"', desc: 'Pressed steel loop cap' },
                { id: 'cap-loop-2875', name: '2-7/8" Loop Cap', size: '2-7/8"', desc: 'Pressed steel loop cap' },
                { id: 'cap-pagoda-2375', name: '2-3/8" Pagoda Cap', size: '2-3/8"', desc: 'Decorative pagoda style cap' },
                { id: 'cap-pagoda-2875', name: '2-7/8" Pagoda Cap', size: '2-7/8"', desc: 'Decorative pagoda style cap' },
                { id: 'cap-acorn-2375', name: '2-3/8" Acorn Cap', size: '2-3/8"', desc: 'Ornamental acorn finial cap' },
                { id: 'cap-ball-2375', name: '2-3/8" Ball Cap', size: '2-3/8"', desc: 'Ornamental ball finial cap' },
            ],
        },
        {
            category: 'Hardware',
            items: [
                { id: 'hw-tensionband-2375', name: '2-3/8" Tension Band', size: '2-3/8"', desc: 'Regular tension band' },
                { id: 'hw-tensionband-2875', name: '2-7/8" Tension Band', size: '2-7/8"', desc: 'Heavy tension band' },
                { id: 'hw-braceband-2375', name: '2-3/8" Brace Band', size: '2-3/8"', desc: 'Regular brace band' },
                { id: 'hw-braceband-2875', name: '2-7/8" Brace Band', size: '2-7/8"', desc: 'Heavy brace band' },
                { id: 'hw-braceband-3way', name: '3-Way Brace Band', size: '', desc: '2 & 3 way brace bands' },
                { id: 'hw-tensionbar-316', name: '3/16" Tension Bar', size: '3/16" x 5/8"', desc: 'Standard tension bar' },
                { id: 'hw-tensionbar-14', name: '1/4" Tension Bar', size: '1/4" x 3/4"', desc: 'Heavy duty tension bar' },
                { id: 'hw-trussrod', name: 'Truss Rod', size: '', desc: 'Truss rod with tightener' },
                { id: 'hw-railend-1375', name: '1-3/8" Rail End', size: '1-3/8"', desc: 'Rail end cup/band' },
                { id: 'hw-railend-1625', name: '1-5/8" Rail End', size: '1-5/8"', desc: 'Rail end cup/band' },
                { id: 'hw-barb-arm', name: 'Barbed Wire Arm', size: '', desc: 'Barbed wire extension arm' },
                { id: 'hw-tie-wire', name: 'Hog Ring Ties', size: '', desc: 'Fabric tie wire' },
                { id: 'hw-gate-clip', name: 'Gate Clip', size: '', desc: 'Standard gate clip' },
                { id: 'hw-carriage-bolt', name: 'Carriage Bolt', size: '5/16" x 1-1/4"', desc: 'Standard carriage bolt with nut' },
            ],
        },
        {
            category: 'Hinges',
            items: [
                { id: 'hinge-male-1375', name: '1-3/8" Male Hinge', size: '1-3/8"', desc: 'Regular male hinge' },
                { id: 'hinge-female-1375', name: '1-3/8" Female Hinge', size: '1-3/8"', desc: 'Regular female hinge' },
                { id: 'hinge-male-1625', name: '1-5/8" Male Hinge', size: '1-5/8"', desc: 'Residential male hinge' },
                { id: 'hinge-female-1625', name: '1-5/8" Female Hinge', size: '1-5/8"', desc: 'Residential female hinge' },
                { id: 'hinge-bulldog', name: 'Bulldog Hinge', size: '', desc: 'Industrial bulldog hinge' },
                { id: 'hinge-box-2375', name: '2-3/8" Box Hinge', size: '2-3/8"', desc: 'Heavy duty box hinge' },
                { id: 'hinge-strap', name: 'Strap Hinge', size: '', desc: 'J-bolt strap hinge' },
                { id: 'hinge-self-closing', name: 'Self-Closing Hinge', size: '', desc: 'Spring-loaded self-closing' },
            ],
        },
        {
            category: 'Latches',
            items: [
                { id: 'latch-butterfly-2375', name: '2-3/8" Butterfly Latch', size: '2-3/8" x 1-5/8"', desc: 'Standard butterfly latch' },
                { id: 'latch-fork-1375', name: '1-3/8" Fork Latch', size: '1-3/8"', desc: 'Standard fork latch' },
                { id: 'latch-fork-1625', name: '1-5/8" Fork Latch', size: '1-5/8"', desc: 'Residential fork latch' },
                { id: 'latch-cantilever', name: 'Cantilever Latch', size: '', desc: 'Slide gate cantilever latch' },
                { id: 'latch-pad-bolt', name: 'Pad Bolt', size: '', desc: 'Drop rod / pad bolt latch' },
                { id: 'latch-pool', name: 'Pool Gate Latch', size: '', desc: 'Self-closing pool safety latch' },
                { id: 'latch-magna', name: 'Magna Latch', size: '', desc: 'Magnetic safety pool latch' },
                { id: 'latch-chain-drop', name: 'Chain & Drop Pin', size: '', desc: 'Double gate chain drop rod' },
            ],
        },
        {
            category: 'Gates',
            items: [
                { id: 'gate-frame-walk', name: 'Walk Gate Frame', size: '', desc: 'Pre-made walk gate frame' },
                { id: 'gate-frame-drive', name: 'Drive Gate Frame', size: '', desc: 'Pre-made drive gate frame' },
                { id: 'gate-frame-double', name: 'Double Gate Frame', size: '', desc: 'Pre-made double drive gate' },
                { id: 'gate-slide-track', name: 'Slide Gate Track', size: '', desc: 'V-groove slide gate track' },
                { id: 'gate-slide-wheel', name: 'Slide Gate Wheel', size: '', desc: 'Slide gate roller assembly' },
                { id: 'gate-cant-roller', name: 'Cantilever Rollers', size: '', desc: 'Cantilever gate roller set' },
                { id: 'gate-operator', name: 'Gate Operator', size: '', desc: 'Automatic gate operator' },
                { id: 'gate-receiver', name: 'Gate Receiver', size: '', desc: 'Slide gate guide/receiver' },
            ],
        },
        {
            category: 'Fencing',
            items: [
                { id: 'fabric-cl-9ga', name: '9 Ga Chainlink Fabric', size: '2"', desc: '9 gauge 2" mesh chainlink' },
                { id: 'fabric-cl-11ga', name: '11 Ga Chainlink Fabric', size: '2"', desc: '11 gauge 2" mesh chainlink' },
                { id: 'fabric-cl-11half', name: '11-1/2 Ga Chainlink', size: '2-1/4"', desc: '11.5 gauge 2-1/4" mesh' },
                { id: 'fabric-cl-6ga', name: '6 Ga Chainlink Fabric', size: '2"', desc: '6 gauge 2" mesh (heavy)' },
                { id: 'fabric-vinyl-coated', name: 'Vinyl Coated Fabric', size: '2"', desc: 'Color coated chainlink' },
                { id: 'fabric-privacy-slat', name: 'Privacy Slats', size: '', desc: 'Fence privacy insert slats' },
                { id: 'fabric-windscreen', name: 'Windscreen', size: '', desc: 'Knitted windscreen fabric' },
                { id: 'barb-wire', name: 'Barbed Wire', size: '', desc: '12.5 ga barbed wire strand' },
                { id: 'razor-wire', name: 'Razor Wire', size: '', desc: 'Concertina razor coil' },
            ],
        },
        {
            category: 'Misc',
            items: [
                { id: 'misc-concrete', name: 'Concrete (bag)', size: '80 lb', desc: '80 lb bag of post-set concrete' },
                { id: 'misc-saddle-clamp', name: 'Saddle Clamp', size: '', desc: 'Pipe saddle clamp' },
                { id: 'misc-t-clamp', name: 'T-Clamp', size: '', desc: 'T-clamp pipe connector' },
                { id: 'misc-corner-clamp', name: 'Corner Clamp', size: '', desc: 'Corner clamp connector' },
                { id: 'misc-sleeve', name: 'Post Sleeve', size: '', desc: 'Post top rail sleeve/coupling' },
                { id: 'misc-eye-top', name: 'Eye Top', size: '', desc: 'Eye top for line post' },
                { id: 'misc-flat-top', name: 'Flat Top', size: '', desc: 'Flat top for line post' },
                { id: 'misc-clip-bottom', name: 'Bottom Clip', size: '', desc: 'Bottom rail clip' },
            ],
        },
    ],

    init() {
        this.renderCatalog();
    },

    renderCatalog() {
        const container = document.getElementById('component-categories');
        let html = '';

        this.catalog.forEach((cat, ci) => {
            html += `
                <div class="component-category">
                    <div class="category-header" data-cat="${ci}" onclick="Components.toggleCategory(${ci})">
                        <span class="arrow">&#9654;</span>
                        ${cat.category} <span style="margin-left:auto;color:var(--text-muted);font-size:10px;">${cat.items.length}</span>
                    </div>
                    <div class="category-items" id="cat-items-${ci}">
                        ${cat.items.map(item => `
                            <div class="component-item" data-comp-id="${item.id}"
                                 onclick="Components.placeComponent('${item.id}')"
                                 title="${item.desc}">
                                <span class="comp-icon">${this.getIcon(cat.category)}</span>
                                ${item.name}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    getIcon(category) {
        const icons = {
            'Posts': '<svg viewBox="0 0 16 16" width="14" height="14"><circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/></svg>',
            'Caps': '<svg viewBox="0 0 16 16" width="14" height="14"><path d="M4 10h8l-1-6H5z" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="4" y1="10" x2="12" y2="10" stroke="currentColor" stroke-width="1.5"/></svg>',
            'Hardware': '<svg viewBox="0 0 16 16" width="14" height="14"><rect x="3" y="5" width="10" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
            'Hinges': '<svg viewBox="0 0 16 16" width="14" height="14"><circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="2" y1="8" x2="5" y2="8" stroke="currentColor" stroke-width="1.5"/><line x1="11" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="1.5"/></svg>',
            'Latches': '<svg viewBox="0 0 16 16" width="14" height="14"><path d="M3 6h6v4H3zM9 7h4v2H9z" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
            'Gates': '<svg viewBox="0 0 16 16" width="14" height="14"><rect x="2" y="4" width="12" height="8" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="2" y1="4" x2="14" y2="12" stroke="currentColor" stroke-width="1"/></svg>',
            'Fencing': '<svg viewBox="0 0 16 16" width="14" height="14"><line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="1.5"/><line x1="2" y1="5" x2="14" y2="11" stroke="currentColor" stroke-width="0.5"/><line x1="2" y1="11" x2="14" y2="5" stroke="currentColor" stroke-width="0.5"/></svg>',
            'Misc': '<svg viewBox="0 0 16 16" width="14" height="14"><circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2"/></svg>',
        };
        return icons[category] || '';
    },

    toggleCategory(index) {
        const items = document.getElementById(`cat-items-${index}`);
        const header = items.previousElementSibling;
        items.classList.toggle('show');
        header.classList.toggle('expanded');
    },

    placeComponent(compId) {
        // Find component data
        let compData = null;
        for (const cat of this.catalog) {
            const item = cat.items.find(i => i.id === compId);
            if (item) {
                compData = { ...item, category: cat.category };
                break;
            }
        }
        if (!compData) return;

        // Switch to a "place component" mode — next click on canvas places it
        Tools.setTool('select');
        Tools.activeTool = '_placeComponent';
        Tools.pendingComponent = compData;

        // Override the next mousedown to place the component
        const handler = (e) => {
            const rect = Canvas.container.getBoundingClientRect();
            const sx = e.clientX - rect.left;
            const sy = e.clientY - rect.top;
            const world = Canvas.screenToWorld(sx, sy);
            const snapped = Canvas.snapPoint(world.x, world.y);

            const el = Drawing.createComponent(snapped.x, snapped.y, compData);
            Drawing.addElement(el);
            Canvas.needsRedraw = true;

            Canvas.container.removeEventListener('mousedown', handler);
            Tools.activeTool = 'select';
            Tools.updateUI();
            document.getElementById('status-tool').textContent = 'Tool: Select';
        };
        Canvas.container.addEventListener('mousedown', handler, { once: true });

        document.getElementById('status-tool').textContent = `Place: ${compData.name}`;
    },

    // Get component by id
    getComponent(compId) {
        for (const cat of this.catalog) {
            const item = cat.items.find(i => i.id === compId);
            if (item) return { ...item, category: cat.category };
        }
        return null;
    },
};
