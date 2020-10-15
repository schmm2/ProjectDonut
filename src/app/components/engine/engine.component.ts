import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { EngineService } from 'services/engine.service';


@Component({
  selector: 'app-engine',
  templateUrl: './engine.component.html',
  styleUrls: ['./engine.component.scss']
})
export class EngineComponent implements OnInit {

  @ViewChild('rendererCanvas', { static: true })
  public rendererCanvas: ElementRef<HTMLCanvasElement>;

  @ViewChild('fpsCounter', { static: true })
  public fpsCounter: ElementRef<HTMLDivElement>;

  public constructor(private engineService: EngineService) { }

  public ngOnInit(): void {
    this.engineService.addFpsCounter(this.fpsCounter);
    this.engineService.createScene(this.rendererCanvas);
    this.engineService.animate();
  }
}
