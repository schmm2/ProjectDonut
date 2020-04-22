import { Injectable } from '@angular/core';
import * as BABYLON from 'babylonjs';
import {GameBoardTile} from '../classes/game-board-tile';
import {AssetLoaderService} from './asset-loader.service';
import {BehaviorSubject} from 'rxjs';
import {TilesGeneratorService} from './tiles-generator.service';

@Injectable({
  providedIn: 'root'
})
export class TerrainGeneratorService {

  public constructor(
    private assetLoaderService: AssetLoaderService,
    private tileGeneratorService: TilesGeneratorService
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
    const time1 = performance.now();
    const mountainTextures = this.assetLoaderService.loadTexturesOfCategory('mountains');
    this.createMeshFromHeightMaps(mountainTextures).then((done) => {
      const time2 = performance.now();
      console.log('Terrain Generator: Creating Terrain took ' + (time2 - time1) + ' milliseconds.');
      console.log('Terrain Generator: Mountain Mesh created');
      // wait for land tiles to be generated
      this.tileGeneratorService.subscribeToGeneratedLandTiles().subscribe((landTiles) => {
        this.buildTerrain(landTiles);
        const time3 = performance.now();
        console.log('Terrain Generator: Creating Terrain took ' + (time3 - time2) + ' milliseconds.');
      });
    });
  }

  public subscribeToGeneratedTerrain() {
    return this.generatedTerrain;
  }

  private createMeshFromHeightMaps(mountainTextures) {
    return new Promise((resolve, reject) => {
      let newMeshesCounter = mountainTextures.length;
      for (const mountainTexture of mountainTextures) {
        BABYLON.Mesh.CreateGroundFromHeightMap(mountainTexture.name, mountainTexture.url, 250, 250, 250, 0, 50, this.scene, false,
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
    const landTileMeshArray = [];
    const coastTilesMeshArray = [];
    const mountainTilesMeshArray = [];
    const mountainsMeshArray = [];

    const time1 = performance.now();
    const copyOfAvailableMountains =  [...this.mountainMeshes];

    const cylinderTemplate = BABYLON.MeshBuilder.CreateCylinder('cylinder-template', {
        diameterTop: this.tileDiameter,
        diameterBottom: this.tileDiameter,
        height: this.tileElevation,
        tessellation: 6},
      this.scene);
    cylinderTemplate.isVisible = false;

    for (const landTile of landTiles) {
      const positionX = landTile.mapCoordinates.x;
      const positionY = landTile.mapCoordinates.y;

      // construct new cylinder according to gameBoard Tiles
      const newCylinder = cylinderTemplate.clone(landTile.name);

      newCylinder.position.x = positionX * (this.tileRadius + this.tileSideHalf);
      // y coordinate in map 2d space is z axis in 3d world
      newCylinder.position.z = positionY * this.tileHeight;
      // shift z axis
      if (landTile.yPositionShifted) {
        newCylinder.position.z += this.tileHeightHalf;
      }
      const cylinderMaterial = new BABYLON.StandardMaterial('mat1', this.scene);

      if (landTile.type === 1) {
        landTileMeshArray.push(newCylinder);
      }

      if (landTile.type === 2) {
        cylinderMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
        coastTilesMeshArray.push(newCylinder);
      }

      if (landTile.type === 3) {
        cylinderMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
        mountainTilesMeshArray.push(newCylinder);
      }

      // center of a mountain tile
      if (landTile.type === 3 && landTile.isMountainCenter) {
        // still mountains to pick for this island
        if (copyOfAvailableMountains.length > 0) {
          const meshName = 'mountainMesh-' + landTile.name;
          const pickedMountain = copyOfAvailableMountains.pop();
          const newMountainMesh = pickedMountain.clone(meshName);
          newMountainMesh.isVisible = true;

          // set mesh position
          // move mesh a bit down
          const mountainMeshPositionY = this.tileElevation / 2 - 0.2;
          newMountainMesh.position = new BABYLON.Vector3(newCylinder.position.x, mountainMeshPositionY, newCylinder.position.z);

          // scale the mesh to fit the tile size
          const meshBoundingBoxSize = newMountainMesh.getBoundingInfo().boundingBox.extendSize;
          const scalingVectorFactor = (2 + landTile.mountainAreaSize) * this.tileRadius / meshBoundingBoxSize.x;
          newMountainMesh.scaling = new BABYLON.Vector3(scalingVectorFactor, scalingVectorFactor, scalingVectorFactor);

          mountainsMeshArray.push(newMountainMesh);
        }
      }
    }
    const time2 = performance.now();
    console.log('Terrain Generator: Building Terrain took ' + (time2 - time1) + ' milliseconds.');

    // merge all meshes together
    const islandTransformerNode = new BABYLON.TransformNode('island-root');
    const coastTilesMerged = BABYLON.Mesh.MergeMeshes(coastTilesMeshArray, true, true, null, false, false);
    const mountainTilesMerged = BABYLON.Mesh.MergeMeshes(mountainTilesMeshArray, true, true, null, false, false);
    const landTilesMerged = BABYLON.Mesh.MergeMeshes(landTileMeshArray, true, true, null, false, false);
    const mountainsMerged = BABYLON.Mesh.MergeMeshes(mountainsMeshArray, true, true, null, false, false);
    // set parent
    coastTilesMerged.parent = mountainTilesMerged.parent = landTilesMerged.parent = mountainsMerged.parent = islandTransformerNode;
    // move island to final location
    islandTransformerNode.position = new BABYLON.Vector3(-120, 0, -120);
    const time3 = performance.now();

    console.log('Terrain Generator: Merging Meshes took ' + (time3 - time2) + ' milliseconds.');

    this.terrainMesh = coastTilesMerged;

    this.generatedTerrain.next(this.terrainMesh);
  }
}
