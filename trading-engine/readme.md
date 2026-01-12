# Trading Engine

A real-time cryptocurrency arbitrage trading system built with NestJS that monitors multiple exchanges, detects price discrepancies, and executes arbitrage opportunities.

## Architecture

The system follows a modular, event-driven architecture with three core components:

- **Feed Module**: Connects to multiple exchanges via WebSocket, maintains order book state, and emits market data updates
- **Arbitrage Module**: Monitors order book updates across exchanges, identifies profitable opportunities, and deduplicates using Redis
- **Execution Module**: Handles the execution of identified arbitrage opportunities

Communication between modules is event-driven using NestJS EventEmitter2, enabling loose coupling and scalability.

## Market Data

### Order Book Management

Each exchange connection (`FeedConnection`) maintains a local order book state:
- **Bids/Asks**: Stored as `Map<price, quantity>` for efficient lookups
- **Best Bid/Ask**: Calculated from the order book and emitted on every update
- **Sequence Validation**: Tracks `lastUpdateId` to ensure message ordering integrity

### Synchronization Flow

1. **Initial Snapshot**: On connection, fetches full order book snapshot via REST API (`/api/v3/depth`)
2. **Message Buffering**: Buffers WebSocket messages received before sync completes
3. **Gap Detection**: Validates sequence numbers (`U`, `u`, `pu`) to detect missing updates
4. **Replay**: Applies buffered messages in correct sequence order
5. **Real-time Updates**: Processes incremental updates once synchronized

### Event Emission

On each order book change, emits `orderbook.update` events containing:
```typescript
{
  exchange: string;
  bestBid: number;
  bestAsk: number;
}
```

## Arbitrage Logic

### Opportunity Detection

The arbitrage module listens for `orderbook.update` events and maintains the latest best bid/ask for each exchange. When at least 2 exchanges have data:

1. **Find Best Prices**: Identifies the exchange with the lowest ask (best buy) and highest bid (best sell)
2. **Calculate Profit**: `profit = bestSell.bid - bestBuy.ask`
3. **Threshold Check**: Only considers opportunities with profit > $0.50
4. **Deduplication**: Uses Redis to prevent processing the same opportunity within 60 seconds

### Deduplication Strategy

Creates a fingerprint from opportunity details:
```
buy:{exchange}-sell:{exchange}-buyPrice:{price}-sellPrice:{price}
```

Stored in Redis with 60-second expiration to prevent duplicate executions of the same opportunity.

### Event Emission

When a profitable opportunity is found, emits `arbitrage.opportunity` event:
```typescript
{
  buyFrom: string;
  sellTo: string;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  timestamp: number;
}
```

## Fault Tolerance

### Automatic Reconnection

- **Exponential Backoff**: Reconnection delays start at 1s and double (1s, 2s, 4s, 8s...) up to 30s max
- **Max Attempts**: Stops after 10 failed reconnection attempts
- **State Reset**: On reconnection, resets sync state and buffer, re-syncs order book

### Sequence Validation

- **Out-of-Sequence Detection**: Validates that `event.pu === lastUpdateId` before processing
- **Automatic Resync**: Triggers full resync if sequence gaps are detected
- **Gap Recovery**: Validates buffered messages have continuous sequence numbers

### Error Handling

- **WebSocket Errors**: Logged but don't trigger immediate reconnection (close event handles it)
- **Sync Failures**: Automatically retries sync if initial snapshot or message replay fails
- **Redis Errors**: Logged to console (connection failures would prevent deduplication but not crash the system)

## Execution

The execution module listens for `arbitrage.opportunity` events and handles trade execution:

- **Logging**: Logs opportunity details (exchanges, prices, expected profit)
- **Placeholder**: Currently logs execution; actual order placement logic to be implemented
- **Event Emission**: Emits `execution.completed` event for downstream processing/persistence

## How to Run

### Prerequisites

1. **Node.js**: v18+ (check with `node --version`)
2. **Redis**: Running instance accessible via `REDIS_URL`
3. **Exchange Simulators**: Two or more exchange-simulator instances running (see `../exchange-simulator/readme.md`)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file or set the following environment variables:

```bash
# Server port (optional, defaults to 3000)
PORT=3000

# Redis connection URL
REDIS_URL=redis://localhost:6379

# Exchange configurations (JSON object mapping exchange names to base URLs)
EXCHANGES_AND_BASE_URLS='{"binance":"http://localhost:3000","coinbase":"http://localhost:3001"}'
```

**Example with multiple exchanges:**
```bash
EXCHANGES_AND_BASE_URLS='{"exchange1":"http://localhost:3000","exchange2":"http://localhost:3001","exchange3":"http://localhost:3002"}'
```

### Running the Application

**Development mode (with hot reload):**
```bash
npm run start:dev
```

**Production mode:**
```bash
npm run build
npm run start:prod
```

**Standard start:**
```bash
npm start
```

### Example Setup

1. **Start Redis:**
   ```bash
   redis-server
   # Or with Docker:
   docker run -d -p 6379:6379 redis:alpine
   ```

2. **Start Exchange Simulators** (in separate terminals):
   ```bash
   # Terminal 1 - Exchange 1
   cd ../exchange-simulator
   EXCHANGE=binance PORT=3000 MID=50000 npm run dev

   # Terminal 2 - Exchange 2
   EXCHANGE=coinbase PORT=3001 MID=50010 npm run dev
   ```

3. **Start Trading Engine:**
   ```bash
   cd trading-engine
   REDIS_URL=redis://localhost:6379 EXCHANGES_AND_BASE_URLS='{"binance":"http://localhost:3000","coinbase":"http://localhost:3001"}' npm run start:dev
   ```

### Verification

Once running, you should see:
- Connection logs for each exchange: `[exchange] Connecting to ws://...`
- WebSocket connection confirmations: `[exchange] WebSocket connected`
- Order book updates being processed
- Arbitrage opportunities logged when profit > $0.50 detected
- Execution logs when opportunities are processed

## Infrastructure Requirements

- **Redis Server**: Required for arbitrage opportunity deduplication
- **Exchange Data Sources**: WebSocket and REST API endpoints (exchange-simulator)

## Event Flow

```
Exchange WebSocket → FeedConnection → orderbook.update event
                                              ↓
                                    Arbitrage Module
                                              ↓
                                    (if profitable)
                                              ↓
                                    arbitrage.opportunity event
                                              ↓
                                    Execution Module
                                              ↓
                                    execution.completed event
```
