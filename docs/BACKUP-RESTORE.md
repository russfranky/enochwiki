# Backup and restore — enoch.wiki

The production database is a single SQLite file. The full rebuild path is:
**repo + env + latest DB backup = full restore in under 1 hour.**

## Nightly backup

`scripts/backup-db.sh` copies the live database with the sqlite3 `.backup`
command. The server does not need to stop. It keeps the last 14 days and
prunes older files.

```bash
DATABASE_URL="file:/srv/enochwiki/db/custom.db" \
BACKUP_DIR=/var/backups/enochwiki \
bash scripts/backup-db.sh
```

Cron line (runs nightly at 03:00 server time):

```cron
0 3 * * * DATABASE_URL="file:/srv/enochwiki/db/custom.db" BACKUP_DIR=/var/backups/enochwiki /bin/bash /srv/enochwiki/scripts/backup-db.sh >> /var/log/enochwiki-backup.log 2>&1
```

Copy `/var/backups/enochwiki` off the server as well (rsync to a second
machine or object storage). A backup that lives only on the server is not
a backup.

## WAL mode

After the database file is created, and after every restore, run:

```bash
node scripts/db-wal.mjs
```

This sets `PRAGMA journal_mode=WAL`. It is idempotent. WAL lets readers and
writers run at the same time, which matters under public traffic.

## Full restore (under 1 hour)

1. Stop the app server and Caddy (or take the site block out of rotation).
2. `git clone` the repo at the last known-good commit, or `git pull` on the
   server checkout. Check out the deployed branch.
3. Restore the environment file: copy the saved `.env` (DATABASE_URL,
   MIMO_API_KEY, MIMO_PAYG_API_KEY, ADMIN_TOKEN, NEXT_PUBLIC_PLAUSIBLE_DOMAIN) into the repo
   root. The `.env` is never committed; keep a sealed copy with the backups.
4. Copy the newest backup into place:
   `cp /var/backups/enochwiki/backup-<latest>.db ./db/custom.db`
5. Run `node scripts/db-wal.mjs` (see above).
6. `bun install --frozen-lockfile`
7. `bunx prisma generate`
8. `bun run build`
9. Start the server (`bun .next/standalone/server.js` on port 3000) and
   confirm Caddy proxies to it.
10. Smoke test: homepage loads, `/topics` lists approved pages,
    `/api/health` returns 200. See `docs/OPS.md` for the uptime monitor.

Estimated time: 20-40 minutes when the backup and `.env` are at hand.

## Monthly restore drill

On the first Monday of each month:

- [ ] Pick the newest backup and restore it to a scratch directory (not over
      production).
- [ ] Run `node scripts/db-wal.mjs` against the scratch copy.
- [ ] `bunx prisma generate` succeeds against the scratch copy.
- [ ] Open the app against the scratch copy (port 3001) and load `/topics`.
- [ ] Confirm the off-server backup copy is current (check the newest file
      date on the second machine or bucket).
- [ ] Log the drill result (date, backup file, pass/fail) in the worklog.

If any step fails, fix the backup pipeline before the next drill, not after
an incident.
