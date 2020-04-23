import { TestBed } from '@angular/core/testing';

import { InteractionManagerService } from './interactionManager.service';

describe('InputHandlerService', () => {
  let service: InteractionManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InteractionManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
