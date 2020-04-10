import { Injectable } from '@angular/core';
import * as BABYLON from 'babylonjs';
// @ts-ignore
import AssetsJSON from '../../assets/assets.json';
import Vector3 = BABYLON.Vector3;

@Injectable({
  providedIn: 'root'
})
export class AssetLoaderService {
  private assetManager: BABYLON.AssetsManager;
  private scene;
  private modelList;

  public constructor() {}

  public init(scene) {
    this.scene = scene;
    this.modelList = new Map();
    this.loadAssets();
  }

  private loadAssets() {
    let modelsToLoad = 0;
    this.assetManager = new BABYLON.AssetsManager(this.scene);
    // console.log(AssetsJSON);

    AssetsJSON.forEach(assetCategory => {
      // console.log(assetCategory);
      modelsToLoad += assetCategory.models.length;
      assetCategory.models.forEach(assetModel => {
        // console.log(assetModel);

        BABYLON.SceneLoader.ImportMesh(null, assetCategory.url, assetModel.fileName, this.scene, (newMeshes) => {
          let numberOfMesh = 0;
          const meshsOfModel = [];

          newMeshes.forEach(mesh => {
            mesh.setEnabled(false);
            mesh.position = Vector3.Zero();
            mesh.scaling = new Vector3(assetModel.scale, assetModel.scale, assetModel.scale);

            // diffuseTexture exist
            const path = assetModel.diffuseTextures[numberOfMesh];
            if (path) {
              mesh.material = new BABYLON.StandardMaterial('mat', this.scene);
              // @ts-ignore
              mesh.material.diffuseTexture = new BABYLON.Texture(path, this.scene);
            }
            meshsOfModel.push(mesh);
            // next
            numberOfMesh++;
          });
          // add model to modeList
          const model = {
            name: assetModel.name,
            type: assetCategory.name,
            scale: assetModel.scale,
            meshes: meshsOfModel
          };
          const modelId = assetCategory.name + '-' + assetModel.name;
          this.modelList.set(modelId, model);

          // one done
          modelsToLoad--;
          // check if we are done loading
          if (modelsToLoad === 0) {
            console.log('AssetLoader: all models loaded');
            console.log(this.modelList);
          }
        });
      });
    });
  }
}
