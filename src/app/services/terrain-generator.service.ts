import { Injectable } from '@angular/core';
import * as BABYLON from 'babylonjs';
import {GameBoardTile} from '../classes/game-board-tile';
import {AssetLoaderService} from './asset-loader.service';
import {BehaviorSubject} from 'rxjs';
import {TilesGeneratorService} from './tiles-generator.service';
import {ShaderMaterial} from "babylonjs/Materials/shaderMaterial";
import {Texture} from "babylonjs/Materials/Textures/texture";

@Injectable({
  providedIn: 'root'
})
export class TerrainGeneratorService {

  public constructor(
    private assetLoaderService: AssetLoaderService,
    private tileGeneratorService: TilesGeneratorService
  ) { }

  private test;
  private scene: any;
  private tileElevation = 5.0;
  private tileRadius = 2;
  private tileDiameter = this.tileRadius * 2;
  private tileLength = this.tileRadius * 2.0;
  private tileSideHalf = this.tileRadius / 2.0;
  private tileHeightHalf = Math.sqrt(Math.pow(this.tileRadius, 2) - Math.pow(this.tileSideHalf, 2));
  private tileHeight = this.tileHeightHalf * 2.0;

  private mountainMeshes = [];
  private terrainMesh;

  private generatedTerrain: BehaviorSubject<any> = new BehaviorSubject(this.terrainMesh);

  private findCorrespondingVertice(subdevisions, mapCoordinates) {
    let x = mapCoordinates.x;
    let y = mapCoordinates.y;

    let verticeIndex = (subdevisions * (y-1) + x) * 3;
    return verticeIndex;
  }

