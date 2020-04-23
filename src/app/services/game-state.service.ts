import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  private selectedGameObject;
  private scene;
  private activeCamera;

  public constructor() { }

  public init(scene) {
    this.scene = scene;
    this.activeCamera = this.scene.activeCamera;
    // disable unnecessary inputs;
    this.activeCamera.inputs.remove(this.activeCamera.inputs.attached.mouse);
    this.activeCamera.inputs.remove(this.activeCamera.inputs.attached.gamepad);

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
}
