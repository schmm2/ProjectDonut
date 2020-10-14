import { HexDirection } from '../enums/HexDirection.enum';

export class HexMetrics {

  public static outerRadius = 10.0;
  public static innerRadius = HexMetrics.outerRadius * 0.866025404;

  public static noiseTextureSize;
  public static noiseTexturePixels;

  public static cellPerturbStrength = 5.0;

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

  public static elevationStep = 5.0;

  public static solidFactor = 0.65;
  public static blendFactor = 1.0 - HexMetrics.solidFactor;

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