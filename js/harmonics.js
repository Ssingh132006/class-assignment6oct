/**
 * harmonics.js - Harmonic Spectrum FFT Analysis and Bar Chart Visualization
 * for Rectifier Output Waveforms
 */

export class HarmonicAnalyzer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width || this.canvas.parentElement?.clientWidth || 700;
    const h = rect.height || 220;

    if (w === 0 || h === 0) return;

    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.width = w;
    this.height = h;
  }

  /**
   * Computes discrete Fourier series amplitudes for orders n = 0 to maxOrder
   */
  computeHarmonics(waveformSamples, maxOrder = 12) {
    const N = waveformSamples.length;
    const harmonics = [];

    // DC Component (n = 0)
    let sumDc = 0;
    for (let i = 0; i < N; i++) {
      sumDc += waveformSamples[i];
    }
    const a0 = sumDc / N;
    harmonics.push({ order: 0, label: 'DC (0)', amp: Math.abs(a0) });

    // AC Harmonics (n = 1 .. maxOrder)
    for (let n = 1; n <= maxOrder; n++) {
      let an = 0;
      let bn = 0;
      for (let i = 0; i < N; i++) {
        const theta = (2 * Math.PI * i) / N;
        an += waveformSamples[i] * Math.cos(n * theta);
        bn += waveformSamples[i] * Math.sin(n * theta);
      }
      an = (2 * an) / N;
      bn = (2 * bn) / N;
      const cn = Math.sqrt(an * an + bn * bn);
      harmonics.push({ order: n, label: `${n}f`, amp: cn });
    }

    return harmonics;
  }

  /**
   * Renders the harmonic spectrum bar chart
   */
  render(waveformSamples) {
    if (!waveformSamples || waveformSamples.length === 0) return;
    this.resize();

    const harmonics = this.computeHarmonics(waveformSamples, 12);
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Clear background
    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, w, h);

    // Padding
    const padLeft = 45;
    const padRight = 20;
    const padBottom = 30;
    const padTop = 20;

    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    // Find max amplitude for normalization (excluding or including DC)
    const maxAmp = Math.max(...harmonics.map(h => h.amp), 1);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padTop + (i / 4) * chartH;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();

      const labelVal = Math.round(maxAmp * (1 - i / 4));
      ctx.fillStyle = '#64748b';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${labelVal}V`, padLeft - 6, y + 3);
    }

    // Bar drawing
    const barWidth = Math.max(12, (chartW / harmonics.length) * 0.65);
    const spacing = chartW / harmonics.length;

    harmonics.forEach((item, index) => {
      const barX = padLeft + index * spacing + (spacing - barWidth) / 2;
      const barHeight = (item.amp / maxAmp) * chartH;
      const barY = padTop + chartH - barHeight;

      // Color coding: DC is emerald, dominant harmonics are cyan/amber
      let gradient = ctx.createLinearGradient(0, barY, 0, barY + barHeight);
      if (item.order === 0) {
        gradient.addColorStop(0, '#10b981');
        gradient.addColorStop(1, '#064e3b');
      } else if (item.order % 6 === 0) {
        gradient.addColorStop(0, '#f59e0b');
        gradient.addColorStop(1, '#78350f');
      } else {
        gradient.addColorStop(0, '#00f2fe');
        gradient.addColorStop(1, '#0369a1');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barWidth, barHeight, [4, 4, 0, 0]);
      ctx.fill();

      // Top amplitude text
      if (item.amp > maxAmp * 0.05) {
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(item.amp)}V`, barX + barWidth / 2, barY - 4);
      }

      // X-axis label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, barX + barWidth / 2, h - 10);
    });
  }
}
