import { WindowRefService } from '../services/window-ref.service';
import { ElementRef, Injectable, NgZone } from '@angular/core';
import {
  Engine,
  Scene,
  Light,
  Color4,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  CannonJSPlugin
} from 'babylonjs';
import * as BABYLONMATERIAL from 'babylonjs-materials';

import CANNON from 'cannon';

import { WaterGeneratorService } from '../services/water-generator.service';
import { TerrainGeneratorService } from '../services/terrain-generator.service';
import { ShipGeneratorService } from '../services/ship-generator.service';
import { AssetLoaderService } from '../services/asset-loader.service';
import { Ship } from '../classes/ship';
import { InteractionManagerService } from '../services/interactionManager.service';
import { GameStateService } from '../services/game-state.service';
import * as BABYLON from "babylonjs";

@Injectable({ providedIn: 'root' })

export class EngineService {
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private camera: BABYLON.UniversalCamera;
  private scene: Scene;
  private light: Light;
  private renderer;
  private fpsCounter: HTMLDivElement;

  // game-objects
  private terrains: any[] = [];
  private waterPlaneObject: any = null;
  private ships: Ship[] = [];
  private gameBoardTiles: any[] = [];

  private gameBoardTilesVisibility = false;

  public constructor(
    private ngZone: NgZone,
    private windowRef: WindowRefService,
    private waterGeneratorService: WaterGeneratorService,
    private terrainGeneratorService: TerrainGeneratorService,
    private shipGeneratorService: ShipGeneratorService,
    private assetLoaderService: AssetLoaderService,
    private interactionManagerService: InteractionManagerService,
    private gameStateService: GameStateService,
  ) {
    window.CANNON = CANNON;
  }

  public addFpsCounter(fpsCounter: ElementRef<HTMLDivElement>): void {
    this.fpsCounter = fpsCounter.nativeElement;
  }

