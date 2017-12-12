import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import {SlyPagerModule} from './sly-pager/sly-pager.module';
import 'hammerjs';
import { SlyPagerPageComponent } from './sly-pager-page/sly-pager-page.component';


@NgModule({
  declarations: [
    AppComponent,
    SlyPagerPageComponent
  ],
  imports: [
    BrowserModule,
    SlyPagerModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
