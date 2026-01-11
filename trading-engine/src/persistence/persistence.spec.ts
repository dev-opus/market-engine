import { Test, TestingModule } from '@nestjs/testing';
import { Persistence } from './persistence';

describe('Persistence', () => {
  let provider: Persistence;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Persistence],
    }).compile();

    provider = module.get<Persistence>(Persistence);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
