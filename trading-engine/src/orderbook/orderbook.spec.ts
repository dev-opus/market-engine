import { Test, TestingModule } from '@nestjs/testing';
import { Orderbook } from './orderbook';

describe('Orderbook', () => {
  let provider: Orderbook;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Orderbook],
    }).compile();

    provider = module.get<Orderbook>(Orderbook);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
