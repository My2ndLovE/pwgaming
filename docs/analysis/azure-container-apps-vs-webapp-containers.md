# Azure Container Apps vs Web App for Containers: Poker Platform Analysis

**Project**: PWGaming Texas Hold'em Poker Platform
**Date**: 2025-11-14
**Context**: Backend hosting decision for NestJS + Socket.io real-time poker game

---

## Executive Summary

Both **Azure Container Apps** and **Azure Web App for Containers** can host the poker platform backend. The current architecture recommends Container Apps, but Web App for Containers offers advantages in certain scenarios.

### 🚀 Key Takeaway: ZERO Code Changes Required

**Switching between Container Apps and Web App requires NO code changes** - only infrastructure configuration changes (deployment commands, Azure CLI flags). Your NestJS backend, Dockerfile, and all application code remain **100% identical** on both platforms.

### Quick Recommendation

| Scenario | Recommendation | Why |
|----------|----------------|-----|
| **MVP (current)** | **Container Apps** | Serverless pricing, built-in sticky sessions, better for variable traffic |
| **Stable traffic** | **Web App for Containers** | Predictable pricing, better for 24/7 poker platform, simpler scaling |
| **Heavy WebSocket use** | **Container Apps** | Native sticky session support, better WebSocket handling |
| **Budget-conscious** | **Container Apps (MVP)** → **Web App (Scale)** | Pay-per-request initially, fixed pricing at scale |

---

## Feature Comparison

### 1. WebSocket & Sticky Sessions (CRITICAL for Poker)

| Feature | Container Apps | Web App for Containers |
|---------|----------------|------------------------|
| **Sticky Sessions** | ✅ Native support (`--affinity sticky`) | ✅ ARR Affinity (Application Request Routing) |
| **WebSocket** | ✅ First-class support | ✅ Full support |
| **Socket.io Compatibility** | ✅ Excellent (HTTP/2 + WebSocket auto-upgrade) | ✅ Excellent |
| **Configuration** | Single flag in CLI | Requires ARR Affinity cookie configuration |
| **Session Persistence** | Cookie-based, automatically managed | Cookie-based, requires manual configuration |

**Winner**: **Container Apps** (easier setup)

---

### 2. Pricing Model

#### Container Apps Pricing

```
MVP Phase (50 concurrent players, ~20% utilization):
- Consumption plan: Pay per vCPU/GB-second
- 0.5 vCPU × 1GB RAM × ~5 hours/day × 30 days = ~$25/month
- Includes 180,000 free vCPU-seconds/month

Scale Phase (200 concurrent players, ~80% utilization):
- 2 vCPU × 4GB RAM × ~18 hours/day × 30 days = ~$120/month
```

**Pros**:
- No cost when idle
- Scales to zero (development/testing)
- Great for variable traffic

**Cons**:
- Unpredictable costs at high usage
- Cold start latency (1-2 seconds)

#### Web App for Containers Pricing

```
MVP Phase:
- Basic B1: 1 vCore, 1.75GB RAM = $13.14/month (24/7)
- Always-on, no cold starts
- Fixed cost

Scale Phase:
- Standard S1: 1 vCore, 1.75GB RAM = $72/month (24/7)
- Premium P1v2: 1 vCore, 3.5GB RAM = $101/month (24/7)
- Includes autoscaling, custom domains, deployment slots
```

**Pros**:
- Predictable monthly costs
- No cold starts
- Better value for 24/7 workloads

**Cons**:
- Pay even when idle
- More expensive for low-usage MVP

**Winner**: **Container Apps (MVP)**, **Web App (Scale)**

---

### 3. Scaling

| Feature | Container Apps | Web App for Containers |
|---------|----------------|------------------------|
| **Auto-scaling** | ✅ HTTP concurrency rules (50 req/instance) | ✅ CPU/Memory-based, Custom metrics |
| **Scale-to-zero** | ✅ Yes (serverless) | ❌ No (minimum 1 instance) |
| **Max instances** | 300 (default 10) | 30 (Standard), 100 (Premium) |
| **Scaling triggers** | HTTP requests, Custom metrics, KEDA | Built-in rules, Azure Monitor metrics |
| **Warm-up time** | 1-2 seconds (cold start) | 0 seconds (always warm) |

**Poker Platform Impact**:
- **Container Apps**: Better for sudden player spikes (tournaments)
- **Web App**: Better for consistent 24/7 poker tables

**Winner**: **Tie** (depends on traffic pattern)

---

### 4. Deployment & CI/CD