  public createScene(canvas: ElementRef<HTMLCanvasElement>): void {
    const navigationPlugin = new BABYLON.RecastJSPlugin();
    // tslint:disable-next-line:prefer-const
    let navigationParameters = {
      cs: 0.2,
      ch: 0.2,
      walkableSlopeAngle: 0,
      walkableHeight: 0,
      walkableClimb: 0,
      walkableRadius: 1,
      maxEdgeLen: 12.,
      maxSimplificationError: 1.3,
      minRegionArea: 8,
      mergeRegionArea: 20,
      maxVertsPerPoly: 6,
      detailSampleDist: 6,
      detailSampleMaxError: 1,
    };

    // The first step is to get the reference of the canvas element from our HTML document
    this.canvas = canvas.nativeElement;

    // Then, load the Babylon 3D engine:
    this.engine = new Engine(this.canvas, true);

    // create a basic BJS Scene object
    this.scene = new Scene(this.engine);

    // enable debug layer
    this.scene.debugLayer.show();

    // load assets
    this.assetLoaderService.init(this.scene);

    this.scene.clearColor = new Color4(0, 0, 0, 0);
    const gravityVector = new Vector3(0, -9.81, 0);
    const physicsPlugin = new CannonJSPlugin();
    this.scene.enablePhysics(gravityVector, physicsPlugin);

    // ***** Sky ****** 
    const skyBox = MeshBuilder.CreateBox('skyBox', { size: 2000.0 }, this.scene);
    //@ts-ignore
    const skyMaterial = new BABYLONMATERIAL.SkyMaterial('skyMaterial', this.scene);
    skyMaterial.backFaceCulling = false;
    skyMaterial.inclination = 0;
    skyBox.material = skyMaterial;

    // ****** CAMERA ******
    // create a FreeCamera, and set its position to (x:5, y:10, z:-20 )
    // @ts-ignore
    this.camera = new BABYLON.UniversalCamera('flyCamera', new BABYLON.Vector3(0, 100, -200), this.scene);
    this.camera.applyGravity = false;

    // target the camera to scene origin
    this.camera.setTarget(BABYLON.Vector3.Zero());
    // attach the camera to the canvas
    this.camera.attachControl(this.canvas, true);
    this.camera.layerMask = 1;

    // enable depth buffer
    this.renderer = this.scene.enableDepthRenderer(this.camera, false);

    // ***** Lights *****
    // create a basic light, aiming 0,1,0 - meaning, to the sky
    this.light = new HemisphericLight('lightHemisphere', new Vector3(0, 1, 0), this.scene);
    //this.light.intensity = 1.0;
    this.light.diffuse = new BABYLON.Color3(1, 1, 1);
    //this.light.specular = new BABYLON.Color3(0, 1, 0);
    //this.light.groundColor = new BABYLON.Color3(0, 1, 0);

    // ***** Test-Objects ***** 
    // Our built-in 'sphere' shape.
   /* var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 100, segments: 32 }, this.scene);

    // Move the sphere upward 1/2 its height
    sphere.position.y = 0;
    sphere.visibility = 0;/*

    // Our built-in 'sphere' shape.
    /*var sphere2 = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 50, segments: 32 }, this.scene);

    // Move the sphere upward 1/2 its height
    sphere2.position.y = -0
    sphere2.position.x = -100;
    sphere2.visibility = 0;*/

    // ***** Water-Plane *****
    const worldSize = new BABYLON.Vector2(500, 500);

    this.waterPlaneObject = this.waterGeneratorService.buildWaterPlane(worldSize, this.scene, this.camera, this.renderer, this.light);

    let time = 0.0;
    this.scene.registerBeforeRender(() => {
      // @ts-ignore
      this.waterPlaneObject.waterPlane.material.setFloat('time', time);
      // @ts-ignore
      this.waterPlaneObject.waterPlane.material.setVector3('cameraPosition', this.camera.position);
      time += 0.008;
    });

    // Reflection
    //this.waterPlaneObject.reflectionRTT.renderList.push(sphere);
    this.waterPlaneObject.reflectionRTT.renderList.push(skyBox);
    // Refraction
    //this.waterPlaneObject.refractionRTT.renderList.push(sphere);

    //this.renderer.getDepthMap().renderList = [sphere];


    // init injector services
    this.gameStateService.init(this.scene);
    this.interactionManagerService.init(this.scene);

    // ***** AssetLoader *****
    this.assetLoaderService.subscribeToAssetsLoadState().subscribe(isLoaded => {
      if (isLoaded) {

        // hide gameboard tiles if not in build mode
        this.gameStateService.subscribeToBuildingMode().subscribe((buildingMode) => {
          if (this.gameBoardTilesVisibility != buildingMode) {
            this.gameBoardTiles.forEach(tile => {
              tile.mesh.visibility = buildingMode;
            })
          }
          this.gameBoardTilesVisibility = buildingMode;
        })

        // ***** Terrain *****
        // subscribe terrain generation
        this.terrainGeneratorService.subscribeToGeneratedTerrain().subscribe((generatedTerrain) => {
          if (generatedTerrain) {
            console.log(generatedTerrain);
            console.log('new terrain created');

            let terrainSize = generatedTerrain.getBoundingInfo().boundingBox.extendSize;
            generatedTerrain.position.x = - terrainSize.x;
            generatedTerrain.position.z = - terrainSize.z;
            generatedTerrain.position.y = 5.0;

            this.renderer.getDepthMap().renderList = [generatedTerrain];
            this.terrains.push(generatedTerrain);

            this.waterPlaneObject.refractionRTT.renderList.push(generatedTerrain);

            //this.waterPlaneObject.reflectionRTT.renderList.push(generatedTerrain);
          }
        });

        // todo: island factory
        const heightMapResolution = 1024;
        const heightMapTexture = new BABYLON.CustomProceduralTexture('textureX', './assets/shaders/terrainNoise', heightMapResolution, this.scene);

        // todo: find better way, maybe observable?
        let stateCheckHeightMap = setInterval(() => {
          if (heightMapTexture.isReady() == true) {
            console.log("heightmap loaded");
            clearInterval(stateCheckHeightMap);

            this.terrainGeneratorService.generateTerrain(this.engine, this.scene, heightMapTexture);
          } else {
            console.log("waiting for texture")
          }
        }, 500);


        // ***** Ships *****
        // subscribe to generated ships
        this.shipGeneratorService.subscribeToGeneratedShip().subscribe(ship => {
          if (ship) {
            console.log(ship);
            const shipMesh = ship.getMesh();
            this.waterPlaneObject.reflectionRTT.renderList.push(shipMesh);

            // add action manager to first 'main' mesh
            shipMesh.actionManager = new BABYLON.ActionManager(this.scene);
            shipMesh.actionManager.registerAction(
              new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger, (pickEvent) => {
                  // set ship as selected
                  this.gameStateService.setSelectedObject(pickEvent.source.shipId, pickEvent.source);
                }
              )
            );

            this.ships.push(ship);
            // shadowGenerator.getShadowMap().renderList.push(mesh);
          }
        });

        // demo: build ships
        //this.shipGeneratorService.buildShip(new BABYLON.Vector2(0, -60), 'fluyt');
        //this.shipGeneratorService.buildShip(new BABYLON.Vector2(20, -60), 'fluyt');
        //this.shipGeneratorService.buildShip(new BABYLON.Vector2(-20, -60), 'fluyt');



        // navigation
        // navigationPlugin.createNavMesh([waterPlane], navigationParameters);

        /*let navmeshdebug = navigationPlugin.createDebugNavMesh(this.scene);
        var matdebug = new BABYLON.StandardMaterial('matdebug', this.scene);
        matdebug.diffuseColor = new BABYLON.Color3(0.1, 0.2, 1);
        matdebug.alpha = 0.2;
        navmeshdebug.material = matdebug;*/

        /*t
        });*/

        //this.showWorldAxis(200);
        // HELPER
        // this.showWorldAxis(150);
      }
    });
  }

  public getEngine(){
    return this.engine;
  }


  private showWorldAxis(size) {
    let makeTextPlane = (text, color, size) => {
      let dynamicTexture = new BABYLON.DynamicTexture('DynamicTexture', 50, this.scene, true);
      dynamicTexture.hasAlpha = true;
      dynamicTexture.drawText(text, 5, 40, 'bold 36px Arial', color, 'transparent', true);
      let plane = BABYLON.Mesh.CreatePlane('TextPlane', size, this.scene, true);
      plane.material = new BABYLON.StandardMaterial('TextPlaneMaterial', this.scene);
      plane.material.backFaceCulling = false;
      // @ts-ignore
      plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
      // @ts-ignore
      plane.material.diffuseTexture = dynamicTexture;
      return plane;
    };
    let axisX = BABYLON.Mesh.CreateLines('axisX', [
      BABYLON.Vector3.Zero(), new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, 0.05 * size, 0),
      new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, -0.05 * size, 0)
    ], this.scene);
    axisX.color = new BABYLON.Color3(1, 0, 0);
    let xChar = makeTextPlane('X', 'red', size / 10);
    xChar.position = new BABYLON.Vector3(0.9 * size, -0.05 * size, 0);
    let axisY = BABYLON.Mesh.CreateLines('axisY', [
      BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(-0.05 * size, size * 0.95, 0),
      new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(0.05 * size, size * 0.95, 0)
    ], this.scene);
    axisY.color = new BABYLON.Color3(0, 1, 0);
    let yChar = makeTextPlane('Y', 'green', size / 10);
    yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size);
    let axisZ = BABYLON.Mesh.CreateLines('axisZ', [
      BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, -0.05 * size, size * 0.95),
      new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, 0.05 * size, size * 0.95)
    ], this.scene);
    axisZ.color = new BABYLON.Color3(0, 0, 1);
    let zChar = makeTextPlane('Z', 'blue', size / 10);
    zChar.position = new BABYLON.Vector3(0, 0.05 * size, 0.9 * size);
  }


  public animate(): void {
    // We have to run this outside angular zones,
    // because it could trigger heavy changeDetection cycles.
    this.ngZone.runOutsideAngular(() => {
      const rendererLoopCallback = () => {

        if (this.fpsCounter) {
          this.fpsCounter.innerHTML = this.engine.getFps().toFixed() + " fps";
        }
        this.scene.render();
      };

      if (this.windowRef.document.readyState !== 'loading') {
        this.engine.runRenderLoop(rendererLoopCallback);
      } else {
        this.windowRef.window.addEventListener('DOMContentLoaded', () => {
          this.engine.runRenderLoop(rendererLoopCallback);
        });
      }

      this.windowRef.window.addEventListener('resize', () => {
        this.engine.resize();
      });
    });
  }
}
