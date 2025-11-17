# Backup & Restore Procedures

## Database Backup Strategy

### PostgreSQL Automated Backups

Azure Database for PostgreSQL provides automatic backups with configurable retention.

**Backup Configuration**:
- **Retention**: 35 days (maximum)
- **Frequency**: Continuous (transaction log)
- **Type**: Full backup + incremental
- **Geo-redundancy**: Enabled for disaster recovery

### Manual Backup

```bash
# Create manual backup
az postgres flexible-server backup create \
  --resource-group poker-production \
  --name poker-db \
  --backup-name manual-backup-$(date +%Y%m%d)

# List backups
az postgres flexible-server backup list \
  --resource-group poker-production \
  --name poker-db
```

### Export Database

```bash
# Export to SQL file
pg_dump -h <host> -U <user> -d poker_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Export specific tables
pg_dump -h <host> -U <user> -d poker_production -t transactions -t users > critical_data.sql

# Compressed backup
pg_dump -h <host> -U <user> -d poker_production | gzip > backup.sql.gz
```

## Redis Backup

### RDB Snapshots

```bash
# Configure snapshot frequency in Redis
CONFIG SET save "900 1 300 10 60 10000"

# Manual snapshot
BGSAVE

# Check last save time
LASTSAVE
```

### Export Redis Data

```bash
# Using redis-cli
redis-cli --rdb dump.rdb

# Copy RDB file from Azure Cache
az redis export \
  --resource-group poker-production \
  --name poker-cache \
  --prefix backup \
  --container <storage-container-url>
```

## Restore Procedures

### PostgreSQL Point-in-Time Restore

```bash
# Restore to specific time
az postgres flexible-server restore \
  --resource-group poker-production \
  --name poker-db-restored \
  --source-server poker-db \
  --restore-time "2025-01-18T10:00:00Z"
```

### Restore from SQL File

```bash
# Restore full database
psql -h <host> -U <user> -d poker_production < backup.sql

# Restore compressed backup
gunzip -c backup.sql.gz | psql -h <host> -U <user> -d poker_production

# Restore specific tables
psql -h <host> -U <user> -d poker_production < critical_data.sql
```

### Redis Data Import

```bash
# Import RDB file
redis-cli --rdb dump.rdb

# Import using Azure CLI
az redis import \
  --resource-group poker-production \
  --name poker-cache \
  --files <storage-blob-url>
```

## Disaster Recovery Plan

### RTO (Recovery Time Objective): 1 hour
### RPO (Recovery Point Objective): 5 minutes

### DR Steps

1. **Detection** (5 min)
   - Monitor alerts for service outage
   - Verify Azure service health

2. **Assessment** (10 min)
   - Identify scope of failure
   - Determine if regional failover needed

3. **Failover** (30 min)
   - Switch to geo-redundant region
   - Point DNS to DR endpoint
   - Restore from latest backup

4. **Verification** (10 min)
   - Run smoke tests
   - Verify data integrity
   - Confirm all services operational

5. **Communication** (5 min)
   - Notify stakeholders
   - Update status page
   - Post incident report

### Regional Failover

```bash
# Promote geo-replica to primary
az postgres flexible-server replica promote \
  --resource-group poker-dr \
  --name poker-db-replica

# Update application connection strings
# Update DNS records
# Verify connectivity
```

## Backup Verification

### Weekly Backup Test

```bash
#!/bin/bash
# backup-verification.sh

# 1. Create test environment
az postgres flexible-server create \
  --resource-group poker-test \
  --name poker-db-test \
  --backup-restore-source poker-db

# 2. Run integrity checks
psql -h poker-db-test -U admin -d poker_production -c "
  SELECT COUNT(*) FROM users;
  SELECT COUNT(*) FROM transactions;
  SELECT COUNT(*) FROM games;
"

# 3. Cleanup
az postgres flexible-server delete \
  --resource-group poker-test \
  --name poker-db-test \
  --yes
```

### Data Integrity Checks

```sql
-- Verify transaction balances match user balances
SELECT 
  userId,
  SUM(CASE WHEN type IN ('deposit', 'win', 'cashout', 'admin_credit') THEN amount ELSE -amount END) as calculated_balance,
  (SELECT balance FROM users WHERE id = transactions.userId) as actual_balance
FROM transactions
GROUP BY userId
HAVING calculated_balance != actual_balance;

-- Check for orphaned records
SELECT * FROM games WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE users.id = games.createdBy
);
```

## Backup Monitoring

### Alerts

Configure alerts for:
- Backup failure
- Backup duration > 30 minutes
- Backup size decrease > 20%
- Failed restore tests

### Backup Metrics

Monitor:
- Last successful backup timestamp
- Backup file size trends
- Restore test success rate
- Storage consumption

## Encryption

### Encryption at Rest
- Azure automatically encrypts all backups
- Uses Microsoft-managed keys by default
- Option to use customer-managed keys (CMK)

### Encryption in Transit
- All backup transfers use TLS 1.2+
- Geo-replication encrypted

## Compliance

### Retention Policy
- **Production**: 35 days
- **Staging**: 7 days  
- **Development**: 1 day

### Access Control
- Backups accessible only to authorized admins
- MFA required for restore operations
- All backup/restore operations logged

## Automation

### Scheduled Exports

```bash
# Cron job for daily exports
0 2 * * * /scripts/backup-export.sh

# backup-export.sh
#!/bin/bash
DATE=$(date +%Y%m%d)
pg_dump -h <host> -U <user> poker_production | gzip > /backups/poker_$DATE.sql.gz
aws s3 cp /backups/poker_$DATE.sql.gz s3://poker-backups/
find /backups -name "*.sql.gz" -mtime +7 -delete
```

### Restore Testing

```bash
# Monthly restore test
0 0 1 * * /scripts/restore-test.sh
```

## Emergency Contacts

- **Database Admin**: dba@company.com
- **DevOps Lead**: devops@company.com
- **Azure Support**: +1-800-AZURE
- **On-call**: oncall@company.com
