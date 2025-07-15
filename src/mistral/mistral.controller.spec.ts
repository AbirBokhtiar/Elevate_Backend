import { Test, TestingModule } from '@nestjs/testing';
import { MistralController } from './mistral.controller';

describe('OpenaiController', () => {
  let controller: MistralController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MistralController],
    }).compile();

    controller = module.get<MistralController>(MistralController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
