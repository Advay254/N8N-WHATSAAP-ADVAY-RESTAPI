# Deployment Guide

This guide covers different deployment options for the Baileys WhatsApp API.

## Quick Start with Docker Compose

The easiest way to deploy the entire stack:

```bash
# Clone the repository
git clone <repository-url>
cd baileys-api

# Copy and configure environment
cp .env.example .env
# Edit .env with your settings

# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec baileys-api npx prisma migrate deploy

# Check logs
docker-compose logs -f baileys-api
```

Services will be available at:
- API: http://localhost:3001
- Dashboard: http://localhost:3001/dashboard
- API Docs: http://localhost:3001/api-docs
- Database: localhost:5432
- Redis: localhost:6379

## Manual Installation

### Prerequisites

- Node.js 20+
- PostgreSQL 12+
- Redis (optional, for clustering)

### Steps

1. **Install dependencies:**
```bash
yarn install
```

2. **Set up environment:**
```bash
cp .env.example .env
# Configure your .env file
```

3. **Set up database:**
```bash
# Create database
createdb baileys_api

# Generate Prisma client
yarn db:generate

# Run migrations
yarn migrate
```

4. **Build and start:**
```bash
yarn build
yarn start
```

## Production Deployment

### Environment Variables

Critical production environment variables:

```env
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL="postgresql://user:password@host:5432/baileys_api"

# Security (CHANGE THESE!)
JWT_SECRET=your-super-secure-jwt-secret-here
API_KEY_SECRET=your-api-key-secret-here
WEBHOOK_SECRET=your-webhook-secret-here

# CORS
CORS_ORIGIN=https://yourdomain.com

# File uploads
MAX_FILE_SIZE=50mb
UPLOAD_PATH=/app/uploads

# Logging
LOG_LEVEL=info
LOG_FILE=/app/logs/app.log

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Docker Production Setup

1. **Build production image:**
```bash
docker build -t baileys-api:latest .
```

2. **Run with production settings:**
```bash
docker run -d \
  --name baileys-api \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e DATABASE_URL="your-database-url" \
  -e JWT_SECRET="your-jwt-secret" \
  -v /host/auth_sessions:/app/auth_sessions \
  -v /host/uploads:/app/uploads \
  -v /host/logs:/app/logs \
  baileys-api:latest
```

### Kubernetes Deployment

Example Kubernetes manifests:

**deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: baileys-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: baileys-api
  template:
    metadata:
      labels:
        app: baileys-api
    spec:
      containers:
      - name: baileys-api
        image: baileys-api:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: baileys-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: baileys-secrets
              key: jwt-secret
        volumeMounts:
        - name: auth-sessions
          mountPath: /app/auth_sessions
        - name: uploads
          mountPath: /app/uploads
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
      volumes:
      - name: auth-sessions
        persistentVolumeClaim:
          claimName: baileys-auth-pvc
      - name: uploads
        persistentVolumeClaim:
          claimName: baileys-uploads-pvc
```

**service.yaml:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: baileys-api-service
spec:
  selector:
    app: baileys-api
  ports:
  - port: 80
    targetPort: 3001
  type: LoadBalancer
```

### Cloud Deployment

#### AWS ECS

1. **Create task definition:**
```json
{
  "family": "baileys-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "baileys-api",
      "image": "your-account.dkr.ecr.region.amazonaws.com/baileys-api:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:baileys/database-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/baileys-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Google Cloud Run

```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/PROJECT-ID/baileys-api

# Deploy to Cloud Run
gcloud run deploy baileys-api \
  --image gcr.io/PROJECT-ID/baileys-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-env-vars DATABASE_URL="your-database-url" \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10
```

### Database Setup

#### PostgreSQL

For production, use a managed database service:

- **AWS RDS**
- **Google Cloud SQL**
- **Azure Database for PostgreSQL**
- **DigitalOcean Managed Databases**

Example connection string:
```
postgresql://username:password@host:5432/baileys_api?sslmode=require
```

#### Migrations

Run migrations in production:
```bash
npx prisma migrate deploy
```

### Monitoring and Logging

#### Health Checks

The API provides a health check endpoint:
```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

#### Logging

Logs are written to:
- Console (structured JSON)
- File: `logs/app.log`
- Error file: `logs/error.log`

#### Metrics

Consider integrating with:
- **Prometheus** for metrics collection
- **Grafana** for visualization
- **Sentry** for error tracking
- **DataDog** for APM

### Security Considerations

1. **Environment Variables:**
   - Never commit secrets to version control
   - Use proper secret management (AWS Secrets Manager, etc.)

2. **Network Security:**
   - Use HTTPS in production
   - Configure proper CORS origins
   - Implement rate limiting

3. **Database Security:**
   - Use SSL connections
   - Restrict database access
   - Regular backups

4. **API Security:**
   - Rotate API keys regularly
   - Monitor for suspicious activity
   - Implement proper authentication

### Scaling

#### Horizontal Scaling

The API is stateless and can be scaled horizontally:

1. **Load Balancer:** Use nginx, HAProxy, or cloud load balancers
2. **Session Storage:** Use Redis for session clustering
3. **Database:** Use connection pooling and read replicas

#### Vertical Scaling

Resource requirements:
- **CPU:** 0.5-1 core per instance
- **Memory:** 512MB-1GB per instance
- **Storage:** Depends on media uploads and logs

### Backup and Recovery

1. **Database Backups:**
   - Automated daily backups
   - Point-in-time recovery
   - Cross-region replication

2. **File Storage:**
   - Backup auth_sessions directory
   - Backup uploads directory
   - Use cloud storage for persistence

3. **Configuration:**
   - Version control all configuration
   - Document deployment procedures
   - Test recovery procedures

### Troubleshooting

Common issues and solutions:

1. **Connection Issues:**
   - Check database connectivity
   - Verify environment variables
   - Check firewall rules

2. **WhatsApp Session Issues:**
   - Clear auth_sessions directory
   - Check QR code generation
   - Verify phone number format

3. **Performance Issues:**
   - Monitor database queries
   - Check memory usage
   - Review log files

4. **File Upload Issues:**
   - Check disk space
   - Verify file permissions
   - Review upload limits

## Render Deployment

### Prerequisites

- A Render account with a web service
- An external PostgreSQL database (e.g., Supabase, Render Postgres, Neon)

### Important: Session Persistence

This API uses **database-backed authentication state** (`useDatabaseAuthState`). WhatsApp
session credentials are stored in the `sessions.authData` column in PostgreSQL instead of
the filesystem. This is critical for Render (and similar ephemeral platforms) because the
filesystem is wiped on every restart/deploy.

### Build Command

```
yarn install && npx prisma generate && npx prisma migrate deploy && yarn build
```

### Start Command

```
yarn start
```

### Required Environment Variables

```
NODE_ENV=production
DATABASE_URL=postgresql://your-supabase-connection-string
JWT_SECRET=generate-a-random-string
API_KEY_SECRET=generate-a-random-string
WEBHOOK_SECRET=generate-a-random-string
API_BASE_URL=https://your-service.onrender.com
CORS_ORIGIN=*
```

> **Note:** `MAX_FILE_SIZE` should be a plain number (e.g. `50`), not `50mb`.

### Database Migrations

Migrations run automatically as part of the build command via `prisma migrate deploy`.
No manual migration steps are required on Render after the initial deployment.
