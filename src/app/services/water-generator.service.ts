import {Injectable} from '@angular/core';

import {
  MeshBuilder,
  ShaderMaterial,
  Vector2,
  RenderTargetTexture,
  Matrix,
  Constants,
  Camera,
  Vector3,
  Color4,
  Plane,
  Texture
} from 'babylonjs';

@Injectable({
  providedIn: 'root'
})
export class WaterGeneratorService {
  private scene: any;
  private camera: any;
 
  private reflectionTransform: Matrix = Matrix.Zero();
  private showRTTPlane = true;
  
  public constructor() {}
  
  private buildRefractionRTT(waterPlane: any, renderTargetSize: Vector2){
    // create refraction RTT
    let refractionRTT = new RenderTargetTexture('refraction',
      { width: renderTargetSize.x, height: renderTargetSize.y }, this.scene, false, true);
    refractionRTT.wrapU = Constants.TEXTURE_MIRROR_ADDRESSMODE;
    refractionRTT.wrapV = Constants.TEXTURE_MIRROR_ADDRESSMODE;
    refractionRTT.ignoreCameraViewport = true;
    this.scene.customRenderTargets.push( refractionRTT);

    refractionRTT.onBeforeRender = () => {
      const planePositionY = waterPlane ? waterPlane.position.y : 0.0;
      // y +0.5 to avoid wierd refraction if wave gets high
      this.scene.clipPlane = Plane.FromPositionAndNormal(new Vector3(0, planePositionY + 0.5, 0), new Vector3(0, 1, 0));
    };

    refractionRTT.onAfterRender = () => {
      this.scene.clipPlane = null;
    };

    return refractionRTT;
  }

  private buildReflectionRTT(waterPlane: any, renderTargetSize: Vector2){
    const mirrorMatrix = Matrix.Zero();
    let savedViewMatrix: Matrix;

    // create reflection RTT
    let reflectionRTT = new RenderTargetTexture('reflection',
      { width: renderTargetSize.x, height: renderTargetSize.y }, this.scene, false, true);
    reflectionRTT.wrapU = Constants.TEXTURE_MIRROR_ADDRESSMODE;
    reflectionRTT.wrapV = Constants.TEXTURE_MIRROR_ADDRESSMODE;
    reflectionRTT.ignoreCameraViewport = true;
    reflectionRTT.refreshRate = 1;
    this.scene.customRenderTargets.push( reflectionRTT);

    reflectionRTT.onBeforeRender = () => {
      // get plane water mesh position
      const planePositionY = waterPlane ? waterPlane.position.y : 0.0;

      // position reflection slightly below object
      this.scene.clipPlane = Plane.FromPositionAndNormal(new Vector3(0, (planePositionY) , 0), new Vector3(0, -1.0, 0));
      // clip plane will be flipped
      Matrix.ReflectionToRef(this.scene.clipPlane, mirrorMatrix);

      // Transform
      savedViewMatrix = this.scene.getViewMatrix();
      mirrorMatrix.multiplyToRef(savedViewMatrix, this.reflectionTransform);
      this.scene.setTransformMatrix(this.reflectionTransform, this.scene.getProjectionMatrix());
      // only render visible faces
      //scene.getEngine().cullBackFaces = false;
      this.scene._mirroredCameraPosition = Vector3.TransformCoordinates((this.scene.activeCamera as Camera).position, mirrorMatrix);
    };

    reflectionRTT.onAfterRender = () => {
      // reset plane
      this.scene.clipPlane = null;

      // Transform
      this.scene.setTransformMatrix(savedViewMatrix, this.scene.getProjectionMatrix());
      this.scene.getEngine().cullBackFaces = true;
      this.scene._mirroredCameraPosition = null;
    };

    return reflectionRTT
  }

  public buildWaterPlane(worldSize: any, scene: any, camera: any, renderer: any, light: any) {
    this.scene = scene;

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
    const foamMaskTexture = new Texture('assets/textures/material/water/water_foam_mask.png', this.scene);

    // create plane
    let waterPlane = MeshBuilder.CreateGround('water', {width: worldSize.x, height: worldSize.y, subdivisions: 400}, this.scene, );
    waterPlane.position.y = 0.0;

    let reflectionRTT = this.buildReflectionRTT(waterPlane, new Vector2(512, 512));
    let refractionRTT = this.buildRefractionRTT(waterPlane, new Vector2(512, 512));

    // more resolution means better quality in reflection / refraction
    //this.buildRenderTargetTexture(new Vector2(512, 512));

    const shallowWaterColor = new Color4(0.3, 0.4, 0.7, 1.0);
    const deepWaterColor = new Color4(0, 0.25, 0.283, 1.0);

    // set shader uniforms
    // texture
    waterMaterial.setTexture('normalMap', waterNormalMap);
    waterMaterial.setTexture('dudvTexture', dudvTexture);
    waterMaterial.setTexture('foamShoreTexture', foamShoreTexture);
    waterMaterial.setTexture('foamTexture', foamTexture);
    waterMaterial.setTexture('depthTexture', renderer.getDepthMap());
    waterMaterial.setTexture('reflectionTexture', reflectionRTT);
    waterMaterial.setTexture('refractionTexture', refractionRTT);
    waterMaterial.setTexture('foamMaskTexture', foamMaskTexture);

    // colors
    waterMaterial.setColor4('shallowWaterColor', shallowWaterColor);
    waterMaterial.setColor4('deepWaterColor', deepWaterColor);

    // camera
    waterMaterial.setFloat('camera_near', camera.minZ);
    waterMaterial.setFloat('camera_far', camera.maxZ);
    // others
    waterMaterial.setFloat('bumpHeight', 0.4);
    waterMaterial.setFloat('dudvOffset', 0.4);
    waterMaterial.setFloat('waterDistortionStrength', 0.03);

    // set material
    waterPlane.material = waterMaterial;

    // add properties
    //waterPlane.receiveShadows = true;

    let waterPlaneObject = {
      reflectionRTT: reflectionRTT,
      refractionRTT: refractionRTT,
      waterPlane: waterPlane
    };

    if (this.showRTTPlane) {
      // create new plane to render Reflection
      const planeRTT = BABYLON.MeshBuilder.CreatePlane('rttPlane', {width: 50, height: 50}, this.scene);
      planeRTT.setPositionWithLocalVector(new BABYLON.Vector3(100, 50, 0));

      const rttMaterial = new BABYLON.StandardMaterial('RTT material', this.scene);
      // @ts-ignore
      rttMaterial.emissiveTexture = reflectionRTT;
      rttMaterial.disableLighting = true;
      planeRTT.material = rttMaterial;
    }
    
    return waterPlaneObject;
  }
}
