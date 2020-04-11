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
  CannonJSPlugin
} from 'babylonjs';
import 'babylonjs-materials';

import CANNON from 'cannon';
import { WaterGeneratorService } from  '../services/water-generator.service';
import { TerrainGeneratorService } from '../services/terrain-generator.service';
import { ShipGeneratorService } from '../services/ship-generator.service';
import { AssetLoaderService } from '../services/asset-loader.service';
import {Ship} from '../models/ship';


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
    private assetLoaderService: AssetLoaderService
  ) {
    window.CANNON = CANNON;
  }

  public createScene(canvas: ElementRef<HTMLCanvasElement>): void {


    // The first step is to get the reference of the canvas element from our HTML document
    this.canvas = canvas.nativeElement;

    // Then, load the Babylon 3D engine:
    this.engine = new Engine(this.canvas,  true);

    // create a basic BJS Scene object
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0, 0, 0, 0);
    const gravityVector = new Vector3(0, -9.81, 0);
    const physicsPlugin = new CannonJSPlugin();
    this.scene.enablePhysics(gravityVector, physicsPlugin);

    // init injector services
    this.shipGeneratorService.init(this.scene);
    this.assetLoaderService.init(this.scene);

    // ***** AssetLoader *****
    this.assetLoaderService.subscribeToAssetsLoadState().subscribe(isLoaded => {
      if (isLoaded) {
        console.log('AssetLoader: all models loaded');
        // build ships
        this.shipList.push(this.shipGeneratorService.buildShip(new Vector2(0, -50), 'fluyt'));
        this.shipGeneratorService.buildShip(new Vector2(20, -100), 'fluyt');
        this.shipGeneratorService.buildShip(new Vector2(-20, -80), 'fluyt');
      }
    });



    // ***** SkyBox ******
    const skyBox = MeshBuilder.CreateBox('skyBox', {size: 1000.0}, this.scene);
    const skyBoxMaterial = new StandardMaterial('skyBox', this.scene);
    skyBoxMaterial.backFaceCulling = false;
    skyBoxMaterial.reflectionTexture = new CubeTexture('/assets/textures/material/TropicalSunnyDay', this.scene);
    skyBoxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyBoxMaterial.diffuseColor = new Color3(0, 0, 0);
    skyBoxMaterial.specularColor = new Color3(0, 0, 0);
    skyBox.material = skyBoxMaterial;

    // ****** CAMERA ******
    // create a FreeCamera, and set its position to (x:5, y:10, z:-20 )
    this.camera = new FlyCamera('flyCamera', new Vector3(0, 100, -200), this.scene);
    this.camera.applyGravity = false;
    this.camera.bankedTurn = false;
    this.camera.rollCorrect = 1;

    // target the camera to scene origin
    this.camera.setTarget(Vector3.Zero());
    // attach the camera to the canvas
    this.camera.attachControl(this.canvas, false);

    // enable depth buffer
    const renderer = this.scene.enableDepthRenderer();

    // ***** Lights *****
    // create a basic light, aiming 0,1,0 - meaning, to the sky
    this.light = new HemisphericLight('light1', new Vector3(0, 1, 0), this.scene);

    // add water plane
    this.waterGeneratorService.setScene(this.scene, this.camera, renderer, this.light);
    const waterPlane = this.waterGeneratorService.buildWaterPlane();

    // add terrain
    this.terrainGeneratorService.setScene(this.scene);
    const terrain = this.terrainGeneratorService.buildTerrain();
    terrain.physicsImpostor = new BABYLON.PhysicsImpostor(terrain, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, this.scene);


    // add mesh to renderList of water
    this.waterGeneratorService.addToReflectionRenderList(skyBox);
    this.waterGeneratorService.addToReflectionRenderList(terrain);
    this.waterGeneratorService.addToRefractionRenderList(terrain);

    // LOGIC
    this.shipGeneratorService.subscribeToShipList().subscribe(shipList => {
      console.log(shipList);
      shipList.forEach(ship => {
        ship.meshes.forEach(mesh => {
          this.waterGeneratorService.addToReflectionRenderList(mesh);
        });

      });
    });

    // add mesh to depth renderer
    // @ts-ignore
    renderer.getDepthMap().renderList = [terrain];
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
