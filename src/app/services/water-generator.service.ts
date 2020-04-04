import {Injectable} from '@angular/core';
import {
  MeshBuilder,
  ShaderMaterial,
  Texture,
  Color3,
  Vector2,
  RenderTargetTexture,
  Matrix,
  Constants,
  Camera,
  Vector3,
  Color4,
  Vector4,
  Plane,
  Nullable
} from 'babylonjs';

@Injectable({
  providedIn: 'root'
})
export class WaterGeneratorService {
  private scene: any;
  private camera: any;
  private renderer: any;
  private light: any;
  private reflectionRTT: any;
  private refractionRTT: any;
  private waterPlane: any;
  private reflectionTransform: Matrix = Matrix.Zero();
  private showRTTPlane = true;
  private time = 0;
  private waveLength = 10.0;
  private waveHeight = 50.0;

  public constructor() {}

  public setScene(scene: any, camera: any, renderer: any, light: any) {
    this.light = light;
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
  }

  public addToReflectionRenderList(mesh) {
    this.reflectionRTT.renderList.push(mesh);
  }

  public addToRefractionRenderList(mesh) {
    this.refractionRTT.renderList.push(mesh);
  }

  public buildRenderTargetTexture(scene: any, renderTargetSize: Vector2) {
    let savedViewMatrix: Matrix;
    const mirrorMatrix = Matrix.Zero();

    // create reflection RTT
    this.reflectionRTT = new RenderTargetTexture('reflection',
      { width: renderTargetSize.x, height: renderTargetSize.y }, scene, false, true);
    this.reflectionRTT.wrapU = Constants.TEXTURE_MIRROR_ADDRESSMODE;
    this.reflectionRTT.wrapV = Constants.TEXTURE_MIRROR_ADDRESSMODE;
    this.reflectionRTT.ignoreCameraViewport = true;
    this.reflectionRTT.refreshRate = 1;
    scene.customRenderTargets.push( this.reflectionRTT);

    // create refraction RTT
    this.refractionRTT = new RenderTargetTexture('refraction',
      { width: renderTargetSize.x, height: renderTargetSize.y }, scene, false, true);
    this.reflectionRTT.wrapU = Constants.TEXTURE_MIRROR_ADDRESSMODE;
    this.reflectionRTT.wrapV = Constants.TEXTURE_MIRROR_ADDRESSMODE;
    this.refractionRTT.ignoreCameraViewport = true;
    scene.customRenderTargets.push( this.refractionRTT);

    this.refractionRTT.onBeforeRender = () => {
      const planePositionY = this.waterPlane ? this.waterPlane.position.y : 0.0;
      scene.clipPlane = Plane.FromPositionAndNormal(new Vector3(0, planePositionY + 0.05, 0), new Vector3(0, 1, 0));
    };

    this.refractionRTT.onAfterRender = () => {
      scene.clipPlane = null;
    };

    this.reflectionRTT.onBeforeRender = () => {
      // get plane water mesh position
      const planePositionY = this.waterPlane ? this.waterPlane.position.y : 0.0;

      // position reflection slightly 0.05 below object
      scene.clipPlane = Plane.FromPositionAndNormal(new Vector3(0, planePositionY - 0.05, 0), new Vector3(0, -1.0, 0));
      // clip plane will be flipped
      Matrix.ReflectionToRef(scene.clipPlane, mirrorMatrix);

      // Transform
      savedViewMatrix = scene.getViewMatrix();
      mirrorMatrix.multiplyToRef(savedViewMatrix, this.reflectionTransform);
      scene.setTransformMatrix(this.reflectionTransform, scene.getProjectionMatrix());
      // only render visible faces
      scene.getEngine().cullBackFaces = false;
      scene._mirroredCameraPosition = Vector3.TransformCoordinates((scene.activeCamera as Camera).position, mirrorMatrix);
    };

    this.reflectionRTT.onAfterRender = () => {
      // reset plane
      scene.clipPlane = null;

      // Transform
      scene.setTransformMatrix(savedViewMatrix, scene.getProjectionMatrix());
      scene.getEngine().cullBackFaces = true;
      scene._mirroredCameraPosition = null;
    };
  }

