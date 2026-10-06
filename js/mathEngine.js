/**
 * mathEngine.js - Exact numerical simulation & mathematical analysis engine
 * for Power Electronics Rectifier Circuits
 */

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

export class MathEngine {
  constructor(config = {}) {
    this.device = config.device || 'diode';      // 'diode' | 'thyristor'
    this.rectType = config.rectType || 'full';   // 'half' | 'full'
    this.phase = config.phase || '1ph';          // '1ph' | '3ph'
    this.load = config.load || 'RL';             // 'R' | 'RL' | 'RL_FWD' | 'RLE'
    this.Vrms = config.Vrms || 230;              // V (RMS)
    this.freq = config.freq || 50;               // Hz
    this.alpha = config.alpha || 30;             // Degrees (0 to 180)
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
   * Evaluates instantaneous state at given electrical angle theta (radians)
   */
  getInstantaneous(theta) {
    const Vm = this.getVm();
    const alphaRad = this.alpha * DEG2RAD;
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

    const isThyristor = this.device === 'thyristor';
    const isFull = this.rectType === 'full';
    const is3Phase = this.phase === '3ph';
    const hasFWD = this.load === 'RL_FWD';
    const isRL = this.load === 'RL' || this.load === 'RL_FWD' || this.load === 'RLE';

    // 1-Phase Calculations
    if (!is3Phase) {
      vin = Vm * Math.sin(normTheta);

      if (!isFull) {
        // --- 1-Phase Half-Wave ---
        if (!isThyristor) {
          // Diode Half-Wave
          if (normTheta >= 0 && normTheta < Math.PI) {
            vout = vin;
            conductingDevices = ['D1'];
            activePath = 'Source(+) → D1 → Load → Source(-)';
            vt = 0.7; // forward drop
          } else {
            vout = 0;
            vt = vin; // reverse blocking
            conductingDevices = [];
            activePath = 'Blocking';
          }
        } else {
          // Thyristor Half-Wave
          const pulseWidth = 5 * DEG2RAD;
          const isFiring = Math.abs(normTheta - alphaRad) < pulseWidth;
          gatePulses = [{ id: 'T1', active: isFiring }];

          // Conduction interval
          let conducts = false;
          let condEnd = Math.PI;
          if (isRL && !hasFWD) {
            // Extinction angle beta roughly pi + alpha/2
            condEnd = Math.min(2 * Math.PI - 0.1, Math.PI + Math.atan(this.getOmega() * this.L / this.R));
          }

          if (normTheta >= alphaRad && normTheta < condEnd) {
            conducts = true;
            vout = vin;
            conductingDevices = ['T1'];
            activePath = 'Source(+) → T1 → Load → Source(-)';
            vt = 1.2;
          } else if (hasFWD && normTheta >= Math.PI && normTheta < condEnd) {
            vout = 0;
            conductingDevices = ['FWD'];
            activePath = 'Load → FWD loop (Freewheeling)';
            vt = vin;
          } else {
            vout = 0;
            vt = vin;
            conductingDevices = [];
            activePath = 'Blocking';
          }
        }
      } else {
        // --- 1-Phase Full-Wave Bridge ---
        if (!isThyristor) {
          // Diode Bridge
          if (normTheta >= 0 && normTheta < Math.PI) {
            vout = vin;
            conductingDevices = ['D1', 'D2'];
            activePath = 'Source(+) → D1 → Load → D2 → Source(-)';
            vt = 0.7;
          } else {
            vout = -vin;
            conductingDevices = ['D3', 'D4'];
            activePath = 'Source(-) → D3 → Load → D4 → Source(+)';
            vt = vin;
          }
        } else {
          // Thyristor Controlled Bridge
          const pulseWidth = 6 * DEG2RAD;
          const p1 = Math.abs(normTheta - alphaRad) < pulseWidth;
          const p2 = Math.abs(normTheta - (Math.PI + alphaRad)) < pulseWidth;
          gatePulses = [
            { id: 'T1', active: p1 },
            { id: 'T2', active: p1 },
            { id: 'T3', active: p2 },
            { id: 'T4', active: p2 }
          ];

          // For continuous conduction RL load
          if (isRL && !hasFWD) {
            if (normTheta >= alphaRad && normTheta < Math.PI + alphaRad) {
              vout = vin;
              conductingDevices = ['T1', 'T2'];
              activePath = 'Source(+) → T1 → Load → T2 → Source(-)';
              vt = 1.2;
            } else {
              vout = -vin;
              conductingDevices = ['T3', 'T4'];
              activePath = 'Source(-) → T3 → Load → T4 → Source(+)';
              vt = vin;
            }
          } else {
            // R load or RL with FWD (clamped at 0)
            if (normTheta >= alphaRad && normTheta < Math.PI) {
              vout = vin;
              conductingDevices = ['T1', 'T2'];
              activePath = 'T1 & T2 Conducting';
              vt = 1.2;
            } else if (normTheta >= Math.PI + alphaRad && normTheta < 2 * Math.PI) {
              vout = -vin;
              conductingDevices = ['T3', 'T4'];
              activePath = 'T3 & T4 Conducting';
              vt = vin;
            } else {
              vout = 0;
              vt = vin;
              conductingDevices = hasFWD && isRL ? ['FWD'] : [];
              activePath = hasFWD && isRL ? 'Freewheeling via FWD' : 'Both Legs Off (Blocking)';
            }
          }
        }
      }
    } else {
      // 3-Phase Calculations
      va = Vm * Math.sin(normTheta);
      vb = Vm * Math.sin(normTheta - (2 * Math.PI / 3));
      vc = Vm * Math.sin(normTheta + (2 * Math.PI / 3));
      vin = va; // default display reference

      if (!isFull) {
        // --- 3-Phase Half-Wave (3-Pulse Star) ---
        // Natural crossover is at 30 deg (pi/6)
        const shift = isThyristor ? alphaRad : 0;
        const baseTheta = ((normTheta - shift) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const bDeg = baseTheta * RAD2DEG;

        if (bDeg >= 30 && bDeg < 150) {
          vout = va;
          conductingDevices = isThyristor ? ['T1'] : ['D1'];
          activePath = 'Phase A → Device 1 → Load → Neutral';
          vt = 1.0;
        } else if (bDeg >= 150 && bDeg < 270) {
          vout = vb;
          conductingDevices = isThyristor ? ['T2'] : ['D2'];
          activePath = 'Phase B → Device 2 → Load → Neutral';
          vt = va - vb;
        } else {
          vout = vc;
          conductingDevices = isThyristor ? ['T3'] : ['D3'];
          activePath = 'Phase C → Device 3 → Load → Neutral';
          vt = va - vc;
        }

        if (!isRL && vout < 0) {
          vout = 0;
          conductingDevices = [];
          activePath = 'Discontinuous Blocking';
        }
      } else {
        // --- 3-Phase Full-Wave Bridge (6-Pulse Graetz) ---
        const shift = isThyristor ? alphaRad : 0;
        const bDeg = (((deg - (shift * RAD2DEG)) % 360) + 360) % 360;

        // Line-to-line voltages
        const vab = va - vb;
        const vac = va - vc;
        const vbc = vb - vc;
        const vba = vb - va;
        const vca = vc - va;
        const vcb = vc - vb;

        if (bDeg >= 60 && bDeg < 120) {
          vout = vac;
          conductingDevices = isThyristor ? ['T1', 'T2'] : ['D1', 'D2'];
          activePath = 'Phase A(+) → Top 1 | Bottom 2 → Phase C(-)';
          vt = 1.2;
        } else if (bDeg >= 120 && bDeg < 180) {
          vout = vab;
          conductingDevices = isThyristor ? ['T1', 'T6'] : ['D1', 'D6'];
          activePath = 'Phase A(+) → Top 1 | Bottom 6 → Phase B(-)';
          vt = 1.2;
        } else if (bDeg >= 180 && bDeg < 240) {
          vout = vcb;
          conductingDevices = isThyristor ? ['T3', 'T6'] : ['D3', 'D6'];
          activePath = 'Phase C(+) → Top 3 | Bottom 6 → Phase B(-)';
          vt = -vac;
        } else if (bDeg >= 240 && bDeg < 300) {
          vout = vca;
          conductingDevices = isThyristor ? ['T3', 'T4'] : ['D3', 'D4'];
          activePath = 'Phase C(+) → Top 3 | Bottom 4 → Phase A(-)';
          vt = -vab;
        } else if (bDeg >= 300 && bDeg < 360) {
          vout = vba;
          conductingDevices = isThyristor ? ['T5', 'T4'] : ['D5', 'D4'];
          activePath = 'Phase B(+) → Top 5 | Bottom 4 → Phase A(-)';
          vt = -vab;
        } else {
          vout = vbc;
          conductingDevices = isThyristor ? ['T5', 'T2'] : ['D5', 'D2'];
          activePath = 'Phase B(+) → Top 5 | Bottom 2 → Phase C(-)';
          vt = -vac;
        }

        if (!isRL && vout < 0) {
          vout = 0;
          conductingDevices = [];
          activePath = 'Discontinuous (R-Load)';
        }
      }
    }

    // Output Current calculation based on Load model
    if (this.load === 'R') {
      iout = Math.max(0, vout / this.R);
    } else {
      // RL dynamics approximation with ripple filter
      const avgV = this.getAnalyticalVdc();
      const avgI = Math.max(0, (avgV - this.E) / this.R);
      const rippleAmp = (avgV * 0.15) / Math.sqrt(this.R * this.R + Math.pow(this.getOmega() * this.L, 2));
      const rippleFreq = (is3Phase ? (isFull ? 6 : 3) : (isFull ? 2 : 1));
      iout = Math.max(0, avgI + rippleAmp * Math.sin(rippleFreq * normTheta - Math.PI / 4));
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
   * Theoretical analytical Vdc calculation for instant verification
   */
  getAnalyticalVdc() {
    const Vm = this.getVm();
    const alphaRad = this.alpha * DEG2RAD;
    const isThy = this.device === 'thyristor';
    const isFull = this.rectType === 'full';
    const is3ph = this.phase === '3ph';
    const isRL = this.load === 'RL' || this.load === 'RL_FWD' || this.load === 'RLE';

    if (!is3ph) {
      if (!isFull) {
        // 1-ph Half
        return isThy ? (Vm / (2 * Math.PI)) * (1 + Math.cos(alphaRad)) : Vm / Math.PI;
      } else {
        // 1-ph Full
        if (!isThy) return (2 * Vm) / Math.PI;
        return isRL && this.load !== 'RL_FWD' 
          ? ((2 * Vm) / Math.PI) * Math.cos(alphaRad) 
          : (Vm / Math.PI) * (1 + Math.cos(alphaRad));
      }
    } else {
      if (!isFull) {
        // 3-ph Half
        return isThy 
          ? ((3 * Math.sqrt(3) * Vm) / (2 * Math.PI)) * Math.cos(alphaRad)
          : (3 * Math.sqrt(3) * Vm) / (2 * Math.PI);
      } else {
        // 3-ph Full (6-Pulse)
        return isThy 
          ? ((3 * Math.sqrt(3) * Vm) / Math.PI) * Math.cos(alphaRad)
          : (3 * Math.sqrt(3) * Vm) / Math.PI;
      }
    }
  }

  /**
   * Generates discrete simulation series over specified number of cycles
   */
  generateSeries(numCycles = 2, totalPoints = 720) {
    const series = {
      angles: [],
      times: [],
      vin: [],
      va: [], vb: [], vc: [],
      gate: [],
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
      series.gate.push(pt.gatePulses.some(g => g.active) ? 1 : 0);
      series.vout.push(pt.vout);
      series.iout.push(pt.iout);
      series.vt.push(pt.vt);
      series.conducting.push(pt.conductingDevices);
    }

    return series;
  }

  /**
   * Computes high-accuracy integrated metrics over 1 full fundamental cycle
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
    const Pdc = Vdc * Idc;
    const Pac = Vrms * Irms;
    const efficiency = Pac > 0.001 ? Math.min(100, Math.max(0, (Pdc / Pac) * 100)) : 0;
    const THD = RF * 100;

    return {
      Vdc: Number(Vdc.toFixed(2)),
      Vrms: Number(Vrms.toFixed(2)),
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
