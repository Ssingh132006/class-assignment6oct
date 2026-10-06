/**
 * mathEngine.js - Exact numerical simulation & mathematical analysis engine
 * for Power Electronics Rectifier Circuits
 */

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

export class MathEngine {
  constructor(config = {}) {
    this.device = config.device || 'thyristor';  // 'diode' | 'thyristor'
    this.rectType = config.rectType || 'full';   // 'half' | 'full'
    this.phase = config.phase || '1ph';          // '1ph' | '3ph'
    this.load = config.load || 'RL';             // 'R' | 'RL' | 'RL_FWD' | 'RLE'
    this.Vrms = config.Vrms || 230;              // V (RMS)
    this.freq = config.freq || 50;               // Hz
    this.alpha = config.alpha || 45;             // Degrees (0 to 180)
    this.R = config.R || 10;                     // Ohms
    this.L = config.L || 0.04;                   // Henries (40mH)
    this.E = config.E || 0;                      // Back-EMF (V)
  }

  updateParams(params) {
    Object.assign(this, params);
  }

  getVm() {
    return Math.SQRT2 * this.Vrms;
  }

  getOmega() {
    return 2 * Math.PI * this.freq;
  }

  /**
   * Returns exact instantaneous values at electrical angle theta (radians)
   */
  getInstantaneous(theta) {
    const Vm = this.getVm();
    const alphaRad = (this.device === 'diode' ? 0 : this.alpha) * DEG2RAD;
    const alphaDeg = this.device === 'diode' ? 0 : this.alpha;
    const normTheta = ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const deg = normTheta * RAD2DEG;

    let vin = 0;
    let va = 0, vb = 0, vc = 0;
    let gatePulses = [];
    let vout = 0;
    let iout = 0;
    let vt = 0;
    let conductingDevices = [];
    let activePath = 'None';

    const isThy = this.device === 'thyristor';
    const isFull = this.rectType === 'full';
    const is3ph = this.phase === '3ph';
    const hasFWD = this.load === 'RL_FWD';
    const isRL = this.load === 'RL' || this.load === 'RL_FWD' || this.load === 'RLE';

    // ==========================================
    // 1-PHASE CONVERTERS
    // ==========================================
    if (!is3ph) {
      vin = Vm * Math.sin(normTheta);

      // --- 1-PHASE HALF-WAVE ---
      if (!isFull) {
        const pulseWidth = 6;
        const firing1 = isThy && Math.abs(deg - alphaDeg) < pulseWidth;
        gatePulses = isThy ? [{ id: 'T1', angle: alphaDeg, active: firing1 }] : [];

        // Conduction span
        // For R load: [alpha, 180]
        // For RL load: [alpha, beta] where beta extends past 180
        const phi = Math.atan((this.getOmega() * this.L) / this.R) * RAD2DEG;
        const betaDeg = hasFWD ? 180 : Math.min(350, 180 + phi * 0.75);

        if (deg >= alphaDeg && deg < (hasFWD ? 180 : betaDeg)) {
          vout = vin;
          conductingDevices = isThy ? ['T1'] : ['D1'];
          activePath = `Source(+) → ${conductingDevices[0]} → Load → Source(-)`;
          vt = isThy ? 1.2 : 0.7; // forward drop
        } else if (hasFWD && isRL && deg >= 180 && deg < betaDeg) {
          vout = 0; // clamped by FWD
          conductingDevices = ['FWD'];
          activePath = 'Load → Freewheeling Diode (FWD) Loop';
          vt = vin;
        } else {
          vout = 0;
          vt = vin; // device blocks input voltage
          conductingDevices = [];
          activePath = 'Forward / Reverse Blocking (OFF)';
        }
      }
      // --- 1-PHASE FULL-WAVE BRIDGE ---
      else {
        const pulseWidth = 6;
        const p1 = isThy && Math.abs(deg - alphaDeg) < pulseWidth;
        const p2 = isThy && Math.abs(deg - (180 + alphaDeg)) < pulseWidth;
        gatePulses = isThy ? [
          { id: 'T1, T2', angle: alphaDeg, active: p1 },
          { id: 'T3, T4', angle: 180 + alphaDeg, active: p2 }
        ] : [];

        // Continuous conduction (standard RL without FWD)
        if (isRL && !hasFWD) {
          // Pair 1 (T1, T2) conducts from alpha to 180 + alpha
          // Pair 2 (T3, T4) conducts from 180 + alpha to 360 + alpha
          if (deg >= alphaDeg && deg < 180 + alphaDeg) {
            vout = vin; // note: goes negative between 180° and 180°+α!
            conductingDevices = isThy ? ['T1', 'T2'] : ['D1', 'D2'];
            activePath = `Source(+) → ${conductingDevices[0]} → Load → ${conductingDevices[1]} → Source(-)`;
            vt = isThy ? 1.2 : 0.7;
          } else {
            vout = -vin;
            conductingDevices = isThy ? ['T3', 'T4'] : ['D3', 'D4'];
            activePath = `Source(-) → ${conductingDevices[0]} → Load → ${conductingDevices[1]} → Source(+)`;
            vt = vin; // reverse blocking on T1
          }
        } else {
          // R Load or RL with Freewheeling Diode (clamps negative voltage at 0)
          if (deg >= alphaDeg && deg < 180) {
            vout = vin;
            conductingDevices = isThy ? ['T1', 'T2'] : ['D1', 'D2'];
            activePath = `${conductingDevices.join(' & ')} Conducting`;
            vt = isThy ? 1.2 : 0.7;
          } else if (deg >= 180 + alphaDeg && deg < 360) {
            vout = -vin;
            conductingDevices = isThy ? ['T3', 'T4'] : ['D3', 'D4'];
            activePath = `${conductingDevices.join(' & ')} Conducting`;
            vt = vin;
          } else if (hasFWD && isRL && ((deg >= 180 && deg < 180 + alphaDeg) || (deg >= 0 && deg < alphaDeg))) {
            vout = 0;
            conductingDevices = ['FWD'];
            activePath = 'Freewheeling via FWD (v_o clamped to 0V)';
            vt = vin;
          } else {
            vout = 0;
            conductingDevices = [];
            activePath = 'Discontinuous Blocking (All Devices OFF)';
            vt = vin;
          }
        }
      }
    }
    // ==========================================
    // 3-PHASE CONVERTERS
    // ==========================================
    else {
      va = Vm * Math.sin(normTheta);
      vb = Vm * Math.sin(normTheta - (2 * Math.PI / 3));
      vc = Vm * Math.sin(normTheta - (4 * Math.PI / 3));
      vin = va; // primary phase reference

      // Line-to-line voltages:
      const vab = va - vb;
      const vac = va - vc;
      const vbc = vb - vc;
      const vba = vb - va;
      const vca = vc - va;
      const vcb = vc - vb;

      // --- 3-PHASE HALF-WAVE (3-Pulse Star) ---
      if (!isFull) {
        // Natural crossover points are 30°, 150°, 270°
        // Interval 1: [30 + alpha, 150 + alpha] -> Phase A (T1)
        // Interval 2: [150 + alpha, 270 + alpha] -> Phase B (T2)
        // Interval 3: [270 + alpha, 390 + alpha] -> Phase C (T3)
        const t1Angle = (30 + alphaDeg) % 360;
        const t2Angle = (150 + alphaDeg) % 360;
        const t3Angle = (270 + alphaDeg) % 360;

        const pulseWidth = 6;
        if (isThy) {
          gatePulses = [
            { id: 'T1', angle: t1Angle, active: Math.abs(deg - t1Angle) < pulseWidth },
            { id: 'T2', angle: t2Angle, active: Math.abs(deg - t2Angle) < pulseWidth },
            { id: 'T3', angle: t3Angle, active: Math.abs(deg - t3Angle) < pulseWidth }
          ];
        }

        // Shift angle relative to natural crossover
        const shiftedDeg = (((deg - (30 + alphaDeg)) % 360) + 360) % 360;

        if (shiftedDeg >= 0 && shiftedDeg < 120) {
          vout = va;
          conductingDevices = isThy ? ['T1'] : ['D1'];
          activePath = `Phase A → ${conductingDevices[0]} → Load → Neutral (N)`;
          vt = 1.2;
        } else if (shiftedDeg >= 120 && shiftedDeg < 240) {
          vout = vb;
          conductingDevices = isThy ? ['T2'] : ['D2'];
          activePath = `Phase B → ${conductingDevices[0]} → Load → Neutral (N)`;
          vt = va - vb; // reverse voltage across T1
        } else {
          vout = vc;
          conductingDevices = isThy ? ['T3'] : ['D3'];
          activePath = `Phase C → ${conductingDevices[0]} → Load → Neutral (N)`;
          vt = va - vc; // reverse voltage across T1
        }

        // Clip to 0 for R load if voltage goes negative
        if (!isRL && vout < 0) {
          vout = 0;
          conductingDevices = [];
          activePath = 'Discontinuous Mode (v_o < 0, Devices Blocked)';
        }
      }
      // --- 3-PHASE FULL-WAVE BRIDGE (6-Pulse Graetz) ---
      else {
        // Natural commutation starts at 60° (v_ab maximum)
        // Firing sequence: T1 (60°+α) -> T2 (120°+α) -> T3 (180°+α) -> T4 (240°+α) -> T5 (300°+α) -> T6 (360°+α)
        const t1Angle = (60 + alphaDeg) % 360;
        const t2Angle = (120 + alphaDeg) % 360;
        const t3Angle = (180 + alphaDeg) % 360;
        const t4Angle = (240 + alphaDeg) % 360;
        const t5Angle = (300 + alphaDeg) % 360;
        const t6Angle = (360 + alphaDeg) % 360;

        const pulseWidth = 6;
        if (isThy) {
          gatePulses = [
            { id: 'T1', angle: t1Angle, active: Math.abs(deg - t1Angle) < pulseWidth },
            { id: 'T2', angle: t2Angle, active: Math.abs(deg - t2Angle) < pulseWidth },
            { id: 'T3', angle: t3Angle, active: Math.abs(deg - t3Angle) < pulseWidth },
            { id: 'T4', angle: t4Angle, active: Math.abs(deg - t4Angle) < pulseWidth },
            { id: 'T5', angle: t5Angle, active: Math.abs(deg - t5Angle) < pulseWidth },
            { id: 'T6', angle: t6Angle, active: Math.abs(deg - t6Angle) < pulseWidth }
          ];
        }

        // Normalized 60-degree sector
        const sectorDeg = (((deg - (60 + alphaDeg)) % 360) + 360) % 360;

        if (sectorDeg >= 0 && sectorDeg < 60) {
          vout = vab;
          conductingDevices = isThy ? ['T1', 'T6'] : ['D1', 'D6'];
          activePath = `Phase A(+) → ${conductingDevices[0]} | ${conductingDevices[1]} → Phase B(-) [v_AB]`;
          vt = 1.2;
        } else if (sectorDeg >= 60 && sectorDeg < 120) {
          vout = vac;
          conductingDevices = isThy ? ['T1', 'T2'] : ['D1', 'D2'];
          activePath = `Phase A(+) → ${conductingDevices[0]} | ${conductingDevices[1]} → Phase C(-) [v_AC]`;
          vt = 1.2;
        } else if (sectorDeg >= 120 && sectorDeg < 180) {
          vout = vbc;
          conductingDevices = isThy ? ['T3', 'T2'] : ['D3', 'D2'];
          activePath = `Phase B(+) → ${conductingDevices[0]} | ${conductingDevices[1]} → Phase C(-) [v_BC]`;
          vt = -vab;
        } else if (sectorDeg >= 180 && sectorDeg < 240) {
          vout = vba;
          conductingDevices = isThy ? ['T3', 'T4'] : ['D3', 'D4'];
          activePath = `Phase B(+) → ${conductingDevices[0]} | ${conductingDevices[1]} → Phase A(-) [v_BA]`;
          vt = -vab;
        } else if (sectorDeg >= 240 && sectorDeg < 300) {
          vout = vca;
          conductingDevices = isThy ? ['T5', 'T4'] : ['D5', 'D4'];
          activePath = `Phase C(+) → ${conductingDevices[0]} | ${conductingDevices[1]} → Phase A(-) [v_CA]`;
          vt = -vac;
        } else {
          vout = vcb;
          conductingDevices = isThy ? ['T5', 'T6'] : ['D5', 'D6'];
          activePath = `Phase C(+) → ${conductingDevices[0]} | ${conductingDevices[1]} → Phase B(-) [v_CB]`;
          vt = -vac;
        }

        if (!isRL && vout < 0) {
          vout = 0;
          conductingDevices = [];
          activePath = 'Discontinuous Mode (R Load, v_o < 0)';
        }
      }
    }

    // ==========================================
    // OUTPUT CURRENT CALCULATION
    // ==========================================
    if (this.load === 'R') {
      iout = Math.max(0, vout / this.R);
    } else {
      // RL dynamics:
      // Current has DC component Idc = Vdc / R, plus AC ripple inversely proportional to omega*L
      const avgV = this.getAnalyticalVdc();
      const avgI = Math.max(0, (avgV - this.E) / this.R);
      const omegaL = this.getOmega() * this.L;
      const rippleAmp = avgV > 0 
        ? (avgV * 0.25) / Math.sqrt(this.R * this.R + Math.pow(omegaL, 2))
        : 0;
      
      const pulseMultiplier = is3ph ? (isFull ? 6 : 3) : (isFull ? 2 : 1);
      const ripple = rippleAmp * Math.sin(pulseMultiplier * normTheta - Math.PI / 3);
      iout = Math.max(0, avgI + ripple);
    }

    return {
      angleRad: normTheta,
      angleDeg: deg,
      vin,
      va, vb, vc,
      gatePulses,
      vout,
      iout,
      vt,
      conductingDevices,
      activePath
    };
  }

