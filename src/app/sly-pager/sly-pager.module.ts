import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SlyPagerComponent } from './sly-pager.component';
import { SlyPagerWrapperComponent } from './sly-pager-wrapper/sly-pager-wrapper.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [SlyPagerComponent, SlyPagerWrapperComponent],
  exports: [SlyPagerComponent, SlyPagerWrapperComponent]
})
export class SlyPagerModule { }
