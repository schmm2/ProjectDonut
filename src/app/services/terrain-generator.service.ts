import { Injectable } from '@angular/core';
import * as BABYLON from 'babylonjs';
import {GameBoardTile} from '../classes/game-board-tile';

@Injectable({
  providedIn: 'root'
})
export class TerrainGeneratorService {

  public constructor() { }

  private scene: any;
  private tileElevation = 5.0;
  private tileRadius = 4.0;
  private tileDiameter = this.tileRadius * 2;
  private tileLength = this.tileRadius * 2.0;
  private tileSideHalf = this.tileRadius / 2.0;
  private tileHeightHalf = Math.sqrt(Math.pow(this.tileRadius, 2) - Math.pow(this.tileSideHalf, 2));
  private tileHeight = this.tileHeightHalf * 2.0;


  public setScene(scene) {
    this.scene = scene;
  }

  public buildTerrain(landTiles: GameBoardTile[]) {
    const meshArray = [];

    for (const landTile of landTiles) {
      const positionX = landTile.mapCoordinates.x;
      const positionY = landTile.mapCoordinates.y;

      // construct new cylinder according to gameBoard Tiles
      const newCylinder = BABYLON.MeshBuilder.CreateCylinder(landTile.name, {
        diameterTop: this.tileDiameter,
        diameterBottom: this.tileDiameter,
        height: this.tileElevation,
        tessellation: 6},
        this.scene);
      // hide until all is computed
      //newCylinder.isVisible = false;

      newCylinder.position.x = positionX * (this.tileRadius + this.tileSideHalf);
      // y coordinate in map 2d space is z axis in 3d world
      newCylinder.position.z = positionY * this.tileHeight;
      // shift z axis
      if (landTile.yPositionShifted) {
        newCylinder.position.z += this.tileHeightHalf;
      }
      const cylinderMaterial = new BABYLON.StandardMaterial('mat1', this.scene);
      console.log(landTile.type);
      if (landTile.type === 2) {
        //cylinderMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
      }

      //newCylinder.mapCoordinates = landTile.mapCoordinates;
      /*newCylinder.actionManager = new BABYLON.ActionManager(this.scene);
      newCylinder.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPickTrigger, function(bjsevt) {
            console.log(bjsevt.source.type);
            console.log(bjsevt.source.mapCoordinates);
            console.log(bjsevt.source.costStyleCode);
          }
        )
      );*/
      newCylinder.material = cylinderMaterial;

      meshArray.push(newCylinder);
    }
    // merge all meshes together
    const mergedMeshes = BABYLON.Mesh.MergeMeshes(meshArray);
    mergedMeshes.position = new BABYLON.Vector3(-120, 0, -120);

    return mergedMeshes;
  }
}
