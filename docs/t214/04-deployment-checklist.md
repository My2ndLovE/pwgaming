# T214: Production Deployment Checklist

**Date**: 2025-11-19
**Target**: Azure (Southeast Asia)
**Estimated Time**: 30 hours (Phase 1)

---

## Pre-Deployment Verification ✅

### Code Quality
- [x] All critical tests passing (342 tests)
- [x] ESLint errors fixed (1 unused import removed)
- [x] TypeScript compilation clean
- [x] No hardcoded credentials
- [x] Environment variables documented

### Security
- [x] Security audit complete (low risk)
- [x] Vulnerabilities documented
- [x] OWASP Top 10 compliance verified
- [x] JWT secrets validated (32+ chars)
- [x] Rate limiting configured

### Infrastructure
- [x] Health check endpoints ready
- [x] Database migrations ready
- [x] Performance indexes created
- [x] Sentry error tracking configured
- [x] Hand replay system implemented

---

## Azure Infrastructure Setup (T008-T017)

### 1. Azure CLI Setup
```bash
# Install Azure CLI
az --version

# Login to Azure
az login

# Set subscription
az account set --subscription "YOUR_SUBSCRIPTION_ID"
```

### 2. Resource Group
```bash
# Create resource group
az group create \
  --name poker-platform-rg \
  --location southeastasia
```

### 3. Azure Key Vault
```bash
# Create Key Vault
az keyvault create \
  --name poker-platform-kv \
  --resource-group poker-platform-rg \
  --location southeastasia

# Store secrets
az keyvault secret set --vault-name poker-platform-kv --name JWT-SECRET --value "YOUR_JWT_SECRET"
az keyvault secret set --vault-name poker-platform-kv --name TELEGRAM-BOT-TOKEN --value "YOUR_TOKEN"
az keyvault secret set --vault-name poker-platform-kv --name DB-PASSWORD --value "YOUR_DB_PASSWORD"
az keyvault secret set --vault-name poker-platform-kv --name REDIS-PASSWORD --value "YOUR_REDIS_PASSWORD"
az keyvault secret set --vault-name poker-platform-kv --name SENTRY-DSN --value "YOUR_SENTRY_DSN"
```

### 4. Container Registry
```bash
# Create Container Registry
az acr create \
  --resource-group poker-platform-rg \
  --name pokerplatformacr \
  --sku Basic

# Enable admin
az acr update -n pokerplatformacr --admin-enabled true

# Get credentials
az acr credential show --name pokerplatformacr
```

### 5. PostgreSQL Database
```bash
# Create PostgreSQL Flexible Server
az postgres flexible-server create \
  --resource-group poker-platform-rg \
  --name poker-platform-db \
  --location southeastasia \
  --admin-user pokeradmin \
  --admin-password "SECURE_PASSWORD" \
  --sku-name Standard_B1ms \
  --storage-size 32 \
  --version 15

# Configure firewall (allow Azure services)
az postgres flexible-server firewall-rule create \
  --resource-group poker-platform-rg \
  --name poker-platform-db \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Create database
az postgres flexible-server db create \
  --resource-group poker-platform-rg \
  --server-name poker-platform-db \
  --database-name poker_platform
```

### 6. Redis Cache
```bash
# Create Redis Cache
az redis create \
  --resource-group poker-platform-rg \
  --name poker-platform-redis \
  --location southeastasia \
  --sku Basic \
  --vm-size c1 \
  --enable-non-ssl-port false

# Get connection string
az redis show --name poker-platform-redis --resource-group poker-platform-rg --query "hostName" --output tsv
az redis list-keys --name poker-platform-redis --resource-group poker-platform-rg
```

### 7. Application Insights
```bash
# Create Application Insights
az monitor app-insights component create \
  --app poker-platform-insights \
  --location southeastasia \
  --resource-group poker-platform-rg \
  --application-type web

# Get instrumentation key
az monitor app-insights component show \
  --app poker-platform-insights \
  --resource-group poker-platform-rg \
  --query "connectionString" --output tsv
```

### 8. Storage Account
```bash
# Create Storage Account
az storage account create \
  --name pokerplatformstorage \
  --resource-group poker-platform-rg \
  --location southeastasia \
  --sku Standard_LRS

# Create container for assets
az storage container create \
  --name assets \
  --account-name pokerplatformstorage \
  --public-access blob
```

---

## Backend Deployment (T031-T035, T039)

