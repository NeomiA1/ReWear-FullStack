\# CLAUDE.md



This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.



\## Project overview



ReWear is a clothing-donation matching platform connecting three user roles: private donors ("Private" users), donation associations/nonprofits ("Association"), and second-hand stores ("Store"). It is a two-tier full-stack app:



\- `client/` — React 19 SPA (Vite, React Router 7, Tailwind CSS 4).

\- `server/` — ASP.NET Core 8 Web API (`RewearApi`), talking to SQL Server via raw ADO.NET + stored procedures.

\- `database/` — incremental SQL migration scripts, run manually against Azure SQL.



The UI is entirely in Hebrew and RTL (`direction: rtl` is forced globally in `client/src/index.css`). Validation error messages returned by the API are also Hebrew strings, so don't "fix" them to English.



\## Commands



\### Client (`client/`)

```

npm install

npm run dev       # Vite dev server, http://localhost:5173

npm run build     # production build to dist/

npm run preview   # preview the production build

npx eslint .      # lint (no separate "lint" script defined in package.json)

```

There is no test runner configured for the client.



\### Server (`server/`)

```

dotnet restore

dotnet build

dotnet run                          # runs at http://localhost:5030 (see Properties/launchSettings.json)

dotnet build -c Release             # used by the deploy workflow

```

There is no test project in this repo (no `\*.Tests.csproj`). `RewearApi.sln` contains a single project. Swagger UI is served at `/swagger` in Development.



\### Database

Nothing under `database/` is run automatically. `database/schema.sql` is an empty placeholder — actual schema is not tracked as one file. The real, current DB structure/data must be read from `script.sql` at the repo root (an SSMS-generated full schema+data dump; note it appears to be UTF-16 encoded, so tools that read it as UTF-8/ASCII will show garbled text — re-read with the correct encoding rather than assuming corruption). The `database/phase\_\*.sql` files are dated, hand-written ALTER/CREATE migrations meant to be applied once, in order, directly against the Azure SQL database before deploying the corresponding backend change (see the comments at the top of each file, e.g. "Run once against RewearDB on Azure. Run BEFORE deploying backend changes"). There is no migration framework (not EF Core) and no automatic sync between these files and Azure — if you add a DB-touching feature, add a new `phase\_\*` file and note manual apply instructions rather than editing schema.sql.



\## Architecture



\### Backend: Controller → DAL → stored procedure, no service layer, no DI

Every controller under `server/Controllers/` follows the same shape:

\- `\[Route("api/\[controller]")] \[ApiController]`, deriving `ControllerBase`.

\- DAL classes are instantiated directly as `readonly` fields (`private readonly UserDAL \_userDal = new UserDAL();`) — there is no dependency injection container registration for these classes, no interfaces/abstractions over them.

\- Controllers validate input (null checks, id > 0 checks, `model.Validate()`), then call straight into a DAL method, then wrap the result in `Ok(...)`/`BadRequest(...)`/`NotFound(...)`.



DAL classes (`server/DAL/\*DAL.cs`) all extend `DBServices` (`server/DAL/DBServices.cs`), which provides:

\- `Connect(string conStrName)` — builds an `IConfigurationRoot` from `appsettings.json` + `appsettings.Development.json` + env vars on every call, opens a new `SqlConnection` using `ConnectionStrings:<conStrName>`.

\- `CreateCommand(spName, con, paramDic)` — builds a `SqlCommand` with `CommandType.StoredProcedure`, using `AddWithValue` for each dictionary entry (`null` values must be passed as `DBNull.Value`, e.g. `(object?)x ?? DBNull.Value`).



Most DAL methods call stored procedures (named `sp\_\*` in the DB, referenced as string constants like `SP\_CREATE\_DONATION\_REQUEST`), but some (e.g. `DonationRequestDAL.GetByUserId`, `GetByAssociationUserId`) run inline multi-table `JOIN` SQL directly instead of a stored proc — this is an existing inconsistency, not a rule to follow one way or the other; match whichever pattern the surrounding file already uses.



BL classes (`server/BL/\*.cs`) are plain data-holder POCOs, several with a `Validate() -> List<string>` method returning Hebrew validation error strings (see `User.cs`, and the DTOs used by other controllers). Controllers call `.Validate()` and return `BadRequest(errors)` when non-empty — replicate this exact pattern (not `\[Required]` data annotations, not FluentValidation) for new endpoints.



\### Auth is not real auth

\- `POST /api/Users/register` and `POST /api/Users/login` exist, but there is no hashing visible anywhere in the codebase — `sp\_RegisterUser`/`sp\_LoginUser` take `@user\_password` and compare/store it as-is (`Users.user\_password` is just an `NVARCHAR(255)` column). Treat this as known, pre-existing behavior; don't assume bcrypt/JWT exist elsewhere.

\- There is no JWT/session/cookie middleware in `Program.cs` — `Login` simply returns the `User` row as JSON on success. The client persists the entire returned user object to `localStorage` under the key `rewear\_user` (`client/src/context/UserContext.jsx`) and uses its presence as the "is logged in" signal. There is no token attached to subsequent API requests.

\- `app.UseAuthorization()` is called in `Program.cs` but there are no `\[Authorize]` attributes anywhere — every endpoint is effectively anonymous.



\### CORS is a hardcoded allowlist

