import { StorageService } from './storageService';
import { OperationsService } from './operationsService';
import { FleetService } from './fleetService';
import { 
  WellAsset, 
  AlarmItem, 
  WorkOrderJob, 
  CableShopItem, 
  FleetVehicle, 
  UserProfile, 
  JobWorkflowStage, 
  JobWorkflowType,
  FailureIncident 
} from '../types';

export interface AssistantAction {
  type: 'navigate' | 'draft_job' | 'draft_work_order';
  route?: string;
  assetId?: string;
  label: string;
  description?: string;
  payload?: any;
  jobData?: {
    title: string;
    wellId: string;
    type: JobWorkflowType;
    priority: 'Immediate' | 'High' | 'Normal' | 'Scheduled';
    assignedCrew?: string;
    description?: string;
  };
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: AssistantAction[];
  provider?: 'gemini' | 'local_demo';
  disclaimer?: string;
  isError?: boolean;
}

export interface AssistantStatus {
  configured: boolean;
  hasKey: boolean;
  model: string;
  provider: 'gemini' | 'local_demo';
  status: string;
  message: string;
}

export class AiAssistantService {
  /**
   * Check Gemini API connectivity and configuration via server endpoint
   */
  static async checkStatus(): Promise<AssistantStatus> {
    try {
      const res = await fetch('/api/assistant/status');
      if (res.ok) {
        return await res.json();
      }
      throw new Error(`Status check returned ${res.status}`);
    } catch (err: any) {
      console.warn('Backend /api/assistant/status unreachable, assuming local demo mode:', err);
      return {
        configured: false,
        hasKey: false,
        model: 'local-rule-engine',
        provider: 'local_demo',
        status: 'demo_fallback',
        message: 'Backend server endpoint not reachable. Local Demo Assistant active.',
      };
    }
  }

  /**
   * Build a lightweight snapshot of live ALS data to ground the assistant
   */
  static getLiveContextSnapshot(selectedAssetId: string | null = null) {
    const wells = StorageService.getWells();
    const alarms = OperationsService.getAlarms();
    const jobs = OperationsService.getJobs();
    const events = OperationsService.getEvents();
    const failures = OperationsService.getFailures();
    const cableItems = StorageService.getCableShopItems();
    const fleet = FleetService.getVehicles();

    const selectedWell = selectedAssetId 
      ? wells.find(w => w.id === selectedAssetId || w.wellCode === selectedAssetId) || null
      : null;

    return {
      selectedWell: selectedWell ? {
        id: selectedWell.id,
        wellCode: selectedWell.wellCode,
        name: selectedWell.name,
        padName: selectedWell.padName,
        basin: selectedWell.basin,
        field: selectedWell.field,
        liftType: selectedWell.liftType,
        status: selectedWell.status,
        bopd: selectedWell.currentBopd,
        grossFluidBpd: selectedWell.grossFluidBpd,
        waterCutPct: selectedWell.waterCutPct,
        intakePressurePsi: selectedWell.intakePressurePsi,
        dischargePressurePsi: selectedWell.dischargePressurePsi,
        motorTempF: selectedWell.motorTempF,
        vfdFrequencyHz: selectedWell.vfdFrequencyHz,
        motorCurrentA: selectedWell.motorCurrentA,
        vibrationG: selectedWell.vibrationG,
        runLifeDays: selectedWell.runLifeDays,
        healthScore: selectedWell.healthScore,
      } : null,
      wellsSummary: {
        totalWells: wells.length,
        nominalCount: wells.filter(w => w.status === 'Nominal').length,
        warningCount: wells.filter(w => w.status === 'Warning').length,
        criticalCount: wells.filter(w => w.status === 'Critical' || w.status === 'Offline').length,
        totalBopd: wells.reduce((sum, w) => sum + (w.currentBopd || 0), 0),
        wellsList: wells.map(w => ({
          id: w.id,
          code: w.wellCode,
          name: w.name,
          pad: w.padName,
          lift: w.liftType,
          status: w.status,
          bopd: w.currentBopd,
          intakePsi: w.intakePressurePsi,
          tempF: w.motorTempF,
          vfdHz: w.vfdFrequencyHz,
        })),
      },
      alarmsSummary: {
        total: alarms.length,
        unacknowledged: alarms.filter(a => !a.acknowledged && a.resolutionStatus !== 'Resolved').length,
        activeList: alarms.slice(0, 8).map(a => ({
          id: a.id,
          wellId: a.wellId,
          wellName: a.wellName,
          severity: a.severity,
          title: a.title,
          currentValue: a.currentValue,
          limit: a.setpointLimit,
          acknowledged: a.acknowledged,
        })),
      },
      jobsSummary: {
        total: jobs.length,
        active: jobs.filter(j => j.stage !== 'Completed & Closed' && j.stage !== 'Cancelled / Deferred').length,
        recent: jobs.slice(0, 5).map(j => ({
          id: j.id,
          title: j.title,
          wellId: j.wellId,
          wellName: j.wellName,
          stage: j.stage,
          priority: j.priority,
          crew: j.assignedCrew,
        })),
      },
      cableShopSummary: {
        totalReels: cableItems.length,
        activeReels: cableItems.slice(0, 4).map(c => ({
          id: c.id,
          partName: c.partName,
          reelNumber: c.spooledToReelNumber,
          lengthFt: c.totalShippingLengthFt,
          stage: c.stage,
          classification: c.classification,
          assignedWell: c.wellName || c.wellId || 'Inventory',
        })),
      },
      fleetSummary: {
        totalVehicles: fleet.length,
        activeVehicles: fleet.slice(0, 4).map(f => ({
          id: f.id,
          name: f.name,
          type: f.type,
          driver: f.driver,
          status: f.status,
          fuelPct: f.fuelPct,
          assignedWellName: f.assignedWellName,
        })),
      },
      failuresSummary: {
        total: failures.length,
        recent: failures.slice(0, 3).map(f => ({
          id: f.id,
          wellId: f.wellId,
          component: f.failedComponent,
          rootCauseCategory: f.rootCauseCategory,
          findings: f.rootCauseFindings,
          mtbfDays: f.runLifeDays,
        })),
      },
    };
  }

