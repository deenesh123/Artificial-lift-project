import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = '0.0.0.0';

app.use(express.json({ limit: '10mb' }));

// Helper to sanitize and check API key
function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== ''
    ? process.env.GEMINI_API_KEY.trim()
    : undefined;
}

// Status endpoint
app.get('/api/assistant/status', (_req, res) => {
  const apiKey = getGeminiApiKey();
  res.json({
    configured: Boolean(apiKey),
    hasKey: Boolean(apiKey),
    model: 'gemini-3.8-flash',
    provider: apiKey ? 'gemini' : 'local_demo',
    status: apiKey ? 'ready' : 'demo_mode_only',
    message: apiKey 
      ? 'Gemini 3.8 Flash model operational via server endpoint.'
      : 'GEMINI_API_KEY environment variable is not configured. Local Demo Assistant active.',
  });
});

// Chat endpoint
app.post('/api/assistant/chat', async (req, res) => {
  try {
    const { messages, context, userRole } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const latestMessage = messages[messages.length - 1]?.content || '';
    const apiKey = getGeminiApiKey();

    // If Gemini API is configured, use @google/genai SDK
    if (apiKey) {
      try {
        const ai = new GoogleGenAI(); // automatically reads process.env.GEMINI_API_KEY

        const systemPrompt = `You are the ALS Operations AI Assistant, an intelligent industrial artificial lift and energy operations advisor.
You are embedded inside ALS (Artificial Lift Suite), an enterprise platform monitoring oil and gas production, ESP systems, rod pumps, SCADA telemetry, cable shop operations, workflows, failure analysis, and fleet logistics.

SYSTEM RULES:
1. Persona: Professional, concise, engineering-focused industrial operations assistant.
2. Grounded Data: Answer questions using the provided ALS operational context snapshot below. Never invent asset IDs, equipment codes, or sensor numbers that are not in the context.
3. Simulation Notice: All data in this application is synthetic demonstration data. When providing numbers, state facts clearly and acknowledge telemetry is simulated.
4. Security & Safety: You cannot directly close alarms, delete records, or change equipment setpoints. When asked to perform actions, prepare a draft proposal and instruct the operator to review and confirm.
5. Navigation & Actions: When relevant, suggest structured navigation actions so the operator can jump to the exact module or focus on a specific well.
To suggest actions, place a JSON array at the very end of your response inside a tagged markdown block:
\`\`\`actions
[
  {
    "type": "navigate",
    "route": "scada-user",
    "assetId": "ALS-DEL-ESP-104",
    "label": "Open SCADA Dashboard for ALS-DEL-ESP-104",
    "description": "View live intake/discharge pressure and motor frequency"
  }
]
\`\`\`
Supported routes for "navigate":
- "operations" (Operations Dashboard)
- "asset-monitoring-user" (Asset Registry)
- "scada-user" (SCADA Dashboard & Gauge Telemetry)
- "devices-user" (Device Monitoring)
- "digital-twin-user" (Digital Twin Nodal Analysis)
- "esp-user" (ESP Performance & Pressure Gradients)
- "pump-user" (Pump Performance & Dynamometer Cards)
- "alarms-user" (Alarm Center)
- "events-user" (Event Center)
- "workflows-user" (Job Workflows)
- "failure-monitoring-user" (Failure Monitoring)
- "cable-shop-user" (Cable Shop 8-Stage QA)
- "fleet-user" (Fleet & Vehicle Tracking)
- "reports-user" (Reports & Analytics)

Supported action type for draft jobs:
\`\`\`actions
[
  {
    "type": "draft_job",
    "jobData": {
      "title": "Investigate High Downhole Motor Temperature",
      "wellId": "ALS-DEL-ESP-082",
      "type": "ESP Pull & Workover",
      "priority": "High",
      "assignedCrew": "Midland Crew Alpha"
    },
    "label": "Review Draft Maintenance Job",
    "description": "Requires explicit operator confirmation before dispatching"
  }
]
\`\`\`

CURRENT ALS OPERATIONAL CONTEXT SNAPSHOT:
${context ? JSON.stringify(context, null, 2) : 'No context provided. Use default ALS knowledge.'}

OPERATOR ROLE: ${userRole || 'Field Engineer'}
`;

        // Format conversation history for Gemini
        const contents = messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }));

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.2,
          }
        });

        const rawText = response.text || '';
        
        // Parse actions if present
        let cleanText = rawText;
        let actions: any[] = [];

        const actionMatch = rawText.match(/```actions\s*([\s\S]*?)\s*```/);
        if (actionMatch) {
          try {
            actions = JSON.parse(actionMatch[1]);
            cleanText = rawText.replace(/```actions\s*[\s\S]*?\s*```/, '').trim();
          } catch (e) {
            console.warn('Failed to parse actions block from Gemini response:', e);
          }
        }

        return res.json({
          text: cleanText,
          actions,
          provider: 'gemini',
          model: 'gemini-3.8-flash',
          disclaimer: 'DEMO SIMULATED DATA — Telemetry is synthesized for demonstration purposes and is not connected to physical live assets.',
        });

      } catch (geminiError: any) {
        console.error('Gemini API call failed, falling back to local demo assistant:', geminiError?.message || geminiError);
        
        // Generate rule-based response with notice
        const fallback = generateLocalDemoResponse(latestMessage, context);
        return res.json({
          text: `> ⚠️ **Gemini API Notice**: API request encountered an error (${geminiError?.message || 'Quota/Network error'}). Switched to **Local Demo Assistant** using live application dataset.\n\n${fallback.text}`,
          actions: fallback.actions,
          provider: 'local_demo',
          fallbackReason: geminiError?.message || 'Gemini API Error',
          disclaimer: 'DEMO LOCAL ASSISTANT (SYNTHETIC DATA) — Operating in local rule-based simulation mode.',
        });
      }
    }

    // If Gemini is not configured, use local demo assistant
    const demoResponse = generateLocalDemoResponse(latestMessage, context);
    return res.json({
      text: demoResponse.text,
      actions: demoResponse.actions,
      provider: 'local_demo',
      disclaimer: 'DEMO LOCAL ASSISTANT (SYNTHETIC DATA) — Gemini API key not configured. Operating in local rule-based simulation mode.',
    });

  } catch (error: any) {
    console.error('Error in /api/assistant/chat:', error);
    res.status(500).json({ 
      error: 'Internal server error while processing assistant query.',
      details: error?.message 
    });
  }
});

