import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  private selectedGameObject;
  private scene;
  private activeCamera;

  private buildingModeValue = false;
  private buildingMode: BehaviorSubject<boolean> = new BehaviorSubject(this.buildingModeValue);
  
  private unitsToMove = [];

  public constructor() { }

  public init(scene) {
    this.scene = scene;
    this.activeCamera = this.scene.activeCamera;
    // disable unnecessary inputs;
    this.activeCamera.inputs.remove(this.activeCamera.inputs.attached.mouse);
    this.activeCamera.inputs.remove(this.activeCamera.inputs.attached.gamepad);

    this.registerUnitMovement();

  }

  public subscribeToBuildingMode(){
    return this.buildingMode;
  }

  public getScene(){
    return this.scene;
  }

  public setSelectedObject(id, mesh) {
    this.selectedGameObject = {
      id,
      mesh
    };
    console.log('Game State Service: object now selected' + this.selectedGameObject.id);
  }

  public getSelectedObject() {
    return this.selectedGameObject;
  }

  public removeSelectedObject() {
    this.selectedGameObject = null;
  }

  public toggleBuildingSystem(){
    this.buildingModeValue = !this.buildingModeValue;
    this.buildingMode.next(this.buildingModeValue);
  }

  public toggleFreeMovingCamera() {
    // check if mouse is already attached
    if (this.activeCamera.inputs.attached.mouse) {
      // console.log('remove mouse');
      this.activeCamera.inputs.remove(this.activeCamera.inputs.attached.mouse);
    } else {
      // console.log('add mouse');
      this.activeCamera.inputs.add(new BABYLON.FreeCameraMouseInput());
    }
  }

  public centerCameraToSelectedObject() {
    console.log(this.selectedGameObject);
    if (this.selectedGameObject && this.selectedGameObject.mesh) {
      console.log('Center Camera to active Object');
      this.activeCamera.setTarget(this.selectedGameObject.mesh.position);
    }
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
      const activeObject = this.getSelectedObject();
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
}
