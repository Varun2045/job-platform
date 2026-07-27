import { StorageProvider } from '../storage/StorageProvider.js';
import { Application } from '../companies/Scraper.js';
import { Logger } from './Logger.js';

export type KanbanStage =
  | 'Wishlist'
  | 'Saved'
  | 'Applied'
  | 'Assessment'
  | 'Screening'
  | 'Interview'
  | 'Offer'
  | 'Accepted'
  | 'Rejected'
  | 'Withdrawn'
  | 'Archived';

export interface KanbanBoardColumn {
  stage: KanbanStage;
  count: number;
  applications: Application[];
}

export interface KanbanBoardResult {
  columns: Record<KanbanStage, KanbanBoardColumn>;
  totalApplications: number;
}

export class KanbanService {
  private static readonly VALID_STAGES: KanbanStage[] = [
    'Wishlist',
    'Saved',
    'Applied',
    'Assessment',
    'Screening',
    'Interview',
    'Offer',
    'Accepted',
    'Rejected',
    'Withdrawn',
    'Archived',
  ];

  constructor(private storage: StorageProvider) {}

  /**
   * Validates whether a state transition from currentStatus to targetStatus is allowed.
   */
  public validateTransition(currentStatus: string, targetStatus: string): boolean {
    if (!KanbanService.VALID_STAGES.includes(targetStatus as KanbanStage)) {
      return false;
    }
    // Terminal states can move to Archived or be reopened to Saved/Applied
    if (currentStatus === 'Archived' && targetStatus === 'Archived') {
      return true;
    }
    return true; // Flexible kanban drag-and-drop state machine
  }

  /**
   * Fetches the complete grouped Kanban board for a user.
   */
  public async getBoard(userId?: string): Promise<KanbanBoardResult> {
    const apps = await this.storage.getApplications(userId);

    const columns: Record<KanbanStage, KanbanBoardColumn> = {
      Wishlist: { stage: 'Wishlist', count: 0, applications: [] },
      Saved: { stage: 'Saved', count: 0, applications: [] },
      Applied: { stage: 'Applied', count: 0, applications: [] },
      Assessment: { stage: 'Assessment', count: 0, applications: [] },
      Screening: { stage: 'Screening', count: 0, applications: [] },
      Interview: { stage: 'Interview', count: 0, applications: [] },
      Offer: { stage: 'Offer', count: 0, applications: [] },
      Accepted: { stage: 'Accepted', count: 0, applications: [] },
      Rejected: { stage: 'Rejected', count: 0, applications: [] },
      Withdrawn: { stage: 'Withdrawn', count: 0, applications: [] },
      Archived: { stage: 'Archived', count: 0, applications: [] },
    };

    for (const app of apps) {
      const stage = (KanbanService.VALID_STAGES.includes(app.status as KanbanStage)
        ? app.status
        : 'Saved') as KanbanStage;
      columns[stage].applications.push(app);
    }

    // Sort applications in each column by stageOrder ascending
    let totalCount = 0;
    for (const stage of KanbanService.VALID_STAGES) {
      columns[stage].applications.sort((a, b) => (a.stageOrder ?? 0) - (b.stageOrder ?? 0));
      columns[stage].count = columns[stage].applications.length;
      totalCount += columns[stage].count;
    }

    return {
      columns,
      totalApplications: totalCount,
    };
  }

  /**
   * Moves an application to a new stage and calculates the new stageOrder float.
   */
  public async moveApplication(
    applicationId: string,
    targetStatus: KanbanStage,
    targetStageOrder?: number,
    userId?: string,
  ): Promise<Application> {
    if (!this.validateTransition('', targetStatus)) {
      throw new Error(`Invalid Kanban stage status: ${targetStatus}`);
    }

    const apps = await this.storage.getApplications(userId);
    const app = apps.find(
      (a) =>
        a.jobId === applicationId ||
        a.jobHash === applicationId ||
        `${a.company}-${a.jobId}` === applicationId,
    );

    if (!app) {
      throw new Error(`Application with ID "${applicationId}" not found`);
    }

    const updatedApp: Application = {
      ...app,
      status: targetStatus,
      stageOrder: typeof targetStageOrder === 'number' ? targetStageOrder : (app.stageOrder ?? 0.0) + 1.0,
      appliedDate: targetStatus === 'Applied' && !app.appliedDate ? new Date().toISOString() : app.appliedDate,
      lastUpdated: new Date().toISOString(),
    };

    await this.storage.saveApplication(updatedApp, userId);
    Logger.info(`KanbanService: Application ${applicationId} moved to ${targetStatus} (stageOrder: ${updatedApp.stageOrder})`);
    return updatedApp;
  }

  /**
   * Reorders an application within its current stage.
   */
  public async reorderWithinStage(
    applicationId: string,
    targetStageOrder: number,
    userId?: string,
  ): Promise<Application> {
    const apps = await this.storage.getApplications(userId);
    const app = apps.find(
      (a) =>
        a.jobId === applicationId ||
        a.jobHash === applicationId ||
        `${a.company}-${a.jobId}` === applicationId,
    );

    if (!app) {
      throw new Error(`Application with ID "${applicationId}" not found`);
    }

    const updatedApp: Application = {
      ...app,
      stageOrder: targetStageOrder,
      lastUpdated: new Date().toISOString(),
    };

    await this.storage.saveApplication(updatedApp, userId);
    return updatedApp;
  }
}
