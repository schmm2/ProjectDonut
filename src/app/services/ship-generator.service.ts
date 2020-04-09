import {Injectable} from '@angular/core';
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import Vector3 = BABYLON.Vector3;

@Injectable({
  providedIn: 'root'
})
export class ShipGeneratorService {
  private scene;
  private modelUrl = './assets/models/ships/';
  public constructor() { }
  private meshContainer;

  private assetManager;
  private shipList = [
    {
      name: 'fluyt',
      modelName: 'cartoon-fluyt.obj',
      scale: 0.008,
      diffuseTextures: [
        'assets/textures/ships/cartoon-fluyt-diffuse.png'
      ]
    }
  ];

  public setScene(scene) {
    this.scene = scene;
  }

  public init() {
    this.meshContainer = new Map();

    this.assetManager = new BABYLON.AssetsManager(this.scene);
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
        this.buildShip(new Vector3(0,4,-50));
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
