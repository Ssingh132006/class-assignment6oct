/**
 * schematics.js - Precision Vector SVG Schematic Generator
 * IEEE Standard Power Electronics Diagrams with seamless connections,
 * correct component orientations, junction dots, and conduction glowing paths.
 */

export class SchematicRenderer {
  constructor(containerElement) {
    this.container = containerElement;
    this.currentSvg = null;
  }

  /**
   * Helper to draw a junction connection dot (IEEE standard)
   */
  dot(x, y) {
    return `<circle cx="${x}" cy="${y}" r="3.5" class="junction-dot" fill="#00f2fe" />`;
  }

  /**
   * Draws a vertical diode or thyristor pointing UPWARDS (Anode at bottom, Cathode at top)
   * Connects seamlessly between (x, yBottom) and (x, yTop)
   */
  verticalDevice(id, label, x, yTop, yBottom, isThyristor = false) {
    const yMid = (yTop + yBottom) / 2;
    const bodyH = 22; // total symbol height
    const triTop = yMid - 10;
    const triBot = yMid + 10;

    let gateSvg = '';
    if (isThyristor) {
      gateSvg = `
        <polyline points="${x + 9},${yMid - 4} ${x + 20},${yMid + 2} ${x + 20},${yMid + 10}" 
                  class="device-gate" id="gate-wire-${id}" />
        <text x="${x + 24}" y="${yMid + 8}" class="gate-tag">G</text>
      `;
    }

    return `
      <g id="dev-${id}" class="device-group" data-device-id="${id}" data-device-type="${isThyristor ? 'Thyristor (SCR)' : 'Diode'}">
        <!-- Connecting Leads -->
        <line x1="${x}" y1="${yBottom}" x2="${x}" y2="${triBot}" class="wire-base" />
        <line x1="${x}" y1="${triTop}" x2="${x}" y2="${yTop}" class="wire-base" />

        <!-- Diode Triangle (Anode -> Cathode, pointing UP) -->
        <polygon points="${x},${triTop} ${x - 12},${triBot} ${x + 12},${triBot}" class="device-body device-symbol" />

        <!-- Cathode Horizontal Bar -->
        <line x1="${x - 14}" y1="${triTop}" x2="${x + 14}" y2="${triTop}" class="device-body" stroke-width="2.8" />

        ${gateSvg}

        <!-- Label -->
        <text x="${x - 18}" y="${yMid + 4}" class="device-label" text-anchor="end">${label}</text>
      </g>
    `;
  }

  /**
   * Draws a horizontal diode or thyristor pointing RIGHTWARDS (Anode at left, Cathode at right)
   * Connects seamlessly between (xLeft, y) and (xRight, y)
   */
  horizontalDevice(id, label, xLeft, xRight, y, isThyristor = false) {
    const xMid = (xLeft + xRight) / 2;
    const triLeft = xMid - 10;
    const triRight = xMid + 10;

    let gateSvg = '';
    if (isThyristor) {
      gateSvg = `
        <polyline points="${xMid + 4},${y + 9} ${xMid - 2},${y + 20} ${xMid - 2},${y + 26}" 
                  class="device-gate" id="gate-wire-${id}" />
        <text x="${xMid + 4}" y="${y + 28}" class="gate-tag">G</text>
      `;
    }

    return `
      <g id="dev-${id}" class="device-group" data-device-id="${id}" data-device-type="${isThyristor ? 'Thyristor (SCR)' : 'Diode'}">
        <!-- Connecting Leads -->
        <line x1="${xLeft}" y1="${y}" x2="${triLeft}" y2="${y}" class="wire-base" />
        <line x1="${triRight}" y1="${y}" x2="${xRight}" y2="${y}" class="wire-base" />

        <!-- Diode Triangle pointing RIGHT -->
        <polygon points="${triRight},${y} ${triLeft},${y - 12} ${triLeft},${y + 12}" class="device-body device-symbol" />

        <!-- Cathode Vertical Bar -->
        <line x1="${triRight}" y1="${y - 14}" x2="${triRight}" y2="${y + 14}" class="device-body" stroke-width="2.8" />

        ${gateSvg}

        <!-- Label -->
        <text x="${xMid}" y="${y - 18}" class="device-label" text-anchor="middle">${label}</text>
      </g>
    `;
  }

