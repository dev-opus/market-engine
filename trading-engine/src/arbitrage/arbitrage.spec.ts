import { Test, TestingModule } from '@nestjs/testing';
import { Arbitrage } from './arbitrage';

describe('Arbitrage', () => {
  let provider: Arbitrage;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Arbitrage],
    }).compile();

    provider = module.get<Arbitrage>(Arbitrage);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
