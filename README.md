# Project Manager

A NestJS application for managing project information with SQLite.

## Features

- Project information upload and update API
- Project service restart functionality
- Project information retrieval with conditional IP masking based on authentication
- Local caching for better performance

## Prerequisites

- Node.js 22 or higher (better-sqlite3 v12 provides prebuilt binaries for Node 26)
- SQLite (embedded, no separate install required)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables by copying the example file and editing it:
   ```bash
   cp .env.example .env
   ```
4. Edit `.env` with your database credentials

## Running the application

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## API Endpoints

### Upload/Update Project Information
- **POST** `/projects`
- Body:
  ```json
  {
    "serviceName": "api-gateway",
    "serverIp": "192.168.1.1",
    "servicePort": 8080,
    "serviceNotes": "Main API Gateway",
    "serviceRuntime": 3600,
    "serviceDescription": "Routes requests to microservices",
    "lastRestartTime": "2023-10-12T10:30:00Z",
    "projectPassword": "secretpass"
  }
  ```

### Get All Projects
- **GET** `/projects`
- Optional query param: `adminPassword=<ADMIN_PASSWORD>`

### Get Project by Service Name
- **GET** `/projects/{serviceName}`
- Optional query param: `adminPassword=<ADMIN_PASSWORD>`

### Restart Project
- **POST** `/projects/restart`
- Header: `admin-password: <ADMIN_PASSWORD>`
- Body:
  ```json
  {
    "serviceName": "api-gateway"
  }
  ```

## API Documentation

API documentation is available at `/api` when the application is running.