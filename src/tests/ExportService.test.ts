import { ExportService } from '../core/ExportService.js';

describe('ExportService', () => {
  const mockData = [
    { company: 'Stripe', role: 'Engineer', appliedDate: '2026-07-01' },
    { company: 'Google', role: 'Dev', appliedDate: '2026-07-02' }
  ];

  test('should generate JSON file output correctly', () => {
    const { buffer, fileName } = ExportService.exportData('Application History', 'JSON', mockData);
    expect(fileName).toContain('application_history_export_');
    expect(fileName.endsWith('.json')).toBe(true);

    const parsed = JSON.parse(buffer.toString('utf-8'));
    expect(parsed.length).toBe(2);
    expect(parsed[0].company).toBe('Stripe');
  });

  test('should generate CSV file outputs containing headers and columns', () => {
    const { buffer, fileName } = ExportService.exportData('Application History', 'CSV', mockData);
    expect(fileName.endsWith('.csv')).toBe(true);

    const csvText = buffer.toString('utf-8');
    expect(csvText).toContain('company,role,appliedDate');
    expect(csvText).toContain('"Stripe","Engineer","2026-07-01"');
  });

  test('should generate Markdown output summaries', () => {
    const { buffer, fileName } = ExportService.exportData('Weekly Report', 'Markdown', 'Weekly overview text content summary.');
    expect(fileName.endsWith('.md')).toBe(true);

    const mdText = buffer.toString('utf-8');
    expect(mdText).toContain('# Export: Weekly Report');
    expect(mdText).toContain('Weekly overview text content summary.');
  });
});
