import pptxgen from 'pptxgenjs';
import fs from 'fs';
import path from 'path';

async function generatePresentation() {
  const pres = new pptxgen();

  pres.layout = 'LAYOUT_16x9';
  pres.author = 'ALS Enterprise Operations';
  pres.company = 'Artificial Lift Suite Enterprise';
  pres.subject = 'ALS Enterprise Platform Architecture & Surveillance Presentation';
  pres.title = 'ALS Enterprise — Artificial Lift Operations & Surveillance Suite';

  // Theme Colors
  const BG_COLOR = '0B1120'; // Slate 950
  const CARD_BG = '1E293B'; // Slate 800
  const ACCENT_CYAN = '06B6D4'; // Cyan 500
  const ACCENT_EMERALD = '10B981'; // Emerald 500
  const ACCENT_AMBER = 'F59E0B'; // Amber 500
  const ACCENT_ROSE = 'F43F5E'; // Rose 500
  const TEXT_WHITE = 'FFFFFF';
  const TEXT_MUTED = '94A3B8'; // Slate 400

  // Helper for slide base styling
  function createBaseSlide(title, category = 'ARTIFICIAL LIFT SUITE ENTERPRISE') {
    const slide = pres.addSlide();
    slide.background = { color: BG_COLOR };

    // Header Category
    slide.addText(category.toUpperCase(), {
      x: 0.8,
      y: 0.5,
      w: 8.0,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: ACCENT_CYAN,
      fontFace: 'Arial'
    });

    // Title
    slide.addText(title, {
      x: 0.8,
      y: 0.8,
      w: 11.5,
      h: 0.6,
      fontSize: 22,
      bold: true,
      color: TEXT_WHITE,
      fontFace: 'Arial'
    });

    // Bottom banner
    slide.addText('DEMO SIMULATED DATA — Telemetry is synthetic and not connected to physical oilfield equipment.', {
      x: 0.8,
      y: 7.0,
      w: 10.0,
      h: 0.3,
      fontSize: 8,
      color: '64748B',
      fontFace: 'Arial'
    });

    slide.addText('ALS ENTERPRISE v2.8', {
      x: 11.0,
      y: 7.0,
      w: 1.5,
      h: 0.3,
      fontSize: 8,
      align: 'right',
      color: ACCENT_CYAN,
      fontFace: 'Arial'
    });

    return slide;
  }

  // ==========================================
  // SLIDE 1: Title Slide
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: BG_COLOR };

    slide.addText('ARTIFICIAL LIFT SUITE', {
      x: 1.0,
      y: 2.0,
      w: 10.0,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: ACCENT_CYAN,
      fontFace: 'Arial',
      charSpacing: 3
    });

    slide.addText('ALS Enterprise Operations & Surveillance Suite', {
      x: 1.0,
      y: 2.5,
      w: 11.0,
      h: 1.2,
      fontSize: 34,
      bold: true,
      color: TEXT_WHITE,
      fontFace: 'Arial'
    });

    slide.addText('Unified Real-Time SCADA Telemetry, Downhole Digital Twin & Reliability Intelligence', {
      x: 1.0,
      y: 3.8,
      w: 10.5,
      h: 0.8,
      fontSize: 16,
      color: TEXT_MUTED,
      fontFace: 'Arial'
    });

    slide.addShape(pres.ShapeType.rect, {
      x: 1.0,
      y: 4.8,
      w: 11.3,
      h: 1.2,
      fill: { color: '131E33' },
      line: { color: '1E293B', width: 1 }
    });

    slide.addText([
      { text: 'Confidential Client Executive Briefing & Technical Capability Demonstration\n', options: { bold: true, color: TEXT_WHITE, fontSize: 12 } },
      { text: 'Prepared for Operations Leadership, Petroleum Engineering, and Surveillance Teams | October 2026', options: { color: TEXT_MUTED, fontSize: 11 } }
    ], { x: 1.2, y: 5.0, w: 10.8, h: 0.8 });

    slide.addNotes('Welcome everyone. Today we are presenting the ALS Enterprise Platform — an operational command center designed specifically for managing large artificial lift fleets. Over the next 10 minutes, we will show how ALS bridges the gap between field-level SCADA instrumentation, downhole physics-based digital twins, and operational workflows.');
  }

  // ==========================================
  // SLIDE 2: Executive Summary
  // ==========================================
  {
    const slide = createBaseSlide('Executive Summary: The Artificial Lift Challenge', 'PLATFORM PURPOSE');

    const cards = [
      {
        title: 'Downhole Blindness',
        desc: 'Operators struggle to detect impending gas locking, solids abrasion, and cable breakdown before severe mechanical failure occurs.',
        stat: '42%',
        statLabel: 'Premature Failures'
      },
      {
        title: 'SCADA Data Fragmentation',
        desc: 'Critical surface and downhole pressures, temperatures, and motor harmonics reside in isolated silos with zero nodal integration.',
        stat: '10+',
        statLabel: 'Disparate Systems'
      },
      {
        title: 'Unified Operational Cockpit',
        desc: 'ALS unifies 20+ monitored wells, high-density gauge telemetry, physics solvers, and closed-loop work orders in a single viewport.',
        stat: '<30s',
        statLabel: 'Anomaly Detection'
      }
    ];

    cards.forEach((c, idx) => {
      const x = 0.8 + idx * 3.9;
      slide.addShape(pres.ShapeType.rect, {
        x: x,
        y: 1.8,
        w: 3.6,
        h: 4.6,
        fill: { color: CARD_BG },
        line: { color: '334155', width: 1 }
      });

      slide.addText(c.stat, {
        x: x + 0.3,
        y: 2.1,
        w: 3.0,
        h: 0.8,
        fontSize: 32,
        bold: true,
        color: idx === 2 ? ACCENT_EMERALD : ACCENT_CYAN,
        fontFace: 'Arial'
      });

      slide.addText(c.statLabel, {
        x: x + 0.3,
        y: 2.9,
        w: 3.0,
        h: 0.3,
        fontSize: 11,
        bold: true,
        color: TEXT_MUTED,
        fontFace: 'Arial'
      });

      slide.addText(c.title, {
        x: x + 0.3,
        y: 3.4,
        w: 3.0,
        h: 0.5,
        fontSize: 15,
        bold: true,
        color: TEXT_WHITE,
        fontFace: 'Arial'
      });

      slide.addText(c.desc, {
        x: x + 0.3,
        y: 4.0,
        w: 3.0,
        h: 2.0,
        fontSize: 11,
        color: TEXT_MUTED,
        fontFace: 'Arial'
      });
    });

    slide.addNotes('Artificial lift accounts for the majority of production operating expenses in unconventional plays. Our platform directly solves the three core pain points: premature pump trips, fragmented monitoring data, and lack of real-time nodal physics integration.');
  }

  // ==========================================
  // SLIDE 3: Dual-Role Architecture
  // ==========================================
  {
    const slide = createBaseSlide('Dual-Role Architecture: Admin Governance vs. User Cockpit', 'SYSTEM SECURITY & RBAC');

    // Admin Card
    slide.addShape(pres.ShapeType.rect, {
      x: 0.8,
      y: 1.8,
      w: 5.6,
      h: 4.6,
      fill: { color: CARD_BG },
      line: { color: '334155', width: 1 }
    });

    slide.addText('ADMINISTRATION PORTAL', {
      x: 1.1,
      y: 2.1,
      w: 5.0,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: ACCENT_AMBER,
      fontFace: 'Arial'
    });

    slide.addText([
      { text: '• User Management & RBAC: ', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Role-based permissions for 7 distinct personas.\n\n', options: { color: TEXT_MUTED } },
      { text: '• Device & Modbus Tag Registry: ', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Full CRUD control over RTUs, VFD registers, and baud rates.\n\n', options: { color: TEXT_MUTED } },
      { text: '• Asset Hierarchy Configuration: ', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Basin, field, pad, and downhole mechanical schematics.\n\n', options: { color: TEXT_MUTED } },
      { text: '• Audit Trail & Change Logs: ', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Immutable log of setpoint trims and alarm threshold edits.', options: { color: TEXT_MUTED } }
    ], { x: 1.1, y: 2.7, w: 5.0, h: 3.4, fontSize: 11 });

    // User Portal Card
    slide.addShape(pres.ShapeType.rect, {
      x: 6.8,
      y: 1.8,
      w: 5.6,
      h: 4.6,
      fill: { color: CARD_BG },
      line: { color: '06B6D4', width: 1 }
    });

    slide.addText('SURVEILLANCE & USER COCKPIT', {
      x: 7.1,
      y: 2.1,
      w: 5.0,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: ACCENT_CYAN,
      fontFace: 'Arial'
    });

    slide.addText([
      { text: '• Real-Time Operations Dashboard: ', options: { bold: true, color: TEXT_WHITE } },
      { text: '10 Control-Room KPIs, wells down triage, and fleet trends.\n\n', options: { color: TEXT_MUTED } },
      { text: '• SCADA Dashboard: ', options: { bold: true, color: TEXT_WHITE } },
      { text: '10 pressure/temp gauges, 7 multi-parameter trend families.\n\n', options: { color: TEXT_MUTED } },
      { text: '• Digital Twin Interactive Views: ', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Downhole wellbore cross-section and surface tree telemetry.\n\n', options: { color: TEXT_MUTED } },
      { text: '• 8-Stage Cable Shop Workflow: ', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Inspection, Hi-Pot testing, spooling, shipment, and invoicing.', options: { color: TEXT_MUTED } }
    ], { x: 7.1, y: 2.7, w: 5.0, h: 3.4, fontSize: 11 });

    slide.addNotes('Notice how the architecture enforces strict separation of concerns. Admin users have total governance over device templates and permissions, while operational surveillance engineers have a streamlined, distraction-free surveillance environment.');
  }

  // ==========================================
  // SLIDE 4: Fleet Overview & 20-Well Monitoring
  // ==========================================
  {
    const slide = createBaseSlide('Field Surveillance & 20-Well Monitored Fleet', 'OPERATIONS DASHBOARD');

    const metrics = [
      { label: 'Total Monitored', val: '20', sub: 'Permian & Eagle Ford', col: TEXT_WHITE },
      { label: 'Running Nominally', val: '18', sub: '90% Operating Uptime', col: ACCENT_EMERALD },
      { label: 'Wells Down', val: '0', sub: 'Trips Triage Queue Active', col: ACCENT_ROSE },
      { label: 'Cycling Wells', val: '2', sub: 'Intermittent / POC', col: '60A5FA' },
      { label: 'Total Production', val: '14,320', sub: 'BPD Gross Fluid', col: ACCENT_CYAN }
    ];

    metrics.forEach((m, idx) => {
      const x = 0.8 + idx * 2.35;
      slide.addShape(pres.ShapeType.rect, {
        x: x,
        y: 1.8,
        w: 2.15,
        h: 1.6,
        fill: { color: CARD_BG },
        line: { color: '334155', width: 1 }
      });

      slide.addText(m.label, { x: x + 0.15, y: 1.95, w: 1.85, h: 0.3, fontSize: 10, color: TEXT_MUTED });
      slide.addText(m.val, { x: x + 0.15, y: 2.25, w: 1.85, h: 0.6, fontSize: 24, bold: true, color: m.col });
      slide.addText(m.sub, { x: x + 0.15, y: 2.85, w: 1.85, h: 0.3, fontSize: 8, color: TEXT_MUTED });
    });

    // Content box
    slide.addShape(pres.ShapeType.rect, {
      x: 0.8,
      y: 3.7,
      w: 11.6,
      h: 2.8,
      fill: { color: CARD_BG },
      line: { color: '334155', width: 1 }
    });

    slide.addText('PERSISTENT TWO-COLUMN CONTROL ROOM WORKSPACE', {
      x: 1.1,
      y: 3.9,
      w: 11.0,
      h: 0.3,
      fontSize: 12,
      bold: true,
      color: ACCENT_CYAN
    });

    slide.addText([
      { text: '• Left-Hand Asset Selector: ', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Categorizes wells into Running, Warning/Threat, Down, and No Communication with live sparklines and search.\n', options: { color: TEXT_MUTED } },
      { text: '• Selected Well Banner: ', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Selecting a well immediately locks the right-hand workspace to that well across SCADA, Digital Twin, ESP curves, and Alarms.\n', options: { color: TEXT_MUTED } },
      { text: '• Field Intervention Queue: ', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Integrated dispatch crew, trip acknowledgment, and soft-start ramp triggers for rapid recovery.', options: { color: TEXT_MUTED } }
    ], { x: 1.1, y: 4.4, w: 11.0, h: 1.8, fontSize: 11 });

    slide.addNotes('This slide illustrates the primary operations viewport. 20 wells are actively streaming synthetic SCADA packets. Notice the 10 control-room KPI cards and the persistent well selector on the left, enabling seamless one-click telemetry drilldown.');
  }

  // ==========================================
  // SLIDE 5: SCADA Instrumentation
  // ==========================================
  {
    const slide = createBaseSlide('Unified SCADA Monitoring: 10 Critical Gauges', 'SCADA INSTRUMENTATION');

    const gauges = [
      { tag: 'THP', name: 'Tubing Head Pressure', val: '284 psi', unit: 'Imperial / Metric' },
      { tag: 'FLP', name: 'Flowline Pressure', val: '115 psi', unit: 'Manifold Header' },
      { tag: 'A-ANN', name: 'A-Annulus Pressure', val: '714 psi', unit: 'Sealed Casing' },
      { tag: 'B-ANN', name: 'B-Annulus Pressure', val: '0.0 psi', unit: 'Surface Vent' },
      { tag: 'PIP', name: 'Pump Intake Pressure', val: '840 psi', unit: 'Phoenix Sensor' },
      { tag: 'PDP', name: 'Pump Discharge Pressure', val: '2,950 psi', unit: '182 Pump Stages' },
      { tag: 'MOT-T', name: 'Motor Temperature', val: '198 °F', unit: 'Max Trip: 250°F' },
      { tag: 'INT-T', name: 'Intake Fluid Temp', val: '172 °F', unit: 'Reservoir Fluid' },
      { tag: 'FL-T', name: 'Flowline Temp', val: '112 °F', unit: 'Surface Flow' },
      { tag: 'BATT', name: 'RTU Battery Voltage', val: '24.2 V', unit: 'Solar Float DC' }
    ];

    gauges.forEach((g, idx) => {
      const col = idx % 5;
      const row = Math.floor(idx / 5);
      const x = 0.8 + col * 2.35;
      const y = 1.8 + row * 2.4;

      slide.addShape(pres.ShapeType.rect, {
        x: x,
        y: y,
        w: 2.15,
        h: 2.1,
        fill: { color: CARD_BG },
        line: { color: '334155', width: 1 }
      });

      slide.addText(g.tag, { x: x + 0.15, y: y + 0.15, w: 1.85, h: 0.3, fontSize: 12, bold: true, color: ACCENT_CYAN });
      slide.addText(g.name, { x: x + 0.15, y: y + 0.45, w: 1.85, h: 0.4, fontSize: 9, color: TEXT_MUTED });
      slide.addText(g.val, { x: x + 0.15, y: y + 0.95, w: 1.85, h: 0.5, fontSize: 18, bold: true, color: TEXT_WHITE });
      slide.addText(g.unit, { x: x + 0.15, y: y + 1.5, w: 1.85, h: 0.3, fontSize: 8, color: '64748B' });
    });

    slide.addNotes('SCADA Monitoring gives operators comprehensive visibility across the entire hydraulic circuit — from downhole intake and discharge to annulus casing pressures and surface flowline temperatures.');
  }

  // ==========================================
  // SLIDE 6: Digital Twin: Downhole Wellbore
  // ==========================================
  {
    const slide = createBaseSlide('Physics-Based Digital Twin: Downhole Wellbore', 'DIGITAL TWIN ARCHITECTURE');

    slide.addShape(pres.ShapeType.rect, {
      x: 0.8,
      y: 1.8,
      w: 6.8,
      h: 4.8,
      fill: { color: CARD_BG },
      line: { color: '334155', width: 1 }
    });

    slide.addText('DOWNHOLE ESP SCHEMATIC & PHYSICS SOLVER', {
      x: 1.1,
      y: 2.0,
      w: 6.2,
      h: 0.3,
      fontSize: 12,
      bold: true,
      color: ACCENT_CYAN
    });

    slide.addText([
      { text: '• Dynamic Wellbore Fluid Level: ', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Simulates fluid column drawdown as VFD frequency changes.\n\n', options: { color: TEXT_MUTED } },
      { text: '• Multi-Stage Mechanical String: ', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Phoenix Sensor Pod (11,480 ft) -> Submersible PMM Motor (240 HP) -> Protector/Seal Chamber -> Gas Separator -> Centrifugal Pump (182 stages) -> Discharge Head.\n\n', options: { color: TEXT_MUTED } },
      { text: '• Real-Time Nodal Pressure Callouts: ', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Overlay of measured PIP, PDP, and thermal gradient directly on downhole elements.\n\n', options: { color: TEXT_MUTED } },
      { text: '• Wear & Degradation Index: ', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Calculates cumulative sand erosion, bearing fatigue, and motor insulation loss.', options: { color: TEXT_MUTED } }
    ], { x: 1.1, y: 2.5, w: 6.2, h: 3.8, fontSize: 10.5 });

    // Right side callout box
    slide.addShape(pres.ShapeType.rect, {
      x: 7.9,
      y: 1.8,
      w: 4.5,
      h: 4.8,
      fill: { color: '131E33' },
      line: { color: '06B6D4', width: 1 }
    });

    slide.addText('DIGITAL TWIN SPECIFICATIONS', {
      x: 8.2,
      y: 2.0,
      w: 4.0,
      h: 0.3,
      fontSize: 12,
      bold: true,
      color: ACCENT_CYAN
    });

    slide.addText([
      { text: 'Well: ', options: { bold: true, color: TEXT_MUTED } },
      { text: 'Phantom State 104-2H\n', options: { bold: true, color: TEXT_WHITE } },
      { text: 'True Vertical Depth: ', options: { bold: true, color: TEXT_MUTED } },
      { text: '11,480 ft\n', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Motor Rating: ', options: { bold: true, color: TEXT_MUTED } },
      { text: '240 HP / 3,850 V / 52 A\n', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Pump Model: ', options: { bold: true, color: TEXT_MUTED } },
      { text: 'Baker Hughes Flex31 (182 stg)\n', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Cable String: ', options: { bold: true, color: TEXT_MUTED } },
      { text: 'Monel Armor #4 AWG Flat\n', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Affinity Law Solver: ', options: { bold: true, color: TEXT_MUTED } },
      { text: 'Head ~ (f/f0)², Q ~ (f/f0)\n', options: { color: ACCENT_EMERALD } },
      { text: 'Telemetry Sync: ', options: { bold: true, color: TEXT_MUTED } },
      { text: '100% Synchronous SCADA Link', options: { color: ACCENT_CYAN } }
    ], { x: 8.2, y: 2.4, w: 4.0, h: 4.0, fontSize: 11 });

    slide.addNotes('The Digital Twin is not just a static picture. It runs a live hydraulic solver that recalculates total dynamic head, motor thermal dissipation, and dynamic fluid level when the operator adjusts the VFD frequency trim slider.');
  }

  // ==========================================
  // SLIDE 7: Digital Twin: Surface Wellhead
  // ==========================================
  {
    const slide = createBaseSlide('Digital Twin: Surface Wellhead & Christmas Tree', 'SURFACE FACILITY SURVEILLANCE');

    slide.addShape(pres.ShapeType.rect, {
      x: 0.8,
      y: 1.8,
      w: 11.6,
      h: 4.8,
      fill: { color: CARD_BG },
      line: { color: '334155', width: 1 }
    });

    slide.addText('CHRISTMAS TREE & MANIFOLD INSTRUMENTATION', {
      x: 1.1,
      y: 2.1,
      w: 10.0,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: ACCENT_CYAN
    });

    const treePoints = [
      { title: 'Crown / Swab Valve', desc: 'Allows lubricator wireline access for acoustic fluid shots with pressure interlock verification.' },
      { title: 'Master Valves (Upper/Lower)', desc: 'Full-bore isolation of production tubing with emergency shutdown (ESD) actuator link.' },
      { title: 'Production Wing & Choke', desc: 'Adjustable bean choke calibrated to flowline pressure with orifice differential pressure tracking.' },
      { title: 'Annulus A & B Monitoring Ports', desc: 'Casing head pressure transmitters detecting packer leaks or annular fluid accumulation.' },
      { title: 'Flowline Pressure & Temp', desc: 'Downstream manifold sensors verifying uninhibited flow to central gathering battery.' }
    ];

    treePoints.forEach((p, idx) => {
      const y = 2.7 + idx * 0.75;
      slide.addText(`${idx + 1}. ${p.title}:`, {
        x: 1.1,
        y: y,
        w: 3.5,
        h: 0.35,
        fontSize: 11,
        bold: true,
        color: TEXT_WHITE
      });

      slide.addText(p.desc, {
        x: 4.8,
        y: y,
        w: 7.2,
        h: 0.5,
        fontSize: 11,
        color: TEXT_MUTED
      });
    });

    slide.addNotes('Operators can toggle seamlessly between the Downhole Wellbore and Surface Wellhead view. This allows surface operators to diagnose valve position anomalies or choke plugging alongside downhole pump conditions.');
  }

  // ==========================================
  // SLIDE 8: ESP & Pump Performance Analytics
  // ==========================================
  {
    const slide = createBaseSlide('ESP Performance Analytics: H-Q Curves & Sizing', 'HYDRAULIC ANALYTICS');

    slide.addShape(pres.ShapeType.rect, {
      x: 0.8,
      y: 1.8,
      w: 5.6,
      h: 4.8,
      fill: { color: CARD_BG },
      line: { color: '334155', width: 1 }
    });

    slide.addText('MULTI-FREQUENCY H-Q PUMP CURVES', {
      x: 1.1,
      y: 2.1,
      w: 5.0,
      h: 0.3,
      fontSize: 12,
      bold: true,
      color: ACCENT_CYAN
    });

    slide.addText([
      { text: '• Affinity Laws Modeling (35 Hz to 75 Hz):\n', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Curves dynamically model pump performance across the entire VFD operating envelope.\n\n', options: { color: TEXT_MUTED } },
      { text: '• Best Efficiency Point (BEP) Envelope:\n', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Clear green highlighted operating zone preventing both downthrust (<1,200 BPD) and upthrust (>2,800 BPD).\n\n', options: { color: TEXT_MUTED } },
      { text: '• Real-Time Operating Dot:\n', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Superimposes current measured BPD and head against the active frequency curve in real time.', options: { color: TEXT_MUTED } }
    ], { x: 1.1, y: 2.5, w: 5.0, h: 3.8, fontSize: 11 });

    slide.addShape(pres.ShapeType.rect, {
      x: 6.8,
      y: 1.8,
      w: 5.6,
      h: 4.8,
      fill: { color: CARD_BG },
      line: { color: '334155', width: 1 }
    });

    slide.addText('INTEGRATED ESP SIZING & IPR CALCULATOR', {
      x: 7.1,
      y: 2.1,
      w: 5.0,
      h: 0.3,
      fontSize: 12,
      bold: true,
      color: ACCENT_EMERALD
    });

    slide.addText([
      { text: '• Vogel IPR Inflow Drawdown:\n', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Calculates maximum potential flow rate (Qmax) and required bottomhole flowing pressure (Pwf).\n\n', options: { color: TEXT_MUTED } },
      { text: '• Engineering Sizing Request Form:\n', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Operators submit design rate (BPD), target TDH, casing clearance, and fluid PVT properties.\n\n', options: { color: TEXT_MUTED } },
      { text: '• Automated Bill of Materials (BOM):\n', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Generates equipment requisition strings for Baker Hughes, ChampionX, SLB, and Valiant hardware.', options: { color: TEXT_MUTED } }
    ], { x: 7.1, y: 2.5, w: 5.0, h: 3.8, fontSize: 11 });

    slide.addNotes('Our ESP Performance module features interactive multi-frequency H-Q curves that update live. Engineers can evaluate whether an ESP is operating near its Best Efficiency Point or entering dangerous upthrust/downthrust conditions.');
  }

  // ==========================================
  // SLIDE 9: Root Cause Failure Analysis
  // ==========================================
  {
    const slide = createBaseSlide('Reliability Intelligence & Failure Pareto Analysis', 'ROOT CAUSE ANALYSIS (RCFA)');

    slide.addShape(pres.ShapeType.rect, {
      x: 0.8,
      y: 1.8,
      w: 11.6,
      h: 4.8,
      fill: { color: CARD_BG },
      line: { color: '334155', width: 1 }
    });

    slide.addText('PARETO DISTRIBUTION & FLEET MTBF BENCHMARKS', {
      x: 1.1,
      y: 2.1,
      w: 10.0,
      h: 0.3,
      fontSize: 13,
      bold: true,
      color: ACCENT_CYAN
    });

    const causes = [
      { rank: '1', cause: 'Gas Locking / Gas Slugging', pct: '31%', action: 'Vortex gas separator optimization & intake pressure setpoint trim' },
      { rank: '2', cause: 'Sand & Solids Erosion', pct: '24%', action: 'SandGuard protector and ceramic radial bearings installed' },
      { rank: '3', cause: 'Electrical / MLE Breakdown', pct: '19%', action: 'Cable shop Hi-Pot inspection and Monel heavy armor deployment' },
      { rank: '4', cause: 'Scale / Paraffin Deposition', pct: '14%', action: 'Continuous capillary chemical injection and periodic solvent wash' },
      { rank: '5', cause: 'Mechanical Bearing Fatigue', pct: '7%', action: 'Real-time vibration FFT threshold trip protection (<0.50 G)' }
    ];

    causes.forEach((c, idx) => {
      const y = 2.6 + idx * 0.75;
      slide.addText(`#${c.rank}`, { x: 1.1, y: y, w: 0.6, h: 0.35, fontSize: 14, bold: true, color: ACCENT_CYAN });
      slide.addText(c.cause, { x: 1.8, y: y, w: 3.5, h: 0.35, fontSize: 11, bold: true, color: TEXT_WHITE });
      slide.addText(c.pct, { x: 5.5, y: y, w: 1.0, h: 0.35, fontSize: 12, bold: true, color: ACCENT_EMERALD });
      slide.addText(c.action, { x: 6.7, y: y, w: 5.3, h: 0.5, fontSize: 10.5, color: TEXT_MUTED });
    });

    slide.addNotes('With ALS, operators stop guessing why equipment fails. The failure analytics engine tracks run-days, MTBF distributions, and manufacturer-specific failure rates across Baker Hughes, ChampionX, SLB, and Valiant.');
  }

  // ==========================================
  // SLIDE 10: 8-Stage Cable Shop Workflow
  // ==========================================
  {
    const slide = createBaseSlide('Closed-Loop Cable Shop 8-Stage Workflow', 'ASSET REPAIR & LIFECYCLE');

    const stages = [
      { step: 1, name: 'Equipment Selection', desc: 'Cable reel and MLE pulled from well' },
      { step: 2, name: 'Cable Test', desc: 'DC Hi-Pot 15kV & insulation megohmmeter' },
      { step: 3, name: 'Preparation', desc: 'Cut damaged sections, armor dressing' },
      { step: 4, name: 'Spliced Test', desc: 'Verify vulcanized splice under load' },
      { step: 5, name: 'Shipment Prep', desc: 'Banded to spool, weather shrink wrap' },
      { step: 6, name: 'Shipped', desc: 'Dispatched on flatbed truck to pad' },
      { step: 7, name: 'Warehouse', desc: 'Receival receipt & yard inventory log' },
      { step: 8, name: 'Invoicing', desc: 'Automated invoice generation & sign-off' }
    ];

    stages.forEach((s, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const x = 0.8 + col * 2.95;
      const y = 1.8 + row * 2.4;

      slide.addShape(pres.ShapeType.rect, {
        x: x,
        y: y,
        w: 2.75,
        h: 2.1,
        fill: { color: CARD_BG },
        line: { color: '334155', width: 1 }
      });

      slide.addText(`STAGE 0${s.step}`, { x: x + 0.15, y: y + 0.15, w: 2.4, h: 0.25, fontSize: 9, bold: true, color: ACCENT_CYAN });
      slide.addText(s.name, { x: x + 0.15, y: y + 0.45, w: 2.4, h: 0.45, fontSize: 12, bold: true, color: TEXT_WHITE });
      slide.addText(s.desc, { x: x + 0.15, y: y + 1.0, w: 2.4, h: 0.9, fontSize: 10, color: TEXT_MUTED });
    });

    slide.addNotes('Cable failures represent the single most expensive replacement cost in artificial lift operations. Our 8-stage Cable Shop tracking module establishes strict chain-of-custody and quality assurance from spool extraction to final invoice.');
  }

  // ==========================================
  // SLIDE 11: Fleet Logistics & Vehicle Tracking
  // ==========================================
  {
    const slide = createBaseSlide('Field Fleet Logistics & Route Replay', 'FIELD SERVICE MANAGEMENT');

    slide.addShape(pres.ShapeType.rect, {
      x: 0.8,
      y: 1.8,
      w: 11.6,
      h: 4.8,
      fill: { color: CARD_BG },
      line: { color: '334155', width: 1 }
    });

    slide.addText('REAL-TIME TELEMATICS, WORK ORDERS & FUEL AUDITING', {
      x: 1.1,
      y: 2.1,
      w: 10.0,
      h: 0.3,
      fontSize: 13,
      bold: true,
      color: ACCENT_CYAN
    });

    const fleetItems = [
      { title: 'Interactive GPS Basin Map', desc: 'Live truck tracking with speed, ETA, and distance to destination well pad.' },
      { title: 'Route Replay Simulation', desc: 'Timeline playback of historical service calls with idle-time tracking and geo-fencing.' },
      { title: 'Driver HOS & Fatigue Compliance', desc: 'DOT Hours-of-Service monitoring with automatic shift limit alerts and break scheduling.' },
      { title: 'Fuel Transaction & Anomaly Audits', desc: 'Detects tank capacity exceedances and off-route fuel card purchases in real time.' },
      { title: 'Work Order Auto-Dispatch', desc: 'Automatically matches the nearest available crew truck to high-severity well alarms.' }
    ];

    fleetItems.forEach((f, idx) => {
      const y = 2.6 + idx * 0.75;
      slide.addText(`• ${f.title}:`, { x: 1.1, y: y, w: 3.5, h: 0.35, fontSize: 11, bold: true, color: TEXT_WHITE });
      slide.addText(f.desc, { x: 4.8, y: y, w: 7.2, h: 0.5, fontSize: 11, color: TEXT_MUTED });
    });

    slide.addNotes('Fleet Logistics ties surface response directly to well health. When a critical trip occurs on a well, the platform immediately identifies the closest qualified maintenance truck and issues a route-optimized work order.');
  }

  // ==========================================
  // SLIDE 12: Next Steps & Implementation Roadmap
  // ==========================================
  {
    const slide = createBaseSlide('Operational Impact & Implementation Roadmap', 'ENTERPRISE VALUE & DEPLOYMENT');

    const pillars = [
      { title: 'Phase 1: Pilot Deployment (Weeks 1-4)', desc: 'Connect 20 pilot wells via Modbus/OPC-UA edge gateway to ALS cloud platform.', col: ACCENT_CYAN },
      { title: 'Phase 2: Digital Twin Tuning (Weeks 5-8)', desc: 'Calibrate downhole inflow performance and motor thermal curves using historical pull data.', col: ACCENT_EMERALD },
      { title: 'Phase 3: Closed-Loop Automation (Weeks 9-12)', desc: 'Activate autonomous VFD frequency trim rules and automated cable shop lifecycle.', col: ACCENT_AMBER }
    ];

    pillars.forEach((p, idx) => {
      const x = 0.8 + idx * 3.9;
      slide.addShape(pres.ShapeType.rect, {
        x: x,
        y: 1.8,
        w: 3.6,
        h: 4.6,
        fill: { color: CARD_BG },
        line: { color: '334155', width: 1 }
      });

      slide.addText(p.title, { x: x + 0.3, y: 2.1, w: 3.0, h: 0.8, fontSize: 14, bold: true, color: p.col });
      slide.addText(p.desc, { x: x + 0.3, y: 3.0, w: 3.0, h: 3.0, fontSize: 11, color: TEXT_MUTED });
    });

    slide.addNotes('Thank you for your time. In summary, ALS Enterprise delivers a unified, production-ready surveillance cockpit that empowers operators, reduces well downtime, and prolongs artificial lift run-life. We welcome your questions.');
  }

  const outDir = path.resolve('public/assets');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outputPath = path.join(outDir, 'ALS_Enterprise_Client_Presentation.pptx');
  await pres.writeFile({ fileName: outputPath });
  console.log(`Presentation generated successfully at: ${outputPath}`);
}

generatePresentation().catch(err => {
  console.error('Error generating presentation:', err);
  process.exit(1);
});