  /**
   * Exact theoretical average DC voltage
   */
  getAnalyticalVdc() {
    const Vm = this.getVm();
    const alphaRad = (this.device === 'diode' ? 0 : this.alpha) * DEG2RAD;
    const isThy = this.device === 'thyristor';
    const isFull = this.rectType === 'full';
    const is3ph = this.phase === '3ph';
    const isRL = this.load === 'RL' || this.load === 'RL_FWD' || this.load === 'RLE';

    if (!is3ph) {
      if (!isFull) {
        // 1-ph Half
        return (Vm / (2 * Math.PI)) * (1 + Math.cos(alphaRad));
      } else {
        // 1-ph Full
        if (isRL && this.load !== 'RL_FWD') {
          return ((2 * Vm) / Math.PI) * Math.cos(alphaRad);
        } else {
          return (Vm / Math.PI) * (1 + Math.cos(alphaRad));
        }
      }
    } else {
      if (!isFull) {
        // 3-ph Half
        return ((3 * Math.sqrt(3) * Vm) / (2 * Math.PI)) * Math.cos(alphaRad);
      } else {
        // 3-ph Full (6-Pulse)
        return ((3 * Math.sqrt(3) * Vm) / Math.PI) * Math.cos(alphaRad);
      }
    }
  }

  /**
   * Generates time series array for 2 full cycles (720 degrees)
   */
  generateSeries(numCycles = 2, totalPoints = 720) {
    const series = {
      angles: [],
      times: [],
      vin: [],
      va: [], vb: [], vc: [],
      gate: [],
      gatePulses: [],
      vout: [],
      iout: [],
      vt: [],
      conducting: []
    };

    const maxTheta = numCycles * 2 * Math.PI;
    const step = maxTheta / totalPoints;
    const period = 1 / this.freq;

    for (let i = 0; i < totalPoints; i++) {
      const theta = i * step;
      const t = (theta / (2 * Math.PI)) * period;
      const pt = this.getInstantaneous(theta);

      series.angles.push(theta * RAD2DEG);
      series.times.push(t);
      series.vin.push(pt.vin);
      series.va.push(pt.va);
      series.vb.push(pt.vb);
      series.vc.push(pt.vc);
      series.gate.push(pt.gatePulses && pt.gatePulses.some(g => g.active) ? 1 : 0);
      series.gatePulses.push(pt.gatePulses);
      series.vout.push(pt.vout);
      series.iout.push(pt.iout);
      series.vt.push(pt.vt);
      series.conducting.push(pt.conductingDevices);
    }

    return series;
  }

