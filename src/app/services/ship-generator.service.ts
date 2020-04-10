import {Injectable} from '@angular/core';
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import Vector3 = BABYLON.Vector3;

@Injectable({
  providedIn: 'root'
})
export class ShipGeneratorService {
  private scene;
  public constructor() { }
  private shipList = [];
  private initalShipPositionY = 4.2;


  public init(scene) {
    this.scene = scene;

    this.assetManager.onTaskError = (error) => {
      console.log(error);
    };
    this.meshContainer = [];
    this.loadAssets();
  }

  private loadAssets() {
    this.shipList.forEach(ship => {
      console.log(ship);

      BABYLON.SceneLoader.ImportMesh(null, this.modelUrl, ship.modelName, this.scene, (newMeshes) => {
        let numberOfMesh = 0;
        newMeshes.forEach(mesh => {

          mesh.setEnabled(false);
          mesh.position = Vector3.Zero();
          mesh.scaling = new Vector3(ship.scale, ship.scale, ship.scale);

          // diffuseTexture exist
          let path = ship.diffuseTextures[numberOfMesh];
          if (path) {
            mesh.material = new BABYLON.StandardMaterial('mat', this.scene);
            // @ts-ignore
            mesh.material.diffuseTexture = new BABYLON.Texture(path, this.scene);
          }
          // next
          numberOfMesh++;
        });
        console.log(newMeshes);
        let newShip = {
          meshes: newMeshes
        };

        this.meshContainer[ship.name] = newMeshes;
        this.buildShip(new Vector3(0, this.shipPositionY, -50));
        //console.log(newScene);
      });




    });
  }


  public buildShip(location) {
    let newShipObject = this.meshContainer['fluyt'];
    newShipObject.forEach(mesh => {
      let newMesh = mesh.createInstance("ship-flut-" + this.scene.meshes.length);
      console.log(newMesh);
      newMesh.position = location;
    });

    //console.log(newShipInstance);
  }

}
