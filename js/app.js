/**
 * app.js - Main Application Orchestrator & Controller
 * Integrates MathEngine, SchematicRenderer, OscilloscopeRenderer, and Harmonics
 */

import { RECTIFIER_CONFIGS } from './config.js';
import { MathEngine } from './mathEngine.js';
import { SchematicRenderer } from './schematics.js';
import { OscilloscopeRenderer } from './oscilloscope.js';
import { HarmonicAnalyzer } from './harmonics.js';

class RectifierStudioApp {
  constructor() {
    this.state = {
      device: 'thyristor',
      rectType: 'full',
      phase: '1ph',
      load: 'RL',
      alpha: 45,
      Vrms: 230,
      freq: 50,
      R: 10,
      L: 0.04,
      E: 0,
      isPlaying: true,
      currentAngle: 45,
      speed: 1.0
    };

    this.mathEngine = new MathEngine(this.state);
    this.schematic = new SchematicRenderer(document.getElementById('circuitCanvasArea'));
    this.oscilloscope = new OscilloscopeRenderer(document.getElementById('oscilloscopeCanvas'));
    this.harmonics = new HarmonicAnalyzer(document.getElementById('harmonicsCanvas'));

    this.animationFrameId = null;
    this.lastFrameTime = performance.now();

    this.initElements();
    this.bindEvents();
    this.updateAll();
    this.startAnimationLoop();
  }

  initElements() {
    // Selectors
    this.deviceRadios = document.querySelectorAll('input[name="deviceType"]');
    this.configRadios = document.querySelectorAll('input[name="rectConfig"]');
    this.phaseRadios = document.querySelectorAll('input[name="phaseSelect"]');
    this.presetDropdown = document.getElementById('presetDropdown');

    // Controls
    this.alphaControlCard = document.getElementById('alphaControlCard');
    this.alphaSlider = document.getElementById('alphaSlider');
    this.alphaValDisplay = document.getElementById('alphaValDisplay');
    this.anglePresetBtns = document.querySelectorAll('.preset-chip');

    this.loadSelect = document.getElementById('loadSelect');
    this.vrmsSlider = document.getElementById('vrmsSlider');
    this.vrmsValDisplay = document.getElementById('vrmsValDisplay');
    this.rSlider = document.getElementById('rSlider');
    this.rValDisplay = document.getElementById('rValDisplay');

    // Playback
    this.btnPlayPause = document.getElementById('btnPlayPause');
    this.btnStepBack = document.getElementById('btnStepBack');
    this.btnStepForward = document.getElementById('btnStepForward');
    this.btnReset = document.getElementById('btnReset');
    this.speedIndicator = document.getElementById('speedIndicator');

    // Scrubber
    this.timeScrubber = document.getElementById('timeScrubber');
    this.scrubberTimeDisplay = document.getElementById('scrubberTimeDisplay');

    // Schematic elements
    this.circuitHeaderTitle = document.getElementById('circuitHeaderTitle');
    this.circuitHeaderSubtitle = document.getElementById('circuitHeaderSubtitle');
    this.conductingDevicesPill = document.getElementById('conductingDevicesPill');
    this.conductionPathDesc = document.getElementById('conductionPathDesc');
    this.circuitAngleTag = document.getElementById('circuitAngleTag');

    // Oscilloscope readout
    this.scopeReadout = document.getElementById('scopeReadout');
    this.readoutAngle = document.getElementById('readoutAngle');
    this.readoutTime = document.getElementById('readoutTime');
    this.readoutVin = document.getElementById('readoutVin');
    this.readoutVout = document.getElementById('readoutVout');
    this.readoutIout = document.getElementById('readoutIout');

    // Inspector
    this.componentInspector = document.getElementById('componentInspector');
    this.inspectorDeviceName = document.getElementById('inspectorDeviceName');
    this.inspectorDeviceStatus = document.getElementById('inspectorDeviceStatus');
    this.inspectorDeviceVoltage = document.getElementById('inspectorDeviceVoltage');

    // Metrics
    this.metricVdc = document.getElementById('metricVdc');
    this.metricVdcFormula = document.getElementById('metricVdcFormula');
    this.metricVrms = document.getElementById('metricVrms');
    this.metricIdc = document.getElementById('metricIdc');
    this.metricIrms = document.getElementById('metricIrms');
    this.metricRf = document.getElementById('metricRf');
    this.metricFf = document.getElementById('metricFf');
    this.metricEff = document.getElementById('metricEff');
    this.metricPiv = document.getElementById('metricPiv');

    // Theory & intervals
    this.theoryVdcEq = document.getElementById('theoryVdcEq');
    this.theoryVdcNotes = document.getElementById('theoryVdcNotes');
    this.theoryVrmsEq = document.getElementById('theoryVrmsEq');
    this.theoryPivEq = document.getElementById('theoryPivEq');
    this.intervalsTableBody = document.getElementById('intervalsTableBody');

    // Trace buttons
    this.tracePills = document.querySelectorAll('.trace-pill');
    this.traceGateBtn = document.getElementById('traceGateBtn');

    // Actions
    this.btnExportReport = document.getElementById('btnExportReport');
    this.btnSnapshotScope = document.getElementById('btnSnapshotScope');
    this.tabButtons = document.querySelectorAll('.tab-btn');
  }

