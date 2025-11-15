# Azure Deployment Guide: Texas Poker Platform MVP

**Project**: PWGaming Texas Hold'em Poker Platform
**Target Region**: Southeast Asia (Singapore)
**Estimated Cost**: $72/month (MVP), $323/month (100+ concurrent players)
**Deployment Time**: 4 weeks infrastructure + 4 weeks development

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Azure Services Overview](#azure-services-overview)
3. [Initial Setup](#initial-setup)
4. [Database Deployment](#database-deployment)
5. [Redis Cache Setup](#redis-cache-setup)
6. [Backend Deployment (Container Apps)](#backend-deployment)
7. [Frontend Deployment (Static Web Apps)](#frontend-deployment)
8. [Storage & CDN Configuration](#storage--cdn-configuration)
9. [Monitoring & Application Insights](#monitoring--application-insights)
10. [CI/CD Pipeline Setup](#cicd-pipeline-setup)
11. [Security & Secrets Management](#security--secrets-management)
12. [Cost Optimization](#cost-optimization)
13. [Disaster Recovery](#disaster-recovery)
14. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

```bash
# 1. Azure CLI
winget install -e --id Microsoft.AzureCLI
# Or download from https://aka.ms/installazurecliwindows

# 2. Docker Desktop
winget install -e --id Docker.DockerDesktop

# 3. Node.js 18+ LTS
winget install -e --id OpenJS.NodeJS.LTS

# 4. Git
winget install -e --id Git.Git

# Verify installations
az --version  # Should be 2.50+
docker --version  # Should be 20+
node --version  # Should be v18+
git --version
```

### Azure Account Setup

```bash
# Login to Azure
az login

# Set default subscription
az account set --subscription "<your-subscription-id>"

# Verify
az account show
```

---

## Azure Services Overview

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      TELEGRAM USERS                             │
│               (Southeast Asia / Global)                         │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
      ┌────────────────────────────────────────┐
      │      Azure Front Door / CDN            │
      │  (Global Edge Caching, DDoS Protection)│
      └──────┬────────────────────┬────────────┘
             │                    │
             │                    │
 ┌───────────▼─────────┐  ┌──────▼──────────────────┐
 │ Static Web Apps     │  │ Container Apps          │
 │ (Next.js Frontend)  │  │ (NestJS Backend)        │
 │                     │  │                         │
 │ - Telegram Mini App │  │ - REST API              │
 │ - WebP card images  │  │ - Socket.io Gateway     │
 │ - Responsive UI     │  │ - Sticky Sessions       │
 │                     │  │ - Auto-scaling (1-5)    │
 └─────────────────────┘  └──────┬──────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
 ┌────────────────────┐ ┌───────────────┐ ┌────────────────┐
 │ PostgreSQL 15      │ │ Redis 7.0     │ │ Blob Storage   │
 │ Flexible Server    │ │ (Managed)     │ │                │
 │                    │ │               │ │ - Card images  │
 │ - ACID transactions│ │ - Game state  │ │ - Avatars      │
 │ - TypeORM          │ │ - Sessions    │ │ - CDN cached   │
 │ - Connection pool  │ │ - Socket.io   │ │                │
 └────────────────────┘ └───────────────┘ └────────────────┘
              │                  │
              └────────┬─────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │    Azure Key Vault           │
        │ - JWT secrets                │
        │ - DB credentials             │
        │ - Telegram bot token         │
        │ - Payment gateway API key    │
        └──────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ Application Insights         │
        │ - Request tracing            │
        │ - Custom metrics             │
        │ - Alerts (latency, errors)   │
        │ - Financial event tracking   │
        └──────────────────────────────┘
```

### Service Selection Rationale

| Service | Why Chosen | Alternative Considered |
|---------|------------|------------------------|
| **Container Apps** | Sticky sessions for WebSocket, auto-scaling, serverless pricing | App Service (higher cost), AKS (too complex) |
| **Static Web Apps** | Free CDN, Telegram Mini App optimized, auto-deployment | App Service (overkill), Blob Storage + CDN (manual) |
| **PostgreSQL Flexible** | ACID transactions for money, TypeORM native, pessimistic locking | Cosmos DB (no ACID), SQL Database (higher cost) |
| **Redis Managed** | Socket.io pub/sub, 99.9% SLA, auto-patching | Redis on VMs (ops overhead) |

---

## Initial Setup

### 1. Create Resource Group

```bash
# Set variables
RESOURCE_GROUP="poker-platform-rg"
LOCATION="southeastasia"  # Singapore
ENVIRONMENT="production"  # or "staging"

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION \
  --tags environment=$ENVIRONMENT project=poker-platform

# Verify
az group show --name $RESOURCE_GROUP
```

### 2. Create Azure Key Vault

```bash
KEYVAULT_NAME="poker-keyvault-$(openssl rand -hex 4)"  # Unique name

az keyvault create \
  --resource-group $RESOURCE_GROUP \
  --name $KEYVAULT_NAME \
  --location $LOCATION \
  --enable-rbac-authorization false \
  --enabled-for-deployment true \
  --enabled-for-template-deployment true

# Store Key Vault URL for later
KEYVAULT_URL=$(az keyvault show --name $KEYVAULT_NAME --query properties.vaultUri -o tsv)
echo "Key Vault URL: $KEYVAULT_URL"
```

### 3. Create Container Registry

```bash
ACR_NAME="pokerplatformacr$(openssl rand -hex 4)"

az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true

# Get credentials (store securely)
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer -o tsv)

echo "ACR Login Server: $ACR_LOGIN_SERVER"
```

---

## Database Deployment

### 1. Create PostgreSQL Flexible Server

```bash
POSTGRES_SERVER="poker-db-$(openssl rand -hex 4)"
POSTGRES_ADMIN_USER="pgadmin"
POSTGRES_ADMIN_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-20)"  # Secure password

az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $POSTGRES_SERVER \
  --location $LOCATION \
  --admin-user $POSTGRES_ADMIN_USER \
  --admin-password $POSTGRES_ADMIN_PASSWORD \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 15 \
  --public-access 0.0.0.0 \
  --backup-retention 7 \
  --storage-auto-grow Enabled

# Create database
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $POSTGRES_SERVER \
  --database-name poker_platform

# Store credentials in Key Vault
DB_CONNECTION_STRING="postgresql://${POSTGRES_ADMIN_USER}:${POSTGRES_ADMIN_PASSWORD}@${POSTGRES_SERVER}.postgres.database.azure.com:5432/poker_platform?sslmode=require"

az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name db-connection-string \
  --value "$DB_CONNECTION_STRING"

echo "PostgreSQL Server: ${POSTGRES_SERVER}.postgres.database.azure.com"
```

### 2. Configure PostgreSQL Settings

```bash
# Enable SSL (required for Azure)
az postgres flexible-server parameter set \
  --resource-group $RESOURCE_GROUP \
  --server-name $POSTGRES_SERVER \
  --name ssl \
  --value ON

# Optimize for poker workload
az postgres flexible-server parameter set \
  --resource-group $RESOURCE_GROUP \
  --server-name $POSTGRES_SERVER \
  --name max_connections \
  --value 100

# Connection pool settings
az postgres flexible-server parameter set \
  --resource-group $RESOURCE_GROUP \
  --server-name $POSTGRES_SERVER \
  --name shared_buffers \
  --value 512MB

# For financial transactions (never disable)
az postgres flexible-server parameter set \
  --resource-group $RESOURCE_GROUP \
  --server-name $POSTGRES_SERVER \
  --name synchronous_commit \
  --value on
```

### 3. Firewall Rules

```bash
# Allow Azure services
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $POSTGRES_SERVER \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Temporary: Allow your IP for migration
YOUR_IP=$(curl -s https://api.ipify.org)
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $POSTGRES_SERVER \
  --rule-name AllowLocalDevelopment \
  --start-ip-address $YOUR_IP \
  --end-ip-address $YOUR_IP
```

---

## Redis Cache Setup

### 1. Create Azure Cache for Redis

```bash
REDIS_NAME="poker-redis-$(openssl rand -hex 4)"

az redis create \
  --resource-group $RESOURCE_GROUP \
  --name $REDIS_NAME \
  --location $LOCATION \
  --sku Basic \
  --vm-size c1 \
  --enable-non-ssl-port false \
  --minimum-tls-version 1.2

# Wait for provisioning (5-10 minutes)
az redis show --resource-group $RESOURCE_GROUP --name $REDIS_NAME --query provisioningState

# Get connection details
REDIS_HOST=$(az redis show --name $REDIS_NAME --resource-group $RESOURCE_GROUP --query hostName -o tsv)
REDIS_PORT=6380  # TLS port
REDIS_KEY=$(az redis list-keys --name $REDIS_NAME --resource-group $RESOURCE_GROUP --query primaryKey -o tsv)

# Store in Key Vault
REDIS_CONNECTION_STRING="rediss://:${REDIS_KEY}@${REDIS_HOST}:${REDIS_PORT}"
az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name redis-connection \
  --value "$REDIS_CONNECTION_STRING"

echo "Redis Host: $REDIS_HOST"
```

### 2. Configure Redis Persistence

```bash
# Enable AOF persistence (for game state integrity)
az redis patch-schedule set \
  --resource-group $RESOURCE_GROUP \
  --name $REDIS_NAME \
  --schedule-entries '[{"dayOfWeek":"Everyday","startHourUtc":2,"maintenanceWindow":"PT5H"}]'
```

---

## Backend Deployment

### 1. Create Container Apps Environment

```bash
CONTAINERAPP_ENV="poker-env"

az containerapp env create \
  --name $CONTAINERAPP_ENV \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# Get environment ID
CONTAINERAPP_ENV_ID=$(az containerapp env show \
  --name $CONTAINERAPP_ENV \
  --resource-group $RESOURCE_GROUP \
  --query id -o tsv)
```

### 2. Build and Push Backend Docker Image

```bash
# Navigate to backend directory
cd backend

# Login to ACR
az acr login --name $ACR_NAME

# Build Docker image
docker build -t $ACR_LOGIN_SERVER/poker-backend:v1.0.0 -f Dockerfile .

# Push to ACR
docker push $ACR_LOGIN_SERVER/poker-backend:v1.0.0
```

**Dockerfile** (backend/Dockerfile):

```dockerfile
# Multi-stage build for optimization
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/main.js"]
```

### 3. Deploy Backend to Container Apps

```bash
CONTAINERAPP_NAME="poker-backend"

# Generate JWT secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Store in Key Vault
az keyvault secret set --vault-name $KEYVAULT_NAME --name jwt-secret --value "$JWT_SECRET"
az keyvault secret set --vault-name $KEYVAULT_NAME --name jwt-refresh-secret --value "$JWT_REFRESH_SECRET"

# Create Container App
az containerapp create \
  --name $CONTAINERAPP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINERAPP_ENV \
  --image $ACR_LOGIN_SERVER/poker-backend:v1.0.0 \
  --target-port 3000 \
  --ingress external \
  --transport auto \
  --min-replicas 1 \
  --max-replicas 5 \
  --cpu 0.5 \
  --memory 1.0Gi \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --secrets \
    db-conn="$DB_CONNECTION_STRING" \
    redis-conn="$REDIS_CONNECTION_STRING" \
    jwt-secret="$JWT_SECRET" \
    jwt-refresh-secret="$JWT_REFRESH_SECRET" \
  --env-vars \
    NODE_ENV=production \
    DATABASE_URL=secretref:db-conn \
    REDIS_URL=secretref:redis-conn \
    JWT_SECRET=secretref:jwt-secret \
    JWT_REFRESH_SECRET=secretref:jwt-refresh-secret

# Enable session affinity (CRITICAL for Socket.io)
az containerapp ingress sticky-sessions set \
  --name $CONTAINERAPP_NAME \
  --resource-group $RESOURCE_GROUP \
  --affinity sticky

# Get backend URL
BACKEND_URL=$(az containerapp show \
  --name $CONTAINERAPP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn -o tsv)

echo "Backend URL: https://$BACKEND_URL"
```

### 4. Configure Auto-Scaling

```bash
# Scale based on concurrent requests (for poker gameplay)
az containerapp update \
  --name $CONTAINERAPP_NAME \
  --resource-group $RESOURCE_GROUP \
  --scale-rule-name http-rule \
  --scale-rule-type http \
  --scale-rule-http-concurrency 50
```

---

## Frontend Deployment

### 1. Create Static Web App

```bash
STATICWEBAPP_NAME="poker-frontend"

# Create Static Web App (connected to GitHub)
az staticwebapp create \
  --name $STATICWEBAPP_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --source https://github.com/yourusername/poker-platform \
  --branch main \
  --app-location "/frontend" \
  --output-location "out" \
  --login-with-github

# Get frontend URL
FRONTEND_URL=$(az staticwebapp show \
  --name $STATICWEBAPP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query defaultHostname -o tsv)

echo "Frontend URL: https://$FRONTEND_URL"
```

### 2. Configure Static Web App

**staticwebapp.config.json** (frontend/staticwebapp.config.json):

```json
{
  "routes": [
    {
      "route": "/api/*",
      "rewrite": "/api/*"
    },
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,webp}", "/css/*"]
  },
  "globalHeaders": {
    "Cache-Control": "public, max-age=31536000, immutable"
  },
  "mimeTypes": {
    ".json": "application/json",
    ".webp": "image/webp"
  },
  "platform": {
    "apiRuntime": "node:18"
  }
}
```

### 3. Configure Environment Variables

```bash
# Set backend API URL
az staticwebapp appsettings set \
  --name $STATICWEBAPP_NAME \
  --resource-group $RESOURCE_GROUP \
  --setting-names \
    NEXT_PUBLIC_API_URL="https://$BACKEND_URL" \
    NEXT_PUBLIC_WS_URL="wss://$BACKEND_URL"
```

---

## Storage & CDN Configuration

### 1. Create Storage Account

```bash
STORAGE_ACCOUNT="pokerstorage$(openssl rand -hex 4)"

az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2 \
  --access-tier Hot \
  --https-only true \
  --min-tls-version TLS1_2

# Get connection string
STORAGE_CONNECTION_STRING=$(az storage account show-connection-string \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query connectionString -o tsv)
```

### 2. Create Blob Containers

```bash
# Card images (public read)
az storage container create \
  --name card-images \
  --account-name $STORAGE_ACCOUNT \
  --public-access blob

# User avatars (public read)
az storage container create \
  --name avatars \
  --account-name $STORAGE_ACCOUNT \
  --public-access blob

# Game replays (private, for future feature)
az storage container create \
  --name game-replays \
  --account-name $STORAGE_ACCOUNT \
  --public-access off
```

### 3. Upload Card Images

```bash
# Convert and upload card images (from local assets)
# Assuming you have card images in backend/assets/cards/

cd backend/assets/cards

for card in *.png; do
  # Convert to WebP (70% size reduction)
  cwebp -q 85 "$card" -o "${card%.png}.webp"

  # Upload to blob storage
  az storage blob upload \
    --account-name $STORAGE_ACCOUNT \
    --container-name card-images \
    --name "${card%.png}.webp" \
    --file "${card%.png}.webp" \
    --content-type "image/webp"
done

# Get CDN URL
STORAGE_URL="https://${STORAGE_ACCOUNT}.blob.core.windows.net"
echo "Storage URL: $STORAGE_URL"
```

### 4. Configure CDN (Optional, for global performance)

```bash
CDN_PROFILE="poker-cdn"
CDN_ENDPOINT="poker-assets-$(openssl rand -hex 4)"

# Create CDN profile
az cdn profile create \
  --resource-group $RESOURCE_GROUP \
  --name $CDN_PROFILE \
  --sku Standard_Microsoft

# Create CDN endpoint
az cdn endpoint create \
  --resource-group $RESOURCE_GROUP \
  --profile-name $CDN_PROFILE \
  --name $CDN_ENDPOINT \
  --origin ${STORAGE_ACCOUNT}.blob.core.windows.net \
  --origin-host-header ${STORAGE_ACCOUNT}.blob.core.windows.net

# Get CDN URL
CDN_URL="https://${CDN_ENDPOINT}.azureedge.net"
echo "CDN URL: $CDN_URL"
```

---

## Monitoring & Application Insights

### 1. Create Application Insights

```bash
APP_INSIGHTS_NAME="poker-insights"

az monitor app-insights component create \
  --app $APP_INSIGHTS_NAME \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP \
  --application-type web

# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app $APP_INSIGHTS_NAME \
  --resource-group $RESOURCE_GROUP \
  --query instrumentationKey -o tsv)

# Get connection string
APPINSIGHTS_CONNECTION_STRING=$(az monitor app-insights component show \
  --app $APP_INSIGHTS_NAME \
  --resource-group $RESOURCE_GROUP \
  --query connectionString -o tsv)

# Store in Key Vault
az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name appinsights-connection-string \
  --value "$APPINSIGHTS_CONNECTION_STRING"
```

### 2. Configure Backend Monitoring

**Update Container App with Application Insights**:

```bash
az containerapp update \
  --name $CONTAINERAPP_NAME \
  --resource-group $RESOURCE_GROUP \
  --set-env-vars \
    APPLICATIONINSIGHTS_CONNECTION_STRING="$APPINSIGHTS_CONNECTION_STRING"
```

**NestJS Integration** (backend/src/main.ts):

```typescript
import { TelemetryClient } from 'applicationinsights';
import * as appInsights from 'applicationinsights';

// Initialize Application Insights
appInsights
  .setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
  .setAutoDependencyCorrelation(true)
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true, true)
  .setAutoCollectExceptions(true)
  .setAutoCollectDependencies(true)
  .setAutoCollectConsole(true)
  .setUseDiskRetryCaching(true)
  .setSendLiveMetrics(true)
  .start();

const client = appInsights.defaultClient;

// Custom events for poker platform
client.trackEvent({
  name: 'GameHandCompleted',
  properties: {
    roomId: 'room-123',
    duration: 180,
    playersCount: 6,
    potAmount: 500,
  },
});
```

### 3. Configure Alerts

```bash
# High latency alert (>1 second)
az monitor metrics alert create \
  --name high-latency-alert \
  --resource-group $RESOURCE_GROUP \
  --scopes $(az containerapp show --name $CONTAINERAPP_NAME --resource-group $RESOURCE_GROUP --query id -o tsv) \
  --condition "avg requests/duration > 1000" \
  --description "Alert when average request duration exceeds 1 second" \
  --evaluation-frequency 1m \
  --window-size 5m \
  --severity 2 \
  --action email your-email@example.com

# Database connection failures
az monitor metrics alert create \
  --name db-connection-failures \
  --resource-group $RESOURCE_GROUP \
  --scopes $(az postgres flexible-server show --name $POSTGRES_SERVER --resource-group $RESOURCE_GROUP --query id -o tsv) \
  --condition "count connections/failed_connections > 5" \
  --description "Alert when database connection failures exceed 5 in 5 minutes" \
  --evaluation-frequency 1m \
  --window-size 5m \
  --severity 1 \
  --action email your-email@example.com
```

---

## CI/CD Pipeline Setup

### GitHub Actions Workflow

**.github/workflows/deploy-backend.yml**:

```yaml
name: Deploy Backend to Azure Container Apps

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - '.github/workflows/deploy-backend.yml'

env:
  AZURE_CONTAINERAPP_NAME: poker-backend
  AZURE_RESOURCE_GROUP: poker-platform-rg
  ACR_LOGIN_SERVER: ${{ secrets.ACR_LOGIN_SERVER }}
  ACR_USERNAME: ${{ secrets.ACR_USERNAME }}
  ACR_PASSWORD: ${{ secrets.ACR_PASSWORD }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        run: |
          cd backend
          npm ci

      - name: Run tests with coverage
        run: |
          cd backend
          npm run test:cov

      - name: Enforce 70% coverage threshold
        run: |
          cd backend
          npx jest --coverage --coverageThreshold='{"global":{"lines":70,"statements":70,"functions":70,"branches":70}}'

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Login to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Build Docker image
        run: |
          cd backend
          docker build -t ${{ env.ACR_LOGIN_SERVER }}/poker-backend:${{ github.sha }} .
          docker tag ${{ env.ACR_LOGIN_SERVER }}/poker-backend:${{ github.sha }} ${{ env.ACR_LOGIN_SERVER }}/poker-backend:latest

      - name: Push to ACR
        run: |
          echo "${{ env.ACR_PASSWORD }}" | docker login ${{ env.ACR_LOGIN_SERVER }} -u ${{ env.ACR_USERNAME }} --password-stdin
          docker push ${{ env.ACR_LOGIN_SERVER }}/poker-backend:${{ github.sha }}
          docker push ${{ env.ACR_LOGIN_SERVER }}/poker-backend:latest

      - name: Deploy to Container Apps
        uses: azure/container-apps-deploy-action@v1
        with:
          containerAppName: ${{ env.AZURE_CONTAINERAPP_NAME }}
          resourceGroup: ${{ env.AZURE_RESOURCE_GROUP }}
          imageToDeploy: ${{ env.ACR_LOGIN_SERVER }}/poker-backend:${{ github.sha }}

      - name: Run database migrations
        run: |
          az containerapp exec \
            --name ${{ env.AZURE_CONTAINERAPP_NAME }} \
            --resource-group ${{ env.AZURE_RESOURCE_GROUP }} \
            --command "npm run migration:run"
```

**.github/workflows/deploy-frontend.yml**:

```yaml
name: Deploy Frontend to Azure Static Web Apps

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'
      - '.github/workflows/deploy-frontend.yml'

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    name: Build and Deploy
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true

      - name: Build And Deploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/frontend"
          api_location: ""
          output_location: "out"
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
          NEXT_PUBLIC_WS_URL: ${{ secrets.NEXT_PUBLIC_WS_URL }}
```

### Set GitHub Secrets

```bash
# Create service principal for GitHub Actions
az ad sp create-for-rbac \
  --name "poker-platform-github-actions" \
  --role contributor \
  --scopes /subscriptions/<subscription-id>/resourceGroups/$RESOURCE_GROUP \
  --sdk-auth

# Copy the JSON output and add to GitHub Secrets as AZURE_CREDENTIALS

# Add other secrets via GitHub UI:
# - ACR_LOGIN_SERVER
# - ACR_USERNAME
# - ACR_PASSWORD
# - AZURE_STATIC_WEB_APPS_API_TOKEN (from Static Web App deployment token)
# - NEXT_PUBLIC_API_URL
# - NEXT_PUBLIC_WS_URL
```

---

## Security & Secrets Management

### 1. Managed Identity Setup

```bash
# Enable managed identity for Container App
az containerapp identity assign \
  --name $CONTAINERAPP_NAME \
  --resource-group $RESOURCE_GROUP \
  --system-assigned

# Get managed identity principal ID
PRINCIPAL_ID=$(az containerapp identity show \
  --name $CONTAINERAPP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query principalId -o tsv)

# Grant Key Vault access
az keyvault set-policy \
  --name $KEYVAULT_NAME \
  --object-id $PRINCIPAL_ID \
  --secret-permissions get list
```

### 2. Network Security

```bash
# Create Network Security Group
NSG_NAME="poker-nsg"

az network nsg create \
  --resource-group $RESOURCE_GROUP \
  --name $NSG_NAME

# Allow HTTPS only
az network nsg rule create \
  --resource-group $RESOURCE_GROUP \
  --nsg-name $NSG_NAME \
  --name allow-https \
  --priority 100 \
  --source-address-prefixes Internet \
  --destination-port-ranges 443 \
  --access Allow \
  --protocol Tcp
```

---

## Cost Optimization

### 1. Set Budget Alerts

```bash
# Create budget for MVP ($80/month)
az consumption budget create \
  --resource-group $RESOURCE_GROUP \
  --budget-name poker-mvp-budget \
  --amount 80 \
  --time-grain Monthly \
  --time-period start='2025-01-01' \
  --category Cost \
  --notifications actual \
    --threshold 90 \
    --contact-emails your-email@example.com

# Create budget for scale ($350/month)
az consumption budget create \
  --resource-group $RESOURCE_GROUP \
  --budget-name poker-scale-budget \
  --amount 350 \
  --time-grain Monthly \
  --time-period start='2025-01-01' \
  --category Cost \
  --notifications actual \
    --threshold 90 \
    --contact-emails your-email@example.com
```

### 2. Reserved Capacity (Save 30-40%)

```bash
# Purchase 1-year PostgreSQL reservation (save 32%)
az postgres flexible-server show-pricing \
  --resource-group $RESOURCE_GROUP \
  --name $POSTGRES_SERVER

# Visit Azure Portal → Reservations to purchase
# Estimated savings: $25/month → $17/month (-$8)
```

---

## Disaster Recovery

### Backup Configuration

```bash
# PostgreSQL automated backups (already enabled)
az postgres flexible-server backup list \
  --resource-group $RESOURCE_GROUP \
  --name $POSTGRES_SERVER

# Manual backup (before major changes)
az postgres flexible-server backup create \
  --resource-group $RESOURCE_GROUP \
  --name $POSTGRES_SERVER \
  --backup-name pre-migration-backup

# Redis export to Blob Storage (weekly)
az redis export \
  --resource-group $RESOURCE_GROUP \
  --name $REDIS_NAME \
  --container $STORAGE_URL/redis-backups \
  --prefix redis-backup-$(date +%Y%m%d)
```

---

## Troubleshooting

### Common Issues

#### 1. Container App Not Starting

```bash
# Check logs
az containerapp logs show \
  --name $CONTAINERAPP_NAME \
  --resource-group $RESOURCE_GROUP \
  --tail 100

# Check revision status
az containerapp revision list \
  --name $CONTAINERAPP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query '[].{Name:name, Active:properties.active, Health:properties.healthState}'
```

#### 2. Database Connection Failures

```bash
# Test connection from local machine
psql "$DB_CONNECTION_STRING"

# Check firewall rules
az postgres flexible-server firewall-rule list \
  --resource-group $RESOURCE_GROUP \
  --name $POSTGRES_SERVER

# Check SSL certificate
openssl s_client -connect ${POSTGRES_SERVER}.postgres.database.azure.com:5432 -starttls postgres
```

#### 3. WebSocket Connection Issues

```bash
# Verify sticky sessions enabled
az containerapp ingress sticky-sessions show \
  --name $CONTAINERAPP_NAME \
  --resource-group $RESOURCE_GROUP

# Test WebSocket connection
websocat "wss://$BACKEND_URL/socket.io/?EIO=4&transport=websocket"
```

---

## Summary

### Deployment Checklist

- [ ] Azure CLI installed and authenticated
- [ ] Resource group created
- [ ] Key Vault provisioned with secrets
- [ ] Container Registry created
- [ ] PostgreSQL Flexible Server deployed and configured
- [ ] Redis Cache provisioned
- [ ] Backend built and deployed to Container Apps
- [ ] Sticky sessions enabled for WebSocket
- [ ] Frontend deployed to Static Web Apps
- [ ] Storage account created with card images uploaded
- [ ] Application Insights configured
- [ ] GitHub Actions CI/CD pipelines set up
- [ ] Budget alerts configured
- [ ] Database migrations executed
- [ ] Health checks passing

### Final URLs

```bash
echo "=== Deployment URLs ==="
echo "Backend API: https://$BACKEND_URL"
echo "Frontend: https://$FRONTEND_URL"
echo "Storage: $STORAGE_URL"
echo "CDN: $CDN_URL"
echo ""
echo "=== Azure Portal Links ==="
echo "Resource Group: https://portal.azure.com/#@/resource/subscriptions/<subscription-id>/resourceGroups/$RESOURCE_GROUP"
echo "Container Apps: https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.App%2FcontainerApps"
echo "Application Insights: https://portal.azure.com/#@/resource/subscriptions/<subscription-id>/resourceGroups/$RESOURCE_GROUP/providers/microsoft.insights/components/$APP_INSIGHTS_NAME"
```

### Cost Summary

| Service | MVP Cost | Scale Cost | Annual (MVP) | Annual (Scale) |
|---------|----------|------------|--------------|----------------|
| Container Apps | $25 | $80 | $300 | $960 |
| PostgreSQL | $25 | $130 | $300 | $1,560 |
| Redis | $16 | $45 | $192 | $540 |
| Static Web Apps | $0 | $15 | $0 | $180 |
| Storage + CDN | $1 | $8 | $12 | $96 |
| Container Registry | $5 | $5 | $60 | $60 |
| **Total** | **$72** | **$323** | **$864** | **$3,876** |

---

**Deployment Complete!** 🎉

Your Texas Poker Platform is now running on Azure with production-grade infrastructure, auto-scaling, monitoring, and CI/CD pipelines.

For implementation, proceed to `tasks.md` to start Phase 1: Setup & Infrastructure.
