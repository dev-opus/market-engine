import { Test, TestingModule } from '@nestjs/testing';
import { Feed } from './feed';

describe('Feed', () => {
  let provider: Feed;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Feed],
    }).compile();

    provider = module.get<Feed>(Feed);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
