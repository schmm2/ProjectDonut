import {Injectable} from '@angular/core';
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import Vector3 = BABYLON.Vector3;
import { AssetLoaderService } from './asset-loader.service';

@Injectable({
  providedIn: 'root'
})
export class ShipGeneratorService {
  private scene;
  private shipList = [];
  private modelPrefix = 'ships-';
  private initalShipPositionY = 4.2;

  public constructor(
    private assetLoaderService: AssetLoaderService,
  ) {}

  public init(scene) {
    this.scene = scene;
  }

  // location Vector2(position.x,position.z), ship type
  public buildShip(location, type) {
    const shipModel = this.assetLoaderService.getAsset(this.modelPrefix + type);
    if ( shipModel) {
      console.log(shipModel);
      let shipMeshes = [];

      // create transformnode
      let cot = null;
      if (shipModel.enableCOT) {
        cot = new BABYLON.TransformNode(shipModel.name + '-root');
      }

      shipModel.meshes.forEach(mesh => {
        const newMesh = mesh.createInstance('ship-' + type + mesh.id);

        if (cot) {
          console.log('enable cot');
          newMesh.parent = cot;
        }
        shipMeshes.push(newMesh);
      });

      if(cot){
        cot.position = new Vector3(location.x, this.initalShipPositionY, location.y);
        cot.rotation.y = 0.6;
      }

    } else {
      console.log('asset not found: ' + this.modelPrefix + type);
    }


    //console.log(newShipInstance);
  }

}
