import {Component} from '@angular/core';
import {SlyPagerPageComponent} from './sly-pager-page/sly-pager-page.component';
import {SlyPagerConfig} from './sly-pager/sly-pager.component';
import * as moment from 'moment';

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
      const mom = moment(this.refMoment).add(currWindow.id + 1, 'year');
      const no = {index: overshoot, window: {id: currWindow.id + 1, size: mom.isoWeeksInYear()}};
      return false;
    },
    onWindowStartReached: (overshoot, currWindow) => {
      const mom = moment(this.refMoment).subtract(currWindow.id - 1, 'year');
      const no = {index: mom.isoWeeksInYear() - overshoot, window: {id: currWindow.id - 1, size: mom.isoWeeksInYear()}};
      return false;
    },
    scrollDirection: Hammer.DIRECTION_VERTICAL,
    onBindComponent: (index, component: SlyPagerPageComponent) => {
      let week = moment(this.refMoment);
      if (index.window.id > 0) {
        week = week.add(index.window.id, 'years');
      } else if (index.window.id < 0) {
        week = week.subtract(Math.abs(index.window.id), 'years');
      }
      week = week.isoWeek(index.index + 1);
      component.setText(week);
      return component;
    },
    blockOnAnimate: true,
    markIndexChangedOnInitialize: true,
    onIndexChanged: (index, component: SlyPagerPageComponent) => {
    }
  };
}
