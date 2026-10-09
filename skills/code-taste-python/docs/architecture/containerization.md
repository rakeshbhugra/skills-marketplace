
# Containerization & Environment Parity

← [Back to index](./README.md)

Most teams write one `Dockerfile`, bolt on hot-reload in dev, and discover in prod that "works on my machine" was load-bearing. This doc is the orientation: the few container setups you actually need, why dev and prod must be *different on purpose*, and how clean adapters make the jump to AWS almost free.

> **Companion docs:** the container is where your [adapters](./adapter.md) get wired to real infrastructure, and [Infrastructure as Code](./infrastructure.md) is how that infrastructure gets created. Read this with both nearby.

## The goal (the only one)

> **The code you debug locally and the code you run in prod should be the *same artifact*, differing only in configuration — never in source.**

Everything below is means to that end. Hot-reload, debugger ports, managed-service swaps — all of it exists so that the only thing that changes between your laptop and AWS is *config*, not *code*. The moment prod runs a different code path than dev, you've lost the ability to reproduce a bug, and every incident becomes archaeology.

## The mental model — three setups, not three apps

People hear "three Dockerfiles" and picture three apps to maintain. It's the opposite: **one application image, three ways of running it.** Pick by the question you're answering.

| Setup | Question it answers | Reload? | Wired to… |
|---|---|---|---|
| **Dev compose** | "I'm editing code right now and want a breakpoint." | Yes — backend *and* frontend | Local containers (Postgres, Redis, LocalStack) |
| **Stable compose** | "Does the built artifact actually run end-to-end?" | No — baked-in code | Local containers, prod-shaped config |
| **AWS / cloud** | "Will this survive prod?" | No | Managed services (RDS, ElastiCache, SQS, S3) |