`Program.cs` defines a single `AllowReact` CORS policy hardcoding exactly two origins: `http://localhost:5173` and `https://re-wear-full-stack.vercel.app`. Adding a new frontend deploy target (e.g. a preview URL) requires editing this list in `Program.cs`, not an env var.



\### Client: role-scoped page trees + one flat router

`client/src/App.jsx` is the single source of truth for routes — a flat `<Routes>` list (no nested layout routes, no route guards). Pages live under `client/src/pages/` split by role:

\- `pages/auth/` — login/register flow, including a type-selection step (`RegisterTypePage`) that branches to `RegisterPrivatePage`, `RegisterOrgPage`, or `RegisterShopPage`, then optionally `RegisterCausesPage`.

\- `pages/user/` — private-donor screens (home, upload donation, map, pickups, impact, etc).

\- `pages/org/` — association/nonprofit screens.

\- `pages/shop/` — second-hand store screens.

\- `pages/CollaborationChatPage.jsx` — shared chat page, mounted at both `/org/chat/:id` and `/shop/chat/:id`.



Each role has its own bottom-nav component (`BottomNav.jsx` for users, `OrgBottomNav.jsx`, `ShopBottomNav.jsx`) — these are separate files with hardcoded, role-specific nav items rather than one parameterized component. Follow this pattern (don't try to unify them) unless asked to refactor.



The app shell is mobile-width: `#root` is capped at `max-width: 480px` and centered (`client/src/index.css`), so pages are built as a single-column mobile layout, not responsive desktop grids.



\### Global state: React Context + localStorage, not the API, for several features

`client/src/context/UserContext.jsx` (`UserProvider`/`useUser()`) holds `user`, `donations`, `sentDonations`, `orgSettings`, and `collaborations`, each mirrored to `localStorage` (`rewear\_user`, `rewear\_donations`, `rewear\_sent`, `rewear\_org\_settings`, `rewear\_collaborations`) via `useEffect`. Some of this state (e.g. `collaborations`, `sendCollaborationRequest`, `sendCollabMessage`) is pure client-side mock data with no backend endpoint at all — before wiring a "collaboration"/"chat" feature to the real API, check whether it's still local-only in `UserContext.jsx` or has since been migrated to a `services/\*Service.js` call, since the codebase currently has both patterns depending on feature age (see git log: donation-request and bag flows were migrated to the API; collaboration/chat were not, as of the last commits).



\### Client: services layer mirrors backend controllers 1:1

`client/src/services/\*.js` are thin `fetch` wrappers, one file per backend controller (`userService.js` ↔ `UsersController`, `donationRequestService.js` ↔ `DonationRequestsController`, etc). All of them import `API\_BASE\_URL` from `services/api.js`, which resolves to `import.meta.env.VITE\_API\_URL` or falls back to `http://localhost:5030/api`. Every function follows the same error-handling shape:

```js

const response = await fetch(`${API\_BASE\_URL}/...`, { method, headers, body });

if (!response.ok) {

&#x20; const errorText = await response.text();

&#x20; throw errorText;              // throws a string, not an Error object

}

return await response.json();   // or response.text() for endpoints that don't return JSON

```

Callers therefore catch plain strings (often the Hebrew message from the API), not `Error` instances — keep this convention when adding new service functions or catch blocks.



\### Deployment

\- Client: Vercel. `client/vercel.json` rewrites all paths to `/index.html` (SPA fallback). `client/.env.production` pins `VITE\_API\_URL` to the deployed Azure API (`https://rewear-api-ruppin-\*.azurewebsites.net/api`).

\- Server: Azure App Service, deployed via `.github/workflows/main\_rewear-api-ruppin.yml` on every push to `main` (build + publish on `windows-latest`, then `azure/webapps-deploy`). This workflow runs `dotnet build`/`publish` directly — it does not use `server/Dockerfile`. The Dockerfile exists only for local/VS container debugging (see comments at its top and the `Container (Dockerfile)` profile in `server/Properties/launchSettings.json`); it is not part of the CI/deploy path.

\- `server/appsettings.json`'s `RewearDB` connection string points at a developer's local named SQL Server instance (`NEOMI-PC\\SQLEXPRESS`, Windows Trusted Connection). This is not a usable connection string for other machines/environments — actual Azure connection strings are supplied via `appsettings.Development.json` (gitignored) or environment variables, per `DBServices.Connect`'s config-building order (json file → Development json → env vars, later sources override earlier).



\## Data model reference

`script.sql` (repo root) is the authoritative current-schema snapshot (from an SSMS export). Core tables: `Users` (all roles' login row — `user\_type` is `Private`/`Association`/`Store`), `Associations`, `SecondHandStores`, `DonationBags`, `DonationRequests`, `DonationRequestBags` (join table), `BagMedia`, `Notifications`, `UserPreferences`, `Causes`/`UserCauses`/`AssociationCauses` (added later, see `database/phase\_b\_causes.sql` and `phase\_c\_association\_causes.sql`), `AssociationStoreRequests`, `Chats`/`ChatMessages`. Associations and Stores each have their own table linked back to `Users.user\_id`, i.e. an Association/Store account is both a `Users` row (for auth) and a row in its role-specific table (for domain data) — see `sp\_RegisterOrganization` in `database/phase\_c\_association\_causes.sql` for the two-step insert + `SCOPE\_IDENTITY()` pattern used to link them inside one transaction.



