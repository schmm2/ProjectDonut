import { TestBed } from '@angular/core/testing';

import { ShipGeneratorService } from './ship-generator.service';

describe('ShipGeneratorService', () => {
  let service: ShipGeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShipGeneratorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