  /**
   * Helper to draw Load Block (R, L, E) between (x, yTop) and (x, yBottom)
   */
  loadBlock(x, yTop, yBottom, loadType) {
    const height = yBottom - yTop - 40;
    const boxY = yTop + 20;

    return `
      <g id="load-group">
        <!-- Top and Bottom Leads -->
        <line x1="${x}" y1="${yTop}" x2="${x}" y2="${boxY}" class="wire-base" />
        <line x1="${x}" y1="${boxY + height}" x2="${x}" y2="${yBottom}" class="wire-base" />

        <!-- Load Container Box -->
        <rect x="${x - 36}" y="${boxY}" width="72" height="${height}" class="load-box" />

        <!-- Resistor Symbol / Text -->
        <rect x="${x - 14}" y="${boxY + 12}" width="28" height="34" fill="#0f172a" stroke="#00f2fe" stroke-width="1.8" rx="3" />
        <text x="${x}" y="${boxY + 33}" class="load-text" font-weight="bold">R</text>

        <!-- Inductor (if present) -->
        ${loadType.includes('RL') ? `
          <g transform="translate(${x}, ${boxY + 68})">
            <path d="M -16,0 A 6,6 0 0,1 -6,0 A 6,6 0 0,1 4,0 A 6,6 0 0,1 14,0" fill="none" stroke="#f59e0b" stroke-width="2" />
            <text x="0" y="16" class="load-text" fill="#f59e0b" font-size="10">L (Ind)</text>
          </g>
        ` : ''}

        <!-- DC Battery E (if RLE) -->
        ${loadType === 'RLE' ? `
          <g transform="translate(${x}, ${boxY + 108})">
            <line x1="-14" y1="-4" x2="14" y2="-4" stroke="#ec4899" stroke-width="2.5" />
            <line x1="-8" y1="4" x2="8" y2="4" stroke="#ec4899" stroke-width="2.5" />
            <text x="0" y="20" class="load-text" fill="#ec4899" font-size="10">E (+/-)</text>
          </g>
        ` : ''}

        <!-- DC Polarity Markers -->
        <text x="${x + 28}" y="${yTop + 16}" fill="#10b981" font-weight="bold" font-family="monospace">+</text>
        <text x="${x + 28}" y="${yBottom - 8}" fill="#38bdf8" font-weight="bold" font-family="monospace">-</text>
        <text x="${x}" y="${yBottom + 20}" class="load-text" fill="#cbd5e1">DC LOAD</text>
      </g>
    `;
  }

