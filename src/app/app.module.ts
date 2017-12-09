import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import {SlyPagerModule} from './sly-pager/sly-pager.module';
import 'hammerjs';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    SlyPagerModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