The first two are usually one multi-stage `Dockerfile` with two *targets* (`dev`, `prod`), selected per compose file. The third is the **same `prod` image** with different environment variables pointing at managed services. That last point is the whole game — see [the architecture connection](#the-architecture-connection).

## Setup 1 — Dev compose (hot reload + attachable debugger)

Two things make a dev container worth using: **your edits show up without a rebuild**, and **you can attach a real debugger**. Miss either and people just run the app outside Docker, which defeats parity.

**Hot reload** comes from bind-mounting source into the container and running the reloader:

```yaml
# docker-compose.dev.yml
services:
  backend:
    build: { context: ., target: dev }       # the "dev" stage of the Dockerfile
    command: uvicorn app.main:app --host 0.0.0.0 --reload
    volumes:
      - ./app:/code/app                       # edits on host → live in container
    ports:
      - "8000:8000"
      - "5678:5678"                           # debugpy attach port
    environment:
      APP_ENV: dev
  frontend:
    build: { context: ./frontend, target: dev }
    command: npm run dev -- --host            # Vite/Next dev server, HMR on
    volumes:
      - ./frontend/src:/app/src
    ports:
      - "5173:5173"
```

**The debugger port is the part most people skip — and it's why containerized debugging feels worse than local.** Inside a container the FastAPI process is isolated; you can't set a breakpoint from your editor unless the process opens a debug socket and you publish that port. The fix is a few lines, gated on environment so it never runs in prod:

```python
# app/main.py
import os

if os.getenv("APP_ENV") == "dev":
    import debugpy
    debugpy.listen(("0.0.0.0", 5678))         # VSCode/PyCharm attaches here
    # debugpy.wait_for_client()               # uncomment to block until attached
```

```jsonc
// .vscode/launch.json — "attach", not "launch"
{
  "name": "Attach to FastAPI (Docker)",
  "type": "debugpy",
  "request": "attach",
  "connection": { "host": "localhost", "port": 5678 },
  "pathMappings": [{ "localRoot": "${workspaceFolder}/app", "remoteRoot": "/code/app" }]
}
```

Now you set breakpoints in your editor and step through code *running inside the container* — same interpreter, same dependencies, same OS as the image you'll ship. That is the entire payoff of containerized dev: you debug the real thing, not a local approximation. `pathMappings` is what makes the breakpoints line up; get the `localRoot`/`remoteRoot` pair wrong and breakpoints silently won't bind.

## Setup 2 — Stable compose (the built artifact, no reload)

`docker compose up` with no bind mounts and no reloader. This is the image you actually ship, exercised on your machine before it goes anywhere. Source is **baked in at build time**; there is no live editing — if you change code, you rebuild. That's the point: it proves the *artifact* works, not your working tree.

A multi-stage `Dockerfile` lets both setups share one file:

```dockerfile
# ---- base: deps only, cached aggressively ----
FROM python:3.12-slim AS base
WORKDIR /code
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# ---- dev: adds debugpy + dev deps, source bind-mounted at runtime ----
FROM base AS dev
RUN uv sync --frozen                          # includes debugpy, pytest, etc.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--reload"]

# ---- prod: source COPIED in, no dev deps, real server ----
FROM base AS prod
COPY app ./app
RUN adduser --disabled-password appuser && chown -R appuser /code
USER appuser                                  # never run as root in prod
CMD ["gunicorn", "app.main:app", "-k", "uvicorn.workers.UvicornWorker", \
     "-w", "4", "-b", "0.0.0.0:8000"]
```

Note what changes between targets is **build inputs and the run command** — not the application source. `--reload` vs. gunicorn workers, dev deps vs. none, root vs. non-root. The `prod` stage is the artifact that goes to AWS unchanged.

## Setup 3 — AWS (same image, managed services behind the same ports)

This is where the layered architecture earns its keep, and where most "lift to prod" projects bleed time. You do **not** build a new image for AWS. You run the **`prod` image** and point its environment variables at managed equivalents of whatever you ran in containers locally:

| Local container | AWS managed equivalent | Does the adapter change? |
|---|---|---|
| `postgres` | **RDS** / Aurora | No — same Postgres wire protocol, swap the connection string |
| `redis` | **ElastiCache (Redis)** | No — wire-compatible, swap the host |
| in-process / local queue | **SQS** | **Yes** — different API, new adapter behind the same port |
| MinIO / local disk | **S3** | Usually yes — `boto3` adapter behind a storage port |
| local SMTP / Mailhog | **SES** | Yes — new adapter, same `Notifier` port |

The pattern: **anything wire-compatible is a config swap; anything with a different API is an adapter swap.** RDS and ElastiCache are literally Postgres and Redis, so the connection string changes and nothing else does. SQS and SES speak their own APIs — but if you put them behind a port (`Queue`, `Notifier`), the swap is *one new file in `adapters/`* and the services above never notice. Tools like **LocalStack** let you run S3/SQS/SES locally in your dev compose so even those have a faithful local stand-in.

> **The trap this avoids:** importing `boto3` directly inside a service. The day you want to test that service without AWS — or run it locally — you can't. Behind a port, the test gets a `FakeQueue`, dev gets LocalStack, and prod gets SQS, with the service unchanged. This is [adapter.md](./adapter.md) applied to deployment.

## How to spot it in your code

- **One `Dockerfile`, no targets, `--reload` hardcoded.** Either prod is running the reloader (slow, insecure) or dev requires a full rebuild per edit. Smell.
- **`docker compose up` and the dev compose are the same file.** No separation of "editing" from "shipping the artifact."
- **`import boto3` / `import redis` inside `services/`.** Infrastructure has leaked across the dependency rule. The AWS swap will now be a refactor, not a config change.
- **Different `requirements`/source between dev and prod images.** Parity is already broken; bugs won't reproduce.
- **Running as root in the prod image.** No `USER`. Standard container-hardening miss.
- **No debugger port anywhere.** The team debugs with `print()` because attaching is "too hard" — it's six lines.

## Match rigor to project stage

Don't build all three on day one. The honest upgrade path:

| Signal | What to add |
|---|---|
| Solo dev, MVP | One `Dockerfile`, run the app directly with `--reload`. Containers optional. |
| "Works on my machine" bugs appear | Multi-stage Dockerfile (`dev`/`prod` targets) + a stable compose file. |
| Debugging in the container is painful | `debugpy` port + a VSCode attach config. |
| Frontend + backend, more than one dev | Dev compose with HMR for both, shared network. |
| Going to AWS | Put `boto3`/queue/storage behind ports; add LocalStack to dev compose; ship the `prod` image. |
| More than a couple of services | Hand environment creation to [Infrastructure as Code](./infrastructure.md). |

Three Dockerfiles for a weekend project is gold-plating. Three setups for an app you're taking to prod is the cheapest insurance you'll buy.

## The architecture connection

Environment parity is the dependency rule, viewed from ops. The reason you can run the *same image* on your laptop and in AWS — swapping Postgres for RDS, Redis for ElastiCache, a local queue for SQS — is that **nothing above the adapter layer knows what it's talking to.** Services depend on `Queue`, not on SQS. The container's job is just to inject the right adapter via config at the edge (`bootstrap`).

If your "move to AWS" is a code change rather than a config change, that's not a Docker problem — it's an architecture problem. The leak is upstream, in a service that imported infrastructure directly. **Clean ports make prod parity a `.env` file. Tangled code makes it a rewrite.**

## Self-check

1. Why must dev and prod images be *different on purpose* — and what's the one thing that must stay the same?
2. You can't hit a breakpoint in your FastAPI route running in Docker. What two things are probably missing?
3. Moving to ElastiCache changes a connection string; moving to SQS adds a new file. Why the difference?
4. A teammate puts `import boto3` in a service. What breaks, and when?
5. Why is "one Dockerfile with `--reload` hardcoded" a smell in *both* directions?

## Things to steal

- **One image, three ways to run it.** Not three apps — a multi-stage build plus compose files and env.
- **Dev and prod differ on purpose; source is identical.** Only config and the run command change.
- **The debugger port is six lines and gated on env.** Attach to the real container process — stop debugging with `print()`.
- **Wire-compatible = config swap; different API = adapter swap.** RDS/ElastiCache are free; SQS/SES/S3 are one file behind a port.
- **LocalStack gives AWS services a faithful local stand-in.** Parity all the way down.
- **Never run prod as root.** Add a `USER`.
- **If "move to AWS" is a code change, the leak is in your architecture, not your Dockerfile.**
- **Match rigor to stage.** Three setups for a prod app; one Dockerfile for a weekend.
