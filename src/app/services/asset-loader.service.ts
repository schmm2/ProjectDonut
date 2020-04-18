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
  private assetsManager: BABYLON.AssetsManager;
  private scene;
  private modelAssetList;
  private imageAssetList;
  private isLoaded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  public constructor() {}

  public init(scene) {
    this.scene = scene;
    this.modelAssetList = new Map();
    this.imageAssetList = new Map();
    this.assetsManager = new BABYLON.AssetsManager(this.scene);
    this.loadAssets();
  }

  public subscribeToAssetsLoadState() {
    return this.isLoaded;
  }

  public getModel(id: any) {
    if (!this.modelAssetList.has(id)) {
      return null;
    }
    return this.modelAssetList.get(id);
  }

  public getAllModels() {
    return this.modelAssetList;
  }

  private loadAssets() {
    AssetsJSON.forEach(assetCategory => {
      // load available images
      // console.log(assetCategory);
      if (assetCategory.images) {
        assetCategory.images.forEach(imageAsset => {
          const path = assetCategory.url + 'images/' + imageAsset.fileName;
          // console.log(path);
          const imageTask = this.assetsManager.addImageTask(imageAsset.name, path);

          imageTask.onSuccess = (task) => {
            // console.log(task);
            const imageId = assetCategory.name + '-' + imageAsset.name;
            this.imageAssetList.set(imageId, task.image);
          };

          imageTask.onError = (task) => {
            console.log('image loader task failed');
            console.log(task);
          };
        });
      }

      // load available models
      if (assetCategory.models) {
        assetCategory.models.forEach(assetModel => {
          // console.log(assetModel);
          const meshPath = assetCategory.url + 'models/';
          const meshTask = this.assetsManager.addMeshTask(assetModel.name, '', meshPath, assetModel.fileName);
          meshTask.onSuccess = (task) => {
            //console.log(task);
            const newMeshes = task.loadedMeshes;
            const meshsOfModel = [];

            let count = 0;
            newMeshes.forEach(mesh => {
              // console.log(mesh);
              mesh.setEnabled(false);
              mesh.position = Vector3.Zero();
              mesh.scaling = new Vector3(assetModel.scale, assetModel.scale, assetModel.scale);

              // add diffuseTexture
              if (assetModel.diffuseTextures) {
                const diffuseTexturePath =  assetCategory.url + 'textures/' + assetModel.diffuseTextures[count];
                // console.log(diffuseTexturePath);
                if (diffuseTexturePath) {
                  mesh.material = new BABYLON.StandardMaterial('mat', this.scene);
                  // @ts-ignore
                  mesh.material.diffuseTexture = new BABYLON.Texture(diffuseTexturePath, this.scene);
                }
              }
              count++;
              meshsOfModel.push(mesh);
              // console.log(meshsOfModel);
            });
            const model = {
              name: assetModel.name,
              type: assetCategory.name,
              scale: assetModel.scale,
              enableCOT: assetModel.enableCOT,
              enablePhysics: assetModel.enablePhysics,
              meshes: meshsOfModel,
            };
            // add model to list
            const modelId = assetCategory.name + '-' + assetModel.name;
            this.modelAssetList.set(modelId, model);
          };
        });
      }
    });

    this.assetsManager.onFinish = (tasks) => {
      console.log('AssetLoader: all models loaded');
      console.log(this.modelAssetList);
      console.log(this.imageAssetList);
      this.isLoaded.next(true);
    };

    // load assets
    this.assetsManager.load();
  }
}