  /**
   * Main render dispatch
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

    let content = '';

    if (!is3ph && !isFull) {
      content = this.render1PhHalfWave(isThy, load);
    } else if (!is3ph && isFull) {
      content = this.render1PhFullBridge(isThy, load);
    } else if (is3ph && !isFull) {
      content = this.render3PhHalfWave(isThy, load);
    } else {
      content = this.render3PhFullBridge(isThy, load);
    }

    svg.innerHTML = content;
    this.container.appendChild(svg);
    this.currentSvg = svg;
  }

  // =========================================================================
  // 1-PHASE HALF-WAVE SCHEMATIC
  // =========================================================================
  render1PhHalfWave(isThy, load) {
    const devId = isThy ? 'T1' : 'D1';
    const hasFWD = load === 'RL_FWD';

    return `
      <!-- AC Source -->
      <g id="ac-source" transform="translate(80, 190)">
        <circle cx="0" cy="0" r="28" fill="#1e293b" stroke="#00f2fe" stroke-width="2.5" />
        <path d="M -12,0 Q -6,-14 0,0 T 12,0" fill="none" stroke="#00f2fe" stroke-width="2.2" />
        <text x="0" y="44" class="source-label" text-anchor="middle">v_s(t)</text>
        <text x="-40" y="-12" fill="#94a3b8" font-size="11" font-family="monospace">+</text>
        <text x="-40" y="24" fill="#94a3b8" font-size="11" font-family="monospace">-</text>
      </g>

      <!-- Main Loop Wires -->
      <!-- From AC Top (80, 162) to (80, 100) to (190, 100) -->
      <path id="wire-src-top" d="M 80,162 L 80,100 L 190,100" class="wire-base" />

      <!-- Device in top branch (190, 100) to (270, 100) -->
      ${this.horizontalDevice(devId, devId, 190, 270, 100, isThy)}

      <!-- From Device Cathode (270, 100) to Load (430, 100) -->
      <path id="wire-dc-top" d="M 270,100 L 430,100" class="wire-base" />

      <!-- Return Wire from Load (430, 280) to (80, 280) to AC Bottom (80, 218) -->
      <path id="wire-return" d="M 430,280 L 80,280 L 80,218" class="wire-base" />

      <!-- Optional Freewheeling Diode (FWD) in parallel with load -->
      ${hasFWD ? `
        <!-- FWD branches from (340, 100) down to (340, 280) pointing UP -->
        ${this.verticalDevice('FWD', 'D_FW', 340, 100, 280, false)}
        ${this.dot(340, 100)}
        ${this.dot(340, 280)}
      ` : ''}

      <!-- Load Block -->
      ${this.loadBlock(430, 100, 280, load)}
      ${this.dot(430, 100)}
      ${this.dot(430, 280)}
    `;
  }

  // =========================================================================
  // 1-PHASE FULL-WAVE BRIDGE SCHEMATIC
  // Standard 4-device bridge where all 4 devices point UPWARDS towards DC+
  // =========================================================================
  render1PhFullBridge(isThy, load) {
    const t = isThy ? 'T' : 'D';
    const hasFWD = load === 'RL_FWD';

    // Leg 1 at x = 180 (T1 top, T4 bottom)
    // Leg 2 at x = 280 (T3 top, T2 bottom)
    // DC Positive rail at y = 70
    // DC Negative rail at y = 310
    // AC Line 1 enters Leg 1 at midpoint y = 190
    // AC Line 2 enters Leg 2 at midpoint y = 190

    return `
      <!-- AC Source on Left -->
      <g id="ac-source" transform="translate(65, 190)">
        <circle cx="0" cy="0" r="26" fill="#1e293b" stroke="#00f2fe" stroke-width="2.5" />
        <path d="M -11,0 Q -5,-13 0,0 T 11,0" fill="none" stroke="#00f2fe" stroke-width="2.2" />
        <text x="0" y="42" class="source-label" text-anchor="middle">v_s(t)</text>
      </g>

      <!-- AC Input Lines to Bridge Midpoints -->
      <!-- Line 1: from AC source top (65, 164) to (65, 130) to (180, 130) to Leg 1 Midpoint (180, 190) -->
      <path id="wire-ac1" d="M 65,164 L 65,130 L 180,130 L 180,190" class="wire-base" />

      <!-- Line 2: from AC source bot (65, 216) to (65, 250) to (280, 250) to Leg 2 Midpoint (280, 190) -->
      <path id="wire-ac2" d="M 65,216 L 65,250 L 280,250 L 280,190" class="wire-base" />

      <!-- Junction dots at AC midpoints -->
      ${this.dot(180, 190)}
      ${this.dot(280, 190)}

      <!-- TOP DC POSITIVE RAIL (y = 70) -->
      <line x1="180" y1="70" x2="440" y2="70" class="wire-base" id="rail-dc-pos" />
      <text x="360" y="60" fill="#10b981" font-size="11" font-family="monospace" font-weight="bold">+ DC Rail</text>
      ${this.dot(180, 70)}
      ${this.dot(280, 70)}

      <!-- BOTTOM DC NEGATIVE RAIL (y = 310) -->
      <line x1="180" y1="310" x2="440" y2="310" class="wire-base" id="rail-dc-neg" />
      <text x="360" y="328" fill="#38bdf8" font-size="11" font-family="monospace" font-weight="bold">- DC Rail</text>
      ${this.dot(180, 310)}
      ${this.dot(280, 310)}

      <!-- ================= BRIDGE LEG 1 (x = 180) ================= -->
      <!-- Top Device T1 / D1 (points UP from midpoint 190 to top rail 70) -->
      ${this.verticalDevice(`${t}1`, `${t}1`, 180, 70, 190, isThy)}

      <!-- Bottom Device T4 / D4 (points UP from bottom rail 310 to midpoint 190) -->
      ${this.verticalDevice(`${t}4`, `${t}4`, 180, 190, 310, isThy)}

      <!-- ================= BRIDGE LEG 2 (x = 280) ================= -->
      <!-- Top Device T3 / D3 (points UP from midpoint 190 to top rail 70) -->
      ${this.verticalDevice(`${t}3`, `${t}3`, 280, 70, 190, isThy)}

      <!-- Bottom Device T2 / D2 (points UP from bottom rail 310 to midpoint 190) -->
      ${this.verticalDevice(`${t}2`, `${t}2`, 280, 190, 310, isThy)}

      <!-- Optional Freewheeling Diode (FWD) at x = 360 -->
      ${hasFWD ? `
        ${this.verticalDevice('FWD', 'D_FW', 360, 70, 310, false)}
        ${this.dot(360, 70)}
        ${this.dot(360, 310)}
      ` : ''}

      <!-- DC LOAD at x = 440 -->
      ${this.loadBlock(440, 70, 310, load)}
      ${this.dot(440, 70)}
      ${this.dot(440, 310)}
    `;
  }

  // =========================================================================
  // 3-PHASE HALF-WAVE SCHEMATIC (3-Pulse Star with Neutral)
  // 3 Horizontal Devices pointing towards Common Cathode
  // =========================================================================
  render3PhHalfWave(isThy, load) {
    const t = isThy ? 'T' : 'D';

    return `
      <!-- 3-Phase Star Sources on Left with Neutral -->
      <g id="3ph-source-group" transform="translate(60, 70)">
        <!-- Neutral Terminal N -->
        <circle cx="0" cy="120" r="6" fill="#64748b" />
        <text x="-16" y="124" fill="#94a3b8" font-size="11" font-weight="bold">N</text>

        <!-- Phase A -->
        <circle cx="45" cy="40" r="16" fill="#1e293b" stroke="#ef4444" stroke-width="2" />
        <text x="45" y="44" fill="#ef4444" font-size="10" font-weight="bold" text-anchor="middle">v_A</text>
        <line x1="0" y1="120" x2="29" y2="40" stroke="#64748b" stroke-width="1.8" />

        <!-- Phase B -->
        <circle cx="45" cy="120" r="16" fill="#1e293b" stroke="#eab308" stroke-width="2" />
        <text x="45" y="124" fill="#eab308" font-size="10" font-weight="bold" text-anchor="middle">v_B</text>
        <line x1="0" y1="120" x2="29" y2="120" stroke="#64748b" stroke-width="1.8" />

        <!-- Phase C -->
        <circle cx="45" cy="200" r="16" fill="#1e293b" stroke="#3b82f6" stroke-width="2" />
        <text x="45" y="204" fill="#3b82f6" font-size="10" font-weight="bold" text-anchor="middle">v_C</text>
        <line x1="0" y1="120" x2="29" y2="200" stroke="#64748b" stroke-width="1.8" />
      </g>

      <!-- Connecting Phase lines to 3 Devices -->
      <!-- Phase A to T1 (y = 110) -->
      <line x1="121" y1="110" x2="190" y2="110" class="wire-base" />
      ${this.horizontalDevice(`${t}1`, `${t}1`, 190, 270, 110, isThy)}
      <line x1="270" y1="110" x2="330" y2="110" class="wire-base" />

      <!-- Phase B to T2 (y = 190) -->
      <line x1="121" y1="190" x2="190" y2="190" class="wire-base" />
      ${this.horizontalDevice(`${t}2`, `${t}2`, 190, 270, 190, isThy)}
      <line x1="270" y1="190" x2="330" y2="190" class="wire-base" />

      <!-- Phase C to T3 (y = 270) -->
      <line x1="121" y1="270" x2="190" y2="270" class="wire-base" />
      ${this.horizontalDevice(`${t}3`, `${t}3`, 190, 270, 270, isThy)}
      <line x1="270" y1="270" x2="330" y2="270" class="wire-base" />

      <!-- COMMON CATHODE BUS (Vertical bus at x = 330) -->
      <line x1="330" y1="110" x2="330" y2="270" class="wire-base" />
      ${this.dot(330, 110)}
      ${this.dot(330, 190)}
      ${this.dot(330, 270)}

      <!-- Bus line from common cathode to Load Top -->
      <line x1="330" y1="110" x2="440" y2="110" class="wire-base" />

      <!-- Neutral Return Bus from Neutral N (60, 190) down and across to Load Bottom -->
      <path id="wire-neutral-return" d="M 60,190 L 35,190 L 35,320 L 440,320" class="wire-base" />
      <text x="240" y="336" fill="#94a3b8" font-size="11" font-family="monospace">Neutral Return (N)</text>

      <!-- Load Block at x = 440 -->
      ${this.loadBlock(440, 110, 320, load)}
      ${this.dot(440, 110)}
      ${this.dot(440, 320)}
    `;
  }

  // =========================================================================
  // 3-PHASE FULL-WAVE BRIDGE SCHEMATIC (6-Pulse Graetz)
  // 3 Legs, 6 Devices, All pointing UPWARDS towards DC+
  // =========================================================================
  render3PhFullBridge(isThy, load) {
    const t = isThy ? 'T' : 'D';
    const hasFWD = load === 'RL_FWD';

    // Leg 1 at x = 160 (T1 Top, T4 Bottom) -> Phase A
    // Leg 2 at x = 250 (T3 Top, T6 Bottom) -> Phase B
    // Leg 3 at x = 340 (T5 Top, T2 Bottom) -> Phase C
    // DC+ rail at y = 70
    // DC- rail at y = 310
    // AC Midpoints at y = 190

    return `
      <!-- 3-Phase Input Terminals on Left -->
      <g id="3ph-terminals" transform="translate(45, 90)">
        <!-- Phase A -->
        <circle cx="0" cy="40" r="14" fill="#1e293b" stroke="#ef4444" stroke-width="2" />
        <text x="0" y="44" fill="#ef4444" font-size="10" font-weight="bold" text-anchor="middle">A</text>

        <!-- Phase B -->
        <circle cx="0" cy="100" r="14" fill="#1e293b" stroke="#eab308" stroke-width="2" />
        <text x="0" y="104" fill="#eab308" font-size="10" font-weight="bold" text-anchor="middle">B</text>

        <!-- Phase C -->
        <circle cx="0" cy="160" r="14" fill="#1e293b" stroke="#3b82f6" stroke-width="2" />
        <text x="0" y="164" fill="#3b82f6" font-size="10" font-weight="bold" text-anchor="middle">C</text>
      </g>

      <!-- Phase Input Lines to Midpoints -->
      <!-- Phase A: (45+14, 130) -> (160, 130) -> Midpoint Leg 1 (160, 190) -->
      <path id="wire-in-a" d="M 59,130 L 160,130 L 160,190" class="wire-base" />

      <!-- Phase B: (45+14, 190) -> Midpoint Leg 2 (250, 190) -->
      <path id="wire-in-b" d="M 59,190 L 250,190" class="wire-base" />

      <!-- Phase C: (45+14, 250) -> (340, 250) -> Midpoint Leg 3 (340, 190) -->
      <path id="wire-in-c" d="M 59,250 L 340,250 L 340,190" class="wire-base" />

      <!-- Midpoint Junction Dots -->
      ${this.dot(160, 190)}
      ${this.dot(250, 190)}
      ${this.dot(340, 190)}

      <!-- TOP DC POSITIVE RAIL (y = 70) -->
      <line x1="160" y1="70" x2="450" y2="70" class="wire-base" id="rail-dc-pos" />
      <text x="380" y="60" fill="#10b981" font-size="11" font-family="monospace" font-weight="bold">+ DC Rail</text>
      ${this.dot(160, 70)}
      ${this.dot(250, 70)}
      ${this.dot(340, 70)}

      <!-- BOTTOM DC NEGATIVE RAIL (y = 310) -->
      <line x1="160" y1="310" x2="450" y2="310" class="wire-base" id="rail-dc-neg" />
      <text x="380" y="328" fill="#38bdf8" font-size="11" font-family="monospace" font-weight="bold">- DC Rail</text>
      ${this.dot(160, 310)}
      ${this.dot(250, 310)}
      ${this.dot(340, 310)}

      <!-- ================= LEG 1: Phase A (x = 160) ================= -->
      <!-- T1 (Top): points UP from midpoint 190 to top rail 70 -->
      ${this.verticalDevice(`${t}1`, `${t}1`, 160, 70, 190, isThy)}
      <!-- T4 (Bottom): points UP from bottom rail 310 to midpoint 190 -->
      ${this.verticalDevice(`${t}4`, `${t}4`, 160, 190, 310, isThy)}

      <!-- ================= LEG 2: Phase B (x = 250) ================= -->
      <!-- T3 (Top): points UP from midpoint 190 to top rail 70 -->
      ${this.verticalDevice(`${t}3`, `${t}3`, 250, 70, 190, isThy)}
      <!-- T6 (Bottom): points UP from bottom rail 310 to midpoint 190 -->
      ${this.verticalDevice(`${t}6`, `${t}6`, 250, 190, 310, isThy)}

      <!-- ================= LEG 3: Phase C (x = 340) ================= -->
      <!-- T5 (Top): points UP from midpoint 190 to top rail 70 -->
      ${this.verticalDevice(`${t}5`, `${t}5`, 340, 70, 190, isThy)}
      <!-- T2 (Bottom): points UP from bottom rail 310 to midpoint 190 -->
      ${this.verticalDevice(`${t}2`, `${t}2`, 340, 190, 310, isThy)}

      <!-- Optional Freewheeling Diode at x = 395 -->
      ${hasFWD ? `
        ${this.verticalDevice('FWD', 'D_FW', 395, 70, 310, false)}
        ${this.dot(395, 70)}
        ${this.dot(395, 310)}
      ` : ''}

      <!-- DC LOAD at x = 450 -->
      ${this.loadBlock(450, 70, 310, load)}
      ${this.dot(450, 70)}
      ${this.dot(450, 310)}
    `;
  }

  /**
   * Updates visual conduction state (illuminates active devices and current loops)
   */
  updateConductionState(conductingDevices = []) {
    if (!this.currentSvg) return;

    // Reset all devices
    const allDevices = this.currentSvg.querySelectorAll('.device-group');
    allDevices.forEach(g => {
      g.classList.remove('device-conducting');
      g.classList.add('device-blocking');
    });

    // Reset all wires
    const allWires = this.currentSvg.querySelectorAll('.wire-base');
    allWires.forEach(w => {
      w.classList.remove('wire-active');
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
