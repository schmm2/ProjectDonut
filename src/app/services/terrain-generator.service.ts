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

  public generateTerrain(engine, scene, heightMapTexture) {
    let noiseTexture = new BABYLON.Texture("assets/terrain/textures/terrainNoise.png", scene);
    noiseTexture.onLoadObservable.add(() => {
      // first we set the noisedata in HexMetrics
      // All cells need to be able to sample noise, we store it once
      HexMetrics.setNoise(noiseTexture);

      // create Mesh
      let hexGrid = new HexGrid(25, 25, heightMapTexture, scene, engine);
      let generateTerrain = hexGrid.getMergedMesh();
      //let cells = hexGrid.getCells();

      // Shader Setup
      const lightPosition = new BABYLON.Vector3(-250, 500, -250);
      const lightColor = new BABYLON.Vector3(220 / 255, 220 / 255, 240 / 255);

      /*
      
      const snowNormalMap = new BABYLON.Texture(
        "assets/textures/material/snow/Snow_002_NORM.jpg",
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

      
      const rockNormalMap = new BABYLON.Texture(
        "assets/textures/material/rock/rock_sliced_Normal-ogl.png",
        scene
      );

      
      const sandNormalMap = new BABYLON.Texture(
        "assets/textures/material/sand/sand1-normal-ogl.png",
        scene
      );*/

      const grassTexture = new BABYLON.Texture(
        "assets/textures/material/grass/mossy-ground1-albedo.png",
        scene
      );

      const snowTexture = new BABYLON.Texture(
        "assets/textures/material/snow/Snow_002_COLOR.jpg",
        scene
      );

      const rockTexture = new BABYLON.Texture(
        "assets/textures/material/rock/rock_sliced_Base_Color.png",
        scene
      );

      const sandTexture = new BABYLON.Texture(
        "assets/textures/material/sand/sand1-albedo.png",
        scene
      );

      const gridTexture = new BABYLON.Texture(
        "assets/terrain/textures/grid.png",
        scene
      );

      let generatedTerrainVertices = generateTerrain.getVerticesData(BABYLON.VertexBuffer.PositionKind);
      let highlightVertice = [...Array(generatedTerrainVertices.length)].map(x => 0);


      var terrainTypesRefBuffer = new BABYLON.Buffer(engine, highlightVertice, false);
      generateTerrain.setVerticesBuffer(terrainTypesRefBuffer.createVertexBuffer("verticeHighlight", 0, 1, 1));

      const terrainMaterial = new BABYLON.ShaderMaterial(
        "terrainMaterial",
        scene,
        {
          vertexElement: "./assets/shaders/terrain/terrain",
          fragmentElement: "./assets/shaders/terrain/terrain",
        },
        {
          attributes: ["position", "uv", "normal", "terrainTypes", "verticeHighlight"],
          uniforms: ["worldViewProjection", "world", "worldView"],
        }
      );

      terrainMaterial.setTexture("gridTexture", gridTexture);
      terrainMaterial.setTextureArray("terrainTextures", [rockTexture, snowTexture, grassTexture, sandTexture]);

      terrainMaterial.setVector3("cameraPosition", scene.activeCamera.position);
      terrainMaterial.setVector3("lightPosition", lightPosition);
      terrainMaterial.setVector3("lightColor", lightColor);



      scene.onPointerDown = function (evt, pickResult) {
        console.log(pickResult);
        console.log(evt)
        var pickedMesh = pickResult.pickedMesh;

        if (pickedMesh.uniqueId == generateTerrain.uniqueId) {

          var vertices = pickedMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
          console.log(vertices.length);

          console.log("TERRAIN");
          var pickedMeshIndices = pickedMesh.getIndices();
          // pickedMeshIndices[pickResult.faceId * 3] -> vertex number,not the index itself
          var vertexIndex = pickedMeshIndices[pickResult.faceId * 3];

          // create vertex buffer
          let highlightVertice = [...Array(vertices.length / 3.0)].map(x => 0);

          console.log(pickedMeshIndices);
          console.log(vertexIndex);
          console.log(pickedMesh.flatPlaneVerticeStartOffset);

          
          // i = hexCell number in this mesh
          for (let i = 0; i < pickedMesh.flatPlaneVerticeStartOffset.length; i++) {
            // we selected a verticeIndex that matches in a range of flatPlane vertice indexes
            if (vertexIndex > pickedMesh.flatPlaneVerticeStartOffset[i] && vertexIndex < (pickedMesh.flatPlaneVerticeStartOffset[i] + pickedMesh.flatPlaneVerticeCount[i])) {
              let offset = pickedMesh.flatPlaneVerticeStartOffset[i];
              console.log("YOU HIT A PLANE");
              console.log(vertexIndex);
              console.log(i);

              // mark every vertice of the plane as "highlited"
              // * 3 because every vertice contains 3 values
              for (let p = 0; p < (pickedMesh.flatPlaneVerticeCount[i]); p++) {
                highlightVertice[offset + p] = 1.0;
                //console.log(offset + p);
              }
              //console.log(i);
            }
          }
          /*
          // build mode
          for (let i = 0; i < pickedMesh.flatPlaneVerticeStartOffset.length; i++) {
            let offset = pickedMesh.flatPlaneVerticeStartOffset[i];

            // mark every vertice of the plane as "highlited"
            // * 3 because every vertice contains 3 values
            for (let p = 0; p < (pickedMesh.flatPlaneVerticeCount[i]); p++) {
              highlightVertice[offset + p] = 1.0;
              //console.log(offset + p);
            }
          }*/

          console.log(highlightVertice);
          var terrainTypesRefBuffer = new BABYLON.Buffer(engine, highlightVertice, false);
          pickedMesh.setVerticesBuffer(terrainTypesRefBuffer.createVertexBuffer("verticeHighlight", 0, 1, 1));
        }
      };

      generateTerrain.material = terrainMaterial;
      this.generatedTerrainSubject.next(generateTerrain);
    });
  }

  public subscribeToGeneratedTerrain() {
    return this.generatedTerrainSubject;
  }
}
