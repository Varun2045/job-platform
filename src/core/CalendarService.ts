export type CalendarEventType = 
  | 'Interview'
  | 'Assessment'
  | 'Recruiter Call'
  | 'Follow-up Reminder';

export interface CalendarEventOptions {
  id?: string;
  title: string;
  description: string;
  eventType: CalendarEventType;
  startTime: Date;
  endTime: Date;
  location?: string;
}

export class CalendarService {
  /**
   * Generates a compliant RFC-5545 ICS calendar event string.
   */
  public static generateICS(options: CalendarEventOptions): string {
    const formatICSDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const uid = options.id || Math.random().toString(36).substring(2, 15);
    const dtstamp = formatICSDate(new Date());
    const dtstart = formatICSDate(options.startTime);
    const dtend = formatICSDate(options.endTime);
    const summary = options.title;
    const description = options.description.replace(/\n/g, '\\n');
    const location = options.location || 'Remote / Virtual Call';

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Job Monitor Platform//CalendarService//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }
}
