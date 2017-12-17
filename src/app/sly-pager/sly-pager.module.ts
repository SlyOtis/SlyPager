import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SlyPagerComponent } from './sly-pager.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [SlyPagerComponent],
  exports: [SlyPagerComponent]
})
export class SlyPagerModule { }