  /**
   * Send a chat message to the server-side assistant API
   */
  static async sendMessage(
    messages: { role: 'user' | 'assistant'; content: string }[],
    selectedAssetId: string | null = null,
    currentUser?: UserProfile
  ): Promise<{
    text: string;
    actions: AssistantAction[];
    provider: 'gemini' | 'local_demo';
    disclaimer: string;
    fallbackReason?: string;
  }> {
    const context = this.getLiveContextSnapshot(selectedAssetId);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          context,
          userRole: currentUser?.roleTitle || 'Senior Field Engineer',
        }),
      });

      if (!res.ok) {
        throw new Error(`API responded with HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err: any) {
      console.warn('Failed to call /api/assistant/chat, using client-side rule fallback:', err);
      // Fallback locally
      const latest = messages[messages.length - 1]?.content || '';
      return this.generateClientFallback(latest, context);
    }
  }

  /**
   * In-browser rule-based fallback if backend is unreachable
   */
  private static generateClientFallback(query: string, context: any) {
    const q = query.toLowerCase();
    const wells = context.wellsSummary.wellsList;

    let text = `> ℹ️ **Local Demo Assistant (Client Fallback)**: Operating in synthetic rule-based mode.\n\n`;

    if (q.includes('down') || q.includes('trip') || q.includes('critical')) {
      const down = wells.filter((w: any) => w.status === 'Critical' || w.status === 'Warning');
      text += `Currently **${down.length} well(s)** require immediate attention:\n\n`;
      down.forEach((w: any) => {
        text += `- **${w.code || w.id} (${w.name})**: Status \`${w.status}\` | Intake: ${w.intakePsi} psi | Temp: ${w.tempF}°F\n`;
      });
      return {
        text,
        actions: [
          {
            type: 'navigate' as const,
            route: 'alarms-user',
            label: 'Review Active Alarms',
            description: 'Check threshold breaches and diagnostic logs',
          }
        ],
        provider: 'local_demo' as const,
        disclaimer: 'DEMO LOCAL ASSISTANT (SYNTHETIC DATA) — Operating in local rule-based simulation mode.',
      };
    }

    text += `### Monitored Production Overview\n`;
    text += `- Monitored Assets: **${context.wellsSummary.totalWells} wells**\n`;
    text += `- Field Gross Production: **${context.wellsSummary.totalBopd.toLocaleString()} BOPD**\n`;
    text += `- Unacknowledged Alarms: **${context.alarmsSummary.unacknowledged} items**\n`;
    text += `- Cable Shop Active Reels: **${context.cableShopSummary.totalReels} reels**\n\n`;
    text += `Ask about down wells, active alarms, cable shop status, or specific equipment such as \`ALS-DEL-ESP-104\`.`;

    return {
      text,
      actions: [
        {
          type: 'navigate' as const,
          route: 'operations',
          label: 'Open Operations Dashboard',
          description: 'View field KPI summary',
        }
      ],
      provider: 'local_demo' as const,
      disclaimer: 'DEMO LOCAL ASSISTANT (SYNTHETIC DATA) — Operating in local rule-based simulation mode.',
    };
  }

  /**
   * Controlled Action: Create a real job in OperationsService from a confirmed draft
   */
  static confirmAndCreateDraftJob(
    jobData: {
      title: string;
      wellId: string;
      type: JobWorkflowType;
      priority: 'Immediate' | 'High' | 'Normal' | 'Scheduled';
      assignedCrew?: string;
      description?: string;
    },
    currentUser: UserProfile
  ): WorkOrderJob {
    const wells = StorageService.getWells();
    const targetWell = wells.find(w => w.id === jobData.wellId || w.wellCode === jobData.wellId);
    const wellName = targetWell?.name || jobData.wellId;

    const newJob: WorkOrderJob = {
      id: `WO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      title: jobData.title,
      wellId: jobData.wellId,
      wellName,
      type: jobData.type || 'ESP Replacement',
      priority: jobData.priority || 'High',
      status: 'Draft',
      stage: 'Draft / Requested',
      assignedCrew: jobData.assignedCrew || 'Midland Crew Alpha',
      responsibleEngineer: currentUser.name,
      notes: jobData.description || `Draft maintenance job generated via ALS Operations AI Assistant by ${currentUser.name}. Requires field crew dispatch confirmation.`,
      scheduledDate: new Date().toISOString().slice(0, 10),
      createdDate: new Date().toISOString().slice(0, 10),
      estimatedHours: 16,
    };

    OperationsService.createJob(newJob);

    // Record audit event
    OperationsService.addEvent({
      id: `EVT-${Date.now()}`,
      wellId: jobData.wellId,
      wellName,
      timestamp: new Date().toISOString(),
      eventType: 'Setpoint Changed',
      user: currentUser.name,
      description: `New maintenance job [${newJob.id}] drafted and confirmed by ${currentUser.name} via AI Assistant.`,
      severity: 'Action',
      notes: `Job type: ${newJob.type}, Priority: ${newJob.priority}`,
    });

    return newJob;
  }
}
