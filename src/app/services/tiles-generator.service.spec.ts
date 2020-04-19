import { TestBed } from '@angular/core/testing';

import { TilesGeneratorService } from './tiles-generator.service';

describe('GameBoardGeneratorService', () => {
  let service: TilesGeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TilesGeneratorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
