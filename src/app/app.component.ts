import {Component} from '@angular/core';
import {SlyPagerPageComponent} from './sly-pager-page/sly-pager-page.component';
import {SlyPagerConfig} from './sly-pager/sly-pager.component';
import * as moment from "moment";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  entryComponents: [SlyPagerPageComponent]
})
export class AppComponent {
  refMoment = moment();
  config: SlyPagerConfig = {
    startIndex: {index: this.refMoment.isoWeek() - 1, window: {id: 0, size: this.refMoment.isoWeeksInYear()}},
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
    onBindComponent: (index, component: SlyPagerPageComponent) => {
      console.log(index);
    },
    mode: 'infinite',
    blockOnAnimate: true,
    onIndexChanged: (index, component: SlyPagerPageComponent) => {
      let week = moment(this.refMoment).isoWeek(index.index);
      if (index.window.id > 0) {
        week = week.add(index.window.id, 'years');
      } else if (index.window.id < 0) {
        week = week.subtract(Math.abs(index.window.id), 'years');
      }
      component.setText(week.toISOString());
    }
  };
}