  public init(scene) {
    let terrainHeightMap = this.createTerrainTexture();
    const gradientTextures = this.assetLoaderService.loadTexturesOfCategory('gradient');
   // console.log(gradientTextures);

    let mat = new BABYLON.StandardMaterial('mat',scene);
   // mat.wireframe = true;

    //const snowTexture = new BABYLON.Texture('assets/textures/material/snow/rock-snow-ice1-2k_Base_Color.png', scene);
    //const snowNormalMap = new BABYLON.Texture('assets/textures/material/snow/rock-snow-ice1-2k_Normal-ogl.png', scene);

    const snowTexture = new BABYLON.Texture('assets/textures/material/snow/Snow_002_COLOR.jpg', scene);
    const snowNormalMap = new BABYLON.Texture('assets/textures/material/snow/Snow_002_NORM.jpg', scene);

    //const grassTexture = new BABYLON.Texture('assets/textures/material/grass/grass1-albedo3.png', scene);
    //const grassNormalMap = new BABYLON.Texture('assets/textures/material/grass/grass1-normal1-ogl.png', scene);

    const grassTexture = new BABYLON.Texture('assets/textures/material/grass/mossy-ground1-albedo.png', scene);
    const grassNormalMap = new BABYLON.Texture('assets/textures/material/grass/mossy-groundnormal.png', scene);


    //const rockTexture = new BABYLON.Texture('assets/textures/material/rock/slate2-tiled-albedo2.png', scene);
    //const rockNormalMap = new BABYLON.Texture('assets/textures/material/rock/slate2-tiled-ogl.png', scene);

    const rockTexture = new BABYLON.Texture('assets/textures/material/rock/sharp-rockface1-albedo.png', scene);
    const rockNormalMap = new BABYLON.Texture('assets/textures/material/rock/sharp-rockface1-normal-ogl.png', scene);

    const sandTexture = new BABYLON.Texture('assets/textures/material/sand/sand1-albedo.png', scene);
    const sandNormalMap = new BABYLON.Texture('assets/textures/material/sand/sand1-normal-ogl.png', scene);


    //const rockTexture = new BABYLON.Texture('assets/textures/material/rock/rock_sliced_Base_Color.png', scene);
    //const rockNormalMap = new BABYLON.Texture('assets/textures/material/rock/rock_sliced_Normal-ogl.png', scene);


    var heightMapTexture = new BABYLON.CustomProceduralTexture('textureX', './assets/shaders/terrainNoise', 1024, scene);
    mat.diffuseTexture = heightMapTexture;

    const terrainMaterial = new BABYLON.ShaderMaterial('terrainMaterial', scene, {
        vertexElement: './assets/shaders/terrain/terrain',
        fragmentElement: './assets/shaders/terrain/terrain',
      },
      {
        needAlphaBlending: true,
        attributes: ['position', 'uv', 'normal'],
        uniforms: ['worldViewProjection', 'world', 'worldView']
      });

    terrainMaterial.setTexture('heightMap', heightMapTexture);

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
    let lightPosition = new BABYLON.Vector3(-150, 350, -50);
    var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 10, segments: 32}, scene);
    sphere.position = lightPosition;
    terrainMaterial.setVector3('lightPosition', lightPosition);
    terrainMaterial.setVector2('resolution', new BABYLON.Vector2(1024, 1024));
    //terrainMaterial.wireframe = true;

    let newGround = BABYLON.Mesh.CreateGround('terrainX', 300, 300, 200, this.scene, true );
    newGround.material = terrainMaterial;
    newGround.convertToFlatShadedMesh();




















    if(gradientTextures[0]) {
      console.log(gradientTextures[0]);
      console.log(terrainHeightMap);

      let size = gradientTextures[0].getBaseSize();
      let gradientPixels = gradientTextures[0].readPixels();

      let numberOfPixels = size.width * size.height;
      let dataArray = new Uint8Array(numberOfPixels);
      console.log(numberOfPixels);
      console.log(dataArray);

      let pixelCounter = 0;
      console.log(gradientPixels);
      for (let i = 0; i < numberOfPixels; i += 4) {
        // r = b = g, ignore alpha
        const gradientValue = gradientPixels[i];
        let newHeightMapValue = terrainHeightMap[pixelCounter] - gradientValue;
        if (newHeightMapValue < 0) {
          newHeightMapValue = 0;
        }

        dataArray[pixelCounter] = newHeightMapValue;

        //console.log(gradientValueStartingPosition);
        pixelCounter++;
      }

      console.log(pixelCounter);
      console.log(dataArray);
    }
      /*
      const mountainTextures = this.assetLoaderService.loadTexturesOfCategory('mountains');
      this.tileGeneratorService.subscribeToGeneratedLandTiles().subscribe((landTiles) => {
        console.log(landTiles);

        let startingPointZeroZeroOfIsland = new BABYLON.Vector2(20,20);
        let subdivisions = 400 + 1;
        let startingPoint = this.findCorrespondingVertice(subdivisions, startingPointZeroZeroOfIsland);

        var updatePositions = (positions) => {
          console.log(positions);

          // apply island shape
          for (let landTile of landTiles) {
            //console.log(landTile);
            // find position on plane
            let correspondingVerticeIndex = startingPoint + this.findCorrespondingVertice(subdivisions, landTile.mapCoordinates);
            positions[correspondingVerticeIndex + 1] = landTile.evelation;


            // add mountains
            // center of a mountain tile
            if (landTile.type === 3 && landTile.isMountainCenter) {
              // still mountains to pick for this island




              const pickedMountainTexture = mountainTextures.pop();
              if (pickedMountainTexture) {

                let mapCoordinatesOfVerticeX =  correspondingVerticeIndex % subdivisions;
                let mapCoordinatesOfVerticeY =  (correspondingVerticeIndex -mapCoordinatesOfVerticeX) / subdivisions;
                let verticeCoordinates = new BABYLON.Vector2(mapCoordinatesOfVerticeX,mapCoordinatesOfVerticeY);
                console.log(verticeCoordinates);

                let mountainPixel = pickedMountainTexture.readPixels();
                let mounatinTextureSize = pickedMountainTexture.getBaseSize();

                console.log(mountainPixel)
                let pixelCount = mountainPixel.length / 4;

                let scaling = 1/10;
                let scaledWith = mounatinTextureSize.width  *scaling;
                let scaledHeight = mounatinTextureSize.height * scaling;
                let startPositionVector = new BABYLON.Vector2(verticeCoordinates.x - (scaledWith / 2), verticeCoordinates.y - (scaledHeight/2));
                console.log(startPositionVector);

                console.log(scaledWith);
                console.log(scaledHeight);

                for (let i = 0; i < scaledHeight; i++) {
                  for (let b = 0; b < scaledWith; b++){
                    let newPosition  = new BABYLON.Vector2(startPositionVector.x + b, startPositionVector.y + i);
                    let correspondingVertice = this.findCorrespondingVertice(subdivisions, newPosition );
                    let mountainHeightDataIndex = (i * scaledWith + b * 4) / scaling;
                    //console.log(mountainHeightDataIndex);
                    positions[correspondingVertice + 1] = mountainPixel[mountainHeightDataIndex];
                  }
                  //console.log(mountainPixel);

                  // find position on plane
                  //let positionX = i %  mounatinTextureSize.width;
                  //let positionY = (pixelCount - positionX) / mounatinTextureSize.width;
                  //
                  //console.log(positionVector);

                }
            }

                // set mesh position
                // move mesh a bit down
                const center = landTile.mapCoordinates;
                const scalingVectorFactor = landTile.mountainAreaSize;



            }
          }
        };
        newGround.updateMeshPositions(updatePositions);
      });

      /*let vertexData = BABYLON.VertexData.CreateGroundFromHeightMap({
        width: 256,
        height:  256,
        subdivisions: 150,
        minHeight: 0,
        maxHeight: 20,
        buffer: dataArray,
        bufferWidth: 256,
        bufferHeight: 256,
        colorFilter: new BABYLON.Color3(0.3, 0.59, 0.11),
        alphaFilter: 0,
      });
      console.log(vertexData);
      //vertexData.applyToMesh(this.mesh)


      vertexData.applyToMesh(this.test);

      //console.log(dataArray);
      //console.log(terrainx);
    }*/


    /*
    let heightMapTexture = new BABYLON.RawTexture(
      new Uint8Array([128, 128, 128, 255]), // data
      1, // width
      1, // height
      BABYLON.Engine.TEXTUREFORMAT_RGBA, // format
      this.scene, // scene
      false, // gen mipmaps
      false, // invertY
      BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
      BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT
    );*/

    this.scene = scene;
    /*
    const time1 = performance.now();
    const mountainTextures = this.assetLoaderService.loadTexturesOfCategory('mountains');
    this.createMeshFromHeightMaps(mountainTextures).then((done) => {
      const time2 = performance.now();
      console.log('Terrain Generator: Creating Terrain took ' + (time2 - time1) + ' milliseconds.');
      console.log('Terrain Generator: Mountain Mesh created');
      // wait for land tiles to be generated
      this.tileGeneratorService.subscribeToGeneratedLandTiles().subscribe((landTiles) => {
        this.buildTerrain(landTiles);
        const time3 = performance.now();
        console.log('Terrain Generator: Creating Terrain took ' + (time3 - time2) + ' milliseconds.');
      });
    });*/
  }

  private createTerrainTexture() {
    const SimplexNoise = require('simplex-noise');
    const simplex = new SimplexNoise(Math.random);
    const t = 0;
    const data = [];
    let width = 256;
    let height = 256;
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const value = (simplex.noise3D(x / 16, y / 16, t / 16) * 0.5 + 0.5) * 255;
        //const g = simplex.noise3D(x / 8, y / 8, t / 16) * 0.5 + 0.5;
        data[(x + y * width)] = value;
        //data[(x + y * 256) * 4 + 3] = 255;
      }
    }
    console.log(data);
    return data;
    //
  }

  public subscribeToGeneratedTerrain() {
    return this.generatedTerrain;
  }

  private createMeshFromHeightMaps(mountainTextures) {
    return new Promise((resolve, reject) => {
      let newMeshesCounter = mountainTextures.length;
      for (const mountainTexture of mountainTextures) {
        BABYLON.Mesh.CreateGroundFromHeightMap(mountainTexture.name, mountainTexture.url, 250, 250, 150, 0, 60, this.scene, false,
          (newMesh) => {
            newMeshesCounter--;
            newMesh.rotation.y = -Math.PI / 3;
            newMesh.isVisible = false;
            const mat = new BABYLON.StandardMaterial('mat', this.scene);
            mat.diffuseColor = new BABYLON.Color3(1, 0, 0);
            newMesh.material = mat;
            this.mountainMeshes.push(newMesh);
            // no more height maps to generate
            if (newMeshesCounter === 0) {
              resolve();
            }
          });
      }
    });
  }

  public buildTerrain(landTiles: GameBoardTile[]) {
    const landTileMeshArray = [];
    const coastTilesMeshArray = [];
    const mountainTilesMeshArray = [];
    const mountainsMeshArray = [];

    const time1 = performance.now();
    const copyOfAvailableMountains =  [...this.mountainMeshes];

    const cylinderTemplate = BABYLON.MeshBuilder.CreateCylinder('cylinder-template', {
        diameterTop: this.tileDiameter,
        diameterBottom: this.tileDiameter,
        height: this.tileElevation,
        tessellation: 6},
      this.scene);
    cylinderTemplate.isVisible = false;

    for (const landTile of landTiles) {
      const positionX = landTile.mapCoordinates.x;
      const positionY = landTile.mapCoordinates.y;

      // construct new cylinder according to gameBoard Tiles
      const newCylinder = cylinderTemplate.clone(landTile.name);

      newCylinder.position.x = positionX * (this.tileRadius + this.tileSideHalf);
      // y coordinate in map 2d space is z axis in 3d world
      newCylinder.position.z = positionY * this.tileHeight;
      // shift z axis
      if (landTile.yPositionShifted) {
        newCylinder.position.z += this.tileHeightHalf;
      }
      const cylinderMaterial = new BABYLON.StandardMaterial('mat1', this.scene);

      if (landTile.type === 1) {
        landTileMeshArray.push(newCylinder);
      }

      if (landTile.type === 2) {
        cylinderMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
        coastTilesMeshArray.push(newCylinder);
      }

      if (landTile.type === 3) {
        cylinderMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
        mountainTilesMeshArray.push(newCylinder);
      }

      // center of a mountain tile
      if (landTile.type === 3 && landTile.isMountainCenter) {
        // still mountains to pick for this island
        if (copyOfAvailableMountains.length > 0) {
          const meshName = 'mountainMesh-' + landTile.name;
          const pickedMountain = copyOfAvailableMountains.pop();
          const newMountainMesh = pickedMountain.clone(meshName);
          newMountainMesh.isVisible = true;

          // set mesh position
          // move mesh a bit down
          const mountainMeshPositionY = this.tileElevation / 2 - 0.2;
          newMountainMesh.position = new BABYLON.Vector3(newCylinder.position.x, mountainMeshPositionY, newCylinder.position.z);

          // scale the mesh to fit the tile size
          const meshBoundingBoxSize = newMountainMesh.getBoundingInfo().boundingBox.extendSize;
          const scalingVectorFactor = (2 + landTile.mountainAreaSize) * this.tileRadius / meshBoundingBoxSize.x;
          newMountainMesh.scaling = new BABYLON.Vector3(scalingVectorFactor, scalingVectorFactor, scalingVectorFactor);

          mountainsMeshArray.push(newMountainMesh);
        }
      }
    }
    const time2 = performance.now();
    console.log('Terrain Generator: Building Terrain took ' + (time2 - time1) + ' milliseconds.');

    // merge all meshes together
    const islandTransformerNode = new BABYLON.TransformNode('island-root');
    const coastTilesMerged = BABYLON.Mesh.MergeMeshes(coastTilesMeshArray, true, true, null, false, false);
    coastTilesMerged.name = 'coastTiles-merged';
    const mountainTilesMerged = BABYLON.Mesh.MergeMeshes(mountainTilesMeshArray, true, true, null, false, false);
    const landTilesMerged = BABYLON.Mesh.MergeMeshes(landTileMeshArray, true, true, null, false, false);
    const mountainsMerged = BABYLON.Mesh.MergeMeshes(mountainsMeshArray, true, true, null, false, false);
    const cylinderMaterial = new BABYLON.StandardMaterial('mat1', this.scene);
    cylinderMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
    mountainTilesMerged.material = cylinderMaterial;
    // set parent
    coastTilesMerged.parent = mountainTilesMerged.parent = landTilesMerged.parent = mountainsMerged.parent = islandTransformerNode;
    // move island to final location
    islandTransformerNode.position = new BABYLON.Vector3(-50, 0, -50);
    const time3 = performance.now();
    // mountainsMerged.convertToFlatShadedMesh();

    console.log('Terrain Generator: Merging Meshes took ' + (time3 - time2) + ' milliseconds.');

    this.terrainMesh = coastTilesMerged;
    //coastTilesMerged.applyToMesh(this.test);
    this.generatedTerrain.next(this.terrainMesh);
  }
}
