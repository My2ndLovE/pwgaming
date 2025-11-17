# Deployment Guide

## Production Deployment to Azure

### Prerequisites
- Azure account with active subscription
- Azure CLI installed and configured
- Docker installed locally
- PostgreSQL and Redis provisioned in Azure

### Architecture

```
Azure Container Apps (Backend)
    ↓
Azure Database for PostgreSQL
Azure Cache for Redis
    ↑
Azure Static Web Apps (Frontend)
```

### Environment Variables

**Backend** (`.env.production`):
```bash
NODE_ENV=production
PORT=3000

# Database
DATABASE_HOST=<azure-postgres-host>
DATABASE_PORT=5432
DATABASE_USER=<admin-user>
DATABASE_PASSWORD=<secure-password>
DATABASE_NAME=poker_production

# Redis
REDIS_HOST=<azure-redis-host>
REDIS_PORT=6379
REDIS_PASSWORD=<redis-password>

# JWT
JWT_SECRET=<generate-secure-secret>
JWT_EXPIRES_IN=7d

# Wallet
WALLET_MODE=internal

# CORS
CORS_ORIGINS=https://your-domain.com
```

**Frontend** (`.env.production`):
```bash
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_WS_URL=wss://api.your-domain.com
```

### Deployment Steps

#### 1. Build Docker Images

**Backend**:
```bash
cd backend
docker build -t poker-backend:latest .
docker tag poker-backend:latest <registry>.azurecr.io/poker-backend:latest
docker push <registry>.azurecr.io/poker-backend:latest
```

#### 2. Deploy to Azure Container Apps

```bash
az containerapp create \
  --name poker-backend \
  --resource-group poker-production \
  --environment poker-env \
  --image <registry>.azurecr.io/poker-backend:latest \
  --target-port 3000 \
  --ingress external \
  --env-vars <env-vars-from-above>
```

#### 3. Deploy Frontend to Static Web Apps

```bash
cd frontend
npm run build

az staticwebapp deploy \
  --name poker-frontend \
  --resource-group poker-production \
  --source-location ./out
```

#### 4. Configure Custom Domain

```bash
# Add custom domain to Container Apps
az containerapp hostname add \
  --hostname api.your-domain.com \
  --resource-group poker-production \
  --name poker-backend

# Add custom domain to Static Web Apps
az staticwebapp hostname set \
  --hostname your-domain.com \
  --resource-group poker-production \
  --name poker-frontend
```

#### 5. Enable SSL/TLS

Azure automatically provisions SSL certificates for custom domains.

### Database Migration

```bash
# Run migrations
npm run migration:run

# Verify
npm run migration:status
```

### Health Checks

- **Liveness**: `GET /health/liveness`
- **Readiness**: `GET /health/readiness`

Configure in Azure Container Apps:
```yaml
livenessProbe:
  httpGet:
    path: /health/liveness
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/readiness
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
```

### Monitoring

1. **Application Insights**: Automatic instrumentation
2. **Log Analytics**: Centralized logging
3. **Alerts**: Configure for errors, high latency, resource usage

### Rollback Procedure

```bash
# List revisions
az containerapp revision list \
  --name poker-backend \
  --resource-group poker-production

# Activate previous revision
az containerapp revision activate \
  --revision <previous-revision-name> \
  --resource-group poker-production
```

### Backup & Recovery

See [backup-restore.md](./backup-restore.md) for detailed procedures.

### Scaling

**Auto-scaling configuration**:
```bash
az containerapp update \
  --name poker-backend \
  --resource-group poker-production \
  --min-replicas 2 \
  --max-replicas 10 \
  --scale-rule-name http-rule \
  --scale-rule-type http \
  --scale-rule-http-concurrency 50
```

### Security

1. **Network Security**: Configure Virtual Network
2. **Secrets Management**: Use Azure Key Vault
3. **DDoS Protection**: Enable Azure DDoS Protection
4. **WAF**: Configure Web Application Firewall

### Cost Optimization

- Use Azure Reserved Instances for predictable workloads
- Enable auto-shutdown for non-production environments
- Monitor usage with Cost Management

### Troubleshooting

Common issues and solutions in [troubleshooting.md](./troubleshooting.md)