### 1. Build Docker Image
```bash
cd backend

# Create Dockerfile (already exists)
# Build image
docker build -t pokerplatformacr.azurecr.io/backend:latest .

# Test locally
docker run -p 3001:3001 --env-file .env pokerplatformacr.azurecr.io/backend:latest

# Push to registry
az acr login --name pokerplatformacr
docker push pokerplatformacr.azurecr.io/backend:latest
```

### 2. Create Container App Environment
```bash
# Create Container Apps environment
az containerapp env create \
  --name poker-env \
  --resource-group poker-platform-rg \
  --location southeastasia
```

### 3. Deploy Backend Container App
```bash
# Create container app
az containerapp create \
  --name poker-backend \
  --resource-group poker-platform-rg \
  --environment poker-env \
  --image pokerplatformacr.azurecr.io/backend:latest \
  --target-port 3001 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3 \
  --cpu 1.0 \
  --memory 2.0Gi \
  --registry-server pokerplatformacr.azurecr.io \
  --registry-username $(az acr credential show --name pokerplatformacr --query username -o tsv) \
  --registry-password $(az acr credential show --name pokerplatformacr --query passwords[0].value -o tsv) \
  --env-vars \
    "NODE_ENV=production" \
    "PORT=3001" \
    "DB_HOST=poker-platform-db.postgres.database.azure.com" \
    "DB_PORT=5432" \
    "DB_USERNAME=pokeradmin" \
    "DB_PASSWORD=secretref:db-password" \
    "DB_DATABASE=poker_platform" \
    "REDIS_HOST=poker-platform-redis.redis.cache.windows.net" \
    "REDIS_PORT=6380" \
    "REDIS_PASSWORD=secretref:redis-password" \
    "JWT_SECRET=secretref:jwt-secret" \
    "TELEGRAM_BOT_TOKEN=secretref:telegram-bot-token" \
    "SENTRY_DSN=secretref:sentry-dsn" \
    "APPLICATIONINSIGHTS_CONNECTION_STRING=secretref:appinsights-connection"
```

### 4. Run Database Migrations
```bash
# SSH into container or run migration job
az containerapp exec \
  --name poker-backend \
  --resource-group poker-platform-rg \
  --command "/bin/sh -c 'npm run migration:run'"
```

---

## Frontend Deployment (T033, T040)

### 1. Build Next.js Application
```bash
cd frontend

# Set environment variables
echo "NEXT_PUBLIC_API_URL=https://poker-backend.YOUR_DOMAIN.com/api/v1" > .env.production
echo "NEXT_PUBLIC_WS_URL=https://poker-backend.YOUR_DOMAIN.com" >> .env.production
echo "NEXT_PUBLIC_SENTRY_DSN=YOUR_SENTRY_DSN" >> .env.production
echo "NEXT_PUBLIC_ENV=production" >> .env.production

# Build
npm run build

# Test build locally
npm start
```

### 2. Deploy to Azure Static Web Apps
```bash
# Create Static Web App
az staticwebapp create \
  --name poker-frontend \
  --resource-group poker-platform-rg \
  --location southeastasia

# Get deployment token
az staticwebapp secrets list \
  --name poker-frontend \
  --resource-group poker-platform-rg \
  --query "properties.apiKey" --output tsv

# Deploy (via GitHub Actions or Azure CLI)
```

---

## CI/CD Setup (T037-T042)

### GitHub Secrets Configuration
```
AZURE_CREDENTIALS
ACR_LOGIN_SERVER=pokerplatformacr.azurecr.io
ACR_USERNAME
ACR_PASSWORD
AZURE_STATIC_WEB_APPS_API_TOKEN
DB_CONNECTION_STRING
REDIS_CONNECTION_STRING
```

### GitHub Actions Workflows
- `.github/workflows/backend-test.yml` - Run tests on PR
- `.github/workflows/frontend-test.yml` - Run frontend tests
- `.github/workflows/deploy-backend.yml` - Deploy backend on push to main
- `.github/workflows/deploy-frontend.yml` - Deploy frontend on push to main

---

## Post-Deployment Validation

### 1. Health Checks
```bash
# Backend health
curl https://poker-backend.YOUR_DOMAIN.com/api/v1/health/liveness
curl https://poker-backend.YOUR_DOMAIN.com/api/v1/health/readiness

# Expected: {"status":"ok",...}
```

