import {Injectable} from '@angular/core';
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import Vector3 = BABYLON.Vector3;
import { AssetLoaderService } from './asset-loader.service';
import { Ship } from '../classes/ship';
import {BehaviorSubject} from 'rxjs';
import {GameStateService} from './game-state.service';

@Injectable({
  providedIn: 'root'
})
export class ShipGeneratorService {
  private generatedShipSubject: BehaviorSubject<Ship> = new BehaviorSubject(null);
  private modelPrefix = 'ships-';
  private initialShipPositionY = 0.55;

  public constructor(
    private assetLoaderService: AssetLoaderService,
  ) {}

  public subscribeToGeneratedShip() {
    return this.generatedShipSubject;
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

      mergedShipMesh.position = new Vector3(location.x, this.initialShipPositionY, location.y);
      mergedShipMesh.rotation.y = 0.6;

      // create ship id
      const shipId = 'ship-' + BABYLON.Tools.RandomId();

      // store id on mesh for reference reasons
      // @ts-ignore
      mergedShipMesh.shipId = shipId;

      // create new ship game object and add it to the list
      const ship = new Ship(shipId, shipModel.name, shipModel.type, mergedShipMesh);
      this.generatedShipSubject.next(ship);

    } else {
      console.log('asset not found: ' + this.modelPrefix + type);
    }
  }
}