| Feature | Container Apps | Web App for Containers |
|---------|----------------|------------------------|
| **Deployment** | Azure CLI, GitHub Actions, ARM templates | Azure CLI, GitHub Actions, ARM templates, Docker Hub |
| **Zero-downtime** | ✅ Rolling updates (revisions) | ✅ Deployment slots (staging → production swap) |
| **Rollback** | ✅ Single command (revision activation) | ✅ Swap back to previous slot |
| **Blue/Green** | ✅ Traffic splitting (10% new, 90% old) | ✅ Deployment slots |
| **Database Migrations** | Run in init container | Run in startup script or separate job |

**Winner**: **Web App for Containers** (deployment slots are superior)

---

### 5. Monitoring & Logging

| Feature | Container Apps | Web App for Containers |
|---------|----------------|------------------------|
| **Application Insights** | ✅ Full integration | ✅ Full integration |
| **Container logs** | ✅ Azure Monitor, Log Analytics | ✅ Azure Monitor, Log Analytics |
| **Metrics** | Custom metrics, HTTP requests, CPU/Memory | Custom metrics, HTTP requests, CPU/Memory, .NET-specific |
| **Log Streaming** | ✅ `az containerapp logs tail` | ✅ `az webapp log tail` |
| **Alerts** | ✅ Azure Monitor | ✅ Azure Monitor |

**Winner**: **Tie** (identical capabilities)

---

### 6. Networking & Security

| Feature | Container Apps | Web App for Containers |
|---------|----------------|------------------------|
| **VNet Integration** | ✅ Yes (requires environment) | ✅ Yes (Standard tier+) |
| **Private Endpoints** | ✅ Yes | ✅ Yes |
| **IP Restrictions** | ✅ Yes | ✅ Yes |
| **Managed Identity** | ✅ System/User-assigned | ✅ System/User-assigned |
| **SSL Certificates** | ✅ Auto (managed), Custom | ✅ Auto (managed), Custom |
| **Custom Domains** | ✅ Yes | ✅ Yes |

**Winner**: **Tie**

---

### 7. Developer Experience

| Feature | Container Apps | Web App for Containers |
|---------|----------------|------------------------|
| **Local Development** | Docker Desktop + Azure CLI | Docker Desktop + Azure CLI |
| **VS Code Extension** | ✅ Azure Container Apps extension | ✅ Azure App Service extension |
| **Debugging** | `az containerapp logs tail`, Application Insights | `az webapp log tail`, SSH access, Application Insights |
| **Environment Variables** | Secrets + environment variables | App Settings (encrypted) |
| **Configuration** | YAML-based, CLI-friendly | Portal-heavy, CLI-friendly |

**Winner**: **Web App for Containers** (SSH access is valuable)

---

### 8. Limitations & Constraints

#### Container Apps Limitations

- **Cold starts**: 1-2 second delay on scale-up (mitigate with min replicas)
- **No SSH access**: Debugging harder (use `az containerapp exec`)
- **Newer service**: Less mature ecosystem (launched 2022)
- **Learning curve**: KEDA scaling concepts

#### Web App for Containers Limitations

- **Always-on cost**: Minimum 1 instance always running
- **Instance limit**: 30 (Standard) vs 300 (Container Apps)
- **No scale-to-zero**: Wastes resources during off-peak

---

## Poker Platform-Specific Analysis

### MVP Requirements (50-100 concurrent players)

| Requirement | Container Apps | Web App for Containers |
|-------------|----------------|------------------------|
| **Real-time gameplay (<1s latency)** | ✅ Sticky sessions, WebSocket | ✅ ARR Affinity, WebSocket |
| **Variable traffic (peak evening)** | ✅ Auto-scale during peak, scale-down at night | ⚠️ Pay for idle capacity at night |
| **Budget-friendly (<$80/month)** | ✅ $25-30/month (consumption) | ✅ $13/month (Basic B1) |
| **Financial transactions (Redis + PostgreSQL)** | ✅ VNet integration | ✅ VNet integration |
| **TDD deployment (CI/CD)** | ✅ GitHub Actions | ✅ GitHub Actions + deployment slots |

**MVP Recommendation**: **Azure Container Apps**
**Reason**: Lower cost for variable traffic, easier sticky session setup

---

### Scale Phase (200+ concurrent players, 24/7 poker tables)

| Requirement | Container Apps | Web App for Containers |
|-------------|----------------|------------------------|
| **24/7 availability** | ⚠️ Cold starts possible (mitigate with min replicas) | ✅ Always warm, zero cold starts |
| **Predictable costs** | ❌ Variable costs (can spike) | ✅ Fixed monthly costs |
| **High concurrency (200+ players)** | ✅ Scale to 300 instances | ⚠️ Limited to 30 instances (Standard) |
| **Zero-downtime deployments** | ✅ Revision management | ✅ Deployment slots (superior) |
| **Advanced monitoring** | ✅ Application Insights | ✅ Application Insights + SSH access |

**Scale Recommendation**: **Azure Web App for Containers (Standard S1+)**
**Reason**: Fixed pricing, zero cold starts, deployment slots for safer releases

