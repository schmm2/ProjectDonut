import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class InteractionManagerService {
  private scene;
  public constructor() { }

  private static handleKeyDown(key) {
    const keyUpperCase = key.toUpperCase();
    switch (keyUpperCase) {
      case 'B':
        console.log('Toggle Building System');
        break;
      case 'C':
        console.log('Center Camera to active Object');
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
          InteractionManagerService.handleKeyDown(kbInfo.event.key);
          break;
        case BABYLON.KeyboardEventTypes.KEYUP:
          // console.log('KEY UP: ', kbInfo.event.keyCode);
          break;
      }
    });
  }
}
