import { TestBed } from '@angular/core/testing';

import { ActionmanagerService } from './interactionManager.service';

describe('InputHandlerService', () => {
  let service: ActionmanagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActionmanagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
