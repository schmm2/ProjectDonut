import { Injectable } from '@angular/core';
import * as BABYLON from 'babylonjs';
import { MixMaterial, GridMaterial } from 'babylonjs-materials';
import { AssetLoaderService } from './asset-loader.service';
import Vector3 = BABYLON.Vector3;
import {Color3} from 'babylonjs/Maths/math.color';

@Injectable({
  providedIn: 'root'
})
export class TerrainGeneratorService {

  public constructor(
    private assetLoaderService: AssetLoaderService
  ) { }

  private scene: any;

  public static successCallback() {
    console.log('terrain loaded');
  }

  public setScene(scene) {
    this.scene = scene;
  }

  public buildTerrain() {
    // create terrain
    const island2AUrl = 'assets/textures/terrain/heightMap_island_a2.png';
    const islandCUrl = 'assets/textures/terrain/islandC.png';
    const islandHon = 'assets/textures/terrain/hono.png';

    // create materials
    // Create the mix material
    const mix = new MixMaterial('terrainMix', this.scene);
    mix.mixTexture1 = new BABYLON.Texture('assets/textures/terrain/hono-color.png', this.scene);

    // diffuse textures
    mix.diffuseTexture1 = new BABYLON.Texture('assets/textures/material/sandy_rocks1_albedo.png', this.scene); // R
    mix.diffuseTexture2 = new BABYLON.Texture('assets/textures/material/grass.jpg', this.scene); // G
    mix.diffuseTexture3 = new BABYLON.Texture('assets/textures/material/sand2.jpg', this.scene); // B
    const diffuseTexture4 = new BABYLON.Texture('assets/textures/material/snow.jpg', this.scene); // A
    mix.diffuseTexture4  = diffuseTexture4;

    mix.specularColor = new BABYLON.Color3(0,0,0);
    // scale
    mix.diffuseTexture1.vScale = mix.diffuseTexture1.uScale = 100;
    mix.diffuseTexture2.vScale = mix.diffuseTexture2.uScale = 100;
    mix.diffuseTexture3.vScale = mix.diffuseTexture3.uScale = 100;

    // Use CreateGroundFromHeightMap to create a height map of 200 units by 200
    // units, with 250 subdivisions in each of the `x` and `z` directions, for a
    // total of 62,500 divisions.
    const islandH = BABYLON.Mesh.CreateGroundFromHeightMap('island', islandHon, 250, 250, 120, 0, 25, this.scene, false, () => {
      console.log('terrain loaded');
      islandH.convertToFlatShadedMesh();
      islandH.material = mix;
    });



    //mix.diffuseTexture4.vScale = mix.diffuseTexture4.uScale = 100;

    /* console.log(this.assetLoaderService.getAllModels());
     let islandX = this.assetLoaderService.getModel('terrain-island5a');
     console.log(islandX);
     islandX.meshes.forEach(mesh => {
       if(mesh.geometry){
       const newMesh = mesh.createInstance('terrain-' + mesh.id);
       newMesh.position = new Vector3(0,0,0);
       newMesh.material.specularColor = new BABYLON.Color3(0.,0.,0.);
       console.log(newMesh.material);*/
    // apply material
    /*if(mesh.material) {
      newMesh.material = null;
      newMesh.material = mix;
    }*/



    return null;
    return islandH;
  }






    //islandA2Mesh.material = mix;
    //islandA2Mesh.material.wireframe = true;
    //islandA2Mesh.material = new GridMaterial("groundMaterial", this.scene);

    //return null;


}
