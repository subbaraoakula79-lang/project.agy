import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('check', () => {
    it('should return status ok', () => {
      const result = controller.check();
      expect(result.status).toBe('ok');
      expect(result.service).toBe('yatra-seva-api');
      expect(result.timestamp).toBeDefined();
      expect(typeof result.uptime).toBe('number');
    });
  });

  describe('ready', () => {
    it('should return ready status', () => {
      const result = controller.ready();
      expect(result.status).toBe('ready');
      expect(result.checks).toBeDefined();
    });
  });
});
