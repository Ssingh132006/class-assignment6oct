/**
 * oscilloscope.js - High-Precision Multi-Trace Canvas Oscilloscope
 * Multi-phase AC inputs (Va, Vb, Vc), rectified DC output with shaded area,
 * SCR gate trigger spikes, dynamic voltage division auto-scaling, and interactive crosshairs.
 */

export class OscilloscopeRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.visibleTraces = {
      vin: true,
      gate: true,
      vout: true,
      iout: true,
      vt: false
    };

    this.currentMarkerAngle = 0;
    this.hoverX = null;
    this.onHoverCallback = null;
    this.is3Phase = false;

    this.initEvents();
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = (rect.width > 20 ? rect.width : (this.canvas.parentElement?.clientWidth || 600));
    const h = (rect.height > 20 ? rect.height : (this.canvas.parentElement?.clientHeight || 380));

    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.width = w;
    this.height = h;
  }

  setTraceVisibility(traceKey, isVisible) {
    if (this.visibleTraces.hasOwnProperty(traceKey)) {
      this.visibleTraces[traceKey] = isVisible;
    }
  }

  setCurrentMarkerAngle(angleDeg) {
    this.currentMarkerAngle = angleDeg;
  }

  setIs3Phase(is3ph) {
    this.is3Phase = is3ph;
  }

  initEvents() {
    window.addEventListener('resize', () => this.resize());

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.hoverX = e.clientX - rect.left;
      if (this.onHoverCallback) {
        const totalDegrees = 720;
        const deg = (this.hoverX / this.width) * totalDegrees;
        this.onHoverCallback(deg, this.hoverX, e.clientY - rect.top);
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoverX = null;
      if (this.onHoverCallback) {
        this.onHoverCallback(null);
      }
    });
  }

  /**
   * Draws oscilloscope screen background, grid divisions, and voltage labels
   */
  drawGrid(vMax = 400) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Dark Phosphor Screen Background
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, w, h);

    // Visible, Very Dim Oscilloscope Graticule Grid (Tektronix/Keysight style)
    const cols = 16; // 45° per division over 720°
    const rows = 10; // Clean vertical division steps

    // 1. Dim Minor Grid Lines (Dotted)
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.10)';
    ctx.lineWidth = 1;
    ctx.setLineDash([1, 3]);
    ctx.beginPath();
    for (let i = 1; i < cols; i++) {
      const x = (i / cols) * w;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let j = 1; j < rows; j++) {
      const y = (j / rows) * h;
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
    ctx.restore();

    // 2. Dim Major Graticule Lines (Solid 1px subtle grid)
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Major 90° intervals (every 2 cols = 90°, 180°, 270°, 360°, 450°, 540°, 630°)
    for (let i = 0; i <= cols; i += 2) {
      const x = (i / cols) * w;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    // Major voltage rows
    for (let j = 0; j <= rows; j += 2) {
      const y = (j / rows) * h;
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
    ctx.restore();

    // Center Ground / Zero Volt reference line (Prominent axis with tick marks)
    const zeroY = h * 0.52;
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.38)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(w, zeroY);
    ctx.stroke();

    // Small tick marks along the 0V ground axis
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.30)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= cols; i++) {
      const x = (i / cols) * w;
      ctx.moveTo(x, zeroY - 3);
      ctx.lineTo(x, zeroY + 3);
    }
    ctx.stroke();
    ctx.restore();

    // Voltage division markings on left
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';

    const vSteps = [
      { v: vMax, label: `+${Math.round(vMax)}V` },
      { v: vMax / 2, label: `+${Math.round(vMax / 2)}V` },
      { v: 0, label: ' 0V (GND)' },
      { v: -vMax / 2, label: `-${Math.round(vMax / 2)}V` },
      { v: -vMax, label: `-${Math.round(vMax)}V` }
    ];

    const scaleY = (h * 0.42) / vMax;
    vSteps.forEach(s => {
      const y = zeroY - s.v * scaleY;
      ctx.fillText(s.label, 8, y - 3);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.moveTo(0, y);
      ctx.lineTo(6, y);
      ctx.stroke();
    });

    // Horizontal Phase angle markers (0, 90, 180, 270, 360, 540, 720)
    const markers = [
      { deg: 0, label: '0°' },
      { deg: 90, label: '90° (π/2)' },
      { deg: 180, label: '180° (π)' },
      { deg: 270, label: '270°' },
      { deg: 360, label: '360° (2π)' },
      { deg: 450, label: '450°' },
      { deg: 540, label: '540° (3π)' },
      { deg: 630, label: '630°' },
      { deg: 720, label: '720° (4π)' }
    ];

    markers.forEach(m => {
      const x = (m.deg / 720) * w;
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(m.label, x + 4, zeroY + 14);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.moveTo(x, zeroY - 4);
      ctx.lineTo(x, zeroY + 4);
      ctx.stroke();
    });
  }

  /**
   * Main render method
   */
  render(series, metrics = {}) {
    if (!series || !series.angles || !series.angles.length) return;
    if (!this.width || !this.height || this.canvas.width === 0 || this.canvas.height === 0) {
      this.resize();
    }
    const ctx = this.ctx;
    const w = this.width || 600;
    const h = this.height || 380;

    // Stable fixed peak voltage scale so changing Vrms slider physically scales the waveform height on screen!
    const maxV = this.is3Phase ? 800 : 500;

    this.drawGrid(maxV);

    const totalDegrees = 720;
    const zeroY = h * 0.52;
    const scaleY = (h * 0.42) / maxV;

    const toScreen = (deg, val) => {
      const x = (deg / totalDegrees) * w;
      const y = zeroY - val * scaleY;
      return [x, y];
    };

    // 1. Draw Input Voltages
    if (this.visibleTraces.vin) {
      if (this.is3Phase) {
        // --- 3-PHASE INPUTS: Draw Va, Vb, Vc with standard color coding ---
        // Phase A: Red (#ef4444)
        ctx.save();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (let i = 0; i < series.angles.length; i++) {
          const [x, y] = toScreen(series.angles[i], series.va[i]);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Phase B: Amber/Yellow (#eab308)
        ctx.strokeStyle = '#eab308';
        ctx.beginPath();
        for (let i = 0; i < series.angles.length; i++) {
          const [x, y] = toScreen(series.angles[i], series.vb[i]);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Phase C: Blue (#3b82f6)
        ctx.strokeStyle = '#3b82f6';
        ctx.beginPath();
        for (let i = 0; i < series.angles.length; i++) {
          const [x, y] = toScreen(series.angles[i], series.vc[i]);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      } else {
        // --- 1-PHASE INPUT: Single Cyan Sine Wave ---
        ctx.save();
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(0, 242, 254, 0.6)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        for (let i = 0; i < series.angles.length; i++) {
          const [x, y] = toScreen(series.angles[i], series.vin[i]);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    // 2. Gate Firing Pulses (Rectangular Blocks matching reference slide)
    if (this.visibleTraces.gate && series.gate) {
      ctx.save();
      const pulseH = maxV * 0.28;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
      ctx.shadowBlur = 8;

      let inPulse = false;
      let pulseStart = 0;

      for (let i = 0; i < series.angles.length; i++) {
        const isPulse = series.gate[i] === 1;
        if (isPulse && !inPulse) {
          inPulse = true;
          pulseStart = series.angles[i];
        } else if (!isPulse && inPulse) {
          inPulse = false;
          const pulseEnd = series.angles[i - 1];
          const [x1, y1] = toScreen(pulseStart, pulseH);
          const [x2, y0] = toScreen(pulseEnd, 0);
          const wBox = Math.max(10, x2 - x1);
          ctx.fillRect(x1, y1, wBox, y0 - y1);
          ctx.strokeRect(x1, y1, wBox, y0 - y1);
        }
      }
      if (inPulse) {
        const [x1, y1] = toScreen(pulseStart, pulseH);
        const [x2, y0] = toScreen(series.angles[series.angles.length - 1], 0);
        const wBox = Math.max(10, x2 - x1);
        ctx.fillRect(x1, y1, wBox, y0 - y1);
        ctx.strokeRect(x1, y1, wBox, y0 - y1);
      }
      ctx.restore();
    }

    // 3. Device Voltage Drop v_T (PIV Monitor - Purple matching reference slide)
    if (this.visibleTraces.vt && series.vt) {
      ctx.save();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = 'rgba(192, 132, 252, 0.8)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let i = 0; i < series.angles.length; i++) {
        const [x, y] = toScreen(series.angles[i], series.vt[i]);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 4. Output Rectified Voltage v_o (Emerald Green with Shaded Area)
    if (this.visibleTraces.vout) {
      ctx.save();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(16, 185, 129, 0.9)';
      ctx.shadowBlur = 10;
      ctx.beginPath();

      for (let i = 0; i < series.angles.length; i++) {
        const [x, y] = toScreen(series.angles[i], series.vout[i]);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Shaded area under curve
      ctx.lineTo(w, zeroY);
      ctx.lineTo(0, zeroY);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.09)';
      ctx.fill();
      ctx.restore();

      // Dashed V_dc Average Line
      if (metrics.Vdc !== undefined) {
        ctx.save();
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        const [, vdcY] = toScreen(0, metrics.Vdc);
        ctx.beginPath();
        ctx.moveTo(0, vdcY);
        ctx.lineTo(w, vdcY);
        ctx.stroke();

        ctx.fillStyle = '#34d399';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText(`Vdc = ${metrics.Vdc} V`, 14, vdcY - 6);
        ctx.restore();
      }
    }

    // 5. Output Current i_o (Radiant Amber - Balanced scale sitting below Vo)
    if (this.visibleTraces.iout) {
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
      ctx.shadowBlur = 8;
      ctx.beginPath();

      // Scale current to display cleanly on the same axis (scale: 4.0V per Ampere)
      const currentScale = 4.0;
      for (let i = 0; i < series.angles.length; i++) {
        const [x, y] = toScreen(series.angles[i], series.iout[i] * currentScale);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 6. Current Timeline Marker (Vertical White Tracking Needle)
    if (this.currentMarkerAngle !== null) {
      const markerX = ((this.currentMarkerAngle % totalDegrees) / totalDegrees) * w;
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(markerX, 0);
      ctx.lineTo(markerX, h);
      ctx.stroke();

      // Top triangle needle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(markerX - 6, 0);
      ctx.lineTo(markerX + 6, 0);
      ctx.lineTo(markerX, 10);
      ctx.fill();
      ctx.restore();
    }

    // 7. Mouse Hover Crosshair
    if (this.hoverX !== null) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(this.hoverX, 0);
      ctx.lineTo(this.hoverX, h);
      ctx.stroke();
      ctx.restore();
    }
  }

  exportImage() {
    return this.canvas.toDataURL('image/png');
  }
}
