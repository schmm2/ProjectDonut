import { WindowRefService } from '../services/window-ref.service';
import {ElementRef, Injectable, NgZone} from '@angular/core';
import {
  Engine,
  Scene,
  Light,
  Color4,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  CannonJSPlugin,
} from 'babylonjs';
import 'babylonjs-materials';

import CANNON from 'cannon';

import { WaterGeneratorService} from  '../services/water-generator.service';
import { TerrainGeneratorService } from '../services/terrain-generator.service';
import { ShipGeneratorService } from '../services/ship-generator.service';
import { AssetLoaderService } from '../services/asset-loader.service';
import {Ship} from '../classes/ship';
import {TilesGeneratorService} from '../services/tiles-generator.service';
import {InteractionManagerService} from '../services/interactionManager.service';
import {GameStateService} from '../services/game-state.service';
import * as BABYLON from "babylonjs";

@Injectable({ providedIn: 'root' })
export class EngineService {
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private camera: BABYLON.UniversalCamera;
  private scene: Scene;
  private light: Light;
  private renderer;

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
    private tilesGeneratorService: TilesGeneratorService,
    private interactionManagerService: InteractionManagerService,
    private gameStateService: GameStateService,
  ) {
   window.CANNON = CANNON;
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
    this.engine = new Engine(this.canvas,  true);

    // create a basic BJS Scene object
    this.scene = new Scene(this.engine);

    // load assets
    this.assetLoaderService.init(this.scene);

    this.scene.clearColor = new Color4(0, 0, 0, 0);
    const gravityVector = new Vector3(0, -9.81, 0);
    const physicsPlugin = new CannonJSPlugin();
    this.scene.enablePhysics(gravityVector, physicsPlugin);

    // ***** SkyBox ******
    const skyBox = MeshBuilder.CreateBox('skyBox', {size: 2000.0}, this.scene);
    /*const skyBoxMaterial = new StandardMaterial('skyBox', this.scene);
    skyBoxMaterial.backFaceCulling = false;
    skyBoxMaterial.reflectionTexture = new CubeTexture('/assets/textures/material/TropicalSunnyDay', this.scene);
    skyBoxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyBoxMaterial.diffuseColor = new Color3(0, 0, 0);
    skyBoxMaterial.specularColor = new Color3(0, 0, 0);
    //skyBoxMaterial.turbidity = 20.0;*/
    // @ts-ignore

   /* const skyMaterial = new BABYLON.SkyMaterial('skyMaterial', this.scene);
    skyMaterial.backFaceCulling = false;
    skyMaterial.inclination = 0;
    skyBox.material = skyMaterial; */

    // ****** CAMERA ******
    // create a FreeCamera, and set its position to (x:5, y:10, z:-20 )
    // @ts-ignore
    this.camera = new BABYLON.UniversalCamera('flyCamera', new BABYLON.Vector3(0, 100, -200), this.scene);
    this.camera.applyGravity = false;

    // target the camera to scene origin
    this.camera.setTarget(BABYLON.Vector3.Zero());
    // attach the camera to the canvas
    this.camera.attachControl(this.canvas, true);

    // enable depth buffer
    this.renderer = this.scene.enableDepthRenderer();

    // ***** Lights *****
    // create a basic light, aiming 0,1,0 - meaning, to the sky
    this.light = new HemisphericLight('lightHemisphere', new Vector3(0, 1, 0), this.scene);
    this.light.intensity = 1.0;

    // Adding a light
    // @ts-ignore
    // const light2 = new BABYLON.PointLight('Omni', new BABYLON.Vector3(-800, 200, -400), this.scene);
    // light2.intensity = 1;
    // light2.diffuse = new BABYLON.Color3(220 / 255, 220 / 255, 139 / 255);
    // let shadowGenerator = new BABYLON.ShadowGenerator(1024, light2);

    // init injector services
    this.gameStateService.init(this.scene);
    this.interactionManagerService.init(this.scene);

    // ***** AssetLoader *****
    this.assetLoaderService.subscribeToAssetsLoadState().subscribe(isLoaded => {
      if (isLoaded) {
        // ***** Water-Plane *****
        const worldSize = new BABYLON.Vector2(500, 500);
        this.waterPlaneObject = this.waterGeneratorService.buildWaterPlane(worldSize, this.scene, this.camera, this.renderer, this.light);
 
        let time = 0.0;
        this.scene.registerBeforeRender(() => {
          // @ts-ignore
          this.waterPlaneObject.waterPlane.material.setFloat('time', time);
          // @ts-ignore
          this.waterPlaneObject.waterPlane.material.setVector3('cameraPosition', this.camera.position);
          time += 0.01;
        });

        //this.waterGeneratorService.addToReflectionRenderList(skyBox);
    
        // ***** GameBoard Tiles *****
        this.tilesGeneratorService.subscribeToGeneratedTiles().subscribe((generatedTiles)=>{
          if(generatedTiles){
            this.gameBoardTiles = this.gameBoardTiles.concat(generatedTiles);
          }
        })
        
        // hide gameboard tiles if not in build mode
        this.gameStateService.subscribeToBuildingMode().subscribe((buildingMode) =>{
          if(this.gameBoardTilesVisibility != buildingMode){
            this.gameBoardTiles.forEach(tile =>{
              tile.mesh.visibility = buildingMode;
            })
          }
          this.gameBoardTilesVisibility = buildingMode;
        })  
        
        // ***** Terrain *****
        // subscribe terrain generation
        this.terrainGeneratorService.subscribeToGeneratedTerrain().subscribe((generatedTerrain) => {
          if (generatedTerrain) {
            console.log('new terrain created');
            this.waterPlaneObject.reflectionRTT.renderList.push(generatedTerrain);
            this.waterPlaneObject.refractionRTT.renderList.push(generatedTerrain);
            this.renderer.getDepthMap().renderList = [generatedTerrain];
            this.terrains.push(generatedTerrain);
          }
        });

        // todo: island factory
        const heightMapResolution = 1024;
        const heightMapTexture = new BABYLON.CustomProceduralTexture('textureX', './assets/shaders/terrainNoise', heightMapResolution, this.scene);

        // todo: find better way, maybe observable?
        let stateCheck = setInterval(() => {
          if (heightMapTexture.isReady() == true) {
            console.log("all loaded");
            clearInterval(stateCheck);

            // generare terrain
            this.terrainGeneratorService.generateTerrain(this.scene, heightMapTexture, heightMapResolution);
            // generate tiles
            this.tilesGeneratorService.generateTiles(this.scene, heightMapTexture);
          }else{
            console.log("waiting for texture")
          }
        }, 500);

      
        // ***** Ships *****
        // subscribe to generated ships
        this.shipGeneratorService.subscribeToGeneratedShip().subscribe(ship => {
          if(ship){
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
        this.shipGeneratorService.buildShip(new BABYLON.Vector2(0, -60), 'fluyt');
        this.shipGeneratorService.buildShip(new BABYLON.Vector2(20, -60), 'fluyt');
        this.shipGeneratorService.buildShip(new BABYLON.Vector2(-20, -60), 'fluyt');

        

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

  
  private showWorldAxis(size) {
    let makeTextPlane = (text, color, size) => {
      let dynamicTexture = new BABYLON.DynamicTexture('DynamicTexture', 50, this.scene, true);
      dynamicTexture.hasAlpha = true;
      dynamicTexture.drawText(text, 5, 40, 'bold 36px Arial', color , 'transparent', true);
      let plane = BABYLON.Mesh.CreatePlane('TextPlane', size, this.scene, true);
      plane.material = new BABYLON.StandardMaterial('TextPlaneMaterial', this.scene);
      plane.material.backFaceCulling = false;
      plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
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
      BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3( -0.05 * size, size * 0.95, 0),
      new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3( 0.05 * size, size * 0.95, 0)
    ], this.scene);
    axisY.color = new BABYLON.Color3(0, 1, 0);
    let yChar = makeTextPlane('Y', 'green', size / 10);
    yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size);
    let axisZ = BABYLON.Mesh.CreateLines('axisZ', [
      BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3( 0 , -0.05 * size, size * 0.95),
      new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3( 0, 0.05 * size, size * 0.95)
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