---

## Code Changes Required: NONE ✅

### Why No Code Changes?

Both Azure Container Apps and Web App for Containers run **the exact same Docker container**. The differences are purely infrastructure/deployment configuration.

**Your NestJS application code is 100% portable because:**

1. **Same Runtime Environment**: Both use Linux containers with Node.js 18
2. **Same Port Configuration**: Both read `process.env.PORT` (backend/src/main.ts:6)
3. **Same Environment Variables**: Both use the same env var names (DATABASE_URL, REDIS_URL, JWT_SECRET)
4. **Same Dockerfile**: Use the same Dockerfile for both platforms (already documented in technical/azure-deployment-guide.md:376-412)
5. **Same Container Registry**: Both pull from Azure Container Registry

### What Changes? (Infrastructure Only)

| Component | Container Apps | Web App for Containers | Code Impact |
|-----------|----------------|------------------------|-------------|
| **Deployment command** | `az containerapp create` | `az webapp create` | ❌ None |
| **Sticky sessions** | `--affinity sticky` flag | `--client-affinity-enabled true` | ❌ None |
| **Environment variables** | `--env-vars` + `--secrets` | `az webapp config appsettings` | ❌ None |
| **Scaling rules** | HTTP concurrency rules | CPU/Memory-based rules | ❌ None |
| **Monitoring** | Application Insights connection string | Application Insights connection string | ❌ None |
| **Docker image** | Same ACR image | Same ACR image | ❌ None |

### Migration Verification

**Current backend code is already compatible** (verified):

```typescript
// backend/src/main.ts:6 - Works on both platforms
await app.listen(process.env.PORT ?? 3000);

// backend/src/config/configuration.ts - Works on both platforms
database: {
  host: process.env.DB_HOST || 'localhost',
  // ... all config reads from environment variables
}
```

**No code changes needed because:**
- ✅ Port binding uses `process.env.PORT` (both platforms set this)
- ✅ Configuration uses environment variables (both platforms inject these)
- ✅ WebSocket/Socket.io works identically (both support sticky sessions)
- ✅ Redis/PostgreSQL connections unchanged (same connection strings)
- ✅ Docker container unchanged (same Dockerfile, same runtime)

### What About the Dockerfile?

**The same Dockerfile works on both platforms** (no changes needed):

```dockerfile
# This Dockerfile works for BOTH Container Apps AND Web App
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

**Why it works on both:**
- Both platforms auto-detect `EXPOSE 3000` and map to `process.env.PORT`
- Both platforms run the same `CMD ["node", "dist/main.js"]` startup command
- Both platforms support multi-stage builds for optimization
- Both platforms support health checks (optional, same format)

---

## Migration Path

### Phase 1 (MVP): Azure Container Apps

**Configuration**:
```bash
az containerapp create \
  --name poker-backend \
  --resource-group poker-platform-rg \
  --environment poker-env \
  --image <acr>.azurecr.io/poker-backend:latest \
  --target-port 3000 \
  --ingress external \
  --transport auto \
  --min-replicas 1 \  # Avoid cold starts
  --max-replicas 5 \
  --cpu 0.5 \
  --memory 1.0Gi \
  --secrets db-conn=<secret> redis-conn=<secret>

# Enable sticky sessions (CRITICAL)
az containerapp ingress sticky-sessions set \
  --name poker-backend \
  --resource-group poker-platform-rg \
  --affinity sticky
```

**Estimated Cost**: $25-40/month

---

### Phase 2 (Scale): Migrate to Azure Web App for Containers

**When to migrate**:
- Sustained 200+ concurrent players (24/7 traffic)
- Monthly Container Apps bill exceeds $100
- Need deployment slots for safer releases
- Cold starts impact user experience

**Migration Steps**:

1. **Create Web App for Containers**:
```bash
az appservice plan create \
  --name poker-plan \
  --resource-group poker-platform-rg \
  --location southeastasia \
  --is-linux \
  --sku S1  # $72/month

az webapp create \
  --name poker-backend-webapp \
  --resource-group poker-platform-rg \
  --plan poker-plan \
  --deployment-container-image-name <acr>.azurecr.io/poker-backend:latest
```

2. **Configure Sticky Sessions**:
```bash
az webapp config set \
  --name poker-backend-webapp \
  --resource-group poker-platform-rg \
  --web-sockets-enabled true

# Enable ARR Affinity (sticky sessions)
az webapp update \
  --name poker-backend-webapp \
  --resource-group poker-platform-rg \
  --client-affinity-enabled true
```

3. **Configure App Settings** (environment variables):
```bash
az webapp config appsettings set \
  --name poker-backend-webapp \
  --resource-group poker-platform-rg \
  --settings \
    DATABASE_URL="@Microsoft.KeyVault(...)" \
    REDIS_URL="@Microsoft.KeyVault(...)" \
    NODE_ENV=production
