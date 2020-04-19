import { Injectable } from '@angular/core';
import {GameStateService} from './game-state.service';

@Injectable({
  providedIn: 'root'
})
export class InteractionManagerService {
  private scene;
  public constructor(
    private gameStateService: GameStateService
  ) { }

  private handleKeyDown(key) {
    const keyUpperCase = key.toUpperCase();
    switch (keyUpperCase) {
      case 'B':
        console.log('Toggle Building System');
        break;
      case 'C':
        this.gameStateService.centerCameraToSelectedObject();
        break;
    }
  }

  public init(scene) {
    console.log('ActionManager Service: init');
    this.scene = scene;
    this.registerKeyboardInputs();
  }

  private registerKeyboardInputs() {
    this.scene.onKeyboardObservable.add((kbInfo) => {
      switch (kbInfo.type) {
        case BABYLON.KeyboardEventTypes.KEYDOWN:
          this.handleKeyDown(kbInfo.event.key);
          break;
        case BABYLON.KeyboardEventTypes.KEYUP:
          // console.log('KEY UP: ', kbInfo.event.keyCode);
          break;
      }
    });
  }
}
