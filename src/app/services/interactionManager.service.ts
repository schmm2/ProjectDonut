import { Injectable } from '@angular/core';
import { GameStateService } from './game-state.service';

@Injectable({
  providedIn: 'root'
})

export class InteractionManagerService {
  private scene;
  private unitsToMove;
  private mouseWheelSpeed = 8.0;

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
    this.unitsToMove = [];
    this.registerUnitMovement();
    this.registerKeyboardInputs();
    this.addMouseWheelZoom();
  }


  private registerUnitMovement() {
    // Compute translation of Units
    this.scene.registerBeforeRender(() => {
      for (const [index, unitToMove] of this.unitsToMove.entries() ) {
        if (unitToMove.distVec > 0) {
          unitToMove.distVec -= 0.1;
          unitToMove.object.translate(unitToMove.targetVecNorm, 0.1, BABYLON.Space.WORLD);
          unitToMove.object.rotation.y = unitToMove.rotation;
        } else {
          // done translating remove from stack
          this.unitsToMove.splice(index, 1);
        }
      }
    });

    this.scene.onPointerDown = (evt, pickResult) =>  {
      const activeObject = this.gameStateService.getSelectedObject();
      if (activeObject && activeObject.mesh) {
        if (pickResult.hit && pickResult.pickedMesh.id === 'water') {
          // units destination
          let targetVec = pickResult.pickedPoint;
          const initialPosition = activeObject.mesh.position.clone();
          const distVec = BABYLON.Vector3.Distance(targetVec, initialPosition);

          targetVec = targetVec.subtract(initialPosition);
          const targetVecNorm = BABYLON.Vector3.Normalize(targetVec);

          // trigonometry to define the rotation angel tof the unit
          const hypotenuse = Math.sqrt(Math.pow(targetVecNorm.x, 2) + Math.pow(targetVecNorm.z, 2));
          const sin = targetVecNorm.z / hypotenuse;
          let angleInRadian = Math.acos(sin);
          // correct the radian from 180-360 degrees
          if (targetVecNorm.x <= 0) {
            angleInRadian = 2 * Math.PI - angleInRadian;
          }

          const unitToMove = {
            id: activeObject.id,
            object: activeObject.mesh,
            distVec,
            targetVecNorm,
            rotation: angleInRadian
          };

          // check if unit already is added to move array
          const unitToMoveIndex = this.unitsToMove.findIndex(unit => unit.id === activeObject.id);
          // remove existing move commands
          if (unitToMoveIndex >= 0) {
            this.unitsToMove.splice(unitToMoveIndex, 1);
          }
          // add new command to unit
          this.unitsToMove.push(unitToMove);
        }
      }
    };
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
