/**
 * oscilloscope.js - High-Precision Multi-Trace Canvas Oscilloscope
 * for Power Electronics Waveform Visualization
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

  initEvents() {
    window.addEventListener('resize', () => {
      this.resize();
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.hoverX = e.clientX - rect.left;
      if (this.onHoverCallback) {
        const totalDegrees = 720; // 2 cycles default
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
   * Draws the oscilloscope grid and axis markers
   */
  drawGrid(numCycles = 2) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Background
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

    // Center Ground / Zero reference line
    const zeroY = h * 0.52;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(w, zeroY);
    ctx.stroke();

    // Cycle & Phase labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px "JetBrains Mono", monospace';
    const markers = [
      { deg: 0, label: '0' },
      { deg: 90, label: 'π/2 (90°)' },
      { deg: 180, label: 'π (180°)' },
      { deg: 270, label: '3π/2' },
      { deg: 360, label: '2π (360°)' },
      { deg: 450, label: '5π/2' },
      { deg: 540, label: '3π (540°)' },
      { deg: 630, label: '7π/2' },
      { deg: 720, label: '4π (720°)' }
    ];

    markers.forEach(m => {
      const x = (m.deg / 720) * w;
      ctx.fillText(m.label, x + 4, zeroY + 14);
      // Small tick
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.moveTo(x, zeroY - 4);
      ctx.lineTo(x, zeroY + 4);
      ctx.stroke();
    });
  }

  /**
   * Main render function
   */
  render(series, metrics = {}) {
    if (!series || !series.angles.length) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    this.drawGrid();

    const totalDegrees = 720;
    const zeroY = h * 0.52;
    const scaleY = (h * 0.38) / 380; // normalize roughly for 380V peak

    // Coordinate mapping helper
    const toScreen = (deg, val) => {
      const x = (deg / totalDegrees) * w;
      const y = zeroY - val * scaleY;
      return [x, y];
    };

    // 1. Draw Input Voltage v_in
    if (this.visibleTraces.vin) {
      ctx.save();
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(0, 242, 254, 0.6)';
      ctx.shadowBlur = 6;
      ctx.beginPath();

      for (let i = 0; i < series.angles.length; i++) {
        const [x, y] = toScreen(series.angles[i], series.vin[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 2. Draw Thyristor Gate Pulses
    if (this.visibleTraces.gate && series.gate) {
      ctx.save();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(192, 132, 252, 0.8)';
      ctx.shadowBlur = 8;
      ctx.beginPath();

      for (let i = 0; i < series.angles.length; i++) {
        const pulseVal = series.gate[i] ? 120 : 0;
        const [x, y] = toScreen(series.angles[i], pulseVal);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Device Voltage v_t (PIV monitor)
    if (this.visibleTraces.vt && series.vt) {
      ctx.save();
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();

      for (let i = 0; i < series.angles.length; i++) {
        const [x, y] = toScreen(series.angles[i], series.vt[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 4. Draw Output Rectified Voltage v_out
    if (this.visibleTraces.vout) {
      ctx.save();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(16, 185, 129, 0.9)';
      ctx.shadowBlur = 10;
      ctx.beginPath();

      for (let i = 0; i < series.angles.length; i++) {
        const [x, y] = toScreen(series.angles[i], series.vout[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Shaded area under v_out
      ctx.lineTo(w, zeroY);
      ctx.lineTo(0, zeroY);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.fill();
      ctx.restore();

      // Dashed V_dc Average Line
      if (metrics.Vdc !== undefined) {
        ctx.save();
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        const [, vdcY] = toScreen(0, metrics.Vdc);
        ctx.beginPath();
        ctx.moveTo(0, vdcY);
        ctx.lineTo(w, vdcY);
        ctx.stroke();

        ctx.fillStyle = '#34d399';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText(`V_dc = ${metrics.Vdc} V`, 12, vdcY - 5);
        ctx.restore();
      }
    }

    // 5. Draw Output Current i_out (scaled to display nicely)
    if (this.visibleTraces.iout) {
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
      ctx.shadowBlur = 8;
      ctx.beginPath();

      // Current scaling factor (multiply by 8 for visibility)
      const currentScale = 8;
      for (let i = 0; i < series.angles.length; i++) {
        const [x, y] = toScreen(series.angles[i], series.iout[i] * currentScale);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 6. Draw Current Simulation Marker (Vertical tracking line)
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

      // Top triangle head
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(markerX - 6, 0);
      ctx.lineTo(markerX + 6, 0);
      ctx.lineTo(markerX, 10);
      ctx.fill();
      ctx.restore();
    }

    // 7. Draw Mouse Hover Crosshair
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

  /**
   * Export waveform canvas to PNG
   */
  exportImage() {
    return this.canvas.toDataURL('image/png');
  }
}
