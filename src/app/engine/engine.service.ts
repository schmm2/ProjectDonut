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
  Vector2,
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


@Injectable({ providedIn: 'root' })
export class EngineService {
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private camera: BABYLON.UniversalCamera;
  private scene: Scene;
  private light: Light;

  // objects
  private shipList: Ship[] = [];

  public constructor(
    private ngZone: NgZone,
    private windowRef: WindowRefService,
    private waterGeneratorService: WaterGeneratorService,
    private terrainGeneratorService: TerrainGeneratorService,
    private shipGeneratorService: ShipGeneratorService,
    private assetLoaderService: AssetLoaderService,
    private tilesGeneratorService: TilesGeneratorService,
    private actionManagerService: InteractionManagerService,
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
    const skyMaterial = new BABYLON.SkyMaterial('skyMaterial', this.scene);
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

    // enable depth buffer
    const renderer = this.scene.enableDepthRenderer();

    // ***** Lights *****
    // create a basic light, aiming 0,1,0 - meaning, to the sky
    this.light = new HemisphericLight('light1', new Vector3(0, 1, 0), this.scene);
    this.light.intensity = 1.0;

    // Adding a light
    // @ts-ignore
    const light2 = new BABYLON.PointLight('Omni', new BABYLON.Vector3(-800, 200, -400), this.scene);
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


        // build ships
        // @ts-ignore
        this.shipList.push(this.shipGeneratorService.buildShip(new Vector2(0, -60), 'fluyt'));
        this.shipGeneratorService.buildShip(new Vector2(20, -60), 'fluyt');
        this.shipGeneratorService.buildShip(new Vector2(-20, -60), 'fluyt');

        this.terrainGeneratorService.subscribeToGeneratedTerrain().subscribe((terrainMesh) => {
          if (terrainMesh) {
            console.log('terrain loaded');
            const terrain = terrainMesh;
            terrain.receiveShadows = true;
            console.log(terrain);


            renderer.getDepthMap().renderList = [terrain];

            // add water plane
            this.waterGeneratorService.setScene(this.scene, this.camera, renderer, this.light);
            const waterPlane = this.waterGeneratorService.buildWaterPlane();
            waterPlane.receiveShadows = true;
            this.waterGeneratorService.addToReflectionRenderList(terrain);
            this.waterGeneratorService.addToRefractionRenderList(terrain);
            // add mesh to renderList of water
            this.waterGeneratorService.addToReflectionRenderList(skyBox);

            // navigation
            navigationPlugin.createNavMesh([waterPlane], navigationParameters);

            /*let navmeshdebug = navigationPlugin.createDebugNavMesh(this.scene);
            var matdebug = new BABYLON.StandardMaterial('matdebug', this.scene);
            matdebug.diffuseColor = new BABYLON.Color3(0.1, 0.2, 1);
            matdebug.alpha = 0.2;
            navmeshdebug.material = matdebug;*/

            /*this.shipGeneratorService.subscribeToShipList().subscribe(shipList => {
              console.log(shipList);
              shipList.forEach(ship => {
                const mesh = ship.getMesh();
                //this.waterGeneratorService.addToReflectionRenderList(mesh);
                // shadowGenerator.getShadowMap().renderList.push(mesh);
              });
            });*/
          }
        });

        this.actionManagerService.init(this.scene);

        // HELPER
        // this.showWorldAxis(150);
      }
    });
  }

  /*
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
  }*/

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
