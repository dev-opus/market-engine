# Exchange Simulator

## Purpose

A simulated cryptocurrency exchange that generates realistic order book data for BTCUSDT. Provides REST API and WebSocket endpoints for market depth snapshots and real-time updates. Can be run as multiple independent exchange instances by configuring different environment variables.

## Data Model

- **Order Book**: Maintains bids and asks as arrays of `[price, quantity]` pairs
- **Snapshot Format**: `{ lastUpdateId, bids, asks }`
- **Update Format**: Binance-style depth update with `e`, `E`, `s`, `U`, `u`, `pu`, `b`, `a` fields
- **Symbol**: BTCUSDT (fixed)

## How to Run

1. Set required environment variables:
   - `MID`: Initial mid price (e.g., `50000`)
   - `PORT`: Server port (e.g., `3000`)
   - `EXCHANGE`: Exchange identifier (e.g., `binance`, `coinbase`)

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in development:
   ```bash
   npm run dev
   ```

4. Or build and run in production:
   ```bash
   npm run build
   npm start
   ```

**Running Multiple Exchanges:**

To simulate multiple exchanges (e.g., for arbitrage testing), run separate instances with different configurations:

```bash
# Exchange 1
EXCHANGE=binance PORT=3000 MID=50000 npm run dev

# Exchange 2
EXCHANGE=coinbase PORT=3001 MID=50010 npm run dev
```

Each instance operates independently with its own order book state and price movements.

**Endpoints:**
- `GET /api/v3/depth` - Order book snapshot
- `WS /ws` - WebSocket stream for real-time updates

## Market Behaviour

- **Update Frequency**: 400ms intervals via WebSocket
- **Price Movement**: 30% chance per update to shift mid price (random walk ±$2.00)
- **Quantity Updates**: 60% chance to modify 1-2 bid/ask quantities (50-90% of original)
- **Level Deletion**: 20% chance to remove a level (quantity set to 0)
- **Level Addition**: 15% chance to add a new level within ±$25 of mid
- **Initial State**: 10 levels on each side with offsets [0.5, 1.0, 2.0, 3.5, 5.0, 7.5, 10.0, 15.0, 20.0, 30.0] from mid price
