# CI/CD Pipeline Documentation

## Overview
This repository uses an adaptive CI/CD pipeline that automatically detects and builds both backend (Spring Boot) and frontend (React) components when they exist.

## How It Works

### Detection Phase
The workflow first checks for the presence of:
- `backend/pom.xml` - indicates Java/Spring Boot backend exists
- `frontend/package.json` - indicates React frontend exists

### Build Jobs
Based on detection, the pipeline conditionally runs:

**Backend Build** (only if pom.xml exists):
- Sets up JDK 17
- Runs Maven build
- Executes unit tests
- Packages JAR artifact

**Frontend Build** (only if package.json exists):
- Sets up Node.js 20
- Installs dependencies with npm ci
- Runs TypeScript type checking
- Executes linting and tests
- Creates production build

### Triggers
The workflow runs on:
- Pushes to `feature/**` branches
- Pushes to `main` branch
- Pull requests targeting `main`
- Manual workflow dispatch

## Current State
The repository currently contains only documentation. The CI/CD pipeline will:
- ✅ Run successfully (detection phase completes)
- ⏭️  Skip backend build (no pom.xml found)
- ⏭️  Skip frontend build (no package.json found)

As the team adds backend and frontend code, the pipeline will automatically start building those components.

## Future Development
When adding code:
1. Place Spring Boot backend in `backend/` directory with `pom.xml`
2. Place React frontend in `frontend/` directory with `package.json` and `package-lock.json`
3. The CI/CD pipeline will automatically detect and build both

## Required Files

### Backend
```
backend/
├── pom.xml (Maven configuration)
└── src/
    └── main/java/...
```

### Frontend
```
frontend/
├── package.json (Node dependencies)
├── package-lock.json (Lock file for reproducible builds)
└── src/...
```
