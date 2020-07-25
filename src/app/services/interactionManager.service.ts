import { Injectable } from '@angular/core';
import { GameStateService } from './game-state.service';

@Injectable({
  providedIn: 'root'
})

export class InteractionManagerService {
  private scene;
  private mouseWheelSpeed = 8.0;

  public constructor(
    private gameStateService: GameStateService
  ) { }

  private handleKeyDown(key) {
    const keyUpperCase = key.toUpperCase();
    switch (keyUpperCase) {
      case 'B':
        //console.log('Toggle Building System');
        this.gameStateService.toggleBuildingSystem();
        break;
      case 'C':
        this.gameStateService.centerCameraToSelectedObject();
        break;
      case 'F':
        this.gameStateService.toggleFreeMovingCamera();
        break;
      case 'Y':
        //
        break;
      case 'ESCAPE':
        this.gameStateService.removeSelectedObject();
        break;
    }
  }

  public init(scene) {
    console.log('ActionManager Service: init');
    this.scene = scene;
    this.registerKeyboardInputs();
    this.addMouseWheelZoom();
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

  private addMouseWheelZoom() {
    this.scene.onPrePointerObservable.add( (pointerInfo, eventState) => {
      const event = pointerInfo.event;
      let delta = 0;
      if (event.wheelDelta) {
        delta = event.wheelDelta;
      } else if (event.detail) {
        delta = -event.detail;
      }
      if (delta) {
        const dir = this.scene.activeCamera.getDirection(BABYLON.Axis.Z);
        // tslint:disable-next-line:max-line-length
        const directionScaled = new BABYLON.Vector3(dir.x * this.mouseWheelSpeed, dir.y * this.mouseWheelSpeed, dir.z * this.mouseWheelSpeed);

        if (delta > 0) {
          this.scene.activeCamera.position.addInPlace(directionScaled);
        } else {
          this.scene.activeCamera.position.subtractInPlace(directionScaled);
        }
      }
    }, BABYLON.PointerEventTypes.POINTERWHEEL, false);
  }
}
