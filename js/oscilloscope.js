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
    const w = rect.width || this.canvas.parentElement?.clientWidth || 600;
    const h = rect.height || this.canvas.parentElement?.clientHeight || 380;

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
    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, w, h);

    // Minor grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const cols = 24;
    const rows = 12;
    for (let i = 0; i <= cols; i++) {
      const x = (i / cols) * w;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let j = 0; j <= rows; j++) {
      const y = (j / rows) * h;
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Center Ground / Zero Volt reference line
    const zeroY = h * 0.52;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(w, zeroY);
    ctx.stroke();

    // Voltage division markings on left
    ctx.fillStyle = '#64748b';
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
      ctx.fillStyle = '#64748b';
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
    if (!series || !series.angles.length) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Determine peak voltage scale dynamically so 3-phase line voltages fit nicely
    let maxV = 360;
    if (this.is3Phase) {
      maxV = 620; // 3-phase peak line voltage is sqrt(3)*325 = 563V
    } else {
      maxV = Math.max(350, (metrics.piv || 325) * 1.15);
    }

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

    // 2. Gate Firing Pulses (Sharp Spikes)
    if (this.visibleTraces.gate && series.gate) {
      ctx.save();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(192, 132, 252, 0.9)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      for (let i = 0; i < series.angles.length; i++) {
        const pulseVal = series.gate[i] ? (maxV * 0.3) : 0;
        const [x, y] = toScreen(series.angles[i], pulseVal);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 3. Device Voltage Drop v_T (PIV Monitor)
    if (this.visibleTraces.vt && series.vt) {
      ctx.save();
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
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
        ctx.fillText(`V_dc = ${metrics.Vdc} V`, 14, vdcY - 6);
        ctx.restore();
      }
    }

    // 5. Output Current i_o (Radiant Amber)
    if (this.visibleTraces.iout) {
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
      ctx.shadowBlur = 8;
      ctx.beginPath();

      // Scale current to display cleanly on the same axis (scale: 12V per Ampere)
      const currentScale = 14;
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
