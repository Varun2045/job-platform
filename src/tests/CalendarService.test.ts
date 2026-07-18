import { CalendarService, CalendarEventOptions } from '../core/CalendarService.js';

describe('CalendarService', () => {
  test('should generate a valid standard ICS calendar file payload', () => {
    const start = new Date('2026-08-01T10:00:00Z');
    const end = new Date('2026-08-01T11:00:00Z');

    const options: CalendarEventOptions = {
      id: 'evt_stripe_123',
      title: 'Stripe Technical Interview',
      description: 'System design interview with Stripe core payments team.',
      eventType: 'Interview',
      startTime: start,
      endTime: end,
      location: 'Google Meet virtual link',
    };

    const ics = CalendarService.generateICS(options);

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('UID:evt_stripe_123');
    expect(ics).toContain('SUMMARY:Stripe Technical Interview');
    expect(ics).toContain('DESCRIPTION:System design interview with Stripe core payments team.');
    expect(ics).toContain('LOCATION:Google Meet virtual link');
    expect(ics).toContain('DTSTART:20260801T100000Z');
    expect(ics).toContain('DTEND:20260801T110000Z');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');

    // RFC line separators check
    expect(ics).toContain('\r\n');
  });
});
