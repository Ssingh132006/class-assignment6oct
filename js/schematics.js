/**
 * schematics.js - Dynamic SVG Schematic Diagram Generator & Conduction Visualizer
 * for Power Electronic Rectifiers
 */

export class SchematicRenderer {
  constructor(containerElement) {
    this.container = containerElement;
    this.currentMode = null;
    this.devicesMap = new Map();
  }

  /**
   * Helper to draw a standard Power Diode or Thyristor symbol in SVG
   */
  createDeviceSymbol(id, label, x, y, angle = 0, isThyristor = false) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('id', `dev-${id}`);
    group.setAttribute('class', 'device-group');
    group.setAttribute('transform', `translate(${x}, ${y}) rotate(${angle})`);

    // Click handler for inspecting device specs
    group.setAttribute('data-device-id', id);
    group.setAttribute('data-device-type', isThyristor ? 'Thyristor (SCR)' : 'Diode');

    // Diode Triangle (Anode -> Cathode)
    const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    triangle.setAttribute('points', '-16,-12 -16,12 12,0');
    triangle.setAttribute('class', 'device-body device-symbol');

    // Cathode Bar
    const bar = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    bar.setAttribute('x1', '12');
    bar.setAttribute('y1', '-14');
    bar.setAttribute('x2', '12');
    bar.setAttribute('y2', '14');
    bar.setAttribute('class', 'device-body');
    bar.setAttribute('stroke-width', '2.5');

    // Leads
    const leadIn = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    leadIn.setAttribute('x1', '-28');
    leadIn.setAttribute('y1', '0');
    leadIn.setAttribute('x2', '-16');
    leadIn.setAttribute('y2', '0');
    leadIn.setAttribute('class', 'wire-base');

    const leadOut = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    leadOut.setAttribute('x1', '12');
    leadOut.setAttribute('y1', '0');
    leadOut.setAttribute('x2', '28');
    leadOut.setAttribute('y2', '0');
    leadOut.setAttribute('class', 'wire-base');

    group.appendChild(triangle);
    group.appendChild(bar);
    group.appendChild(leadIn);
    group.appendChild(leadOut);

    // If Thyristor, draw Gate Lead
    if (isThyristor) {
      const gateLead = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      gateLead.setAttribute('points', '10,7 2,18 2,24');
      gateLead.setAttribute('class', 'device-gate');
      gateLead.setAttribute('id', `gate-${id}`);
      group.appendChild(gateLead);

      const gateLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      gateLabel.setAttribute('x', '6');
      gateLabel.setAttribute('y', '28');
      gateLabel.setAttribute('font-size', '8');
      gateLabel.setAttribute('fill', '#c084fc');
      gateLabel.textContent = 'G';
      group.appendChild(gateLabel);
    }

    // Text Label (counter-rotate text so it stays upright)
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', angle === 90 ? '-22' : '-18');
    text.setAttribute('class', 'device-label');
    text.setAttribute('transform', `rotate(${-angle})`);
    text.textContent = label;
    group.appendChild(text);

