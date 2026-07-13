# Backup and Disaster Recovery Guide (Archived)

Details on system backups, export schedules, and restore runbooks.

---

## 1. Automatic Backup Service

The `BackupService` triggers at the completion of every successful scraper orchestrator run. It exports the entire current state of:
- `companies_state`
- `jobs`
- `applications`
- `user_resumes`

### Output Location
- Local/FileStorage: Backups are stored in `storage/backups/backup-{timestamp}.json`.
- Cloud/Supabase: Backups are saved to the configured remote blob bucket or cloud storage.

---

## 2. Retention Policy

The platform retains the last **5 daily backups** automatically. On every new backup generation:
- The system checks the `storage/backups/` directory for files matching `backup-*.json`.
- It sorts them chronologically.
- Any backup files beyond the latest 5 are automatically deleted to conserve storage space.

---

## 3. Database Restore Runbook

To restore state from an exported backup JSON file:

1. Locate the backup file (e.g., `backup-2026-07-08-178351.json`).
2. Run the admin import utility:
   ```bash
   node dist/cli/admin.js restore --file storage/backups/backup-2026-07-08-178351.json
   ```
3. Verify that the tables in Supabase (or local JSON files) have been successfully re-populated.
