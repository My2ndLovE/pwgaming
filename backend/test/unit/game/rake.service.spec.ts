import { Test, TestingModule } from '@nestjs/testing';
import { RakeService } from '../../../src/modules/game/services/rake.service';

describe('RakeService', () => {
  let service: RakeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RakeService],
    }).compile();

    service = module.get<RakeService>(RakeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateRake', () => {
    it('should calculate 5% rake on eligible pot', () => {
      const potAmount = 40; // 5% = $2, under cap
      const rake = service.calculateRake(potAmount);

      expect(rake).toBe(2); // 5% of 40
    });

    it('should cap rake at $3', () => {
      const potAmount = 100; // 5% would be $5, but cap is $3
      const rake = service.calculateRake(potAmount);

      expect(rake).toBeLessThanOrEqual(3);
    });

    it('should cap rake at $3 for large pots', () => {
      const potAmount = 1000; // 5% would be $50, but cap is $3
      const rake = service.calculateRake(potAmount);

      expect(rake).toBe(3);
    });

    it('should not charge rake on pots less than $10', () => {
      const potAmount = 9;
      const rake = service.calculateRake(potAmount);

      expect(rake).toBe(0);
    });

    it('should charge rake on pots exactly $10', () => {
      const potAmount = 10;
      const rake = service.calculateRake(potAmount);

      expect(rake).toBe(0.5); // 5% of 10
    });

    it('should handle zero pot', () => {
      const potAmount = 0;
      const rake = service.calculateRake(potAmount);

      expect(rake).toBe(0);
    });

    it('should handle negative pot (edge case)', () => {
      const potAmount = -10;
      const rake = service.calculateRake(potAmount);

      expect(rake).toBe(0);
    });
  });

  describe('calculateRakeWithDetails', () => {
    it('should return rake and remaining pot', () => {
      const potAmount = 100;
      const result = service.calculateRakeWithDetails(potAmount);

      expect(result.rakeAmount).toBe(3); // Capped at $3
      expect(result.potAfterRake).toBe(97); // 100 - 3
    });

    it('should return zero rake for small pots', () => {
      const potAmount = 5;
      const result = service.calculateRakeWithDetails(potAmount);

      expect(result.rakeAmount).toBe(0);
      expect(result.potAfterRake).toBe(5);
    });

    it('should calculate correct percentage', () => {
      const potAmount = 40;
      const result = service.calculateRakeWithDetails(potAmount);

      expect(result.rakeAmount).toBe(2); // 5% of 40
      expect(result.potAfterRake).toBe(38);
      expect(result.rakePercentage).toBe(5);
    });

    it('should include pot amount in details', () => {
      const potAmount = 100;
      const result = service.calculateRakeWithDetails(potAmount);

      expect(result.originalPotAmount).toBe(100);
    });
  });

  describe('deductRakeFromPot', () => {
    it('should deduct rake from pot amount', () => {
      const potAmount = 100;
      const afterRake = service.deductRakeFromPot(potAmount);

      expect(afterRake).toBe(97); // 100 - 3 (capped rake)
    });

    it('should not deduct from small pots', () => {
      const potAmount = 8;
      const afterRake = service.deductRakeFromPot(potAmount);

      expect(afterRake).toBe(8);
    });
  });

  describe('getRakeConfiguration', () => {
    it('should return rake configuration', () => {
      const config = service.getRakeConfiguration();

      expect(config.rakePercentage).toBe(5);
      expect(config.rakeCap).toBe(3);
      expect(config.minimumPotForRake).toBe(10);
    });
  });

  describe('isRakeApplicable', () => {
    it('should return true for pots >= $10', () => {
      expect(service.isRakeApplicable(10)).toBe(true);
      expect(service.isRakeApplicable(100)).toBe(true);
    });

    it('should return false for pots < $10', () => {
      expect(service.isRakeApplicable(9)).toBe(false);
      expect(service.isRakeApplicable(0)).toBe(false);
      expect(service.isRakeApplicable(-5)).toBe(false);
    });
  });
});
