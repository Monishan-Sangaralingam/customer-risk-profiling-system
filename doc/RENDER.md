# Free Render evaluation deployment

This deploys the React static site, transaction service, risk-score service, Python
ML service, and one PostgreSQL database. The Render frontend calls transactions
and risk scoring directly over HTTPS, so the Java API gateway is not deployed.
The alert screen derives its data from risk scores and transactions. The separate
alert/report Java modules are not part of the current UI's API path.

## 1. Put the prepared code on GitHub

Commit and push the deployment changes to your fork. In Render, select that fork
and the branch containing `render.yaml`. Local untracked CSV/ZIP files and your
SSH private key are not required for this deployment and must not be uploaded.

## 2. Create a Blueprint

1. Sign in at <https://dashboard.render.com/> and connect GitHub.
2. Choose **New → Blueprint**, select your fork, and use `render.yaml`.
3. Verify the preview shows **three Free web services**, **one static site**, and
   **one Free PostgreSQL database**, all server resources in Singapore.
4. Render asks for the five URL variables marked `sync: false`. If the service
   addresses are not assigned yet, enter `https://example.invalid` temporarily.
   This permits startup, but API operations will not work until step 3 below.
5. Create the Blueprint. The ML image includes the committed trained model;
   no dataset upload or model retraining is needed.

Do not select a paid compute plan or add a persistent disk. If your workspace
already has a Free PostgreSQL database, reuse it by editing the Blueprint database
references, or use a workspace without one. Render permits one Free database per
workspace. Keep the database's external access disabled (`ipAllowList: []`);
the Java services connect to it over Render's private network with SSL.

## 3. Connect the public service URLs

Copy each web service's actual `https://…onrender.com` address from its dashboard.
Do not assume it exactly matches the service name: Render may append a suffix.
Use the origin only, with **no `/api` suffix** and no trailing slash.

| Render service | Environment variable | Value |
| --- | --- | --- |
| riskguard-transactions | `RISK_SERVICE_URL` | Risk service HTTPS URL |
| riskguard-risk | `TRANSACTION_SERVICE_URL` | Transaction service HTTPS URL |
| riskguard-risk | `ML_SERVICE_URL` | ML service HTTPS URL |
| riskguard-demo | `VITE_TRANSACTION_SERVICE_URL` | Transaction service HTTPS URL |
| riskguard-demo | `VITE_RISK_SERVICE_URL` | Risk service HTTPS URL |

For each service, use **Environment → Save, rebuild, and deploy** (or the equivalent
deploy action). The frontend's `VITE_` variables are embedded at build time, so a
new frontend build is required after changing them. These URLs contain no secrets.
Database host, port, database name, user, and password are injected automatically
by the Blueprint. Do not paste Render's `postgresql://…` URL into a JDBC field.

Free web services cannot receive private-network traffic, so service-to-service
calls must use the **public HTTPS URLs**, not `fromService.host`/internal addresses.
The mutual transaction/risk calls are configured after creation to avoid a
Blueprint dependency cycle. The original local MariaDB configuration is retained;
PostgreSQL is selected only by `SPRING_PROFILES_ACTIVE=render`.

## 4. Verify and load synthetic demo data

Open these URLs and wait for successful responses, allowing time for sleeping
services to wake:

- `ML_URL/health`: `status` is `UP` and **`model_loaded` is `true`**.
- `TRANSACTION_URL/actuator/health`: `status` is `UP`.
- `RISK_URL/actuator/health`: `status` is `UP`.
- Sign up through the application, then check the transactions and risk pages.
  Data endpoints now require a valid account session; anonymous requests return 401.

From a local terminal in this repository, run the following (replace all URLs):

```powershell
$credential = Get-Credential -Message 'Enter your registered application email and password'
$env:RISKGUARD_PASSWORD = $credential.GetNetworkCredential().Password
python scripts/seed_demo.py --email $credential.UserName --transactions https://YOUR-TRANSACTIONS.onrender.com --risk https://YOUR-RISK.onrender.com --ml https://YOUR-ML.onrender.com
Remove-Item Env:RISKGUARD_PASSWORD
```

