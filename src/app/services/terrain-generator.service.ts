import { Injectable } from '@angular/core';
import * as BABYLON from 'babylonjs';
import {GameBoardTile} from '../classes/game-board-tile';
import {AssetLoaderService} from './asset-loader.service';
import {BehaviorSubject} from 'rxjs';

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

  private mountainMeshes = [];
  private terrainMesh;

  private generatedTerrain: BehaviorSubject<any> = new BehaviorSubject(this.terrainMesh);

  public init(scene) {
    this.scene = scene;
    const mountainTextures = this.assetLoaderService.loadTexturesOfCategory('mountains');
    return this.createMeshFromHeightMaps(mountainTextures);
  }

  private createMeshFromHeightMaps(mountainTextures) {
    return new Promise((resolve, reject) => {
      let newMeshesCounter = mountainTextures.length;
      for (const mountainTexture of mountainTextures) {
        BABYLON.Mesh.CreateGroundFromHeightMap(mountainTexture.name, mountainTexture.url, 250, 250, 250, 0, 40, this.scene, false,
          (newMesh) => {
            newMeshesCounter--;
            newMesh.rotation.y = -Math.PI / 3;
            newMesh.isVisible = false;
            const mat = new BABYLON.StandardMaterial('mat', this.scene);
            mat.diffuseColor = new BABYLON.Color3(1, 0, 0);
            newMesh.material = mat;
            this.mountainMeshes.push(newMesh);
            // no more height maps to generate
            if (newMeshesCounter === 0) {
              resolve();
            }
          });
      }
    });
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
      // newCylinder.isVisible = false;

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

      if (landTile.type === 3) {
        cylinderMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
      }

      // center of a mountain tile
      if (landTile.type === 3 && landTile.isMountainCenter) {
        // get a random mesh
        const pickedMountainIndex = Math.round(Math.random() * (this.mountainMeshes.length - 1));
        const meshName = 'mountainMesh-' + landTile.name;
        const newMountainMesh = this.mountainMeshes[pickedMountainIndex].createInstance(meshName);
        newMountainMesh.isVisible = true;

        // set mesh position
        // move mesh a bit down
        const mountainMeshPositionY = this.tileElevation / 2 - 0.2;
        newMountainMesh.position = new BABYLON.Vector3(newCylinder.position.x, mountainMeshPositionY, newCylinder.position.z);

        // scale the mesh to fit the tile size
        const meshBoundingBoxSize = newMountainMesh.getBoundingInfo().boundingBox.extendSize;
        const scalingVectorFactor = (2 + landTile.mountainAreaSize) * this.tileRadius / meshBoundingBoxSize.x;
        newMountainMesh.scaling = new BABYLON.Vector3(scalingVectorFactor, scalingVectorFactor, scalingVectorFactor);
      }

      newCylinder.material = cylinderMaterial;
      // console.log(newCylinder);
      meshArray.push(newCylinder);
    }
    // merge all meshes together
    // const mergedMeshes = BABYLON.Mesh.MergeMeshes(meshArray);
    // mergedMeshes.position = new BABYLON.Vector3(-120, 0, -120);

    return null;
    // return mergedMeshes;
  }
}
