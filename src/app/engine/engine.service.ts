import { WindowRefService } from './../services/window-ref.service';
import {ElementRef, Injectable, NgZone} from '@angular/core';
import {
  Engine,
  FreeCamera,
  Scene,
  Light,
  Mesh,
  Color4,
  Vector3,
  HemisphericLight,
  FlyCamera,
  MeshBuilder,
  StandardMaterial,
  CubeTexture,
  Color3,
  Vector2,
  CannonJSPlugin,
  RecastJSPlugin
} from 'babylonjs';
import 'babylonjs-materials';

import Recast from 'recast-detour';
import CANNON from 'cannon';
import { WaterGeneratorService } from  '../services/water-generator.service';
import { TerrainGeneratorService } from '../services/terrain-generator.service';
import { ShipGeneratorService } from '../services/ship-generator.service';
import { AssetLoaderService } from '../services/asset-loader.service';
import {Ship} from '../classes/ship';
import {TilesGeneratorService} from '../services/tiles-generator.service';
import {InteractionManagerService} from '../services/interactionManager.service';
import {GameStateService} from '../services/game-state.service';


@Injectable({ providedIn: 'root' })
export class EngineService {
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private camera: FlyCamera;
  private scene: Scene;
  private light: Light;

  // objects
  private  shipList: Ship[] = [];

  public constructor(
    private ngZone: NgZone,
    private windowRef: WindowRefService,
    private waterGeneratorService: WaterGeneratorService,
    private terrainGeneratorService: TerrainGeneratorService,
    private shipGeneratorService: ShipGeneratorService,
    private assetLoaderService: AssetLoaderService,
    private tilesGeneratorService: TilesGeneratorService,
    private actionManagerService: InteractionManagerService,
    private gameStateService: GameStateService
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
    const skyMaterial = new BABYLON.SkyMaterial('skyMaterial', this.scene);
    skyMaterial.backFaceCulling = false;
    skyMaterial.inclination = 0;
    skyBox.material = skyMaterial;

    // ***** Lights *****
    // create a basic light, aiming 0,1,0 - meaning, to the sky
    this.light = new HemisphericLight('light1', new Vector3(0, 1, 0), this.scene);
    this.light.intensity = 1.0;

    // Adding a light
    // @ts-ignore
    let light2 = new BABYLON.PointLight('Omni', new BABYLON.Vector3(-800, 200, -400), this.scene);
    light2.intensity = 1;
    light2.diffuse = new BABYLON.Color3(220 / 255, 220 / 255, 139 / 255);
    // let shadowGenerator = new BABYLON.ShadowGenerator(1024, light2);

    // init injector services
    this.shipGeneratorService.init(this.scene);

    this.gameStateService.init(this.scene);

    // ***** AssetLoader *****
    this.assetLoaderService.subscribeToAssetsLoadState().subscribe(isLoaded => {
      if (isLoaded) {
        console.log('engine: assets loaded, start building scene...');

        this.terrainGeneratorService.init(this.scene);

        // enable depth buffer
        const renderer = this.scene.enableDepthRenderer();
        // build ships
        // @ts-ignore
        this.shipList.push(this.shipGeneratorService.buildShip(new Vector2(0, -150), 'fluyt'));
        this.shipGeneratorService.buildShip(new Vector2(20, -180), 'fluyt');
        this.shipGeneratorService.buildShip(new Vector2(-20, -180), 'fluyt');

        // add water plane
        this.waterGeneratorService.setScene(this.scene, this.camera, renderer, this.light);
        const waterPlane = this.waterGeneratorService.buildWaterPlane();

        this.terrainGeneratorService.subscribeToGeneratedTerrain().subscribe((terrainMesh) => {
          if (terrainMesh) {
            console.log("terrain loaded");
            const terrain = terrainMesh;
            terrain.receiveShadows = true;
            this.waterGeneratorService.addToReflectionRenderList(terrain);
            this.waterGeneratorService.addToRefractionRenderList(terrain);
            renderer.getDepthMap().renderList = [terrain];
          }
        });


        // @ts-ignore
        // terrain.physicsImpostor = new BABYLON.PhysicsImpostor(terrain, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, this.scene);

        // add mesh to renderList of water
        this.waterGeneratorService.addToReflectionRenderList(skyBox);



        // @ts-ignore

        waterPlane.receiveShadows = true;


        // navigation
        // navigationPlugin.createNavMesh([terrain, waterPlane], navigationParameters);

        /*let navmeshdebug = navigationPlugin.createDebugNavMesh(this.scene);
        var matdebug = new BABYLON.StandardMaterial('matdebug', this.scene);
        matdebug.diffuseColor = new BABYLON.Color3(0.1, 0.2, 1);
        matdebug.alpha = 0.2;
        navmeshdebug.material = matdebug;
        */

        // add mesh to depth renderer
        // @ts-ignore


        this.actionManagerService.init(this.scene);

        // LOGIC
        this.shipGeneratorService.subscribeToShipList().subscribe(shipList => {
          console.log(shipList);
          shipList.forEach(ship => {
            const mesh = ship.getMesh();
            this.waterGeneratorService.addToReflectionRenderList(mesh);
              // shadowGenerator.getShadowMap().renderList.push(mesh);
          });
        });
      }
    });





    // ****** CAMERA ******
    // create a FreeCamera, and set its position to (x:5, y:10, z:-20 )
    // @ts-ignore
    this.camera = new BABYLON.UniversalCamera('flyCamera', new BABYLON.Vector3(0, 100, -200), this.scene);
    this.camera.applyGravity = false;
    this.camera.bankedTurn = false;
    this.camera.rollCorrect = 1;

    // target the camera to scene origin
    this.camera.setTarget(Vector3.Zero());
    // attach the camera to the canvas
    this.camera.attachControl(this.canvas, false);




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