The script uses only the Python standard library. It inserts 15 synthetic
transactions across customers 9001–9003 through the normal application APIs,
covering ordinary spending and riskier behavior. It checks merchant markers so a
retry does not duplicate successful inserts. A transaction can have been saved
before a downstream scoring failure; rerun the script after fixing service URLs
and check the resulting customer risk scores. Exact risk categories are determined
by the trained model, not forced by the script. Data dates are set relative to the
time the script runs; seed close to the evaluation so they stay in the 30-day window.

Open the **riskguard-demo static site URL**, create an account, sign in, and
verify the dashboard, customer details, risk recalculation, and a new transaction.
Reload `/customers` directly to confirm the SPA rewrite works. Share this static
site URL with evaluators. After deployment, your computer can be switched off.

## Evaluation limits and troubleshooting

- Accounts, hashed passwords, expiring/revocable sessions, alert resolutions and
  settings are stored in PostgreSQL. Existing simulated logins are invalid after
  this update; each evaluator must create an account. Registered analysts share
  this demo's customer portfolio and application settings.
- Deploy both Java services and the frontend together. No additional Render
  environment variables are required. Hibernate adds the new tables and nullable
  transaction score columns without deleting existing transaction data.
- Use synthetic customer information for evaluation.
- Free web services sleep after 15 idle minutes. Open all three health URLs before
  presenting; let the ML service wake first to avoid the risk service's existing
  heuristic fallback. The app is not guaranteed to wake instantly for an evaluator.
- All three web services share **750 free running hours per workspace per month**.
  That is approximately 250 hours with all three awake. There is no keep-alive job
  in this setup. Usage is not an unlimited always-on hosting allowance.
- The **Free PostgreSQL database expires after 30 days**. Schedule deployment near
  your evaluation and retain the seed script to recreate synthetic data. Database
  expiry requires a new database and updated connections or a paid upgrade.
- Each Java container has a 256 MB heap cap and reduced thread/pool sizes for a
  512 MB service. If Render logs show memory exhaustion, the free plan is too small
  for that workload; local builds alone cannot guarantee production memory usage.
- `404` API errors: check the frontend public URLs, without `/api` in the variables.
- `502`/timeouts: wake services, then check their deployment logs and public URLs.
- Database errors: verify all services/database are in the same region and the
  Render profile is enabled. A single database holds both services' distinct tables.
- Model load errors: the pickle was produced with scikit-learn 1.7.2; keep that
  pinned version. Render's ML service fails startup if it cannot load the model.

Official references: [Blueprint specification](https://render.com/docs/blueprint-spec),
[free service limitations](https://render.com/docs/free),
[compute plans](https://render.com/docs/compute-plans).

## Developer verification

### Timestamps

Transaction, creation and risk-calculation timestamps are stored as UTC in the
existing timestamp columns. API responses include `Z` to identify UTC. Incoming
transaction timestamps with an explicit offset are normalized to UTC; legacy
timestamps without an offset are interpreted as UTC for compatibility with the
existing Render data. The frontend displays all times in `Asia/Colombo`
(UTC+05:30), independently of the evaluator's device timezone. No database-wide
time shift or schema migration is required for the existing UTC Render records.

Deploy the frontend and both Java services for this timestamp update.

Frontend: `cd frontend`, `npm ci`, then `npm run build`.

Each Java Dockerfile builds its service independently with Maven. For a local
PostgreSQL aggregation test, create a **disposable** database, set
`TEST_POSTGRES_URL=jdbc:postgresql://localhost:5432/DISPOSABLE_DB`,
`TEST_POSTGRES_USER`, and `TEST_POSTGRES_PASSWORD`, then run from
`backend/transaction-service`:

```powershell
.\mvnw.cmd -Dtest=RenderPostgresIntegrationTests test
```

That test uses `create-drop` and must never target a deployed demo database.
It exercises daily/weekly queries, native projection types, hour extraction,
exclusive date boundaries, and daily aggregation persistence on real PostgreSQL.

For ML tests, install `backend/ml-service/requirements-dev.txt` in a Python 3.11
virtual environment, then from `backend/ml-service` run:

```powershell
python -m unittest test_render_model -v
```
