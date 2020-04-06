import { Injectable } from '@angular/core';
import * as BABYLON from 'babylonjs';
import { MixMaterial} from 'babylonjs-materials';

@Injectable({
  providedIn: 'root'
})
export class TerrainGeneratorService {

  public constructor() { }
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

    // Use CreateGroundFromHeightMap to create a height map of 200 units by 200
    // units, with 250 subdivisions in each of the `x` and `z` directions, for a
    // total of 62,500 divisions.
    const islandA2Mesh = BABYLON.Mesh.CreateGroundFromHeightMap('island', islandCUrl, 250, 250, 250, 0, 20, this.scene, false, TerrainGeneratorService.successCallback);

    // create materials
    // Create the mix material
    const mix = new MixMaterial('terrainMix', this.scene);
    mix.mixTexture1 = new BABYLON.Texture('assets/textures/terrain/islandCMixMap.png', this.scene);

    // diffuse textures
    mix.diffuseTexture1 = new BABYLON.Texture('assets/textures/material/grass.jpg', this.scene); // R
    mix.diffuseTexture2 = new BABYLON.Texture('assets/textures/material/sandy_rocks1_albedo.png', this.scene); // G
    mix.diffuseTexture3 = new BABYLON.Texture('assets/textures/material/sand2.jpg', this.scene); // B
    mix.diffuseTexture4 = new BABYLON.Texture('assets/textures/material/ground.jpg', this.scene); // A

    // scale
    mix.diffuseTexture1.vScale = mix.diffuseTexture1.uScale = 100;
    mix.diffuseTexture2.vScale = mix.diffuseTexture2.uScale = 100;
    mix.diffuseTexture3.vScale = mix.diffuseTexture3.uScale = 100;
    mix.diffuseTexture4.vScale = mix.diffuseTexture4.uScale = 100;

    // apply material
    islandA2Mesh.material = mix;

    return islandA2Mesh;
  }
}