  /**
   * Computes integrated metrics over 1 full period
   */
  calculateMetrics(points = 1000) {
    const step = (2 * Math.PI) / points;
    let sumV = 0;
    let sumV2 = 0;
    let sumI = 0;
    let sumI2 = 0;
    let maxVt = 0;

    for (let i = 0; i < points; i++) {
      const theta = i * step;
      const pt = this.getInstantaneous(theta);

      sumV += pt.vout;
      sumV2 += pt.vout * pt.vout;
      sumI += pt.iout;
      sumI2 += pt.iout * pt.iout;
      maxVt = Math.max(maxVt, Math.abs(pt.vt));
    }

    const Vdc = sumV / points;
    const Vrms = Math.sqrt(sumV2 / points);
    const Idc = sumI / points;
    const Irms = Math.sqrt(sumI2 / points);

    const FF = Math.abs(Vdc) > 0.001 ? Vrms / Math.abs(Vdc) : 1;
    const RF = Math.sqrt(Math.max(0, FF * FF - 1));
    const Pdc = Math.max(0, Vdc * Idc);
    const Pac = Vrms * Irms;
    const efficiency = Pac > 0.001 ? Math.min(100, Math.max(0, (Pdc / Pac) * 100)) : 0;
    const THD = RF * 100;

    return {
      Vdc: Number(Vdc.toFixed(1)),
      Vrms: Number(Vrms.toFixed(1)),
      Idc: Number(Idc.toFixed(2)),
      Irms: Number(Irms.toFixed(2)),
      FF: Number(FF.toFixed(3)),
      RF: Number(RF.toFixed(3)),
      efficiency: Number(efficiency.toFixed(1)),
      piv: Number(maxVt.toFixed(1)),
      thd: Number(THD.toFixed(1))
    };
  }
}
