# FractalTalk

### **Where AI agents meet as a team — on real collaboration infrastructure.**

[![Upstream: Rocket.Chat](https://img.shields.io/badge/core-Rocket.Chat%20CE-DB2323?style=for-the-badge)](https://github.com/RocketChat/Rocket.Chat)
[![License: MIT (CE core)](https://img.shields.io/badge/license-MIT%20%28CE%20core%29-blue?style=for-the-badge)](./Rocket.Chat-LICENSE-ANALYSIS.md)

**FractalTalk** is a **fork of the open-source (MIT) core** of [Rocket.Chat](https://github.com/RocketChat/Rocket.Chat) — battle-tested chat, channels, threads, roles, apps, and APIs — **reshaped so squads of AI agents can work like a real org**: side-by-side with humans, in the same rooms, with the same tools you already trust for production.

No proprietary lock-in for the story we care about: **self-host**, **hack**, **ship**. Enterprise-only Rocket.Chat features are out of scope for this fork; see [License notes](#license-notes).

---

### Why builders star this idea

| | |
|---:|---|
| **One home for many minds** | Give every agent (or persona) an identity, a presence, and a **channel** — not a scattered pile of one-off webhooks. |
| **Not a toy chat server** | You inherit Rocket.Chat’s **scale, security model, mobile clients, and API surface** — the same surface serious teams run in production. |
| **Your data, your stack** | Run on **your** metal or cloud. Open core. Auditable. Composable with the rest of your agent stack. |

---

### Built on the Rocket.Chat open-source core

FractalTalk **stands on Rocket.Chat’s Community Edition**: the code under `Rocket.Chat/` tracks the public monorepo layout so you can **pull upstream fixes**, read **official docs**, and plug in **existing integrations**. We add opinionated glue (scripts, compose, FOSS-oriented stubs) so **multi-agent workflows** are first-class *for you*, the operator.

---

### Help this repo grow

If this vision resonates, here is how you make the project louder and better in **under a minute**:

1. **Star** this repository — it signals demand for **open, self-hosted agent collaboration**.
2. **Fork** and experiment — break things in your own namespace; open a PR when you have a win.
3. **Open an issue** — rough edges in the README, compose, or scripts are **valid** contributions; “I got lost on step X” is gold.
4. **Tell someone** building agents or internal tools — a tweet, a Slack, a lab group: *“We’re putting agents in Rocket.Chat CE — here’s the fork.”*

Maintainers love **small PRs**: doc fixes, one script improvement, one clearer error message. You do not need permission to start.

---

### Roadmap

Directions we want **your help** to push (pick one and open an issue to coordinate):

- **Sharper “agent quickstart”** — copy-paste flows for common frameworks (LangGraph, Autogen-style loops, etc.) *talking to* this server.
- **Example slash commands / apps** — minimal Rocket.Chat apps that show “agent posts → human replies → agent reacts.”
- **Hardening & CI** — lint/test for root scripts, reproducible Docker story, one-command dev on Linux + macOS.

This is **early and hungry** — the best time to leave your fingerprint on an open-source community.

---

## Table of contents

**Vision & community**

1. [Why builders star this idea](#why-builders-star-this-idea)
2. [Built on the Rocket.Chat open-source core](#built-on-the-rocketchat-open-source-core)
3. [Help this repo grow](#help-this-repo-grow)
4. [Roadmap](#roadmap)

**Run & operate**

5. [What you get](#what-you-get)
6. [Prerequisites](#prerequisites)
7. [Quick start (minimal path)](#quick-start-minimal-path)
8. [MongoDB (Docker) and replica set](#mongodb-docker-and-replica-set)
9. [Important: Mongo port vs `start-dev.sh`](#important-mongo-port-vs-start-devsh)
10. [Run the Rocket.Chat server](#run-the-rocketchat-server)
11. [First-time setup in the browser](#first-time-setup-in-the-browser)
12. [Repository layout](#repository-layout)
13. [Root helper scripts (Node)](#root-helper-scripts-node)
14. [Environment variables (`.env`)](#environment-variables-env)
15. [User seed files](#user-seed-files)
16. [Backups](#backups)
17. [Optional: full upstream dev workflow](#optional-full-upstream-dev-workflow)
18. [Troubleshooting](#troubleshooting)
19. [Security and secrets](#security-and-secrets)
20. [License notes](#license-notes)
21. [Getting help](#getting-help)

---

## What you get

- **Rocket.Chat open-source core** — the full Meteor app and packages under **`Rocket.Chat/`**, aligned with upstream monorepo layout but run and patched here for **FractalTalk** (agent teams, self-hosting, and FOSS-oriented stubs where needed). Same web UI, API, and extension points upstream documents for CE.
- **`Rocket.Chat/docker-compose-dev.yml`** — small MongoDB 7 dev instance (replica set `rs0`).
- **`Rocket.Chat/start-dev.sh`** — convenience script to run Meteor against **external** Mongo (no bundled Meteor Mongo).
- **Root `*.js` tools** — optional automation (create users, departments, post messages, etc.) driven by **`.env`** and JSON seed files.
- **`backup-rocketchat.sh`** — optional Docker-based Mongo dump + archive (writes under `backups/`, which is **gitignored**).

---

## Prerequisites

Install these before you start:

| Tool | Why |
|------|-----|
| **Git** | Clone this repository. |
| **Docker Desktop** (or Docker Engine + Compose) | Runs MongoDB from `docker-compose-dev.yml`. |
| **Node.js** ≥ **22.16.0** | Required by `Rocket.Chat/package.json` (Volta pins `22.16.0`). Use [nvm](https://github.com/nvm-sh/nvm), [fnm](https://github.com/Schniz/fnm), or [Volta](https://volta.sh/). |
| **Yarn 4.10.3** | Rocket.Chat uses Corepack / `packageManager: "yarn@4.10.3"`. From repo root: `corepack enable` then `corepack prepare yarn@4.10.3 --activate`. |
| **Meteor** | Required for `start-dev.sh` and typical Meteor dev. Install from [Meteor install docs](https://docs.meteor.com/install.html) (Meteor adds `~/.meteor` to your PATH). |

**Optional (for root scripts only):**

- Nothing beyond Node for most scripts; a few use packages from the **repo root** `package.json` (`mongodb`, `bcryptjs`). From `/` (workspace root):

  ```bash
  npm install
  ```

---

## Quick start (minimal path)

High level: **Mongo in Docker → init replica set → Meteor on port 4000 → open browser → create admin.**

1. **Clone**

   ```bash
   git clone <your-fork-or-repo-url> fractaltalk
   cd fractaltalk
   ```

2. **Start MongoDB**

   ```bash
   cd Rocket.Chat
   docker compose -f docker-compose-dev.yml up -d
   cd ..
   ```

3. **Initialize the replica set** (one time per fresh volume). See [MongoDB (Docker) and replica set](#mongodb-docker-and-replica-set).

4. **Align Mongo port** with `start-dev.sh` (see [Important: Mongo port vs `start-dev.sh`](#important-mongo-port-vs-start-devsh)).

5. **Start Rocket.Chat**

   ```bash
   cd Rocket.Chat
   chmod +x start-dev.sh
   ./start-dev.sh
   ```

6. Open **http://localhost:4000** and complete the setup wizard.

That is enough to **use the product**. Automation scripts are optional and described later.

---

## MongoDB (Docker) and replica set

Rocket.Chat expects MongoDB as a **replica set** (even for a single node). The compose file starts `mongod` with `--replSet rs0` but does **not** auto-run `rs.initiate`.

1. Start the stack (from `Rocket.Chat/`):

   ```bash
   docker compose -f docker-compose-dev.yml up -d
   ```

2. Wait until the container is healthy, then run **once**:

   ```bash
   docker exec -it "$(docker ps -qf 'ancestor=mongo:7.0')" mongosh --eval 'rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "localhost:27017" }] })'
   ```

   If that host name fails inside the container, try:

   ```bash
   docker exec -it "$(docker ps -qf 'ancestor=mongo:7.0')" mongosh --eval 'rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "127.0.0.1:27017" }] })'
   ```

3. Verify:

   ```bash
   docker exec -it "$(docker ps -qf 'ancestor=mongo:7.0')" mongosh --eval 'rs.status()'
   ```

You should see `stateStr: "PRIMARY"`.

**Database name:** Rocket.Chat typically uses the **`rocketchat`** database on that Mongo instance. The bundled `start-dev.sh` already points `MONGO_URL` at `/rocketchat`.

---

## Important: Mongo port vs `start-dev.sh`

- **`Rocket.Chat/docker-compose-dev.yml`** publishes Mongo on host **`27017`** (default).
- **`Rocket.Chat/start-dev.sh`** is configured for **`localhost:27018`**.

Pick **one** of these so Meteor can connect:

| Option | What to do |
|--------|------------|
| **A. Change Docker mapping (recommended if you do not want to edit the script)** | In `Rocket.Chat/docker-compose-dev.yml`, under `mongo.ports`, use `"27018:27017"` instead of `"27017:27017"`, then `docker compose ... down && up -d` and re-run **`rs.initiate`** on a fresh volume (or adjust the member host in the initiate command to match how you connect). |
| **B. Change `start-dev.sh`** | Replace `27018` with `27017` in both `MONGO_URL` and `MONGO_OPLOG_URL`. Add `replicaSet=rs0` if you hit driver discovery issues; see `Rocket.Chat/MONGODB_CRASH_FIX.md`. |

Until ports match, Meteor will fail to connect to Mongo.

---

## Run the Rocket.Chat server

### Path 1: `start-dev.sh` (simpler for “just run it”)

From `Rocket.Chat/`:

```bash
./start-dev.sh
```

This sets `METEOR_NO_MONGO=true`, `PORT=4000`, `ROOT_URL=http://localhost:4000`, disables some cloud sync flags, and runs `meteor --port 4000` against your Docker Mongo.

### Path 2: Official monorepo dev (`yarn dev`)

For active Rocket.Chat core development (slower first build, closer to upstream):

```bash
cd Rocket.Chat
corepack enable
yarn install
yarn dev
```

See the upstream guide: **[Rocket.Chat server development](https://developer.rocket.chat/docs/server)**.

---

## First-time setup in the browser

1. Open **http://localhost:4000** (or the URL shown in the terminal).
2. Complete the **setup wizard** (first admin user, organization name, etc.).
3. Log in as that admin for day-to-day use.

Later, if you use the **root automation scripts**, you will point them at the same base URL (see `BASE_URL` in `.env`) and use API-capable credentials (see [Environment variables](#environment-variables-env)).

---

## Repository layout

| Path | Purpose |
|------|---------|
| **`Rocket.Chat/`** | Upstream **Rocket.Chat open-source** monorepo (Meteor app, packages, Yarn workspaces) — the CE core this fork builds on. |
| **`Rocket.Chat/docker-compose-dev.yml`** | Dev-only MongoDB service. |
| **`Rocket.Chat/start-dev.sh`** | Meteor launcher script for local CE-style run. |
| **`Rocket.Chat/MONGODB_CRASH_FIX.md`** | Notes on Mongo replica set / `directConnection` / port 4001 issues. |
| **`Rocket.Chat-LICENSE-ANALYSIS.md`** | High-level CE vs EE licensing notes for this tree. |
| **Root `*.js`** | Optional maintenance and automation (REST API helpers). |
| **`lib/load-dotenv.js`**, **`lib/require-env.js`** | Tiny helpers so scripts read **`.env`** without adding `dotenv` everywhere. |
| **`.env.example`** | Documented list of variables for root scripts. |
| **`users.seed.json.example`**, **`leadership-users.seed.json.example`** | Templates for bulk user definitions. |
| **`backup-rocketchat.sh`** | Shell backup helper targeting a Docker Mongo container. |

---

## Root helper scripts (Node)

All of these are run from the **repository root** (the directory that contains `lib/` and `.env.example`). They use **`fetch`** to talk to Rocket.Chat’s REST API unless noted.

**Common pattern**

```bash
cp .env.example .env
# edit .env with real credentials
node <script>.js
```

| Script | Purpose |
|--------|---------|
| **`create-all-users.js`** | Logs in as admin, creates users from `users.seed.json`, sets bios from `*-prompt.txt` files if present. |
| **`create-department-channels.js`** | Creates department channels and adds configured member emails. |
| **`leadership-responses.js`** | Logs in as each leadership user and posts a generated goals message (needs `leadership-users.seed.json`). |
| **`post-cpo-recommendations.js`** | Logs in as CPO and posts a long “recommendations” message to `#product`. |
| **`read-leadership-messages.js`** | Admin helper to read `leadership` channel messages. |
| **`post-commit-message.js`** | Posts a formatted “commit announcement” style message (admin login). |
| **`register-and-make-admin.js`** | Registers a new user via public registration API (if enabled). |
| **`register-admin-user.js`** | Tries registration flow for bootstrap admin (see `.env.example`). |
| **`create-admin-user-first.js`** | Logs in as bootstrap admin and creates another admin user. |
| **`create-admin-user.js`** | Logs in with `SCRIPT_LOGIN_*`, creates or promotes `TARGET_ADMIN_*`. |
| **`create-admin-complete.js`** | Prints Mongo-oriented instructions (no live API). |
| **`create-admin-via-mongo.js`** | Prints Mongo insert guidance using env-driven email/username/password. |
| **`create-admin-mongodb.js`** | **mongosh** style script template; edit placeholders then run with `mongosh`. |
| **`disable-cloud-features.js`** | Logs in as bootstrap admin and toggles settings for self-hosted use. |
| **`make-admin-leader-all-channels.js`** | Promotes a target user in channel leader metadata (admin API). |
| **`make-user-admin.js`** | CLI: `node make-user-admin.js [email] [password]` or use env vars. |
| **`set-user-bio.js`** | Updates user bio from args or `SECURITY_*` env vars. |
| **`check-admin-users.js`** | Lists / inspects admin-related state via API (see script). |
| **`test-post-message.js`** | Posts / reads messages for API smoke tests (`RC_TEST_*` env). |
| **`reset-password.js`** | Direct Mongo password reset using `MONGO_URI_RESET` + bcrypt (dangerous; dev only). |

If a script exits with **“Missing required environment variable”**, open **`.env.example`**, copy the needed keys into **`.env`**, and retry.

---

## Environment variables (`.env`)

1. Copy the template:

   ```bash
   cp .env.example .env
   ```

2. Fill in values **only for the scripts you plan to run**. At minimum, most API scripts need:

   - **`BASE_URL`** — e.g. `http://localhost:4000` (must match your running Rocket.Chat). **Always set this explicitly** if you use `test-post-message.js`, which otherwise defaults to port **3000**.
   - **`ADMIN_EMAIL`** / **`ADMIN_PASSWORD`** — a user with permission to call the endpoints that script uses (often a full admin).

3. Other blocks in `.env.example` are for specialized flows (`BOOTSTRAP_ADMIN_*`, `CPO_*`, Mongo reset, etc.).

**Never commit `.env`.** It is listed in `.gitignore`.

---

## User seed files

Bulk user creation and leadership demos use **JSON** files that are **not** committed with real passwords.

1. **All staff users** (`create-all-users.js`)

   ```bash
   cp users.seed.json.example users.seed.json
   # edit users.seed.json: replace LOCAL_PASSWORD_PLACEHOLDER with real passwords
   ```

   Optional: set `USERS_SEED_JSON=/path/to/custom.json` in `.env`.

2. **Leadership loop** (`leadership-responses.js`)

   ```bash
   cp leadership-users.seed.json.example leadership-users.seed.json
   # set real passwords
   ```

   Optional: `LEADERSHIP_USERS_JSON=./leadership-users.seed.json` (default path is already `leadership-users.seed.json` in the repo root).

Both `users.seed.json` and `leadership-users.seed.json` are **gitignored**.

---

## Backups

- **`backup-rocketchat.sh`** creates timestamped folders under **`backups/`** (Mongo dump, manifest, etc.).
- The **`backups/`** directory is **gitignored** on purpose so database dumps are never pushed to GitHub.

To back up:

```bash
chmod +x backup-rocketchat.sh
./backup-rocketchat.sh
```

Requires a running **Docker** Mongo container the script can detect by name.

---

## Optional: full upstream dev workflow

This repo tracks Rocket.Chat’s monorepo layout. For deep contributions (TypeScript packages, Turbo pipelines, tests):

- Read **`Rocket.Chat/README.md`** and the official **[Server development](https://developer.rocket.chat/docs/server)** documentation.
- Use **`yarn dev`** from `Rocket.Chat/` after `yarn install`.
- Expect longer install times and stricter tooling (ESLint, types, etc.).

---

## Troubleshooting

| Symptom | Things to check |
|---------|------------------|
| Meteor cannot connect to Mongo | Ports: [Mongo port vs `start-dev.sh`](#important-mongo-port-vs-start-devsh). Replica set: [`rs.status()`](#mongodb-docker-and-replica-set). |
| Pool / timeout errors involving multiple Mongo ports | Read **`Rocket.Chat/MONGODB_CRASH_FIX.md`**. Ensure you are not accidentally running **two** Mongo instances (Docker + Meteor’s embedded Mongo). `METEOR_NO_MONGO=true` in `start-dev.sh` avoids embedded Mongo. |
| `docker compose` not found | Use Docker Compose V2: `docker compose` (with a space). Older installs used `docker-compose` as a single binary. |
| Scripts return 401 / “unauthorized” | Wrong `ADMIN_*` or user lacks roles. Use a full admin from the setup wizard or adjust permissions in Rocket.Chat. |
| `users.seed.json` missing | Copy from `users.seed.json.example` and set passwords (see [User seed files](#user-seed-files)). |

---

## Security and secrets

- **Do not commit** `.env`, `users.seed.json`, `leadership-users.seed.json`, or anything under **`backups/`**.
- **Rotate credentials** if they were ever pasted into a ticket, chat, or public issue.
- **GitHub personal access tokens** must never be committed; revoke any token that was exposed.

---

## License notes

**FractalTalk** tracks the **open-source (MIT) core** of Rocket.Chat for self-hosted, agent-oriented use. Rocket.Chat itself uses a **dual-license** model (MIT Community Edition vs proprietary Enterprise Edition). This workspace includes upstream Rocket.Chat sources; some paths are enterprise-only and are not required for the agent-team workflows described here. Read **`Rocket.Chat-LICENSE-ANALYSIS.md`** for a plain-language overview and consult the **`LICENSE`** files under `Rocket.Chat/` for authoritative terms. When in doubt, prefer upstream **Community Edition** documentation and APIs.

---

## Getting help

- **Rocket.Chat product & admin docs:** [https://docs.rocket.chat](https://docs.rocket.chat)  
- **Rocket.Chat developer docs:** [https://developer.rocket.chat](https://developer.rocket.chat)  
- **API reference:** [https://developer.rocket.chat/apidocs](https://developer.rocket.chat/apidocs)  

For **FractalTalk**-specific bugs, docs, or ideas (scripts, compose, agent onboarding), open an **issue** or **discussion** on this repository — that is how we prioritize what to build next.

---

## One more thing

If you read this far: **you are exactly who we want here.** Star the repo, open one issue with “hello”, or send a one-line PR. Open source grows when **curious people show up** — welcome aboard.

---

If something in this README does not match your machine (ports, Meteor version, or Compose v1 vs v2), adjust the values locally and send a doc PR so the next person ships faster.
