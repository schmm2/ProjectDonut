import { Injectable } from '@angular/core';
import * as BABYLON from 'babylonjs';
import {GameBoardTile} from '../classes/game-board-tile';
import {AssetLoaderService} from './asset-loader.service';

@Injectable({
  providedIn: 'root'
})
export class TerrainGeneratorService {

  public constructor(
    private assetLoaderService: AssetLoaderService
  ) { }

  private scene: any;
  private tileElevation = 5.0;
  private tileRadius = 4.0;
  private tileDiameter = this.tileRadius * 2;
  private tileLength = this.tileRadius * 2.0;
  private tileSideHalf = this.tileRadius / 2.0;
  private tileHeightHalf = Math.sqrt(Math.pow(this.tileRadius, 2) - Math.pow(this.tileSideHalf, 2));
  private tileHeight = this.tileHeightHalf * 2.0;

  private mountainTextures;
  private mountainMeshes = [];

  public init(scene) {
    return new Promise((resolve, reject) => {
      this.scene = scene;
      this.mountainTextures = this.assetLoaderService.loadTexturesOfCategory('mountains');
      let newMeshesCounter = this.mountainTextures.length;
      for (const mountainTexture of this.mountainTextures) {
        console.log(mountainTexture);
        BABYLON.Mesh.CreateGroundFromHeightMap(mountainTexture.name, mountainTexture.url, 150, 150, 250, 0, 30, this.scene, false,
          (newMesh) => {
            console.log(newMesh);
            newMeshesCounter--;
            newMesh.rotation.y = -Math.PI / 3;
            newMesh.isVisible = false;
            this.mountainMeshes.push(newMesh);
            if(newMeshesCounter == 0){
              resolve();
            }
          });
      }
    });
  }

  public buildTerrain(landTiles: GameBoardTile[]) {
    console.log(this.mountainMeshes);
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

      if (landTile.type === 2) {
        cylinderMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
      }
      if (landTile.type === 3 && landTile.isMountainCenter) {
        console.log("BULD MOUNTAIN");
        // get a random mesh
        console.log(this.mountainMeshes);
        let newMountainMesh = this.mountainMeshes[0].createInstance('dd');
        newMountainMesh.isVisible = true;
        newMountainMesh.position = newCylinder.position;
        let meshBoundingBoxSize = newMountainMesh.getBoundingInfo().boundingBox.extendSize;
        console.log(meshBoundingBoxSize);
        let scalingVectorFactor = //this.tileHeightHalf / meshBoundingBoxSize.x;
        newMountainMesh.scaling = new BABYLON.Vector3(0.4,0.4,0.4);
        console.log(newMountainMesh);
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
    //const mergedMeshes = BABYLON.Mesh.MergeMeshes(meshArray);
    //mergedMeshes.position = new BABYLON.Vector3(-120, 0, -120);

    return null;
    return mergedMeshes;
  }
}
