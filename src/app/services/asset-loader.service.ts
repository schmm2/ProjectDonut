import { Injectable } from '@angular/core';
import * as BABYLON from 'babylonjs';
// @ts-ignore
import AssetsJSON from '../../assets/assets.json';
import Vector3 = BABYLON.Vector3;
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AssetLoaderService {
  private assetManager: BABYLON.AssetsManager;
  private scene;
  private assetList;
  private isLoaded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  public constructor() {}

  public init(scene) {
    this.scene = scene;
    this.assetList = new Map();
    this.loadAssets();
  }

  public subscribeToAssetsLoadState() {
    return this.isLoaded;
  }

  public getAsset(id: any) {
    if (this.assetList.has(id)) {
      return this.assetList.get(id);
    } else {
      return null;
    }
  }

  private loadAssets() {
    let assetsToLoad = 0;

    this.assetManager = new BABYLON.AssetsManager(this.scene);
    // console.log(AssetsJSON);

    AssetsJSON.forEach(assetCategory => {
      console.log(assetCategory);
      assetsToLoad += assetCategory.models.length;

      assetCategory.models.forEach(assetModel => {
        // console.log(assetModel);

        BABYLON.SceneLoader.ImportMesh(null, assetCategory.url, assetModel.fileName, this.scene, (newMeshes) => {
          let numberOfMesh = 0;
          const meshsOfModel = [];

          newMeshes.forEach(mesh => {
            console.log(mesh);
            mesh.setEnabled(false);
            mesh.position = Vector3.Zero();
            mesh.scaling = new Vector3(assetModel.scale, assetModel.scale, assetModel.scale);

            // add diffuseTexture
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
            enableCOT: assetModel.enableCOT,
            enablePhysics: assetModel.enablePhysics,
            meshes: meshsOfModel,
          };
          const modelId = assetCategory.name + '-' + assetModel.name;
          this.assetList.set(modelId, model);

          // one done
          assetsToLoad--;
          // check if we are done loading
          if (assetsToLoad === 0) {
            console.log(this.assetList);
            this.isLoaded.next(true);
          }
        });
      });
    });
  }
}
