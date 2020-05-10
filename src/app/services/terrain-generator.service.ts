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

  private generatedTerrain: BehaviorSubject<any> = new BehaviorSubject(this.terrainMesh);

  public init(scene) {
    this.scene = scene;
    const lightPosition = new BABYLON.Vector3(-250, 500, -250);
    const lightColor =  new BABYLON.Vector3(220 / 255, 220 / 255, 240 / 255);

    const snowTexture = new BABYLON.Texture('assets/textures/material/snow/Snow_002_COLOR.jpg', scene);
    const snowNormalMap = new BABYLON.Texture('assets/textures/material/snow/Snow_002_NORM.jpg', scene);

    const grassTexture = new BABYLON.Texture('assets/textures/material/grass/mossy-ground1-albedo.png', scene);
    const grassNormalMap = new BABYLON.Texture('assets/textures/material/grass/mossy-groundnormal.png', scene);

     // const rockTexture = new BABYLON.Texture('assets/textures/material/rock/slate2-tiled-albedo2.png', scene);
     // const rockNormalMap = new BABYLON.Texture('assets/textures/material/rock/slate2-tiled-ogl.png', scene);

    // const rockTexture = new BABYLON.Texture('assets/textures/material/rock/sharp-rockface1-albedo.png', scene);
    // const rockNormalMap = new BABYLON.Texture('assets/textures/material/rock/sharp-rockface1-normal-ogl.png', scene);

    const rockTexture = new BABYLON.Texture('assets/textures/material/rock/rock_sliced_Base_Color.png', scene);
    const rockNormalMap = new BABYLON.Texture('assets/textures/material/rock/rock_sliced_Normal-ogl.png', scene);

    const sandTexture = new BABYLON.Texture('assets/textures/material/sand/sand1-albedo.png', scene);
    const sandNormalMap = new BABYLON.Texture('assets/textures/material/sand/sand1-normal-ogl.png', scene);

    const heightMapResolution = 1024;
    const heightMapTexture = new BABYLON.CustomProceduralTexture('textureX', './assets/shaders/terrainNoise', heightMapResolution, scene);

    const terrainMaterial = new BABYLON.ShaderMaterial('terrainMaterial', scene, {
        vertexElement: './assets/shaders/terrain/terrain',
        fragmentElement: './assets/shaders/terrain/terrain',
      },
      {
        needAlphaBlending: true,
        attributes: ['position', 'uv', 'normal'],
        uniforms: ['worldViewProjection', 'world', 'worldView']
      });

    // set variables of terrain material
    terrainMaterial.setTexture('heightMap', heightMapTexture);

    // terrain textures
    terrainMaterial.setTexture('snowTexture', snowTexture);
    terrainMaterial.setTexture('snowNormalMap', snowNormalMap);

    terrainMaterial.setTexture('rockTexture', rockTexture);
    terrainMaterial.setTexture('rockNormalMap', rockNormalMap);

    terrainMaterial.setTexture('grassTexture', grassTexture);
    terrainMaterial.setTexture('grassNormalMap', grassNormalMap);

    terrainMaterial.setTexture('sandTexture', sandTexture);
    terrainMaterial.setTexture('sandNormalMap', sandNormalMap);

    terrainMaterial.setVector3('cameraPosition', scene.activeCamera.position);

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
  }

  public subscribeToGeneratedTerrain() {
    return this.generatedTerrain;
  }
}
