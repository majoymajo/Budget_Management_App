# Budget Management Application

## Project Overview

A comprehensive budget management system designed for personal and business financial tracking, built with modern technologies and automated deployment pipelines.

## Tech Stack Specifications

### Backend Components
- **Runtime**: Java Development Kit 17
- **Framework**: Spring Boot 4.0.2
- **Build Automation**: Apache Maven
- **Message Queue**: RabbitMQ
- **Containerization**: Docker

### Frontend Components
- **Runtime**: Node.js 19.2
- **UI Library**: React 19.2
- **Type System**: TypeScript 5.9.3
- **Package Management**: pnpm (version 8)
- **Module Bundler**: Vite

## Automated Pipeline Architecture

This repository implements a sophisticated 10-stage continuous integration and deployment pipeline:

### Pipeline Execution Stages

**Stage 1: Code Quality Validation**
- Backend: Checkstyle enforcement, SpotBugs detection, PMD analysis
- Frontend: ESLint validation, TypeScript compilation verification

**Stage 2: Automated Testing**
- Backend: JUnit test suites, integration test execution
- Frontend: Jest/React Testing Library suites, coverage analysis

**Stage 3: Security Analysis**
- Filesystem vulnerability scanning (Trivy)
- Maven dependency vulnerability assessment
- NPM package security audit

**Stage 4: Application Build**
- Backend: Maven package creation with test exclusion
- Frontend: Production-optimized bundle generation

**Stage 5: Development Environment**
- Automated deployment to development servers
- Artifact retrieval and distribution

**Stage 6: Staging Environment**
- Conditional deployment with approval requirements
- Limited to develop and main branches

**Stage 7: Production Environment**
- Conditional deployment with strict approval requirements
- Limited to main branch only

**Stage 8: Pull Request Documentation**
- Automated comment generation with pipeline results
- Artifact links and execution summaries

**Stage 9: Failure Alert System**
- Slack webhook integration for real-time alerts
- Automated GitHub issue creation for tracking

**Stage 10: Success Notification**
- Slack confirmation messages
- Deployment status updates

### Key Automation Features

✓ **Environment-based deployment strategy** with approval gates  
✓ **Automated PR commentary** including test outcomes and build artifacts  
✓ **Multi-channel notifications** via Slack integration  
✓ **Intelligent issue tracking** with automatic creation on failures  
✓ **Comprehensive quality gates** covering testing and security  
✓ **Efficient artifact handling** for both backend and frontend builds  
✓ **Advanced vulnerability detection** across dependencies

### Required Configuration

#### GitHub Secrets
- `SLACK_WEBHOOK_URL`: Webhook endpoint for Slack notifications (optional)

#### GitHub Environments
The pipeline utilizes three distinct environments:
- `development`: Automatic deployment without manual intervention
- `staging`: Manual approval required before deployment
- `production`: Strict manual approval with production-level protection

### Repository Organization

```
Taller_Diagnostico/
├── .github/
│   └── workflows/
│       └── ci-cd-pipeline.yml         # Complete pipeline definition
├── backend/                            # Java Spring Boot application
│   ├── pom.xml                        # Maven project descriptor
│   └── src/
│       ├── main/java/                 # Application source code
│       └── test/java/                 # Test suites
├── frontend/                           # React TypeScript application
│   ├── package.json                   # Node package configuration
│   ├── tsconfig.json                  # TypeScript compiler settings
│   ├── vite.config.ts                 # Vite bundler configuration
│   └── src/                           # Application source code
├── AI_Protocol/
│   └── AI_Workflow.md                 # AI collaboration guidelines
├── PROMPT_DOCUMENTATION/
│   ├── Back-End.md                    # Backend development prompts
│   ├── Front-End.md                   # Frontend development prompts
│   └── QA.md                          # Quality assurance prompts
└── README.md                           # Project documentation
```

## Development Instructions

### Backend Application

```bash
# Navigate to backend directory
cd backend

# Install dependencies and compile
mvn clean install

# Execute application
mvn spring-boot:run
```

### Frontend Application

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## Contribution Workflow

1. Fork repository and create feature branch from `develop`
2. Implement changes with appropriate testing
3. Push commits to remote - pipeline executes automatically
4. Create pull request targeting `develop` branch
5. Review automated PR comments with execution results
6. Merge upon approval - triggers staging deployment
7. Promote to `main` for production release

## Pipeline Activation

The automated pipeline activates under these conditions:
- Code pushed to `develop`, `main`, or `feature/**` branches
- Pull requests opened against `develop` or `main`
- Manual workflow execution via GitHub Actions interface

## Project Team

- Jacob - Full Stack Development
- Majo - Full Stack Development
- Agus - Quality Assurance

## License Information

[License details to be added]
