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
        <!-- Generous transparent hit-box for rock-solid hover stability -->
        <rect x="${x - 22}" y="${triTop - 8}" width="44" height="${triBot - triTop + 16}" class="device-hitbox" />

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
        <!-- Generous transparent hit-box for rock-solid hover stability -->
        <rect x="${triLeft - 8}" y="${y - 20}" width="${triRight - triLeft + 16}" height="40" class="device-hitbox" />

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
    this.currentConfig = config;
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

    // Append dedicated active current overlay paths:
    // 1) Solid white base line on conducting sections
    // 2) Glowing colored dashes moving in physical current direction
    content += `
      <!-- Active Conduction Current Overlays -->
      <path id="active-current-base" class="current-base-path" d="" />
      <path id="active-current-flow" class="current-flow-trace" d="" />
    `;

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
        <text x="0" y="44" class="source-label" text-anchor="middle">v<tspan dy="3" font-size="9">s</tspan><tspan dy="-3">(t)</tspan></text>
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
  // Wire connections route cleanly to leg midpoints without intersecting devices
  // =========================================================================
  render1PhFullBridge(isThy, load) {
    const t = isThy ? 'T' : 'D';
    const hasFWD = load === 'RL_FWD';

    // Leg 1 at x = 180 (T1 top, T4 bottom)
    // Leg 2 at x = 280 (T3 top, T2 bottom)
    // DC Positive rail at y = 70
    // DC Negative rail at y = 310
    // Upper devices: yTop = 70, yBottom = 175
    // Lower devices: yTop = 205, yBottom = 310
    // Midpoint wire space: y = 175 to 205 (open gap)
    // AC Line 1 enters Leg 1 at y = 185
    // AC Line 2 enters Leg 2 at y = 195 (arches over Leg 1 at x = 180)

    return `
      <!-- AC Source on Left -->
      <g id="ac-source" transform="translate(65, 190)">
        <circle cx="0" cy="0" r="26" fill="#1e293b" stroke="#00f2fe" stroke-width="2.5" />
        <path d="M -11,0 Q -5,-13 0,0 T 11,0" fill="none" stroke="#00f2fe" stroke-width="2.2" />
        <text x="0" y="42" class="source-label" text-anchor="middle">v<tspan dy="3" font-size="9">s</tspan><tspan dy="-3">(t)</tspan></text>
      </g>

      <!-- AC Input Lines to Leg Midpoints -->
      <!-- Line 1: from AC source top (65, 164) down to y=185, straight into Leg 1 Midpoint (180, 185) -->
      <path id="wire-ac1" d="M 65,164 L 65,185 L 180,185" class="wire-base" />

      <!-- Line 2: from AC source bot (65, 216) up to y=195, jumps over Leg 1 at x=180 into Leg 2 Midpoint (280, 195) -->
      <path id="wire-ac2" d="M 65,216 L 65,195 L 172,195 A 8 8 0 0 1 188,195 L 280,195" class="wire-base" />

      <!-- Leg Midpoint Vertical Connecting Wires between Upper and Lower Devices -->
      <line x1="180" y1="175" x2="180" y2="205" class="wire-base" />
      <line x1="280" y1="175" x2="280" y2="205" class="wire-base" />

      <!-- Junction dots at AC leg midpoints -->
      ${this.dot(180, 185)}
      ${this.dot(280, 195)}

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
      <!-- Top Device T1 / D1 (points UP from midpoint 175 to top rail 70) -->
      ${this.verticalDevice(`${t}1`, `${t}1`, 180, 70, 175, isThy)}

      <!-- Bottom Device T4 / D4 (points UP from bottom rail 310 to midpoint 205) -->
      ${this.verticalDevice(`${t}4`, `${t}4`, 180, 205, 310, isThy)}

      <!-- ================= BRIDGE LEG 2 (x = 280) ================= -->
      <!-- Top Device T3 / D3 (points UP from midpoint 175 to top rail 70) -->
      ${this.verticalDevice(`${t}3`, `${t}3`, 280, 70, 175, isThy)}

      <!-- Bottom Device T2 / D2 (points UP from bottom rail 310 to midpoint 205) -->
      ${this.verticalDevice(`${t}2`, `${t}2`, 280, 205, 310, isThy)}

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
  // Wire connections route cleanly to leg midpoints with IEEE jumper bridges
  // =========================================================================
  render3PhFullBridge(isThy, load) {
    const t = isThy ? 'T' : 'D';
    const hasFWD = load === 'RL_FWD';

    // Leg 1 at x = 160 (T1 Top, T4 Bottom) -> Phase A
    // Leg 2 at x = 250 (T3 Top, T6 Bottom) -> Phase B
    // Leg 3 at x = 340 (T5 Top, T2 Bottom) -> Phase C
    // DC+ rail at y = 70
    // DC- rail at y = 310
    // Upper devices: yTop = 70, yBottom = 175
    // Lower devices: yTop = 205, yBottom = 310
    // Midpoint wire space: y = 175 to 205 (open gap)
    // Phase A enters Leg 1 at y = 180
    // Phase B enters Leg 2 at y = 190 (jumper over Leg 1)
    // Phase C enters Leg 3 at y = 200 (jumpers over Leg 1 and Leg 2)

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

      <!-- Phase Input Lines to Midpoints (Clear of device bodies) -->
      <!-- Phase A: from (59, 130) down to y=180, straight into Leg 1 Midpoint (160, 180) -->
      <path id="wire-in-a" d="M 59,130 L 100,130 L 100,180 L 160,180" class="wire-base" />

      <!-- Phase B: from (59, 190), jumps over Leg 1 at x=160 into Leg 2 Midpoint (250, 190) -->
      <path id="wire-in-b" d="M 59,190 L 152,190 A 8 8 0 0 1 168,190 L 250,190" class="wire-base" />

      <!-- Phase C: from (59, 250) up to y=200, jumps over Leg 1 and Leg 2 into Leg 3 Midpoint (340, 200) -->
      <path id="wire-in-c" d="M 59,250 L 100,250 L 100,200 L 152,200 A 8 8 0 0 1 168,200 L 242,200 A 8 8 0 0 1 258,200 L 340,200" class="wire-base" />

      <!-- Midpoint Vertical Connecting Wires in Legs -->
      <line x1="160" y1="175" x2="160" y2="205" class="wire-base" />
      <line x1="250" y1="175" x2="250" y2="205" class="wire-base" />
      <line x1="340" y1="175" x2="340" y2="205" class="wire-base" />

      <!-- Midpoint Junction Dots -->
      ${this.dot(160, 180)}
      ${this.dot(250, 190)}
      ${this.dot(340, 200)}

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
      <!-- T1 (Top): points UP from midpoint 175 to top rail 70 -->
      ${this.verticalDevice(`${t}1`, `${t}1`, 160, 70, 175, isThy)}
      <!-- T4 (Bottom): points UP from bottom rail 310 to midpoint 205 -->
      ${this.verticalDevice(`${t}4`, `${t}4`, 160, 205, 310, isThy)}

      <!-- ================= LEG 2: Phase B (x = 250) ================= -->
      <!-- T3 (Top): points UP from midpoint 175 to top rail 70 -->
      ${this.verticalDevice(`${t}3`, `${t}3`, 250, 70, 175, isThy)}
      <!-- T6 (Bottom): points UP from bottom rail 310 to midpoint 205 -->
      ${this.verticalDevice(`${t}6`, `${t}6`, 250, 205, 310, isThy)}

      <!-- ================= LEG 3: Phase C (x = 340) ================= -->
      <!-- T5 (Top): points UP from midpoint 175 to top rail 70 -->
      ${this.verticalDevice(`${t}5`, `${t}5`, 340, 70, 175, isThy)}
      <!-- T2 (Bottom): points UP from bottom rail 310 to midpoint 205 -->
      ${this.verticalDevice(`${t}2`, `${t}2`, 340, 205, 310, isThy)}

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
   * Returns the exact directed SVG path for the active current loop.
   * Path starts at positive potential, passes through devices & load,
   * and completes through the negative return rail.
   */
  getActiveCurrentPath(conductingDevices) {
    if (!conductingDevices || conductingDevices.length === 0) return '';
    const config = this.currentConfig || {};
    const { phase, rectType } = config;
    const is3ph = phase === '3ph';
    const isFull = rectType === 'full';

    // 1-PHASE FULL-WAVE BRIDGE
    if (!is3ph && isFull) {
      if (conductingDevices.includes('T1') || conductingDevices.includes('D1')) {
        // Positive cycle: Source(+) -> Line 1 -> T1 -> +DC Rail -> Load -> -DC Rail -> T2 -> Line 2 (jumper) -> Source(-)
        return 'M 65,164 L 65,185 L 180,185 L 180,70 L 440,70 L 440,310 L 280,310 L 280,195 L 188,195 A 8 8 0 0 0 172,195 L 65,195 L 65,216';
      }
      if (conductingDevices.includes('T3') || conductingDevices.includes('D3') || conductingDevices.includes('T4') || conductingDevices.includes('D4')) {
        // Negative cycle: Source(-) -> Line 2 (jumper) -> T3 -> +DC Rail -> Load -> -DC Rail -> T4 -> Line 1 -> Source(+)
        return 'M 65,216 L 65,195 L 172,195 A 8 8 0 0 1 188,195 L 280,195 L 280,70 L 440,70 L 440,310 L 180,310 L 180,185 L 65,185 L 65,164';
      }
      if (conductingDevices.includes('FWD')) {
        // Freewheeling loop: Load bottom -> FWD bottom -> UP FWD -> Load top -> DOWN Load
        return 'M 440,310 L 360,310 L 360,70 L 440,70 L 440,310';
      }
    }

    // 1-PHASE HALF-WAVE
    if (!is3ph && !isFull) {
      if (conductingDevices.includes('T1') || conductingDevices.includes('D1')) {
        return 'M 80,162 L 80,100 L 430,100 L 430,280 L 80,280 L 80,218';
      }
      if (conductingDevices.includes('FWD')) {
        return 'M 430,280 L 340,280 L 340,100 L 430,100 L 430,280';
      }
    }

    // 3-PHASE HALF-WAVE
    if (is3ph && !isFull) {
      if (conductingDevices.includes('T1') || conductingDevices.includes('D1')) {
        return 'M 64,110 L 121,110 L 330,110 L 440,110 L 440,320 L 35,320 L 35,190 L 60,190';
      }
      if (conductingDevices.includes('T2') || conductingDevices.includes('D2')) {
        return 'M 64,190 L 121,190 L 330,190 L 330,110 L 440,110 L 440,320 L 35,320 L 35,190 L 60,190';
      }
      if (conductingDevices.includes('T3') || conductingDevices.includes('D3')) {
        return 'M 64,270 L 121,270 L 330,270 L 330,110 L 440,110 L 440,320 L 35,320 L 35,190 L 60,190';
      }
      if (conductingDevices.includes('FWD')) {
        return 'M 440,320 L 380,320 L 380,110 L 440,110 L 440,320';
      }
    }

    // 3-PHASE FULL-WAVE (6-Pulse)
    if (is3ph && isFull) {
      if (conductingDevices.includes('FWD')) {
        return 'M 450,310 L 395,310 L 395,70 L 450,70 L 450,310';
      }

      const hasT1 = conductingDevices.includes('T1') || conductingDevices.includes('D1');
      const hasT3 = conductingDevices.includes('T3') || conductingDevices.includes('D3');
      const hasT5 = conductingDevices.includes('T5') || conductingDevices.includes('D5');
      const hasT4 = conductingDevices.includes('T4') || conductingDevices.includes('D4');
      const hasT6 = conductingDevices.includes('T6') || conductingDevices.includes('D6');
      const hasT2 = conductingDevices.includes('T2') || conductingDevices.includes('D2');

      // T1 (Phase A+) & T2 (Phase C-)
      if (hasT1 && hasT2) {
        return 'M 64,130 L 100,130 L 100,180 L 160,180 L 160,70 L 450,70 L 450,310 L 340,310 L 340,200 L 258,200 A 8 8 0 0 0 242,200 L 168,200 A 8 8 0 0 0 152,200 L 100,200 L 100,250 L 64,250';
      }
      // T1 (Phase A+) & T6 (Phase B-)
      if (hasT1 && hasT6) {
        return 'M 64,130 L 100,130 L 100,180 L 160,180 L 160,70 L 450,70 L 450,310 L 250,310 L 250,190 L 168,190 A 8 8 0 0 0 152,190 L 64,190';
      }
      // T3 (Phase B+) & T2 (Phase C-)
      if (hasT3 && hasT2) {
        return 'M 64,190 L 152,190 A 8 8 0 0 1 168,190 L 250,190 L 250,70 L 450,70 L 450,310 L 340,310 L 340,200 L 258,200 A 8 8 0 0 0 242,200 L 168,200 A 8 8 0 0 0 152,200 L 100,200 L 100,250 L 64,250';
      }
      // T3 (Phase B+) & T4 (Phase A-)
      if (hasT3 && hasT4) {
        return 'M 64,190 L 152,190 A 8 8 0 0 1 168,190 L 250,190 L 250,70 L 450,70 L 450,310 L 160,310 L 160,180 L 100,180 L 100,130 L 64,130';
      }
      // T5 (Phase C+) & T4 (Phase A-)
      if (hasT5 && hasT4) {
        return 'M 64,250 L 100,250 L 100,200 L 152,200 A 8 8 0 0 1 168,200 L 242,200 A 8 8 0 0 1 258,200 L 340,200 L 340,70 L 450,70 L 450,310 L 160,310 L 160,180 L 100,180 L 100,130 L 64,130';
      }
      // T5 (Phase C+) & T6 (Phase B-)
      if (hasT5 && hasT6) {
        return 'M 64,250 L 100,250 L 100,200 L 152,200 A 8 8 0 0 1 168,200 L 242,200 A 8 8 0 0 1 258,200 L 340,200 L 340,70 L 450,70 L 450,310 L 250,310 L 250,190 L 168,190 A 8 8 0 0 0 152,190 L 64,190';
      }
    }

    return '';
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

    // Highlight actively conducting devices
    conductingDevices.forEach(devId => {
      const el = this.currentSvg.querySelector(`#dev-${devId}`);
      if (el) {
        el.classList.add('device-conducting');
        el.classList.remove('device-blocking');
      }
    });

    // Compute directed current path
    const pathD = this.getActiveCurrentPath(conductingDevices);
    const basePathEl = this.currentSvg.querySelector('#active-current-base');
    const flowPathEl = this.currentSvg.querySelector('#active-current-flow');

    if (basePathEl) {
      basePathEl.setAttribute('d', pathD);
    }
    if (flowPathEl) {
      flowPathEl.setAttribute('d', pathD);
    }
  }
}
