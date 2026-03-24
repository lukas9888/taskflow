# TaskFlow — minimal full-stack scaffold (CBS Applied Programming)

This repo is a **proof-of-concept** only: **Angular → C# Web API → PostgreSQL** for a single **Task** entity (`GET` / `POST`). Use it as a template to add the rest of your TaskFlow features.

**Exam note:** the course guide expects more than this POC (e.g. **CRUD for at least two entities**, **several related tables with keys/FKs**, **four Angular components** — included here — **services**, **forms with two-way binding and validation**, **10+ seed rows** — included in `database/init.sql` — etc.). See **Exam checklist** below.

## Folder layout

| Folder | Role |
|--------|------|
| `database/` | SQL to create the `tasks` table and seed data. |
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

## One-time database setup

1. Create a database named **`taskflow`** (pgAdmin: Databases → Create → Database, or `CREATE DATABASE taskflow;`).
2. Open **Query Tool** on that database and run the script:  
   [`database/init.sql`](database/init.sql)  
3. Ensure the API connection string in your user/password/port does not differ:  
   - [`backend/TaskFlow.API/appsettings.Development.json`](backend/TaskFlow.API/appsettings.Development.json)  
   - Key: **`TaskFlowDb`** — format:  
     `Host=localhost;Port=5432;Username=postgres;Password=1234;Database=taskflow`

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

## What this POC demonstrates (course “recipe”)

Follow this order when you add new features (mirrors the Applied Programming lectures: **REST**, **separation of concerns**, **dependency injection**):

1. **Database:** decide table/columns, PK/FK → add SQL in `database/` (and run it on Postgres).  
2. **C# entity:** class under `TaskFlow.Model/Entities/` matching the table.  
3. **Repository:** SQL via **Npgsql** under `TaskFlow.Model/Repositories/` (one repository per table is a good rule).  
4. **DI:** register the repository in [`backend/TaskFlow.API/Program.cs`](backend/TaskFlow.API/Program.cs) with `builder.Services.AddScoped<...>()`.  
5. **Controller:** new route under `TaskFlow.API/Controllers/` — map **HTTP verbs** (`GET`, `POST`, `PUT`, `DELETE`) to repository methods; return JSON.  
6. **Angular model:** `interface` in `frontend/src/app/models/`.  
7. **Angular service:** `HttpClient` methods in `frontend/src/app/services/` (`provideHttpClient` is already in `app.config.ts`).  
8. **Angular components:** template shows data; call the service on **load** (`ngOnInit`) and on **user actions** (click/submit).

**Frontend pieces in this repo (four components + one service):**

- `AppComponent` — shell, loads list on startup.  
- `TaskFormComponent` — `[(ngModel)]`, `required` / `minlength` / `maxlength`, submit → `POST`.  
- `TaskListComponent` — displays a list with `@for`.  
- `TaskRowComponent` — one row (`@Input` task).  
- `TaskService` — `HttpClient` → API.

**CORS:** `Program.cs` uses a **development-style** open policy (`AllowAnyOrigin`). Restrict origins in a real deployment.

## Troubleshooting

| Symptom | Things to check |
|--------|------------------|
| Browser: CORS / network error | API must be running; `UseCors` is configured — restart API after changes. |
| Empty list / load error | Wrong `baseUrl` port; API not running; database empty or script not applied. |
| API: database error | Connection string password/database name; Postgres running; `tasks` table exists. |
| `dotnet` / `ng` not found | Install SDK / Node; close and reopen the terminal; check PATH. |

## Exam checklist (beyond this POC)

Before submission, align with the **Project and Exam Guide**:

- [ ] Second entity + **CRUD** (and **HTTP methods** used correctly).  
- [ ] **Several related tables** with **primary keys** and **foreign keys**.  
- [ ] **≥4 Angular components** (satisfied here) + **services** for API calls.  
- [ ] **Forms:** two-way binding + **validation** (pattern started in `TaskFormComponent`).  
- [ ] **≥10 test records** in SQL (seed file already has 10 — adjust for your final schema).  
- [ ] **Report** (max 10 pages + appendix rules) and **zip** of source **without** `node_modules`, `bin`, `obj`, large artifacts (per guide).

## Submission zip tip

Exclude build outputs and dependencies to keep the zip small (guide suggests on the order of **5–15 MB** of source). This repo’s [`.gitignore`](.gitignore) lists common folders to omit.
