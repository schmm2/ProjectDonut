import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  private selectedGameObject;
  private scene;

  public constructor() { }

  public init(scene) {
    this.scene = scene;
  }

  public setSelectedObject(id, mesh) {
    this.selectedGameObject = {
      id,
      mesh
    };
    console.log('Game State Service: object now selected' + this.selectedGameObject.id);
  }

  public centerCameraToSelectedObject() {
    console.log(this.selectedGameObject);
    if (this.selectedGameObject && this.selectedGameObject.mesh) {
      console.log('Center Camera to active Object');
      const activeCamera = this.scene.activeCamera;
      activeCamera.setTarget(this.selectedGameObject.mesh.position);
    }
  }
}