  bindEvents() {
    // 1. Device Radio Change
    this.deviceRadios.forEach(r => {
      r.addEventListener('change', (e) => {
        this.state.device = e.target.value;
        this.syncPresetDropdown();
        this.updateAll();
      });
    });

    // 2. Configuration Radio Change
    this.configRadios.forEach(r => {
      r.addEventListener('change', (e) => {
        this.state.rectType = e.target.value;
        this.syncPresetDropdown();
        this.updateAll();
      });
    });

    // 3. Phase Radio Change
    this.phaseRadios.forEach(r => {
      r.addEventListener('change', (e) => {
        this.state.phase = e.target.value;
        this.syncPresetDropdown();
        this.updateAll();
      });
    });

    // 4. Preset Dropdown
    this.presetDropdown.addEventListener('change', (e) => {
      const parts = e.target.value.split('-');
      this.state.phase = parts[0];
      this.state.rectType = parts[1];
      this.state.device = parts[2];

      // Update radio elements
      document.querySelector(`input[name="deviceType"][value="${this.state.device}"]`).checked = true;
      document.querySelector(`input[name="rectConfig"][value="${this.state.rectType}"]`).checked = true;
      document.querySelector(`input[name="phaseSelect"][value="${this.state.phase}"]`).checked = true;

      this.updateAll();
    });

    // 5. Alpha slider & presets
    this.alphaSlider.addEventListener('input', (e) => {
      this.state.alpha = Number(e.target.value);
      this.alphaValDisplay.textContent = `${this.state.alpha}°`;
      this.highlightAnglePreset(this.state.alpha);
      this.updateSimulation();
    });

    this.anglePresetBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const val = Number(btn.getAttribute('data-angle'));
        this.state.alpha = val;
        this.alphaSlider.value = val;
        this.alphaValDisplay.textContent = `${val}°`;
        this.highlightAnglePreset(val);
        this.updateSimulation();
      });
    });

    // 6. Load select
    this.loadSelect.addEventListener('change', (e) => {
      this.state.load = e.target.value;
      this.updateAll();
    });

    // 7. Vrms & R sliders
    this.vrmsSlider.addEventListener('input', (e) => {
      this.state.Vrms = Number(e.target.value);
      this.vrmsValDisplay.textContent = `${this.state.Vrms} V`;
      this.updateSimulation();
    });

    this.rSlider.addEventListener('input', (e) => {
      this.state.R = Number(e.target.value);
      this.rValDisplay.textContent = `${this.state.R} Ω`;
      this.updateSimulation();
    });

    // 8. Playback controls
    this.btnPlayPause.addEventListener('click', () => {
      this.state.isPlaying = !this.state.isPlaying;
      this.btnPlayPause.textContent = this.state.isPlaying ? '⏸' : '▶';
      this.btnPlayPause.classList.toggle('playing', this.state.isPlaying);
      this.showToast(this.state.isPlaying ? 'Simulation Resumed' : 'Simulation Paused');
    });

    this.btnStepBack.addEventListener('click', () => {
      this.state.isPlaying = false;
      this.btnPlayPause.textContent = '▶';
      this.btnPlayPause.classList.remove('playing');
      this.state.currentAngle = (this.state.currentAngle - 15 + 720) % 720;
      this.timeScrubber.value = Math.round(this.state.currentAngle);
      this.updateFrame();
    });

    this.btnStepForward.addEventListener('click', () => {
      this.state.isPlaying = false;
      this.btnPlayPause.textContent = '▶';
      this.btnPlayPause.classList.remove('playing');
      this.state.currentAngle = (this.state.currentAngle + 15) % 720;
      this.timeScrubber.value = Math.round(this.state.currentAngle);
      this.updateFrame();
    });

    this.btnReset.addEventListener('click', () => {
      this.state.currentAngle = 0;
      this.timeScrubber.value = 0;
      this.updateFrame();
      this.showToast('Reset timeline to 0°');
    });

    const speeds = [0.25, 0.5, 1.0, 2.0];
    this.speedIndicator.addEventListener('click', () => {
      const idx = speeds.indexOf(this.state.speed);
      this.state.speed = speeds[(idx + 1) % speeds.length];
      this.speedIndicator.textContent = `${this.state.speed}x`;
      this.showToast(`Speed set to ${this.state.speed}x`);
    });

    // 9. Time scrubber
    this.timeScrubber.addEventListener('input', (e) => {
      this.state.isPlaying = false;
      this.btnPlayPause.textContent = '▶';
      this.btnPlayPause.classList.remove('playing');
      this.state.currentAngle = Number(e.target.value);
      this.updateFrame();
    });

    // 10. Oscilloscope hover inspection
    this.oscilloscope.onHoverCallback = (angleDeg, mouseX, mouseY) => {
      if (angleDeg === null) {
        this.scopeReadout.style.display = 'none';
        return;
      }

      this.scopeReadout.style.display = 'flex';
      const rad = (angleDeg * Math.PI) / 180;
      const pt = this.mathEngine.getInstantaneous(rad);
      const period = 1 / this.state.freq;
      const tMs = ((angleDeg / 360) * period * 1000).toFixed(2);

      this.readoutAngle.textContent = `${angleDeg.toFixed(1)}°`;
      this.readoutTime.textContent = `${tMs} ms`;
      this.readoutVin.textContent = `${pt.vin.toFixed(1)} V`;
      this.readoutVout.textContent = `${pt.vout.toFixed(1)} V`;
      this.readoutIout.textContent = `${pt.iout.toFixed(2)} A`;
    };

    // 11. Trace toggles
    this.tracePills.forEach(pill => {
      pill.addEventListener('click', () => {
        const trace = pill.getAttribute('data-trace');
        pill.classList.toggle('active');
        const isActive = pill.classList.contains('active');
        this.oscilloscope.setTraceVisibility(trace, isActive);
        this.oscilloscope.render(this.currentSeries, this.currentMetrics);
      });
    });

    // 12. Tabs navigation
    this.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.tabButtons.forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');

        if (tabId === 'tab-harmonics') {
          setTimeout(() => {
            this.harmonics.resize();
            this.harmonics.render(this.currentSeries.vout);
          }, 30);
        }
      });
    });

    // 13. Interactive schematic device clicks
    document.getElementById('circuitCanvasArea').addEventListener('click', (e) => {
      const devGroup = e.target.closest('.device-group');
      if (devGroup) {
        const devId = devGroup.getAttribute('data-device-id');
        const devType = devGroup.getAttribute('data-device-type');
        const isConducting = devGroup.classList.contains('device-conducting');

        this.inspectorDeviceName.textContent = `${devId} (${devType})`;
        this.inspectorDeviceStatus.textContent = `State: ${isConducting ? 'Forward Conducting' : 'Reverse / Forward Blocking'}`;
        const maxPiv = (Math.SQRT2 * this.state.Vrms * (this.state.phase === '3ph' ? Math.sqrt(3) : 1)).toFixed(1);
        this.inspectorDeviceVoltage.textContent = `Instant Drop: ${isConducting ? '~1.2V' : 'Blocking'} | PIV Rating: ${maxPiv} V`;

        this.componentInspector.classList.add('visible');
        setTimeout(() => {
          this.componentInspector.classList.remove('visible');
        }, 3500);
      }
    });

    // 14. Export CSV & Save Waveform
    this.btnExportReport.addEventListener('click', () => this.exportCsv());
    this.btnSnapshotScope.addEventListener('click', () => this.snapshotScope());
  }

  highlightAnglePreset(val) {
    this.anglePresetBtns.forEach(btn => {
      const a = Number(btn.getAttribute('data-angle'));
      btn.classList.toggle('active', a === val);
    });
  }

  syncPresetDropdown() {
    const key = `${this.state.phase}-${this.state.rectType}-${this.state.device}`;
    if (this.presetDropdown) {
      this.presetDropdown.value = key;
    }

    // Toggle alpha card visibility for Thyristor vs Diode
    const isThy = this.state.device === 'thyristor';
    this.alphaControlCard.style.opacity = isThy ? '1' : '0.4';
    this.alphaControlCard.style.pointerEvents = isThy ? 'auto' : 'none';
    if (!isThy) {
      this.alphaValDisplay.textContent = '0° (N/A)';
    } else {
      this.alphaValDisplay.textContent = `${this.state.alpha}°`;
    }

    if (this.traceGateBtn) {
      this.traceGateBtn.style.display = isThy ? 'inline-flex' : 'none';
    }
  }

  getConfigKey() {
    return `${this.state.phase}-${this.state.rectType}-${this.state.device}`;
  }

  updateAll() {
    const configKey = this.getConfigKey();
    const info = RECTIFIER_CONFIGS[configKey] || RECTIFIER_CONFIGS['1ph-full-thyristor'];

    // Update headers
    this.circuitHeaderTitle.textContent = info.name;
    this.circuitHeaderSubtitle = `${info.type} • Pulses: ${info.pulses} • Load: ${this.state.load}`;

    // Render new schematic SVG
    this.schematic.renderSchematic(this.state);

    // Update theory & equations
    this.theoryVdcEq.textContent = info.vdcFormula;
    this.theoryVdcNotes.textContent = info.description;
    this.theoryVrmsEq.textContent = info.vrmsFormula;
    this.theoryPivEq.textContent = `PIV = ${info.pivFormula}`;

    // Populate intervals table
    this.intervalsTableBody.innerHTML = '';
    info.intervals.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="color: var(--color-accent);">${row.range}</td>
        <td style="color: var(--color-emerald); font-weight: 600;">${row.state}</td>
        <td style="color: #38bdf8;">${row.vout}</td>
        <td>${row.comment}</td>
      `;
      this.intervalsTableBody.appendChild(tr);
    });

    this.updateSimulation();
  }

  updateSimulation() {
    this.mathEngine.updateParams(this.state);
    this.currentSeries = this.mathEngine.generateSeries(2, 720);
    this.currentMetrics = this.mathEngine.calculateMetrics();

    // Update metrics cards
    this.metricVdc.textContent = this.currentMetrics.Vdc;
    this.metricVrms.textContent = this.currentMetrics.Vrms;
    this.metricIdc.textContent = this.currentMetrics.Idc;
    this.metricIrms.textContent = this.currentMetrics.Irms;
    this.metricRf.textContent = this.currentMetrics.RF;
    this.metricFf.textContent = this.currentMetrics.FF;
    this.metricEff.textContent = this.currentMetrics.efficiency;
    this.metricPiv.textContent = this.currentMetrics.piv;

    const analyticalVdc = this.mathEngine.getAnalyticalVdc().toFixed(1);
    this.metricVdcFormula.textContent = `Formula: ${analyticalVdc} V`;

    // Render oscilloscope & harmonics
    this.oscilloscope.render(this.currentSeries, this.currentMetrics);
    this.harmonics.render(this.currentSeries.vout);

    this.updateFrame();
  }

  updateFrame() {
    const rad = (this.state.currentAngle * Math.PI) / 180;
    const pt = this.mathEngine.getInstantaneous(rad);

    // Update schematic active paths
    this.schematic.updateConductionState(pt.conductingDevices);

    // Update tracking tags
    this.conductingDevicesPill.textContent = pt.conductingDevices.length > 0 ? pt.conductingDevices.join(', ') : 'None (Off)';
    this.conductionPathDesc.textContent = pt.activePath;
    this.circuitAngleTag.textContent = `${(this.state.currentAngle % 360).toFixed(1)}°`;

    // Update scrubber display
    const period = 1 / this.state.freq;
    const tMs = ((this.state.currentAngle / 360) * period * 1000).toFixed(1);
    this.scrubberTimeDisplay.textContent = `${Math.round(this.state.currentAngle)}° (${tMs}ms)`;

    // Update oscilloscope vertical cursor line
    this.oscilloscope.setCurrentMarkerAngle(this.state.currentAngle);
    this.oscilloscope.render(this.currentSeries, this.currentMetrics);
  }

  startAnimationLoop() {
    const loop = (timestamp) => {
      const dt = (timestamp - this.lastFrameTime) / 1000;
      this.lastFrameTime = timestamp;

      if (this.state.isPlaying) {
        // At 50Hz, one cycle (360 deg) is 20ms => 18,000 deg/sec
        // We scale visual simulation speed smoothly
        const degPerSec = 180 * this.state.speed;
        this.state.currentAngle = (this.state.currentAngle + degPerSec * dt) % 720;
        this.timeScrubber.value = Math.round(this.state.currentAngle);
        this.updateFrame();
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  exportCsv() {
    if (!this.currentSeries) return;
    let csv = 'Angle_Deg,Time_s,Vin_V,Vout_V,Iout_A,Vt_V\n';
    for (let i = 0; i < this.currentSeries.angles.length; i++) {
      csv += `${this.currentSeries.angles[i].toFixed(1)},${this.currentSeries.times[i].toFixed(6)},${this.currentSeries.vin[i].toFixed(2)},${this.currentSeries.vout[i].toFixed(2)},${this.currentSeries.iout[i].toFixed(3)},${this.currentSeries.vt[i].toFixed(2)}\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rectifier_simulation_${this.getConfigKey()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('CSV Lab Data Exported Successfully!');
  }

  snapshotScope() {
    const dataUrl = this.oscilloscope.exportImage();
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `waveform_${this.getConfigKey()}.png`;
    a.click();
    this.showToast('Waveform Snapshot Saved as PNG!');
  }

  showToast(message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>⚡</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }
}

// Start application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new RectifierStudioApp();
});
