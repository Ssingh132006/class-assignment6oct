/**
 * config.js - Configuration, metadata, and theoretical definitions
 * for Power Electronics Bridge & Controlled Rectifiers
 */

export const RECTIFIER_CONFIGS = {
  // 1. Single-Phase Half-Wave Diode
  '1ph-half-diode': {
    id: '1ph-half-diode',
    name: '1-Phase Half-Wave Diode Rectifier',
    type: 'Uncontrolled Half-Wave',
    devices: ['D1'],
    hasAlpha: false,
    pulses: 1,
    pivFormula: 'V_m = \\sqrt{2} V_{rms}',
    vdcFormula: 'V_{dc} = \\frac{V_m}{\\pi} \\approx 0.318 V_m',
    vrmsFormula: 'V_{rms} = \\frac{V_m}{2} = 0.5 V_m',
    rippleFreqMultiplier: 1,
    description: 'Simplest rectifier configuration using a single diode. Conduction occurs only during the positive half-cycle [0, π]. High ripple factor (1.21) and DC saturation of supply transformer make it suitable only for low-power applications.',
    intervals: [
      { range: '0° to 180°', state: 'D1 Forward Biased (ON)', vout: 'v_s(t) = V_m sin(ωt)', comment: 'Source supplies power to load' },
      { range: '180° to 360°', state: 'D1 Reverse Biased (OFF)', vout: '0 V', comment: 'Diode blocks full negative peak voltage (PIV = V_m)' }
    ]
  },

  // 2. Single-Phase Full-Wave Diode Bridge
  '1ph-full-diode': {
    id: '1ph-full-diode',
    name: '1-Phase Full-Wave Diode Bridge Rectifier',
    type: 'Uncontrolled Full-Wave Bridge',
    devices: ['D1', 'D2', 'D3', 'D4'],
    hasAlpha: false,
    pulses: 2,
    pivFormula: 'V_m = \\sqrt{2} V_{rms}',
    vdcFormula: 'V_{dc} = \\frac{2V_m}{\\pi} \\approx 0.637 V_m',
    vrmsFormula: 'V_{rms} = \\frac{V_m}{\\sqrt{2}} \\approx 0.707 V_m',
    rippleFreqMultiplier: 2,
    description: 'Classic 4-diode Graetz bridge rectifier. Conduction occurs in diagonal pairs: (D1, D2) during the positive half-cycle and (D3, D4) during the negative half-cycle. No transformer DC magnetization. Ripple frequency is 2f.',
    intervals: [
      { range: '0° to 180°', state: 'D1 & D2 Conducting', vout: '+v_s(t)', comment: 'Current flows: Source+ → D1 → Load → D2 → Source-' },
      { range: '180° to 360°', state: 'D3 & D4 Conducting', vout: '-v_s(t) = +|v_s|', comment: 'Current flows: Source- → D3 → Load → D4 → Source+' }
    ]
  },

  // 3. Three-Phase Half-Wave Diode
  '3ph-half-diode': {
    id: '3ph-half-diode',
    name: '3-Phase Half-Wave Diode Rectifier (3-Pulse)',
    type: 'Uncontrolled 3-Pulse Star',
    devices: ['D1', 'D2', 'D3'],
    hasAlpha: false,
    pulses: 3,
    pivFormula: '\\sqrt{3} V_m = V_{LL,peak}',
    vdcFormula: 'V_{dc} = \\frac{3\\sqrt{3}}{2\\pi} V_m \\approx 0.827 V_m',
    vrmsFormula: 'V_{rms} \\approx 0.8407 V_m',
    rippleFreqMultiplier: 3,
    description: 'Three diodes connected to neutral-referenced phases (A, B, C). At any moment, the diode connected to the phase with the highest instantaneous positive voltage conducts for 120°. Ripple frequency is 3f (150 Hz at 50 Hz).',
    intervals: [
      { range: '30° to 150°', state: 'D1 (Phase A) Conducting', vout: 'v_A(t)', comment: 'Phase A voltage is higher than phases B and C' },
      { range: '150° to 270°', state: 'D2 (Phase B) Conducting', vout: 'v_B(t)', comment: 'Phase B voltage is highest' },
      { range: '270° to 390° (30°)', state: 'D3 (Phase C) Conducting', vout: 'v_C(t)', comment: 'Phase C voltage is highest' }
    ]
  },

  // 4. Three-Phase Full-Wave Diode Bridge
  '3ph-full-diode': {
    id: '3ph-full-diode',
    name: '3-Phase Full-Wave Diode Bridge (6-Pulse)',
    type: 'Uncontrolled 6-Pulse Graetz Bridge',
    devices: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6'],
    hasAlpha: false,
    pulses: 6,
    pivFormula: '\\sqrt{3} V_m = V_{LL,peak}',
    vdcFormula: 'V_{dc} = \\frac{3\\sqrt{3}}{\\pi} V_m \\approx 1.654 V_m = 1.35 V_{LL,rms}',
    vrmsFormula: 'V_{rms} \\approx 1.655 V_m',
    rippleFreqMultiplier: 6,
    description: 'Standard industrial 6-pulse diode bridge. Utilizes two groups: Top positive group (D1, D3, D5) conducts the most positive phase, and bottom negative group (D4, D6, D2) conducts the most negative phase. Exceptionally low ripple factor (4.2%).',
    intervals: [
      { range: '60° to 120°', state: 'D1 & D2 Conducting', vout: 'v_{AC}(t)', comment: 'Phase A most positive, Phase C most negative' },
      { range: '120° to 180°', state: 'D1 & D6 Conducting', vout: 'v_{AB}(t)', comment: 'Phase A most positive, Phase B most negative' },
      { range: '180° to 240°', state: 'D3 & D6 Conducting', vout: 'v_{CB}(t)', comment: 'Phase C most positive, Phase B most negative' },
      { range: '240° to 300°', state: 'D3 & D4 Conducting', vout: 'v_{CA}(t)', comment: 'Phase C most positive, Phase A most negative' },
      { range: '300° to 360°', state: 'D5 & D4 Conducting', vout: 'v_{BA}(t)', comment: 'Phase B most positive, Phase A most negative' },
      { range: '0° to 60°', state: 'D5 & D2 Conducting', vout: 'v_{BC}(t)', comment: 'Phase B most positive, Phase C most negative' }
    ]
  },

  // 5. Single-Phase Half-Wave Thyristor
  '1ph-half-thyristor': {
    id: '1ph-half-thyristor',
    name: '1-Phase Half-Wave Thyristor Controlled Rectifier',
    type: 'Phase-Controlled Half-Wave',
    devices: ['T1'],
    hasAlpha: true,
    pulses: 1,
    pivFormula: 'V_m = \\sqrt{2} V_{rms}',
    vdcFormula: 'V_{dc} = \\frac{V_m}{2\\pi}(1 + \\cos\\alpha)',
    vrmsFormula: 'V_{rms} = \\frac{V_m}{2}\\sqrt{\\frac{1}{\\pi}\\left((\\pi-\\alpha) + \\frac{\\sin(2\\alpha)}{2}\\right)}',
    rippleFreqMultiplier: 1,
    description: 'Controlled half-wave converter using an SCR (Thyristor). Conduction is delayed until firing angle α. Output average voltage is continuously adjustable by varying α from 0° to 180°.',
    intervals: [
      { range: '0° to α', state: 'T1 Forward Blocking', vout: '0 V', comment: 'Anode positive but gate pulse not yet applied' },
      { range: 'α to 180°', state: 'T1 Conducting (Triggered)', vout: 'v_s(t)', comment: 'SCR fires at α and conducts until current drops below holding value' },
      { range: '180° to 360°', state: 'T1 Reverse Blocking', vout: '0 V', comment: 'Reverse bias commutates SCR off (or extends if inductive load)' }
    ]
  },

  // 6. Single-Phase Full-Wave Thyristor Bridge
  '1ph-full-thyristor': {
    id: '1ph-full-thyristor',
    name: '1-Phase Full-Wave Controlled Bridge (Fully Controlled)',
    type: 'Phase-Controlled Full-Wave Bridge',
    devices: ['T1', 'T2', 'T3', 'T4'],
    hasAlpha: true,
    pulses: 2,
    pivFormula: 'V_m = \\sqrt{2} V_{rms}',
    vdcFormula: 'V_{dc} = \\frac{2V_m}{\\pi} \\cos\\alpha \\text{ (Continuous RL)} \\quad | \\quad \\frac{V_m}{\\pi}(1 + \\cos\\alpha) \\text{ (R Load)}',
    vrmsFormula: 'V_{rms} = V_{m} / \\sqrt{2} \\text{ (Continuous Conduction)}',
    rippleFreqMultiplier: 2,
    description: 'Fully controlled 4-SCR bridge converter. Allows two-quadrant operation (Rectification when α < 90°, Inversion when α > 90° with active RLE load). Pairs (T1, T2) and (T3, T4) are fired alternately at α and π + α.',
    intervals: [
      { range: 'α to 180°+α', state: 'T1 & T2 Conducting', vout: '+v_s(t)', comment: 'Triggered at α. With inductive load, conducts past 180° until T3 & T4 are fired' },
      { range: '180°+α to 360°+α', state: 'T3 & T4 Conducting', vout: '-v_s(t)', comment: 'Commutates T1 & T2 off and applies reverse polarity to load' }
    ]
  },

  // 7. Three-Phase Half-Wave Thyristor
  '3ph-half-thyristor': {
    id: '3ph-half-thyristor',
    name: '3-Phase Half-Wave Thyristor Converter (3-Pulse)',
    type: 'Phase-Controlled 3-Pulse Star',
    devices: ['T1', 'T2', 'T3'],
    hasAlpha: true,
    pulses: 3,
    pivFormula: '\\sqrt{3} V_m = V_{LL,peak}',
    vdcFormula: 'V_{dc} = \\frac{3\\sqrt{3}}{2\\pi} V_m \\cos\\alpha \\text{ (Continuous)}',
    vrmsFormula: 'V_{rms} = \\sqrt{3} V_m \\sqrt{\\frac{1}{6} + \\frac{\\sqrt{3}}{8\\pi}\\cos(2\\alpha)}',
    rippleFreqMultiplier: 3,
    description: '3-SCR converter fed from three-phase star source. Firing angle α is referenced from natural crossover points (30°, 150°, 270°). Conduction transitions continuously from continuous to discontinuous mode as α increases beyond 30° for R load.',
    intervals: [
      { range: '30°+α to 150°+α', state: 'T1 (Phase A) Conducting', vout: 'v_A(t)', comment: 'Phase A Thyristor conducts for 120° interval' },
      { range: '150°+α to 270°+α', state: 'T2 (Phase B) Conducting', vout: 'v_B(t)', comment: 'Phase B Thyristor triggered and commutates T1 off' },
      { range: '270°+α to 390°+α', state: 'T3 (Phase C) Conducting', vout: 'v_C(t)', comment: 'Phase C Thyristor triggered' }
    ]
  },

  // 8. Three-Phase Full-Wave Thyristor Bridge
  '3ph-full-thyristor': {
    id: '3ph-full-thyristor',
    name: '3-Phase Full-Wave Controlled Bridge (6-Pulse)',
    type: 'Fully Controlled 6-Pulse Bridge Converter',
    devices: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
    hasAlpha: true,
    pulses: 6,
    pivFormula: '\\sqrt{3} V_m = V_{LL,peak}',
    vdcFormula: 'V_{dc} = \\frac{3\\sqrt{3}}{\\pi} V_m \\cos\\alpha = \\frac{3 V_{LL,peak}}{\\pi} \\cos\\alpha',
    vrmsFormula: 'V_{rms} = \\sqrt{3} V_m \\sqrt{\\frac{1}{2} + \\frac{3\\sqrt{3}}{4\\pi} \\cos(2\\alpha)}',
    rippleFreqMultiplier: 6,
    description: 'Heavy-duty 6-SCR converter utilized in DC motor drives and HVDC transmission. Firing pulses are applied in sequence (T1-T6) every 60°. Produces exceptionally smooth DC output with minimal filtering required.',
    intervals: [
      { range: '60°+α to 120°+α', state: 'T1 & T2 Conducting', vout: 'v_{AC}(t)', comment: 'Phase A top, Phase C bottom' },
      { range: '120°+α to 180°+α', state: 'T1 & T6 Conducting', vout: 'v_{AB}(t)', comment: 'Phase A top, Phase B bottom' },
      { range: '180°+α to 240°+α', state: 'T3 & T6 Conducting', vout: 'v_{CB}(t)', comment: 'Phase C top, Phase B bottom' },
      { range: '240°+α to 300°+α', state: 'T3 & T4 Conducting', vout: 'v_{CA}(t)', comment: 'Phase C top, Phase A bottom' },
      { range: '300°+α to 360°+α', state: 'T5 & T4 Conducting', vout: 'v_{BA}(t)', comment: 'Phase B top, Phase A bottom' },
      { range: '0°+α to 60°+α', state: 'T5 & T2 Conducting', vout: 'v_{BC}(t)', comment: 'Phase B top, Phase C bottom' }
    ]
  }
};
