import {Component} from '@angular/core';
import {SlyPagerPageComponent} from './sly-pager-page/sly-pager-page.component';
import {SlyPagerConfig} from "./sly-pager/sly-pager.component";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  entryComponents: [SlyPagerPageComponent]
})
export class AppComponent {
  config: SlyPagerConfig = {
    startIndex: {index: 2, window: {id: 0, size: 10}},
    onCreateComponent: (index) => {
      return SlyPagerPageComponent;
    },
    onWindowEndReached: (overshoot, currWindow) => {
      return {index: overshoot, window: {id: currWindow.id + 1, size: 10}};
    },
    onWindowStartReached: (overshoot, currWindow) => {
      return {index: 10 - overshoot, window: {id: currWindow.id - 1, size: 10}};
    },
    scrollDirection: Hammer.DIRECTION_HORIZONTAL,
    onBindComponent: (index, component) => {
      console.log(index);
    },
    mode: 'infinite',
    blockOnAnimate: true,
    onIndexChanged: index => {}
  };
}
