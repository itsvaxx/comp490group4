```markdown

\# GameLens Deployment Guide



\## Deployment Options



\### Option 1: Local Production Deployment



\*\*Using PM2 (Process Manager)\*\*

```bash

\# Install PM2 globally

npm install -g pm2



\# Start application with PM2

pm2 start server.js --name gamelens



\# Save PM2 configuration

pm2 save



\# Enable PM2 to start on system boot

pm2 startup

```



\*\*Using Systemd (Linux)\*\*

Create `/etc/systemd/system/gamelens.service`:

```ini

\[Unit]

Description=GameLens NBA Dashboard

After=network.target



\[Service]

Type=simple

User=ubuntu

WorkingDirectory=/var/www/gamelens

ExecStart=/usr/bin/node server.js

Restart=on-failure

Environment=NODE\_ENV=production



\[Install]

WantedBy=multi-user.target

```



Then run:

```bash

sudo systemctl enable gamelens

sudo systemctl start gamelens

```



\---



\### Option 2: Heroku Deployment



1\. \*\*Create Heroku App\*\*

```bash

heroku create gamelens-dashboard

```



2\. \*\*Set Environment Variables\*\*

```bash

heroku config:set SPORTSDATAIO\_API\_KEY=your\_api\_key\_here

heroku config:set NODE\_ENV=production

```



3\. \*\*Deploy\*\*

```bash

git push heroku main

```



4\. \*\*Open Application\*\*

```bash

heroku open

```



\---



\### Option 3: Docker Deployment



\*\*Create Dockerfile:\*\*

```dockerfile

FROM node:18-alpine

WORKDIR /app

COPY package\*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD \["node", "server.js"]

```



\*\*Create docker-compose.yml:\*\*

```yaml

version: '3.8'

services:

&#x20; gamelens:

&#x20;   build: .

&#x20;   ports:

&#x20;     - "3000:3000"

&#x20;   environment:

&#x20;     - SPORTSDATAIO\_API\_KEY=${SPORTSDATAIO\_API\_KEY}

&#x20;     - NODE\_ENV=production

&#x20;   restart: unless-stopped

```



\*\*Build and Run:\*\*

```bash

\# Build the image

docker build -t gamelens .



\# Run with docker-compose

docker-compose up -d



\# Check logs

docker-compose logs -f

```



\---



\### Option 4: Vercel Deployment



1\. \*\*Install Vercel CLI\*\*

```bash

npm i -g vercel

```



2\. \*\*Deploy\*\*

```bash

vercel

```

Follow the prompts to link to your project.



3\. \*\*Set Environment Variables in Vercel Dashboard\*\*

\- Go to Project Settings → Environment Variables

\- Add `SPORTSDATAIO\_API\_KEY`



\---



\### Option 5: AWS Elastic Beanstalk



1\. \*\*Install EB CLI\*\*

```bash

pip install awsebcli

```



2\. \*\*Initialize EB Application\*\*

```bash

eb init -p node.js gamelens

```



3\. \*\*Create Environment\*\*

```bash

eb create gamelens-prod

```



4\. \*\*Set Environment Variables\*\*

```bash

eb setenv SPORTSDATAIO\_API\_KEY=your\_api\_key\_here

```



5\. \*\*Deploy\*\*

```bash

eb deploy

```



\---



\## Environment Variables Reference



| Variable | Description | Required | Default |

|----------|-------------|----------|---------|

| `SPORTSDATAIO\_API\_KEY` | SportsDataIO API key | Yes | None |

| `PORT` | Server port | No | 3000 |

| `NODE\_ENV` | Environment (development/production) | No | development |



\---



\## Pre-Deployment Checklist



\- \[ ] All tests pass locally

\- \[ ] Environment variables are configured

\- \[ ] `node\_modules` is in `.gitignore`

\- \[ ] No hardcoded API keys in source code

\- \[ ] Application runs with `NODE\_ENV=production`



\---



\## Post-Deployment Validation



\### Health Check

```bash

\# Check if server is running

curl https://your-domain.com/



\# Expected response

{"message":"NBA Analytics Backend is running!"}

```



\### API Endpoint Test

```bash

\# Test teams endpoint

curl https://your-domain.com/api/teams



\# Expected: JSON array of 30 NBA teams

```



\### Browser Validation

1\. Navigate to your deployed URL

2\. Verify games load within 5 seconds

3\. Test team comparison tool

4\. Verify standings display



\---



\## Monitoring \& Logging



\### View Logs (PM2)

```bash

pm2 logs gamelens

```



\### View Logs (Docker)

```bash

docker-compose logs -f

```



\### View Logs (Heroku)

```bash

heroku logs --tail

```



\---



\## Rollback Procedure



\*\*Heroku:\*\*

```bash

heroku releases

heroku rollback vX

```



\*\*Docker:\*\*

```bash

docker-compose down

docker-compose up -d

```



\*\*PM2:\*\*

```bash

pm2 restart gamelens

pm2 reload gamelens

```



\---



\## Troubleshooting Deployment



| Issue | Solution |

|-------|----------|

| `Port already in use` | Change PORT in environment variables |

| `API key invalid` | Verify key in SportsDataIO dashboard |

| `CORS errors` | Ensure CORS headers are configured in server.js |

| `Connection timeout` | Check firewall settings and network connectivity |

| `Module not found` | Run `npm install` on the deployment server |

```

