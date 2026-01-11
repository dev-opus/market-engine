import dotenv from 'dotenv';
import log4js, { type Logger } from 'log4js';

dotenv.config();

export class Config {
  private logger: Logger;

  constructor() {
    this.logger = log4js.getLogger('MarketSimulator');

    log4js.configure({
      appenders: {
        out: { type: 'stdout' },
        app: { type: 'file', filename: 'logs/market-simulator.log' },
      },
      categories: {
        default: { appenders: ['out', 'app'], level: 'debug' },
      },
    });

    this.logger.info('Configuration initialized');
  }

  getLogger(): Logger {
    return this.logger;
  }

  ensureEnvVariables(): void {
    const requiredVars = ['PORT', 'EXCHANGE'];

    requiredVars.forEach((varName) => {
      if (!process.env[varName]) {
        this.logger.error(`Environment variable ${varName} is not set.`);
        throw new Error(
          `Environment variable ${varName} is required but not set.`
        );
      }
    });

    this.logger.info('All required environment variables are set.');
  }
}
