import {Injectable} from '@angular/core';
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import Vector3 = BABYLON.Vector3;
import { AssetLoaderService } from './asset-loader.service';
import { Ship } from '../classes/ship';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShipGeneratorService {
  private scene;
  private shipList: BehaviorSubject<Ship[]> = new BehaviorSubject([]);
  private modelPrefix = 'ships-';
  private initialShipPositionY = 0.65;

  public constructor(
    private assetLoaderService: AssetLoaderService,
  ) {}

  public subscribeToShipList() {
    return this.shipList;
  }


  public init(scene) {
    this.scene = scene;
  }

  public buildShip(location, type) {
    const shipModel = this.assetLoaderService.getModel(this.modelPrefix + type);
    if ( shipModel) {
      // console.log(shipModel);
      const shipMeshes = [];

      shipModel.meshes.forEach(mesh => {
        // create mesh clone
        const newMesh = mesh.clone('ship-' + type + mesh.id);
        shipMeshes.push(newMesh);
      });
      const mergedShipMesh = BABYLON.Mesh.MergeMeshes(shipMeshes, true, false, null , false, true);

      // add action manager to first 'main' mesh
      mergedShipMesh.actionManager = new BABYLON.ActionManager(this.scene);
      mergedShipMesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPickTrigger, (pickEvent) => {
            console.log(pickEvent.source);
            console.log(pickEvent.source.shipId);
          }
        )
      );

      mergedShipMesh.position = new Vector3(location.x, this.initialShipPositionY, location.y);
      mergedShipMesh.rotation.y = 0.6;

      // create ship id
      const shipId = 'ship-' + BABYLON.Tools.RandomId();

      // store id on mesh for reference reasons
      // @ts-ignore
      mergedShipMesh.shipId = shipId;

      // create new ship game object and add it to the list
      const ship = new Ship(shipId, shipModel.name, shipModel.type, mergedShipMesh);
      const currentValue = this.shipList.value;
      const updatedValue = [...currentValue, ship];
      this.shipList.next(updatedValue);

    } else {
      console.log('asset not found: ' + this.modelPrefix + type);
    }
  }
}
