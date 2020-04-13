import {Injectable} from '@angular/core';

import {
  MeshBuilder,
  ShaderMaterial,
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
  Nullable,
  Texture
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
  private showRTTPlane = false;
  private time = 0;
  private waveLength = 10.0;
  private waveHeight = 50.0;

  public constructor() {


  }

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
      // y +1.0 to avoid wierd refraction if wave gets high
      scene.clipPlane = Plane.FromPositionAndNormal(new Vector3(0, planePositionY + 1.00, 0), new Vector3(0, 1, 0));
    };

    this.refractionRTT.onAfterRender = () => {
      scene.clipPlane = null;
    };

    this.reflectionRTT.onBeforeRender = () => {
      // get plane water mesh position
      const planePositionY = this.waterPlane ? this.waterPlane.position.y : 0.0;

      // position reflection slightly below object
      scene.clipPlane = Plane.FromPositionAndNormal(new Vector3(0, planePositionY , 0), new Vector3(0, -1.0, 0));
      // clip plane will be flipped
      Matrix.ReflectionToRef(scene.clipPlane, mirrorMatrix);

      // Transform
      savedViewMatrix = scene.getViewMatrix();
      mirrorMatrix.multiplyToRef(savedViewMatrix, this.reflectionTransform);
      scene.setTransformMatrix(this.reflectionTransform, scene.getProjectionMatrix());
      // only render visible faces
      //scene.getEngine().cullBackFaces = false;
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
    // more resolution means better quality in reflection / refraction
    this.buildRenderTargetTexture(this.scene, new Vector2(512, 512));

    if (this.showRTTPlane) {
      // create new plane to render Reflection
      const planeRTT = BABYLON.MeshBuilder.CreatePlane('rttPlane', {width: 50, height: 50}, this.scene);
      planeRTT.setPositionWithLocalVector(new BABYLON.Vector3(100, 50, 0));

      const rttMaterial = new BABYLON.StandardMaterial('RTT material', this.scene);
      rttMaterial.emissiveTexture = this.refractionRTT;
      rttMaterial.disableLighting = true;
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
    const waterNormalMap = new Texture('assets/textures/material/water/water_normal.png', this.scene);
    const dudvTexture = new Texture('assets/textures/material/water/water_dudv.png', this.scene);
    const foamShoreTexture = new Texture('assets/textures/material/water/water_foam_shore.png', this.scene);
    const foamTexture = new Texture('assets/textures/material/water/water_foam.png', this.scene);


    // create plane
    this.waterPlane = MeshBuilder.CreateGround('water', {width: 250, height: 250, subdivisions: 100}, this.scene, );
    this.waterPlane.position.y = 3;

    const shallowWaterColor = new Color4(0.3, 0.4, 0.7, 1.0);
    const deepWaterColor = new Color4(0, 0.25, 0.283, 1.0);

    // set shader uniforms
    // texture
    waterMaterial.setTexture('normalMap', waterNormalMap);
    waterMaterial.setTexture('dudvTexture', dudvTexture);
    waterMaterial.setTexture('foamShoreTexture', foamShoreTexture);
    waterMaterial.setTexture('foamTexture', foamTexture);
    waterMaterial.setTexture('depthTexture', this.renderer.getDepthMap());
    waterMaterial.setTexture('reflectionTexture', this.reflectionRTT);
    waterMaterial.setTexture('refractionTexture', this.refractionRTT);

    // colors
    waterMaterial.setColor4('shallowWaterColor', shallowWaterColor);
    waterMaterial.setColor4('deepWaterColor', deepWaterColor);

    // camera
    waterMaterial.setFloat('camera_near', this.camera.minZ);
    waterMaterial.setFloat('camera_far', this.camera.maxZ);
    // others
    waterMaterial.setFloat('bumpHeight', 0.4);
    waterMaterial.setFloat('dudvOffset', 0.4);
    waterMaterial.setFloat('waterDistortionStrength', 0.03);

    // set material
    this.waterPlane.material = waterMaterial;

    // tslint:disable-next-line:only-arrow-functions
    this.scene.registerBeforeRender(() => {
      // @ts-ignore
      this.waterPlane.material.setFloat('time', this.time);
      this.waterPlane.material.setVector3('cameraPosition', this.camera.position);
      this.time += 0.01;
    });

    return this.waterPlane;
  }
}
