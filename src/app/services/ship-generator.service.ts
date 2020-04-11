import {Injectable} from '@angular/core';
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import Vector3 = BABYLON.Vector3;
import { AssetLoaderService } from './asset-loader.service';
import { Ship } from '../models/ship';
import { WaterGeneratorService } from './water-generator.service';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShipGeneratorService {
  private scene;
  private shipList: BehaviorSubject<Ship[]> = new BehaviorSubject([]);
  private modelPrefix = 'ships-';
  private initialShipPositionY = 4.15;

  public constructor(
    private assetLoaderService: AssetLoaderService,
    private waterGeneratorService: WaterGeneratorService
  ) {}

  public subscribeToShipList() {
    return this.shipList;
  }


  public init(scene) {
    this.scene = scene;
  }

  public buildShip(location, type) {
    const shipModel = this.assetLoaderService.getAsset(this.modelPrefix + type);
    if ( shipModel) {
      console.log(shipModel);
      const shipMeshes = [];

      // create transform node
      let cot = null;
      if (shipModel.enableCOT) {
        cot = new BABYLON.TransformNode(shipModel.name + '-root');
      }

      shipModel.meshes.forEach(mesh => {
        // create mesh instance
        const newMesh = mesh.createInstance('ship-' + type + mesh.id);
        if (cot) {
          newMesh.parent = cot;
        }
        shipMeshes.push(newMesh);
      });

      // set position
      if (cot) {
        cot.position = new Vector3(location.x, this.initialShipPositionY, location.y);
        cot.rotation.y = 0.6;
      }

      // create new ship object and add it to the list
      const ship = new Ship(shipModel.name,  shipModel.type, shipMeshes, cot);
      const currentValue = this.shipList.value;
      const updatedValue = [...currentValue, ship];
      this.shipList.next(updatedValue);

    } else {
      console.log('asset not found: ' + this.modelPrefix + type);
    }
  }
}
