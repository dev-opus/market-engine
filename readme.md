## Market Engine

Sandboxed cross-exchange trading stack: simulated exchanges plus a NestJS engine that listens for market data, detects arbitrage, and (currently) simulates execution.

### Architecture
- **Exchange Simulator**: Fake exchange exposing REST depth snapshots and WS depth updates.
- **Trading Engine**: NestJS service with three pieces:
  - **Feed**: Maintains WS connections, snapshots, and emits orderbook updates.
  - **Arbitrage**: Finds best bid/ask across exchanges, de-dupes via Redis, emits opportunities.
  - **Execution**: Logs/handles opportunities (placeholder for real orders).

### Folder Structure
- `exchange-simulator/` — Simulated exchange; [see readme](exchange-simulator/readme.md).
- `trading-engine/` — Engine + arbitrage logic; [see readme](trading-engine/readme.md).

### How to Run (quick start)
From the project root (`market-engine`), using the `Makefile`:

1) **Install dependencies**:
```bash
make deps
```

2) **Build simulator images** (first time or after simulator changes):
```bash
make simulators-build
```

3) **Start simulators, Redis, and trading engine**:
```bash
make up
```

4) **Stop everything**:
```bash
make down
```

See the package READMEs in each folder for deeper details and configuration.
