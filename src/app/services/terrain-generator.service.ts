import { Injectable } from '@angular/core';
import * as BABYLON from 'babylonjs';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TerrainGeneratorService {

  public constructor() { }

  private scene: any;
  private terrainMesh;
  private heightMapTexture;
  private heightMapResolution;

  private generatedTerrain: BehaviorSubject<any> = new BehaviorSubject(this.terrainMesh);

  public init(scene, heightmap, heightmapResolution) {
    this.scene = scene;
    this.heightMapTexture = heightmap;
    this.heightMapResolution = heightmapResolution;
    this.generateTerrain();
  }

  private generateTerrain() {
    const lightPosition = new BABYLON.Vector3(-250, 500, -250);
    const lightColor =  new BABYLON.Vector3(220 / 255, 220 / 255, 240 / 255);

    const snowTexture = new BABYLON.Texture('assets/textures/material/snow/Snow_002_COLOR.jpg', this.scene);
    const snowNormalMap = new BABYLON.Texture('assets/textures/material/snow/Snow_002_NORM.jpg', this.scene);

    const grassTexture = new BABYLON.Texture('assets/textures/material/grass/mossy-ground1-albedo.png', this.scene);
    const grassNormalMap = new BABYLON.Texture('assets/textures/material/grass/mossy-groundnormal.png', this.scene);

    // const rockTexture = new BABYLON.Texture('assets/textures/material/rock/slate2-tiled-albedo2.png', scene);
    // const rockNormalMap = new BABYLON.Texture('assets/textures/material/rock/slate2-tiled-ogl.png', scene);

    // const rockTexture = new BABYLON.Texture('assets/textures/material/rock/sharp-rockface1-albedo.png', scene);
    // const rockNormalMap = new BABYLON.Texture('assets/textures/material/rock/sharp-rockface1-normal-ogl.png', scene);

    const rockTexture = new BABYLON.Texture('assets/textures/material/rock/rock_sliced_Base_Color.png', this.scene);
    const rockNormalMap = new BABYLON.Texture('assets/textures/material/rock/rock_sliced_Normal-ogl.png', this.scene);

    const sandTexture = new BABYLON.Texture('assets/textures/material/sand/sand1-albedo.png', this.scene);
    const sandNormalMap = new BABYLON.Texture('assets/textures/material/sand/sand1-normal-ogl.png', this.scene);


    const terrainMaterial = new BABYLON.ShaderMaterial('terrainMaterial', this.scene, {
        vertexElement: './assets/shaders/terrain/terrain',
        fragmentElement: './assets/shaders/terrain/terrain',
      },
      {
        attributes: ['position', 'uv', 'normal'],
        uniforms: ['worldViewProjection', 'world', 'worldView']
      });

    // set variables of terrain material
    terrainMaterial.setTexture('heightMap', this.heightMapTexture);

    // console.log(this.heightMapTexture.readPixels()); 

    // terrain textures
    terrainMaterial.setTexture('snowTexture', snowTexture);
    terrainMaterial.setTexture('snowNormalMap', snowNormalMap);

    terrainMaterial.setTexture('rockTexture', rockTexture);
    terrainMaterial.setTexture('rockNormalMap', rockNormalMap);

    terrainMaterial.setTexture('grassTexture', grassTexture);
    terrainMaterial.setTexture('grassNormalMap', grassNormalMap);

    terrainMaterial.setTexture('sandTexture', sandTexture);
    terrainMaterial.setTexture('sandNormalMap', sandNormalMap);

    terrainMaterial.setVector3('cameraPosition', this.scene.activeCamera.position);

    terrainMaterial.setFloat('mountainHeight', 30.0);


    terrainMaterial.setVector3('lightPosition', lightPosition);
    terrainMaterial.setVector3('lightColor', lightColor);
    terrainMaterial.setFloat('steepnessFactor', 7.);
    terrainMaterial.setVector2('resolution', new BABYLON.Vector2(1024, 1024));
    // terrainMaterial.wireframe = true;

    // create ground
    const ground = BABYLON.Mesh.CreateGround('terrainX', 400, 400, 400, this.scene, true );
    ground.material = terrainMaterial;

    // debug
    // const sphereSun = BABYLON.MeshBuilder.CreateSphere('sphereSun', {diameter: 10, segments: 32}, scene);
    // sphereSun.position = lightPosition;
    console.log(ground);
    console.log(ground.isReady());

    this.generatedTerrain.next(ground);
  } 

  public subscribeToGeneratedTerrain() {
    return this.generatedTerrain;
  }
}
