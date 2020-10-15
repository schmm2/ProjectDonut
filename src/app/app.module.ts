import { WindowRefService } from './services/window-ref.service';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';

import { EngineComponent } from 'components/engine/engine.component';

import { UiInfobarBottomComponent } from 'components/ui/ui-infobar-bottom/ui-infobar-bottom.component';
import { UiComponent } from 'components/ui/ui.component';

@NgModule({
  declarations: [
    AppComponent,
    EngineComponent,
    UiComponent,
    UiInfobarBottomComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [
    WindowRefService
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