### 2. Smoke Tests
```bash
# Test authentication
curl -X POST https://poker-backend.YOUR_DOMAIN.com/api/v1/auth/telegram \
  -H "Content-Type: application/json" \
  -d '{"initData":"test"}'

# Test health endpoint
curl https://poker-backend.YOUR_DOMAIN.com/api/v1/health
```

### 3. Frontend Access
```bash
# Open in browser
open https://poker-frontend.YOUR_DOMAIN.com

# Verify:
- Page loads
- Assets load (images, CSS, JS)
- No console errors
```

### 4. Database Verification
```bash
# Connect to PostgreSQL
psql "host=poker-platform-db.postgres.database.azure.com port=5432 dbname=poker_platform user=pokeradmin sslmode=require"

# Verify tables
\dt

# Verify migrations
SELECT * FROM migrations ORDER BY timestamp DESC;

# Verify platform settings
SELECT * FROM platform_settings;
```

### 5. Sentry Verification
```bash
# Trigger test error
curl https://poker-backend.YOUR_DOMAIN.com/api/v1/test-error

# Check Sentry dashboard
# Verify error appears
```

---

## Rollback Plan

### Backend Rollback
```bash
# Roll back to previous image version
az containerapp update \
  --name poker-backend \
  --resource-group poker-platform-rg \
  --image pokerplatformacr.azurecr.io/backend:PREVIOUS_TAG
```

### Database Rollback
```bash
# SSH into container
az containerapp exec --name poker-backend --resource-group poker-platform-rg

# Run migration rollback
npm run migration:revert
```

### Frontend Rollback
```bash
# Revert GitHub commit
git revert HEAD
git push origin main

# Or redeploy previous version via GitHub Actions
```

---

## Monitoring Setup

### 1. Application Insights Dashboards
- Response times
- Error rates
- Request counts
- Dependency health

### 2. Sentry Alerts
- High error rate alerts
- Critical error notifications
- Performance degradation alerts

### 3. Health Check Monitoring
- Kubernetes liveness/readiness probes
- Azure Monitor health checks
- Uptime monitoring

---

## Security Checklist

- [ ] All secrets in Key Vault (not in code)
- [ ] SSL/TLS enabled for all connections
- [ ] Database firewall configured
- [ ] Redis TLS enabled
- [ ] CORS configured with allowed origins
- [ ] Rate limiting active
- [ ] Security headers (Helmet.js) enabled
- [ ] Environment variables validated on startup

---

## Cost Monitoring

### Initial Setup
- PostgreSQL B1ms: ~$30/month
- Redis Basic C1: ~$15/month
- Container Apps: ~$20/month
- Static Web Apps: Free tier
- **Total**: ~$65/month

### After 1000 Users
- PostgreSQL B2s: ~$60/month
- Redis Standard C1: ~$75/month
- Container Apps (2 instances): ~$40/month
- Application Insights: ~$10/month
- **Total**: ~$185/month

---

## Launch Day Checklist

### 6 Hours Before Launch
- [ ] Final code freeze
- [ ] All tests passing
- [ ] Security audit reviewed
- [ ] Backup strategy confirmed
- [ ] Rollback plan tested

### 2 Hours Before Launch
- [ ] Deploy backend to production
- [ ] Run database migrations
- [ ] Deploy frontend to production
- [ ] Smoke tests passing
- [ ] Health checks green

### Launch Time
- [ ] Enable public access
- [ ] Monitor error rates (Sentry)
- [ ] Monitor performance (App Insights)
- [ ] Monitor health checks
- [ ] Team on standby

### 1 Hour After Launch
- [ ] Verify user registrations working
- [ ] Verify game creation working
- [ ] Verify wallet operations
- [ ] Check error rates < 1%
- [ ] Check response times < 500ms

### 24 Hours After Launch
- [ ] Review all error logs
- [ ] Check performance metrics
- [ ] Verify backup completed
- [ ] Document any issues
- [ ] Plan hotfixes if needed

---

## Support Contacts

- **Azure Support**: portal.azure.com
- **Sentry Dashboard**: sentry.io
- **Database Admin**: pgAdmin / Azure Portal
- **DNS Management**: Your DNS provider

---

## Conclusion

This checklist provides a complete deployment roadmap from Azure infrastructure setup through post-launch monitoring. Follow each section sequentially for a smooth production deployment.

**Total Deployment Time**: 30 hours
**Team Required**: 2-3 engineers
**Recommended**: Deploy to staging first, then production

✅ **Ready for Phase 1 Execution**