    return group;
  }

  /**
   * Helper to render Load block (R, L, E and optional FWD)
   */
  createLoadBlock(x, y, loadType = 'RL') {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('id', 'load-assembly');
    group.setAttribute('transform', `translate(${x}, ${y})`);

    // Box outline
    const box = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    box.setAttribute('x', '-35');
    box.setAttribute('y', '0');
    box.setAttribute('width', '70');
    box.setAttribute('height', '130');
    box.setAttribute('class', 'load-box');
    group.appendChild(box);

    // Resistor Symbol
    const rLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    rLabel.setAttribute('x', '0');
    rLabel.setAttribute('y', '32');
    rLabel.setAttribute('class', 'load-text');
    rLabel.textContent = 'R (Load)';
    group.appendChild(rLabel);

    // Inductor Symbol
    if (loadType.includes('RL')) {
      const lLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      lLabel.setAttribute('x', '0');
      lLabel.setAttribute('y', '70');
      lLabel.setAttribute('class', 'load-text');
      lLabel.setAttribute('fill', '#f59e0b');
      lLabel.textContent = 'L (Ind)';
      group.appendChild(lLabel);
    }

    // Back-EMF / Battery Symbol
    if (loadType === 'RLE') {
      const eLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      eLabel.setAttribute('x', '0');
      eLabel.setAttribute('y', '108');
      eLabel.setAttribute('class', 'load-text');
      eLabel.setAttribute('fill', '#ec4899');
      eLabel.textContent = 'E (DC)';
      group.appendChild(eLabel);
    }

    return group;
  }

  /**
   * Renders the complete vector schematic based on circuit configuration
   */
  renderSchematic(config) {
    const { phase, rectType, device, load } = config;
    const isThy = device === 'thyristor';
    const isFull = rectType === 'full';
    const is3ph = phase === '3ph';

    this.container.innerHTML = '';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 540 380');
    svg.setAttribute('class', 'schematic-svg');

    // 1-PHASE HALF-WAVE
    if (!is3ph && !isFull) {
      this.build1PhHalfWave(svg, isThy, load);
    }
    // 1-PHASE FULL-WAVE BRIDGE
    else if (!is3ph && isFull) {
      this.build1PhFullBridge(svg, isThy, load);
    }
    // 3-PHASE HALF-WAVE (3-PULSE)
    else if (is3ph && !isFull) {
      this.build3PhHalfWave(svg, isThy, load);
    }
    // 3-PHASE FULL-WAVE (6-PULSE BRIDGE)
    else {
      this.build3PhFullBridge(svg, isThy, load);
    }

    this.container.appendChild(svg);
    this.currentSvg = svg;
  }

  build1PhHalfWave(svg, isThy, load) {
    const devName = isThy ? 'T1' : 'D1';

    // AC Source (Left circle)
    svg.innerHTML = `
      <g id="ac-source" transform="translate(90, 180)">
        <circle cx="0" cy="0" r="28" fill="#1e293b" stroke="#00f2fe" stroke-width="2.5" />
        <path d="M -12,0 Q -6,-14 0,0 T 12,0" fill="none" stroke="#00f2fe" stroke-width="2" />
        <text x="0" y="44" class="source-label" text-anchor="middle">v_s(t)</text>
        <text x="-40" y="-10" fill="#94a3b8" font-size="11" font-family="monospace">+</text>
        <text x="-40" y="20" fill="#94a3b8" font-size="11" font-family="monospace">-</text>
      </g>

      <!-- Main Wires -->
      <path id="wire-top-1" d="M 90,152 L 90,100 L 210,100" class="wire-base" />
      <path id="wire-top-2" d="M 270,100 L 420,100 L 420,120" class="wire-base" />
      <path id="wire-bottom" d="M 420,250 L 420,260 L 90,260 L 90,208" class="wire-base" />
    `;

    // Add Diode / Thyristor in top branch
    svg.appendChild(this.createDeviceSymbol(devName, devName, 240, 100, 0, isThy));

    // Add Freewheeling Diode branch if enabled
    if (load === 'RL_FWD') {
      const fwdGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      fwdGroup.innerHTML = `
        <path id="wire-fwd-top" d="M 340,100 L 340,130" class="wire-base" />
        <path id="wire-fwd-bot" d="M 340,230 L 340,260" class="wire-base" />
      `;
      svg.appendChild(fwdGroup);
      svg.appendChild(this.createDeviceSymbol('FWD', 'D_FW', 340, 180, 270, false));
    }

    // Add Load Block
    svg.appendChild(this.createLoadBlock(420, 120, load));
  }

  build1PhFullBridge(svg, isThy, load) {
    const p1 = isThy ? 'T1' : 'D1';
    const p2 = isThy ? 'T2' : 'D2';
    const p3 = isThy ? 'T3' : 'D3';
    const p4 = isThy ? 'T4' : 'D4';

    svg.innerHTML = `
      <!-- AC Source Left -->
      <g id="ac-source" transform="translate(60, 180)">
        <circle cx="0" cy="0" r="24" fill="#1e293b" stroke="#00f2fe" stroke-width="2.5" />
        <path d="M -10,0 Q -5,-12 0,0 T 10,0" fill="none" stroke="#00f2fe" stroke-width="2" />
        <text x="0" y="38" class="source-label" text-anchor="middle">v_s(t)</text>
      </g>

      <!-- Source input wires to bridge -->
      <path id="wire-src-pos" d="M 60,156 L 60,120 L 170,120 L 170,140" class="wire-base" />
      <path id="wire-src-neg" d="M 60,204 L 60,240 L 270,240 L 270,220" class="wire-base" />

      <!-- DC Bus Rails -->
      <path id="wire-dc-pos" d="M 170,80 L 170,60 L 440,60 L 440,110" class="wire-base" />
      <path id="wire-dc-neg" d="M 270,300 L 440,300 L 440,250" class="wire-base" />
      <path id="wire-bridge-top" d="M 170,60 L 270,60 L 270,80" class="wire-base" />
      <path id="wire-bridge-bot" d="M 170,280 L 170,300 L 270,300" class="wire-base" />
    `;

    // 4 Bridge Devices
    // Leg 1: Top (T1/D1), Bottom (T4/D4)
    svg.appendChild(this.createDeviceSymbol(p1, p1, 170, 95, 90, isThy));
    svg.appendChild(this.createDeviceSymbol(p4, p4, 170, 265, 90, isThy));

    // Leg 2: Top (T3/D3), Bottom (T2/D2)
    svg.appendChild(this.createDeviceSymbol(p3, p3, 270, 95, 90, isThy));
    svg.appendChild(this.createDeviceSymbol(p2, p2, 270, 265, 90, isThy));

    // Optional FWD
    if (load === 'RL_FWD') {
      const fwdGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      fwdGroup.innerHTML = `
        <path d="M 360,60 L 360,135" class="wire-base" />
        <path d="M 360,225 L 360,300" class="wire-base" />
      `;
      svg.appendChild(fwdGroup);
      svg.appendChild(this.createDeviceSymbol('FWD', 'D_FW', 360, 180, 270, false));
    }

    // Load
    svg.appendChild(this.createLoadBlock(440, 110, load));
  }

  build3PhHalfWave(svg, isThy, load) {
    const d1 = isThy ? 'T1' : 'D1';
    const d2 = isThy ? 'T2' : 'D2';
    const d3 = isThy ? 'T3' : 'D3';

    svg.innerHTML = `
      <!-- 3-Phase Sources (A, B, C) with Neutral -->
      <g id="3ph-sources" transform="translate(60, 60)">
        <!-- Phase A -->
        <circle cx="0" cy="50" r="16" fill="#1e293b" stroke="#ef4444" stroke-width="2" />
        <text x="0" y="54" fill="#ef4444" font-size="10" font-weight="bold" text-anchor="middle">A</text>

        <!-- Phase B -->
        <circle cx="0" cy="130" r="16" fill="#1e293b" stroke="#eab308" stroke-width="2" />
        <text x="0" y="134" fill="#eab308" font-size="10" font-weight="bold" text-anchor="middle">B</text>

        <!-- Phase C -->
        <circle cx="0" cy="210" r="16" fill="#1e293b" stroke="#3b82f6" stroke-width="2" />
        <text x="0" y="214" fill="#3b82f6" font-size="10" font-weight="bold" text-anchor="middle">C</text>

        <!-- Neutral Bar -->
        <circle cx="-30" cy="130" r="6" fill="#64748b" />
        <text x="-30" y="152" fill="#94a3b8" font-size="10" font-weight="bold" text-anchor="middle">N</text>
        <line x1="-30" y1="130" x2="-16" y2="130" stroke="#64748b" stroke-width="2" />
        <line x1="-30" y1="130" x2="-16" y2="50" stroke="#64748b" stroke-width="2" />
        <line x1="-30" y1="130" x2="-16" y2="210" stroke="#64748b" stroke-width="2" />
      </g>

      <!-- Input wires to rectifiers -->
      <path id="wire-a" d="M 76,110 L 200,110" class="wire-base" />
      <path id="wire-b" d="M 76,190 L 200,190" class="wire-base" />
      <path id="wire-c" d="M 76,270 L 200,270" class="wire-base" />

      <!-- Common Cathode Bus -->
      <path id="wire-common-cathode" d="M 260,110 L 320,110 L 320,190 L 320,270" class="wire-base" />
      <path id="wire-to-load" d="M 320,110 L 440,110 L 440,120" class="wire-base" />

      <!-- Neutral Return Bus to Load -->
      <path id="wire-neutral-bus" d="M 30,190 L 15,190 L 15,340 L 440,340 L 440,250" class="wire-base" />
    `;

    // Devices
    svg.appendChild(this.createDeviceSymbol(d1, d1, 230, 110, 0, isThy));
    svg.appendChild(this.createDeviceSymbol(d2, d2, 230, 190, 0, isThy));
    svg.appendChild(this.createDeviceSymbol(d3, d3, 230, 270, 0, isThy));

    // Load
    svg.appendChild(this.createLoadBlock(440, 120, load));
  }

  build3PhFullBridge(svg, isThy, load) {
    const t = isThy ? 'T' : 'D';

    svg.innerHTML = `
      <!-- 3-Phase Terminals A, B, C on left -->
      <g id="3ph-terminals" transform="translate(45, 90)">
        <circle cx="0" cy="40" r="14" fill="#1e293b" stroke="#ef4444" stroke-width="2" />
        <text x="0" y="44" fill="#ef4444" font-size="10" font-weight="bold" text-anchor="middle">A</text>

        <circle cx="0" cy="100" r="14" fill="#1e293b" stroke="#eab308" stroke-width="2" />
        <text x="0" y="104" fill="#eab308" font-size="10" font-weight="bold" text-anchor="middle">B</text>

        <circle cx="0" cy="160" r="14" fill="#1e293b" stroke="#3b82f6" stroke-width="2" />
        <text x="0" y="164" fill="#3b82f6" font-size="10" font-weight="bold" text-anchor="middle">C</text>
      </g>

      <!-- Connecting Phase Wires into the 3 Legs -->
      <path id="wire-in-a" d="M 59,130 L 150,130 L 150,180" class="wire-base" />
      <path id="wire-in-b" d="M 59,190 L 230,190 L 230,180" class="wire-base" />
      <path id="wire-in-c" d="M 59,250 L 310,250 L 310,180" class="wire-base" />

      <!-- DC Positive Rail (Top) -->
      <path id="wire-dc-top" d="M 150,60 L 310,60 L 450,60 L 450,110" class="wire-base" />

      <!-- DC Negative Rail (Bottom) -->
      <path id="wire-dc-bot" d="M 150,300 L 310,300 L 450,300 L 450,250" class="wire-base" />
    `;

    // Leg 1: T1 (Top), T4 (Bottom)
    svg.appendChild(this.createDeviceSymbol(`${t}1`, `${t}1`, 150, 95, 90, isThy));
    svg.appendChild(this.createDeviceSymbol(`${t}4`, `${t}4`, 150, 265, 90, isThy));

    // Leg 2: T3 (Top), T6 (Bottom)
    svg.appendChild(this.createDeviceSymbol(`${t}3`, `${t}3`, 230, 95, 90, isThy));
    svg.appendChild(this.createDeviceSymbol(`${t}6`, `${t}6`, 230, 265, 90, isThy));

    // Leg 3: T5 (Top), T2 (Bottom)
    svg.appendChild(this.createDeviceSymbol(`${t}5`, `${t}5`, 310, 95, 90, isThy));
    svg.appendChild(this.createDeviceSymbol(`${t}2`, `${t}2`, 310, 265, 90, isThy));

    // Optional FWD
    if (load === 'RL_FWD') {
      const fwdGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      fwdGroup.innerHTML = `
        <path d="M 380,60 L 380,135" class="wire-base" />
        <path d="M 380,225 L 380,300" class="wire-base" />
      `;
      svg.appendChild(fwdGroup);
      svg.appendChild(this.createDeviceSymbol('FWD', 'D_FW', 380, 180, 270, false));
    }

    // Load
    svg.appendChild(this.createLoadBlock(450, 110, load));
  }

  /**
   * Updates visual conduction state (illuminates conducting devices & flowing current wires)
   */
  updateConductionState(conductingDevices = [], isFiring = false) {
    if (!this.currentSvg) return;

    // Reset all device groups to blocking/idle
    const allDevices = this.currentSvg.querySelectorAll('.device-group');
    allDevices.forEach(g => {
      g.classList.remove('device-conducting');
      g.classList.add('device-blocking');
    });

    // Reset all wires
    const allWires = this.currentSvg.querySelectorAll('.wire-base');
    allWires.forEach(w => {
      w.classList.remove('wire-active');
      w.classList.remove('wire-active-return');
    });

    // Highlight actively conducting devices
    conductingDevices.forEach(devId => {
      const el = this.currentSvg.querySelector(`#dev-${devId}`);
      if (el) {
        el.classList.add('device-conducting');
        el.classList.remove('device-blocking');
      }
    });

    // Animate active current wires
    if (conductingDevices.length > 0) {
      allWires.forEach(w => {
        w.classList.add('wire-active');
      });
    }
  }
}
