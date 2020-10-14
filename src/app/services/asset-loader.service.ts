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
  private textureAssetList;
  private isLoaded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  public constructor() {}

  public init(scene) {
    this.scene = scene;
    this.modelAssetList = new Map();
    this.textureAssetList = new Map();
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

  public getTexture(id: any ) {
    if (!this.textureAssetList.has(id)) {
      return null;
    }
    return this.textureAssetList.get(id);
  }

  public getAllTextures() {
    return this.textureAssetList;
  }

  public getAllModels() {
    return this.modelAssetList;
  }

  public loadTexturesOfCategory(category: any) {
    const images = [];
    const allImages = this.getAllTextures();
    allImages.forEach((image, key) => {
      if (key.startsWith(category)) {images.push(image); }
    });
    return images;
  }

  private loadAssets() {
    AssetsJSON.forEach(assetCategory => {
      // load available textures
      // console.log(assetCategory);
      if (assetCategory.textures) {
        assetCategory.textures.forEach(textureAsset => {
          const path = assetCategory.url + 'textures/' + textureAsset.fileName;
          // console.log(path);
          const textureTask = this.assetsManager.addTextureTask(textureAsset.name, path);

          textureTask.onSuccess = (task) => {
            // console.log(task);
            const textureId = assetCategory.name + '-' + textureAsset.name;
            this.textureAssetList.set(textureId, task.texture);
          };

          textureTask.onError = (task) => {
            console.log('texture loader task failed');
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
      console.log('AssetLoader: all assets loaded');
      console.log(this.modelAssetList);
      console.log(this.textureAssetList);
      this.isLoaded.next(true);
    };

    // load assets
    this.assetsManager.load();
  }
}
