import { KanbanService } from '../core/KanbanService.js';
import { FileStorage } from '../storage/FileStorage.js';

describe('KanbanService Unit Tests', () => {
  let storage: FileStorage;
  let service: KanbanService;
  const testUserId = 'kanban-test-user-uuid';

  beforeAll(async () => {
    storage = new FileStorage();
    await storage.initialize();
    service = new KanbanService(storage);
  });

  it('should validate stage transitions', () => {
    expect(service.validateTransition('Saved', 'Interview')).toBe(true);
    expect(service.validateTransition('Applied', 'InvalidStage')).toBe(false);
  });

  it('should retrieve empty or populated Kanban board', async () => {
    const board = await service.getBoard(testUserId);
    expect(board).toBeDefined();
    expect(board.columns.Saved).toBeDefined();
    expect(board.columns.Interview).toBeDefined();
    expect(Array.isArray(board.columns.Saved.applications)).toBe(true);
  });

  it('should move an application and update stageOrder', async () => {
    const mockApp = {
      jobId: 'job-kanban-1',
      jobHash: 'hash-kanban-1',
      company: 'TestCorp',
      status: 'Saved',
      stageOrder: 1.0,
      lastUpdated: new Date().toISOString(),
    };

    await storage.saveApplication(mockApp as any, testUserId);

    const updated = await service.moveApplication('job-kanban-1', 'Interview', 250.5, testUserId);
    expect(updated.status).toBe('Interview');
    expect(updated.stageOrder).toBe(250.5);

    const board = await service.getBoard(testUserId);
    const inInterview = board.columns.Interview.applications.find((a) => a.jobId === 'job-kanban-1');
    expect(inInterview).toBeDefined();
  });

  it('should throw error when moving non-existent application', async () => {
    await expect(service.moveApplication('non-existent-id', 'Interview', 1.0, testUserId)).rejects.toThrow();
  });
});
