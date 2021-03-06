import { HexDirection } from '../enums/HexDirection.enum';

export class HexMetrics {

  public static outerRadius = 10.0;
  public static innerRadius = HexMetrics.outerRadius * 0.866025404;
  public static cellPerturbStrength = 4.0;

  private static noiseTextureSize;
  private static noiseTexturePixels;

  public static elevationStep = 5.0;
  public static solidFactor = 0.5;
  public static blendFactor = 1.0 - HexMetrics.solidFactor;

  // removed terrasesperslope as we do not want terraces -> we perturb the vertices to get an uneven look
  public static terraceSteps = 6;
  public static horizontalTerraceStepSize = 1.0 / HexMetrics.terraceSteps;
  public static verticalTerraceStepSize = 1.0 / HexMetrics.terraceSteps;

  // reuse of function not direct Type mismatch Color3/ Vector3
  public static TerraceLerpColor(a: BABYLON.Color3, b: BABYLON.Color3, step: number) {
    let lerp = HexMetrics.TerraceLerp(
      new BABYLON.Vector3(a.r, a.g, a.b),
      new BABYLON.Vector3(b.r, b.g, b.b),
      step
    );
    return new BABYLON.Color3(lerp.x, lerp.y, lerp.z);
  }
  public static TerraceLerp(a: BABYLON.Vector3, b: BABYLON.Vector3, step: number) {
    // horizontal offset
    let h = step * HexMetrics.horizontalTerraceStepSize;
    let x = (b.x - a.x) * h;
    let z = (b.z - a.z) * h;
    // height, vertical offset, removed terrace formula from example: ((step + 1) / 2) * HexMetrics.verticalTerraceStepSize;
    let v = step * HexMetrics.verticalTerraceStepSize;
    let y = (b.y - a.y) * v;

    return new BABYLON.Vector3(a.x + x, a.y + y, a.z + z);
  }

  public static mix3Colors(
    col1: BABYLON.Color3,
    col2: BABYLON.Color3,
    col3: BABYLON.Color3) {
    let r = (col1.r + col2.r + col3.r) / 3;
    let g = (col1.g + col2.g + col3.g) / 3;
    let b = (col1.b + col2.b + col3.b) / 3;
    return new BABYLON.Color3(r, g, b);
  }

  public static mix2Colors(
    col1: BABYLON.Color3,
    col2: BABYLON.Color3) {
    let r = (col1.r + col2.r) / 2;
    let g = (col1.g + col2.g) / 2;
    let b = (col1.b + col2.b) / 2;
    return new BABYLON.Color3(r, g, b);
  }

  public static setNoise(noiseTexture) {
    this.noiseTextureSize = noiseTexture.getSize();
    this.noiseTexturePixels = noiseTexture.readPixels();
  }

  public static sampleNoise(position) {
    // wrap if hexgrid is bigger than noise sample image
    let uvX = Math.round(position.x) % this.noiseTextureSize.width;
    let uvY = Math.round(position.z) % this.noiseTextureSize.height;

    // fix as we cant sample point which do not exist in the image
    if (uvX <= 0) {
      uvX = 0;
    }

    if (uvY <= 0) {
      uvY = 0;
    }

    // find pixel array position
    let pixelArrayPosition = (uvY * this.noiseTextureSize.width + uvX) * 4;

    return new BABYLON.Vector4(
      this.noiseTexturePixels[pixelArrayPosition],
      this.noiseTexturePixels[pixelArrayPosition + 1],
      this.noiseTexturePixels[pixelArrayPosition + 2],
      this.noiseTexturePixels[pixelArrayPosition + 3]
    )
  }

  public static corners = [
    new BABYLON.Vector3(0.0, 0.0, HexMetrics.outerRadius),
    new BABYLON.Vector3(HexMetrics.innerRadius, 0.0, 0.5 * HexMetrics.outerRadius),
    new BABYLON.Vector3(HexMetrics.innerRadius, 0.0, -0.5 * HexMetrics.outerRadius),
    new BABYLON.Vector3(0.0, 0.0, -HexMetrics.outerRadius),
    new BABYLON.Vector3(-HexMetrics.innerRadius, 0.0, -0.5 * HexMetrics.outerRadius),
    new BABYLON.Vector3(-HexMetrics.innerRadius, 0.0, 0.5 * HexMetrics.outerRadius),
    new BABYLON.Vector3(0.0, 0.0, HexMetrics.outerRadius)
  ];


  public static getFirstSolidCorner(direction: HexDirection) {
    //console.log(direction);
    return HexMetrics.corners[direction].scale(HexMetrics.solidFactor);
  }

  public static getSecondSolidCorner(direction: HexDirection) {
    //console.log(direction);
    return HexMetrics.corners[direction + 1].scale(HexMetrics.solidFactor);
  }

  public static getFirstCorner(direction: HexDirection) {
    //console.log(direction);
    return HexMetrics.corners[direction];
  }

  public static getSecondCorner(direction: HexDirection) {
    //console.log(direction);
    return HexMetrics.corners[direction + 1];
  }

  public static getBridge(direction: HexDirection) {
    // add two vectors together
    let midPoint = HexMetrics.corners[direction].add(HexMetrics.corners[direction + 1]);

    return midPoint.scale(HexMetrics.blendFactor);
  }
}