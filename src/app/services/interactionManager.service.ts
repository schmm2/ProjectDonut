import { Injectable } from '@angular/core';
import {GameStateService} from './game-state.service';

@Injectable({
  providedIn: 'root'
})
export class InteractionManagerService {
  private scene;
  private unitsToMove;

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
    this.unitsToMove = [];
    this.registerUnitMovement();
    this.registerKeyboardInputs();
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
          //console.log(this.unitsToMove);
        }
      }
    });

    this.scene.onPointerDown = (evt, pickResult) =>  {
      const activeObject = this.gameStateService.getSelectedObject();
      if (activeObject) {
        console.log(activeObject);
        console.log(pickResult);
        if (pickResult.hit && pickResult.pickedMesh.id === 'water') {
          console.log('new unit to move');
          let targetVec = pickResult.pickedPoint;
          const initVec = activeObject.mesh.position.clone();
          const distVec = BABYLON.Vector3.Distance(targetVec, initVec);

          targetVec = targetVec.subtract(initVec);
          const targetVecNorm = BABYLON.Vector3.Normalize(targetVec);

          //let rotation = Math.acos(targetVecNorm.x / Math.sqrt(Math.pow(targetVecNorm.x, 2) + Math.pow(targetVecNorm.z, 2)));
          console.log(targetVecNorm);
          let hypothenuse = Math.sqrt(Math.pow(targetVecNorm.x,2)+ Math.pow(targetVecNorm.z,2));
          let sin = targetVecNorm.z / hypothenuse;
          let angleInRadian = Math.acos(sin);
          // correct the radian from 180-360 degress
          if(targetVecNorm.x <= 0){
            angleInRadian = 2 * Math.PI - angleInRadian;
          }
          console.log("----------");
          console.log(sin);
          console.log(angleInRadian);

          // object start at 90deg when rotation = 0;
          let shipRotationCorrection = -(Math.PI / 2);

          console.log("new rotation");
          console.log(Math.PI + shipRotationCorrection);
          let rotation = Math.atan(targetVecNorm.z / targetVecNorm.x);
          //console.log(rotation)
          //console.log((360/ (Math.PI * 2) * rotation));
          const unitToMove = {
            id: activeObject.id,
            object: activeObject.mesh,
            distVec,
            targetVecNorm,
            rotation: angleInRadian  
          };
          console.log(unitToMove);
          // check if unit already is added to move array
          const unitToMoveIndex = this.unitsToMove.findIndex(unit => unit.id === activeObject.id);
          console.log(unitToMoveIndex);
          // remove existing move commands
          if (unitToMoveIndex >= 0) {
            this.unitsToMove.splice(unitToMoveIndex, 1);
            console.log(this.unitsToMove);
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
}
