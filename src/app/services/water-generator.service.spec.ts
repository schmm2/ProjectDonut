import { TestBed } from '@angular/core/testing';

import { WaterGeneratorService } from './water-generator.service';

describe('WaterGeneratorService', () => {
  let service: WaterGeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WaterGeneratorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
