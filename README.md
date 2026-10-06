# ⚡ Rectifier Studio: Power Electronics Virtual Laboratory

An interactive, high-fidelity simulator for studying **Diode Bridge Rectifiers** and **Thyristor Phase-Controlled Converters** across Single-Phase and Three-Phase topologies. Built for power electronics coursework, laboratory assignments, and engineering analysis.

🔗 **GitHub Repository:** [https://github.com/Ssingh132006/class-assignment6oct](https://github.com/Ssingh132006/class-assignment6oct)

---

## 🌟 Key Features

### 1. Top Control Hub
- **Device Type**: Switch instantly between **Diode Rectifier (Uncontrolled)** and **Thyristor Controlled Converter (Phase-Controlled SCR)**.
- **Circuit Configuration**: Toggle between **Half-Wave** and **Full-Wave Bridge (Graetz Bridge)** topologies.
- **Supply Phases**: Select between **1-Phase (Single Phase, 230V)** and **3-Phase (Three Phase Star/Delta, 400V)**.
- **8 Core Topologies Supported**:
  1. 1-Phase Half-Wave Diode Rectifier
  2. 1-Phase Full-Wave Diode Bridge Rectifier (2-Pulse)
  3. 3-Phase Half-Wave Diode Rectifier (3-Pulse Star)
  4. 3-Phase Full-Wave Diode Bridge Rectifier (6-Pulse Graetz Bridge)
  5. 1-Phase Half-Wave Thyristor Controlled Rectifier
  6. 1-Phase Full-Wave Fully-Controlled Thyristor Bridge
  7. 3-Phase Half-Wave Thyristor Converter (3-Pulse)
  8. 3-Phase Full-Wave Fully-Controlled Thyristor Bridge (6-Pulse)
- **Firing Angle ($\alpha$) Control**: Precision slider from $0^\circ$ to $180^\circ$ with live preset chips ($0^\circ, 30^\circ, 45^\circ, 60^\circ, 90^\circ, 120^\circ$).
- **Load Topologies**:
  - Pure Resistive Load ($R$)
  - Inductive Load ($R-L$)
  - $R-L$ with Freewheeling Diode (FWD)
  - Active DC Battery / Back-EMF Load ($R-L-E$)

### 2. Interactive Circuit Schematic (Left Panel)
- **Vector SVG Engine**: Crystal clear rendering of transformers, AC sources, diodes, SCRs, gate terminals, and load blocks.
- **Live Conduction Visualizer**:
  - Actively conducting devices glow with electric emerald light (`ON` badge).
  - Reverse/blocking devices display subtle holding state.
  - Active electrical current loops glow and animate with flowing electrons in real-time!
- **Device Inspector**: Click any diode or thyristor in the circuit to view its instantaneous voltage drop, operating state, and Peak Inverse Voltage (PIV) rating.

### 3. High-Precision Multi-Trace Oscilloscope (Right Panel)
- **Multi-Trace Display**:
  - $v_s(t)$: Input AC Source Voltage (or 3-Phase Line/Phase voltages $v_a, v_b, v_c$)
  - $i_g(t)$: Gate Firing Trigger Pulses at angle $\alpha$
  - $v_o(t)$: Rectified Output Voltage (with dashed average $V_{dc}$ level and shaded conduction area)
  - $i_o(t)$: Load Output Current (showing continuous vs. discontinuous ripple)
  - $v_{T1}(t)$: Device Voltage Stress & PIV Monitor
- **Interactive Crosshair & Hover Tooltip**: Hovering over the waveform shows exact instantaneous values $(\omega t, t, v_s, v_o, i_o)$ in real-time.
- **Timeline Scrubber**: Drag or step through electrical angle $\omega t \in [0, 720^\circ]$ to freeze-frame and examine commutation moments.
- **Playback Controls**: Play/Pause, Step forward/backward ($15^\circ$), Speed adjuster ($0.25\times, 0.5\times, 1.0\times, 2.0\times$), and Reset.

### 4. Comprehensive Analysis & Educational Tabs
- **Performance Metrics**:
  - Average DC Voltage ($V_{dc}$)
  - RMS Output Voltage ($V_{rms}$)
  - Average DC Current ($I_{dc}$)
  - RMS Output Current ($I_{rms}$)
  - Form Factor ($FF = V_{rms}/V_{dc}$)
  - Ripple Factor ($RF = \sqrt{FF^2 - 1}$)
  - Rectification Efficiency ($\eta = P_{dc}/P_{ac} \times 100\%$)
  - Peak Inverse Voltage ($PIV$)
  - Total Harmonic Distortion ($THD$)
- **Mathematical Formulas & Theory**: Exact piecewise and analytical expressions for each configuration.
- **Harmonic Spectrum (FFT)**: Interactive bar chart displaying DC and harmonic amplitudes ($f, 2f, 3f, 4f, 6f, \dots$), demonstrating why 6-pulse bridges produce significantly cleaner DC outputs.
- **Conduction Intervals Table**: Breakdown of conduction periods for lab reports.
- **Export Tools**:
  - **Export Lab Data (CSV)**: Full time-series simulation data export.
  - **Save Waveform (PNG)**: High-resolution oscilloscope snapshot export.

---

## 🚀 Running Locally

You can run the project locally with zero dependencies using Python or Node:

```bash
# Clone the repository
git clone https://github.com/Ssingh132006/class-assignment6oct.git
cd class-assignment6oct

# Option 1: Python HTTP server
python3 -m http.server 5173

# Option 2: npm / node
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ☁️ Deploying to Vercel via GitHub

This project is structured as a zero-config static web application:

1. **Push to GitHub**:
   Ensure all files are committed and pushed to `main`:
   ```bash
   git add .
   git commit -m "feat: complete interactive bridge & controlled rectifier simulator"
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com) and log in with your GitHub account (`Ssingh132006`).
   - Click **"Add New..."** > **"Project"**.
   - Select the repository: `class-assignment6oct`.
   - Vercel automatically detects the root `index.html` and `vercel.json`.
   - Click **"Deploy"**.

