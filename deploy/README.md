# Deploying My Captain to the VPS (CloudPanel, PM2, Nginx)

Two processes run on the server, both reachable only through Nginx over HTTPS:

| Site | Process | Local port |
|---|---|---|
| `api.<domain>` | `mycaptain-api` (backend + live updates) | 4000 |
| `partners.<domain>` | `mycaptain-partners` (partner website) | 3010 |

## One-time setup

1. **DNS**: point `api` and `partners` A records at the VPS IP.
2. **CloudPanel**: add two *Reverse Proxy* sites (`api.<domain>` → `http://127.0.0.1:4000`, `partners.<domain>` → `http://127.0.0.1:3010`) and issue Let's Encrypt certificates. Add the WebSocket lines from `nginx/api.conf` to the API vhost.
3. **Server packages**: Node 20+, PM2 (`npm i -g pm2`), Redis (`apt install redis-server`, bound to 127.0.0.1).
4. **Code**: `git clone` the repository as the site user.
5. **Production database**: create a *separate* MongoDB Atlas database (or cluster) for production, a database user with access to it only, and allow the VPS IP in Atlas Network Access. Turn on backups.
6. **`backend/.env`** (copy `.env.example`):
   - `NODE_ENV=production`, `HOST=127.0.0.1`, `PORT=4000`
   - `CORS_ORIGINS=https://partners.<domain>`
   - `MONGODB_URI=` production database
   - `REDIS_URL=redis://127.0.0.1:6379`
   - New `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `OTP_PEPPER`, each generated on the server with
     `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. Never reuse development values.
   - Cloudinary keys (ideally a separate production folder or account)
   - SMS provider settings (see below)
   - `SEED_ADMIN_PHONE`, `SEED_ADMIN_PASSWORD` (strong), then run `npm run build && node dist/scripts/seed.js` once and delete the password line.
7. **`partners/.env.production`**:
   - `API_URL=http://127.0.0.1:4000/api/v1`
   - `NEXT_PUBLIC_SOCKET_URL=https://api.<domain>`
8. **Start**: `bash deploy/update.sh`, then `pm2 startup` so processes return after a reboot.
9. **Firewall**: allow only 22, 80 and 443 (`ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw enable`).

The API refuses to start in production without Redis, Cloudinary, a real SMS provider or with `http://` CORS origins.

## SMS provider

Set `SMS_PROVIDER` in `backend/.env`:

- `twilio`: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM` (or `TWILIO_MESSAGING_SERVICE_SID`).
- `http`: any Pakistani gateway with an HTTP API. Put its send URL in `SMS_HTTP_URL` using `{to}` (+92…), `{to_local}` (03…) and `{text}`. If the gateway answers 200 on errors, set `SMS_HTTP_SUCCESS` to text that only appears on success.

`SMS_DAILY_LIMIT` caps codes per day to protect the bill.

## Updating

```bash
bash deploy/update.sh
```

## Mobile app

Set `EXPO_PUBLIC_API_URL=https://api.<domain>/api` and `EXPO_PUBLIC_SOCKET_URL=https://api.<domain>` for the production build.
