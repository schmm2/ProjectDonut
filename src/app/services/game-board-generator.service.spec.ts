import { TestBed } from '@angular/core/testing';

import { GameBoardGeneratorService } from './game-board-generator.service';

describe('GameBoardGeneratorService', () => {
  let service: GameBoardGeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameBoardGeneratorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