3. **Live Instant URL**:
   Your simulator will be live instantly with global CDN acceleration and HTTPS!

---

## 📚 Mathematical Reference Summary

| Topology | Pulses | $V_{dc}$ Formula (R Load) | $V_{dc}$ (Continuous RL) | PIV Rating | Ripple Frequency |
|---|:---:|---|---|:---:|:---:|
| **1$\Phi$ Half Diode** | 1 | $\frac{V_m}{\pi} \approx 0.318 V_m$ | Extinction $\beta$ dependent | $V_m$ | $f$ |
| **1$\Phi$ Full Diode Bridge** | 2 | $\frac{2V_m}{\pi} \approx 0.637 V_m$ | $\frac{2V_m}{\pi} \approx 0.637 V_m$ | $V_m$ | $2f$ |
| **3$\Phi$ Half Diode (3-Pulse)** | 3 | $\frac{3\sqrt{3}}{2\pi} V_m \approx 0.827 V_m$ | $\frac{3\sqrt{3}}{2\pi} V_m$ | $\sqrt{3}V_m$ | $3f$ |
| **3$\Phi$ Full Diode (6-Pulse)** | 6 | $\frac{3\sqrt{3}}{\pi} V_m \approx 1.654 V_m$ | $\frac{3\sqrt{3}}{\pi} V_m$ | $\sqrt{3}V_m$ | $6f$ |
| **1$\Phi$ Half Thyristor** | 1 | $\frac{V_m}{2\pi}(1+\cos\alpha)$ | Extends to $\beta$ | $V_m$ | $f$ |
| **1$\Phi$ Full Thyristor Bridge**| 2 | $\frac{V_m}{\pi}(1+\cos\alpha)$ | $\frac{2V_m}{\pi}\cos\alpha$ | $V_m$ | $2f$ |
| **3$\Phi$ Half Thyristor** | 3 | $\frac{3\sqrt{3}}{2\pi}V_m \cos\alpha$ | $\frac{3\sqrt{3}}{2\pi}V_m \cos\alpha$ | $\sqrt{3}V_m$ | $3f$ |
| **3$\Phi$ Full Thyristor (6-Pulse)**| 6 | $\frac{3\sqrt{3}}{\pi}V_m \cos\alpha$ | $\frac{3\sqrt{3}}{\pi}V_m \cos\alpha$ | $\sqrt{3}V_m$ | $6f$ |

---

## 👨‍💻 Author

**Shreyas Singh**  
IIT Kharagpur  
*Class Assignment - Power Electronics & Bridge Rectifiers*