  public buildWaterPlane() {
    //const depthTexture = this.renderer.getDepthMap().getInternalTexture();

    // more resolution means better quality in reflection / refraction
    this.buildRenderTargetTexture(this.scene, new Vector2(512, 512));

    if (this.showRTTPlane) {
      // create new plane to render Reflection
      const planeRTT = BABYLON.MeshBuilder.CreatePlane('rttPlane', {width: 50, height: 50}, this.scene);
      planeRTT.setPositionWithLocalVector(new BABYLON.Vector3(100, 50, 0));

      const rttMaterial = new BABYLON.StandardMaterial('RTT material', this.scene);
      rttMaterial.emissiveTexture = this.renderer.getDepthMap();
      //rttMaterial.disableLighting = true;
      planeRTT.material = rttMaterial;
    }
    // create material
    const waterMaterial = new ShaderMaterial('waterMaterial', this.scene, {
        vertexElement: './assets/shaders/water',
        fragmentElement: './assets/shaders/water',
      },
      {
        needAlphaBlending: true,
        attributes: ['position', 'uv', 'normal'],
        uniforms: ['worldViewProjection', 'world', 'worldView']
      });

    // set texture
    const waterSurfaceTexture = new BABYLON.Texture('assets/textures/material/waterTexture.png', this.scene);
    const waterBumpTexture = new BABYLON.Texture('assets/textures/material/waterBump.png', this.scene);
    const dudvmap = new BABYLON.Texture('assets/textures/material/dudvmap.png', this.scene);


    // create plane
    this.waterPlane = MeshBuilder.CreateGround('water', {width: 250, height: 250, subdivisions: 50}, this.scene, );
    this.waterPlane.position.y = 5;

    const waterDirection = new BABYLON.Vector2(0, 1.0);
    const windMatrix = waterBumpTexture.getTextureMatrix().multiply(
      BABYLON.Matrix.Translation(waterDirection.x * this.time, waterDirection.y * this.time, 0));

    console.log(windMatrix);
    waterMaterial.setMatrix('windMatrix', windMatrix);
    waterMaterial.setFloats('waveData', [this.waveLength, this.waveHeight]);
    waterMaterial.setFloat('camera_near', this.camera.minZ);
    waterMaterial.setFloat('camera_far', this.camera.maxZ);
    console.log(this.camera.minZ);
    console.log(this.camera.maxZ);


    // set shader uniforms
    waterMaterial.setTexture('reflectionTexture', this.reflectionRTT);
    waterMaterial.setTexture('refractionTexture', this.refractionRTT);
    waterMaterial.setTexture('depthTexture', this.renderer.getDepthMap());
    waterMaterial.setTexture('bumpTexture', waterBumpTexture);
    waterMaterial.setFloat('bumpHeight', 0.4);

    //waterMaterial.setMatrix('worldReflectionViewProjection', wrvp);

    waterMaterial.setTexture('waterTexture', waterSurfaceTexture);
    waterMaterial.setTexture('dudvTexture', dudvmap);

    const shallowWaterColor = new Color4(0, 0.1, 0.3, 1.0);
    const deepWaterColor = new Color4(0, 0.1, 0.1, 1.0);

    waterMaterial.setVector3('cameraPosition', this.scene.activeCamera.position);

    waterMaterial.setColor3('shallowWaterColor', shallowWaterColor);
    waterMaterial.setColor3('deepWaterColor', deepWaterColor);
    waterMaterial.alpha = 0.0;
    // set material
    this.waterPlane.material = waterMaterial;


    // tslint:disable-next-line:only-arrow-functions
    this.scene.registerBeforeRender(() => {
      // @ts-ignore
      this.waterPlane.material.setFloat('time', this.time);
      //waterMaterial.setVector3('cameraPosition', this.scene.activeCamera.position);
      this.time += 0.01;
    });

    return this.waterPlane;
  }
}
