import { Injectable } from "@angular/core";
import * as BABYLON from "babylonjs";
import { cellPixelShader } from "babylonjs-materials/cell/cell.fragment";
import { BehaviorSubject } from "rxjs";
import { HexGrid } from "../classes/HexGrid";
import { HexMetrics } from "../classes/HexMetrics";

@Injectable({
  providedIn: "root",
})
export class TerrainGeneratorService {
  private generatedTerrainSubject: BehaviorSubject<any> = new BehaviorSubject(
    null
  );

  public constructor() {

  }

  public generateTerrain(scene, heightMapTexture) {
    let noiseTexture = new BABYLON.Texture("assets/terrain/textures/terrainNoise.png", scene);
    noiseTexture.onLoadObservable.add(() => {
      // first we set the noisedata in HexMetrics
      // All cells need to be able to sample noise, we store it once
      HexMetrics.setNoise(noiseTexture);

      // create Mesh
      let hexGrid = new HexGrid(25, 25, heightMapTexture, scene);
      //let generateTerrain = hexGrid.getMergedMesh();
      let hexCells = hexGrid.getCells();

      // Shader Setup
      const lightPosition = new BABYLON.Vector3(-250, 500, -250);
      const lightColor = new BABYLON.Vector3(220 / 255, 220 / 255, 240 / 255);

      const snowTexture = new BABYLON.Texture(
        "assets/textures/material/snow/Snow_002_COLOR.jpg",
        scene
      );
      const snowNormalMap = new BABYLON.Texture(
        "assets/textures/material/snow/Snow_002_NORM.jpg",
        scene
      );

      const grassTexture = new BABYLON.Texture(
        "assets/textures/material/grass/mossy-ground1-albedo.png",
        scene
      );
      const grassNormalMap = new BABYLON.Texture(
        "assets/textures/material/grass/mossy-groundnormal.png",
        scene
      );

      // const rockTexture = new BABYLON.Texture('assets/textures/material/rock/slate2-tiled-albedo2.png', scene);
      // const rockNormalMap = new BABYLON.Texture('assets/textures/material/rock/slate2-tiled-ogl.png', scene);

      // const rockTexture = new BABYLON.Texture('assets/textures/material/rock/sharp-rockface1-albedo.png', scene);
      // const rockNormalMap = new BABYLON.Texture('assets/textures/material/rock/sharp-rockface1-normal-ogl.png', scene);

      const rockTexture = new BABYLON.Texture(
        "assets/textures/material/rock/rock_sliced_Base_Color.png",
        scene
      );
      const rockNormalMap = new BABYLON.Texture(
        "assets/textures/material/rock/rock_sliced_Normal-ogl.png",
        scene
      );

      const sandTexture = new BABYLON.Texture(
        "assets/textures/material/sand/sand1-albedo.png",
        scene
      );
      const sandNormalMap = new BABYLON.Texture(
        "assets/textures/material/sand/sand1-normal-ogl.png",
        scene
      );

      const terrainMaterial = new BABYLON.ShaderMaterial(
        "terrainMaterial",
        scene,
        {
          vertexElement: "./assets/shaders/terrain/terrain",
          fragmentElement: "./assets/shaders/terrain/terrain",
        },
        {
          attributes: ["position", "uv", "normal"],
          uniforms: ["worldViewProjection", "world", "worldView"],
        }
      );

      // terrain textures
      terrainMaterial.setTexture("snowTexture", snowTexture);
      terrainMaterial.setTexture("snowNormalMap", snowNormalMap);

      terrainMaterial.setTexture("rockTexture", rockTexture);
      terrainMaterial.setTexture("rockNormalMap", rockNormalMap);

      terrainMaterial.setTexture("grassTexture", grassTexture);
      terrainMaterial.setTexture("grassNormalMap", grassNormalMap);

      terrainMaterial.setTexture("sandTexture", sandTexture);
      terrainMaterial.setTexture("sandNormalMap", sandNormalMap);

      terrainMaterial.setVector3("cameraPosition", scene.activeCamera.position);
      terrainMaterial.setVector3("lightPosition", lightPosition);
      terrainMaterial.setVector3("lightColor", lightColor);

      //terrainMaterial.wireframe = true;

      scene.ambientColor = new BABYLON.Color3(1, 1, 1);

      //console.log(generateTerrain);
      //generateTerrain.material = terrainMaterial;
      let myMaterial = new BABYLON.StandardMaterial("test1", scene)
      /*myMaterial.diffuseColor = new BABYLON.Color3(1, 0, 1);
      myMaterial.specularColor = new BABYLON.Color3(0.5, 0.6, 0.87);
      myMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
      myMaterial.ambientColor = new BABYLON.Color3(0.23, 0.98, 0.53);*/

      // generateTerrain.material = terrainMaterial;

      
      hexCells.forEach((cell) => {
        cell.mesh.useVertexColors = true;
        //terrainMaterial.setColor3("test", cell.color);
        cell.mesh.material = terrainMaterial;

      });

      //this.generatedTerrainSubject.next(generateTerrain);
    });
  }

  public subscribeToGeneratedTerrain() {
    return this.generatedTerrainSubject;
  }
}