```

4. **Set Up Deployment Slots**:
```bash
az webapp deployment slot create \
  --name poker-backend-webapp \
  --resource-group poker-platform-rg \
  --slot staging

# Deploy to staging first, then swap
az webapp deployment slot swap \
  --name poker-backend-webapp \
  --resource-group poker-platform-rg \
  --slot staging \
  --target-slot production
```

**Estimated Cost**: $72/month (S1) or $101/month (P1v2)

5. **Update CI/CD pipeline** (.github/workflows/deploy-backend.yml):
```yaml
# Change deployment step from:
- name: Deploy to Container Apps
  uses: azure/container-apps-deploy-action@v1
  with:
    containerAppName: poker-backend

# To:
- name: Deploy to Web App
  uses: azure/webapps-deploy@v2
  with:
    app-name: poker-backend-webapp
    images: ${{ env.ACR_LOGIN_SERVER }}/poker-backend:${{ github.sha }}
```

**Migration Downtime**: ~5 minutes (time to switch DNS/traffic)

**Rollback Plan**: Keep Container Apps running during initial Web App deployment. Switch traffic back if issues arise.

---

## Cost Comparison Summary

### MVP (50-100 concurrent players, ~5 hours peak/day)

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| **Container Apps** | **$25-40** | ✅ Best for MVP |
| **Web App (Basic B1)** | $13 | ⚠️ Limited scaling, 1 instance max |
| **Web App (Standard S1)** | $72 | ❌ Overkill for MVP |

### Scale (200+ concurrent players, 24/7 poker tables)

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| **Container Apps** | $80-150 | ⚠️ Variable costs |
| **Web App (Standard S1)** | **$72** | ✅ Fixed cost, predictable |
| **Web App (Premium P1v2)** | $101 | ✅ Better performance (3.5GB RAM) |

**Total Infrastructure Cost (with DB + Redis)**:

| Phase | Container Apps | Web App (Standard S1) |
|-------|----------------|-----------------------|
| **MVP** | $72/month | $85/month |
| **Scale** | $280-350/month | **$323/month** |

---

## Recommendation

### Short-term (MVP - Months 1-6)

✅ **Use Azure Container Apps**

**Reasons**:
1. Lower cost for variable traffic ($25 vs $72)
2. Easier sticky session configuration
3. Auto-scaling handles evening poker peaks
4. Pay only for active usage (test environments scale to zero)
5. Modern serverless architecture

**Tradeoffs**:
- 1-2 second cold starts (mitigate with `min-replicas: 1`)
- Variable costs (set budget alerts)

---

### Long-term (Scale - Months 6+)

✅ **Migrate to Azure Web App for Containers (Standard S1 or Premium P1v2)**

**Reasons**:
1. Fixed, predictable monthly costs
2. Zero cold starts (better UX for 24/7 poker)
3. Deployment slots for zero-downtime releases
4. SSH access for production debugging
5. Better value at sustained high traffic

**Migration Triggers**:
- Sustained 200+ concurrent players (80%+ utilization 24/7)
- Container Apps monthly bill exceeds $100
- Cold starts impact user experience
- Need blue/green deployments

---

## Implementation Checklist

### Container Apps Setup (Current)

- [x] Architecture documented in `technical/azure-deployment-guide.md:340`
- [ ] Deploy Container Apps environment
- [ ] Configure sticky sessions (`--affinity sticky`)
- [ ] Set `min-replicas: 1` to avoid cold starts
- [ ] Configure Application Insights
- [ ] Set budget alerts at $80/month

### Future: Web App Migration (When Triggered)

- [ ] Create App Service Plan (Standard S1)
- [ ] Deploy Web App for Containers
- [ ] Configure ARR Affinity (sticky sessions)
- [ ] Set up deployment slots (staging → production)
- [ ] Configure SSH access for debugging
- [ ] Migrate traffic from Container Apps
- [ ] Monitor cost savings vs Container Apps

---

## Conclusion

**Current Choice**: **Azure Container Apps** is the right choice for MVP due to lower costs, easier WebSocket configuration, and serverless benefits.

**Future Path**: Monitor usage and costs. When sustained 24/7 traffic justifies fixed pricing (~6 months post-launch), migrate to **Azure Web App for Containers (Standard S1)** for predictable costs, zero cold starts, and deployment slots.

**Hybrid Approach**: Keep development/testing environments on Container Apps (scale-to-zero), run production on Web App for Containers (always-on).

---

**Next Steps**:
1. Proceed with Container Apps deployment (current plan)
2. Set budget alerts to trigger migration evaluation
3. Re-evaluate after 3 months of production data
4. Prepare migration runbook when usage patterns stabilize