// Rule-based fallback assistant when Gemini API key is not configured or fails
function generateLocalDemoResponse(query: string, context: any): { text: string; actions: any[] } {
  const q = (query || '').toLowerCase().trim();
  const wells = context?.wells || [];
  const alarms = context?.alarms || [];
  const jobs = context?.jobs || [];
  const cableItems = context?.cableItems || [];
  const fleet = context?.fleet || [];
  const selectedWell = context?.selectedWell;

  // 1. Down wells query
  if (q.includes('down') || q.includes('offline') || q.includes('stopped') || q.includes('trip')) {
    const downWells = wells.filter((w: any) => w.status === 'Critical' || w.status === 'Offline');
    const warningWells = wells.filter((w: any) => w.status === 'Warning');

    let text = `### 🚨 Down & Offline Assets Report\n\n`;
    if (downWells.length === 0) {
      text += `Currently, **0 wells** are fully offline or locked out in the monitored field. However, **${warningWells.length} wells** have elevated warning parameters requiring active engineering surveillance.\n\n`;
    } else {
      text += `**${downWells.length} well(s)** are currently in critical or tripped state:\n\n`;
      downWells.forEach((w: any) => {
        text += `- **${w.wellCode || w.id} (${w.name})** — Status: \`${w.status}\` | Lift: ${w.liftType} | Pad: ${w.padName}\n`;
        text += `  - Casing Pressure: ${w.intakePressurePsi || 0} psi | BOPD: ${w.currentBopd || 0} BPD | Run Life: ${w.runLifeDays || 0} days\n`;
      });
    }

    if (warningWells.length > 0) {
      text += `\n**Warning Assets (${warningWells.length}):**\n`;
      warningWells.forEach((w: any) => {
        text += `- **${w.wellCode || w.id} (${w.name})** — Motor Temp: ${w.motorTempF || 'N/A'}°F | Vibration: ${w.vibrationG || 'N/A'}g\n`;
      });
    }

    const firstCritical = downWells[0] || warningWells[0];
    const actions = firstCritical ? [
      {
        type: 'navigate',
        route: 'alarms-user',
        assetId: firstCritical.id,
        label: `View Alarms for ${firstCritical.wellCode || firstCritical.id}`,
        description: 'Examine active trip root causes and sensor thresholds',
      },
      {
        type: 'navigate',
        route: 'scada-user',
        assetId: firstCritical.id,
        label: `Open SCADA for ${firstCritical.wellCode || firstCritical.id}`,
        description: 'Check high-speed intake pressure and VFD frequency',
      }
    ] : [];

    return { text, actions };
  }

  // 2. Alarms query
  if (q.includes('alarm') || q.includes('alert') || q.includes('warning')) {
    const activeAlarms = alarms.filter((a: any) => !a.acknowledged && a.resolutionStatus !== 'Resolved');
    let text = `### ⚠️ Active Unacknowledged Alarms (${activeAlarms.length})\n\n`;

    if (activeAlarms.length === 0) {
      text += `All current alarms have been acknowledged or resolved. Total historical alarms tracked: **${alarms.length}**.\n`;
    } else {
      text += `| Alarm ID | Well / Asset | Severity | Parameter | Current Reading | Setpoint Limit |\n`;
      text += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
      activeAlarms.slice(0, 5).forEach((a: any) => {
        text += `| \`${a.id}\` | **${a.wellName || a.wellId}** | \`${a.severity}\` | ${a.parameter} | **${a.currentValue}** | ${a.setpointLimit} |\n`;
      });
      text += `\n*Top operational concern:* **${activeAlarms[0]?.title}** on ${activeAlarms[0]?.wellName}.\n`;
    }

    const actions = [
      {
        type: 'navigate',
        route: 'alarms-user',
        label: 'Open Alarm Center',
        description: 'Acknowledge, annotate, or escalate active field alarms',
      }
    ];

    return { text, actions };
  }

  // 3. Specific well query: ALS-DEL-ESP-104 or selected well
  if (q.includes('104') || (selectedWell && (q.includes('this well') || q.includes('selected well')))) {
    const target = wells.find((w: any) => w.id === 'ALS-DEL-ESP-104' || w.wellCode === 'DEMO-WELL-001') || selectedWell || wells[0];
    
    let text = `### 📊 Telemetry Status: ${target?.name} (\`${target?.id}\`)\n\n`;
    text += `- **Operating Status**: \`${target?.status}\` (${target?.liftType})\n`;
    text += `- **Pad Location**: ${target?.padName} (${target?.basin} — ${target?.field})\n`;
    text += `- **Gross Fluid Rate**: **${target?.grossFluidBpd?.toLocaleString() || '2,450'} BPD** | Oil: **${target?.currentBopd || '985'} BOPD**\n`;
    text += `- **Water Cut**: **${target?.waterCutPct || '59.8'}%** | Gas: **${target?.gasMcfd || '1,420'} Mcfd**\n`;
    text += `- **Intake Pressure**: **${target?.intakePressurePsi || 840} psi** | Discharge: **${target?.dischargePressurePsi || 2950} psi**\n`;
    text += `- **Downhole Motor Temp**: **${target?.motorTempF || 198}°F** (Nominal limit < 225°F)\n`;
    text += `- **VFD Frequency**: **${target?.vfdFrequencyHz || 58.5} Hz** | Current: **${target?.motorCurrentA || 52.4} A**\n`;
    text += `- **ESP Run Life**: **${target?.runLifeDays || 412} days** | Health Score: **${target?.healthScore || 94}/100**\n\n`;
    text += `*Engineering Assessment:* Equipment is operating within target nodal draw-down parameters with stable motor winding temperatures.`;

    const actions = [
      {
        type: 'navigate',
        route: 'scada-user',
        assetId: target?.id,
        label: `Open SCADA Gauges for ${target?.wellCode || target?.id}`,
        description: 'View real-time gauge telemetry and VFD speed control',
      },
      {
        type: 'navigate',
        route: 'esp-user',
        assetId: target?.id,
        label: `Inspect ESP Pressure Gradient for ${target?.wellCode || target?.id}`,
        description: 'Review true vertical depth pressure profiles (0 to 11,450 ft TVD)',
      },
      {
        type: 'navigate',
        route: 'digital-twin-user',
        assetId: target?.id,
        label: `Open Physics Digital Twin for ${target?.wellCode || target?.id}`,
        description: 'Examine inflow performance relationship (IPR) and operating point',
      }
    ];

    return { text, actions };
  }

  // 4. Elevated motor temperatures
  if (q.includes('temperature') || q.includes('temp') || q.includes('heat') || q.includes('winding')) {
    const elevated = wells.filter((w: any) => (w.motorTempF || 0) > 215);

    let text = `### 🌡️ Elevated Motor Temperature Surveillance\n\n`;
    if (elevated.length === 0) {
      text += `All monitored ESP downhole motor temperatures are currently below the standard 215°F threshold.\n`;
    } else {
      text += `Detected **${elevated.length} ESP asset(s)** with elevated motor internal RTD readings:\n\n`;
      elevated.forEach((w: any) => {
        text += `- **${w.wellCode || w.id} (${w.name})**: **${w.motorTempF}°F** (Warning threshold: 225°F / Trip: 250°F)\n`;
        text += `  - Frequency: ${w.vfdFrequencyHz} Hz | Motor Current: ${w.motorCurrentA} A | Status: \`${w.status}\`\n`;
      });
      text += `\n*Recommendation:* Review VFD frequency setpoints to evaluate electrical load shedding or scale inhibitor injection.\n`;
    }

    const actions = elevated.length > 0 ? [
      {
        type: 'navigate',
        route: 'esp-user',
        assetId: elevated[0].id,
        label: `Inspect ESP Thermal Profile (${elevated[0].wellCode || elevated[0].id})`,
        description: 'View motor thermal response vs frequency',
      },
      {
        type: 'draft_job',
        jobData: {
          title: `Thermal Investigation & Chemical Flush - ${elevated[0].name}`,
          wellId: elevated[0].id,
          type: 'Preventive Maintenance',
          priority: 'High',
          assignedCrew: 'Midland Crew Alpha'
        },
        label: `Draft PM Job for ${elevated[0].wellCode || elevated[0].id}`,
        description: 'Create draft maintenance job for operator review',
      }
    ] : [];

    return { text, actions };
  }

  // 5. Cable shop query
  if (q.includes('cable') || q.includes('spool') || q.includes('splice') || q.includes('reel')) {
    let text = `### 🧵 Cable Shop 8-Stage QA Workflow Status\n\n`;
    text += `Currently tracking **${cableItems.length || 6} cable reels** across the 8-stage repair and qualification pipeline:\n\n`;
    
    cableItems.slice(0, 4).forEach((c: any) => {
      text += `- **Reel ${c.reelId}** (\`${c.cableType || 'Lead Flat #4'}\` - ${c.lengthFt || 4500} ft): Currently in **Stage ${c.currentStage || 3}/8 (${c.status || 'In Progress'})** for well **${c.assignedWell || 'Stock'}**\n`;
    });
    text += `\nAll reels must pass Hi-Pot dielectric test (> 25 kV DC) and conductor armor inspection prior to spooling dispatch.`;

    const actions = [
      {
        type: 'navigate',
        route: 'cable-shop-user',
        label: 'Open Cable Shop 8-Stage Pipeline',
        description: 'View staging, test certificates, and reel assignments',
      }
    ];

    return { text, actions };
  }

  // 6. Fleet query
  if (q.includes('fleet') || q.includes('truck') || q.includes('vehicle') || q.includes('logistics')) {
    let text = `### 🚚 Field Vehicle & Fleet Logistics Summary\n\n`;
    text += `- **Active Fleet Units**: **${fleet.length || 8} service vehicles** monitored via GPS telematics\n`;
    text += `- **Field Staging Hub**: Pecos Staging Hub & Midland Yard\n`;
    text += `- **Operational Dispatch**: Slickline Unit (SL-04), ESP Spooling Rig (SR-02), and Chemical Unit actively en route\n`;
    text += `- **Fleet Health & Fuel**: Average fuel reserve: **76%** | Zero vehicle fault codes detected\n`;

    const actions = [
      {
        type: 'navigate',
        route: 'fleet-user',
        label: 'Open Fleet Tracking View',
        description: 'View real-time vehicle map, driver status, and dispatch routes',
      }
    ];

    return { text, actions };
  }

  // 7. Workflows / Jobs query
  if (q.includes('job') || q.includes('work') || q.includes('maintenance') || q.includes('crew')) {
    const openJobs = jobs.filter((j: any) => j.stage !== 'Completed & Closed' && j.stage !== 'Cancelled / Deferred');
    let text = `### 📋 Maintenance & Work Order Workflows\n\n`;
    text += `Currently **${openJobs.length} active jobs** in the field execution pipeline:\n\n`;

    openJobs.slice(0, 4).forEach((j: any) => {
      text += `- **${j.id}** [${j.priority}] — **${j.title}** (${j.wellName || j.wellId})\n`;
      text += `  - Stage: \`${j.stage}\` | Crew: ${j.assignedCrew || 'Unassigned'} | Scheduled: ${j.scheduledStartDate || 'Today'}\n`;
    });

    const actions = [
      {
        type: 'navigate',
        route: 'workflows-user',
        label: 'Open Job Workflows',
        description: 'Manage work orders, crew dispatches, and step-by-step checklists',
      }
    ];

    return { text, actions };
  }

  // 8. General production summary / 24h summary
  const totalBopd = wells.reduce((acc: number, w: any) => acc + (w.currentBopd || 0), 0);
  const avgHealth = Math.round(wells.reduce((acc: number, w: any) => acc + (w.healthScore || 90), 0) / (wells.length || 1));

  let text = `### 🌐 ALS 24-Hour Operations Summary\n\n`;
  text += `- **Monitored Assets**: **${wells.length || 20} wells** across Permian, Delaware, and Eagle Ford Basins\n`;
  text += `- **Total Field Production**: **${totalBopd.toLocaleString() || '14,250'} BOPD**\n`;
  text += `- **Mean Asset Health Index**: **${avgHealth}%**\n`;
  text += `- **Unacknowledged Alarms**: **${alarms.filter((a: any) => !a.acknowledged).length} active items**\n`;
  text += `- **Cable Shop QA Pipeline**: **${cableItems.length || 6} reels** in qualification\n\n`;
  text += `Select any suggested query below or ask about specific equipment (e.g. \`ALS-DEL-ESP-104\`, motor temperatures, or active alarms).`;

  const actions = [
    {
      type: 'navigate',
      route: 'operations',
      label: 'Open Operations Dashboard',
      description: 'View field KPI summary and 24-hour production trends',
    },
    {
      type: 'navigate',
      route: 'alarms-user',
      label: 'Review Active Alarms',
      description: 'Check priority items requiring operator attention',
    }
  ];

  return { text, actions };
}

// Dev server with Vite middleware or static serving in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`[ALS Server] Running on http://${HOST}:${PORT}`);
    console.log(`[ALS Server] Gemini API Status: ${getGeminiApiKey() ? 'CONFIGURED (gemini-3.8-flash)' : 'LOCAL DEMO MODE (KEY MISSING)'}`);
  });
}

startServer().catch((err) => {
  console.error('[ALS Server] Failed to initialize:', err);
  process.exit(1);
});
