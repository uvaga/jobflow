# Docker Setup for JobFlow

## Services

- **MongoDB 4.4**: Port 27017 (4.4 is used for compatibility with CPUs without AVX support)
- **Mongo Express**: Port 8081 (Web UI)

## Quick Start

### Start all services:
```bash
docker-compose up -d
```

### Stop all services:
```bash
docker-compose down
```

### View logs:
```bash
docker-compose logs -f
```

### Clean everything (including data):
```bash
docker-compose down -v
```

## Access Points

### MongoDB
- **Connection String**: `mongodb://jobflow_admin:jobflow_dev_password@localhost:27017/jobflow?authSource=admin`
- **Database**: `jobflow`
- **Admin User**: `jobflow_admin`
- **Admin Password**: `jobflow_dev_password`

### Mongo Express (Web UI)
- **URL**: http://localhost:8081/
- **Username**: `admin`
- **Password**: `admin123`

## Database Management

### Connect via MongoDB Shell
```bash
docker exec -it jobflow-mongodb mongosh -u jobflow_admin -p jobflow_dev_password --authenticationDatabase admin
```

### Backup Database
```bash
docker exec jobflow-mongodb mongodump -u jobflow_admin -p jobflow_dev_password --authenticationDatabase admin --db jobflow --out /data/backup
```

### Restore Database
```bash
docker exec jobflow-mongodb mongorestore -u jobflow_admin -p jobflow_dev_password --authenticationDatabase admin --db jobflow /data/backup/jobflow
```

## Troubleshooting

### Port 27017 already in use
```bash
# Windows: Find and kill process
netstat -ano | findstr :27017
taskkill /PID <PID> /F
```

### Reset database completely
```bash
docker-compose down -v
docker-compose up -d
```

### View MongoDB logs
```bash
docker-compose logs -f mongodb
```
