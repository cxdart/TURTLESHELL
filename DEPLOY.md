# TURTLESHELL Deploy Flow

Canonical repo: `TURTLESHELL_project/turtleshell-web`

Rules:
- Do not commit `.env.local`, `.env.production`, or backup env files.
- Keep `node_modules` and `.next` out of Git.
- Back up the live server before risky deploys.

Deploy steps:
1. Work locally in `turtleshell-web`.
2. Run `npm run build`.
3. Commit and push to `origin/master`.
4. On the server, pull into `~/turtleshell-web`.
5. Run `npm install` only when dependencies change, then run `npm run build`.
6. Restart PM2 with `pm2 restart turtleshell`.
7. Verify the live site and check `pm2 logs turtleshell --lines 100`.
