# TaskFlow 

## Folder layout

| Folder | Role |
|--------|------|
| `database/` | SQL migrations + seeds + helper scripts for PostgreSQL. |
| `backend/` | .NET solution: `TaskFlow.API` (REST) + `TaskFlow.Model` (entities + Npgsql repositories). |
| `frontend/` | Angular app: task form, list, row + `TaskService` calling the API. |

## Prerequisites (install once per machine)

1. **.NET SDK** (v. 9, important that everybody uses the **same** major version).  
   - Download: [https://dotnet.microsoft.com/download](https://dotnet.microsoft.com/download)  
2. **Node.js LTS** (includes **npm**).  
   - Download: [https://nodejs.org](https://nodejs.org)  
3. **Angular CLI** (optional globally; this project also works with `npx ng` from `frontend/`).  
   - `npm install -g @angular/cli`  
4. **PostgreSQL** (and optionally but recommended **pgAdmin** to run SQL). **set DB password to 1234 when asked to provide a db during installation** 
   - Download: [https://www.postgresql.org/download/](https://www.postgresql.org/download/)  
5. **Editor:** Visual Studio Code (recommended in the course) + optional **C# Dev Kit** and **Angular Language Service**.

## Verify prerequisites

Run in a terminal (PowerShell or cmd):

```text
dotnet --version
node -v
npm -v
npx ng version
```

Confirm PostgreSQL is running (Windows: Services; or connect with pgAdmin / `psql`).

## Database setup (migrations + seeds)

This repo uses a lightweight **SQL migration** approach (no external migration tool):

- `database/migrations/`: schema changes (applied once, tracked in `schema_migrations`)
- `database/seed.sql`: dev/demo data (safe to re-run)

### One-time: create the database

Create a database named **`taskflow`** (pgAdmin: Databases → Create → Database, or `CREATE DATABASE taskflow;`).

### Apply schema migrations

From repo root (bash):

```bash
./database/apply-migrations.sh
```

### Apply migrations + seeds (wrapper)

```bash
./database/apply-all.sh
```

### Apply seed data (optional, re-runnable)

```bash
./database/apply-seeds.sh
```

Similarly, you can pass `-PsqlPath` if needed.

### Connection string (API)

Ensure the API connection string matches your PostgreSQL user/password/port:

- [`backend/TaskFlow.API/appsettings.json`](backend/TaskFlow.API/appsettings.json)
- Key: **`TaskFlowDb`** — default (local):  
  `Host=localhost;Port=5432;Username=taskflow_app;Password=taskflow_app;Database=taskflow`  
  (Apply migration `012_taskflow_app_role.sql` first so `taskflow_app` exists.)

## Run the backend

```powershell
cd backend
dotnet run --project TaskFlow.API
```

- Default **HTTP** URL is in [`backend/TaskFlow.API/Properties/launchSettings.json`](backend/TaskFlow.API/Properties/launchSettings.json) (this scaffold uses **`http://localhost:5046`**).  
- Open **Swagger** at `http://localhost:5046/swagger` to try `GET /api/tasks` and `POST /api/tasks`.

`UseHttpsRedirection` is **not** enabled so local HTTP matches the Angular `baseUrl` without certificate friction.

## Run the frontend

In a **second** terminal:

```powershell
cd frontend
npm install
npx ng serve
```

Open the URL shown (usually `http://localhost:4200`).

**Important:** the Angular API URL is in [`frontend/src/app/services/task.service.ts`](frontend/src/app/services/task.service.ts) (`baseUrl`). If your API port changes, update **`baseUrl`** to match the running API (same host/port as Swagger, with path `/api/tasks`).

This repo’s [`.gitignore`](.gitignore) lists common folders to omit.
