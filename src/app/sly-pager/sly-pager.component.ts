import {
  AfterViewInit,
  Component, ElementRef, HostListener, Input, OnInit,
  Renderer2,
  ViewChild
} from '@angular/core';
import * as Hammer from 'hammerjs';
import {SlyPagerPageComponent} from '../sly-pager-page/sly-pager-page.component';
import {
  SlyPagerIndex, SlyPagerWrapperComponent,
  SlyPagerWrapperConfig
} from './sly-pager-wrapper/sly-pager-wrapper.component';

export enum SlyPagerDirection {
  DIRECTION_VERTICAL = Hammer.DIRECTION_VERTICAL,
  DIRECTION_HORIZONTAL = Hammer.DIRECTION_HORIZONTAL
}
@Component({
  selector: 'app-sly-pager, [app-sly-pager]',
  templateUrl: './sly-pager.component.html',
  entryComponents: [SlyPagerPageComponent],
  styleUrls: ['./sly-pager.component.css']
})
export class SlyPagerComponent implements OnInit, AfterViewInit {

  @ViewChild(SlyPagerWrapperComponent) wrapper: SlyPagerWrapperComponent;
  private _swipeThreshold = 0.75;
  private _scrollDirection: SlyPagerDirection = SlyPagerDirection.DIRECTION_HORIZONTAL;
  private hammer: HammerManager;
  private _container: HTMLElement;
  private _index: SlyPagerIndex;
  private config: SlyPagerWrapperConfig = {
    startIndex: {index: 2, window: {id: 0, size: 10}},
    onCreateComponent: (index) => {
      return SlyPagerPageComponent;
    },
    onWindowEndReached: (overshoot, currWindow) => {
      return {index: overshoot, window: currWindow};
    },
    onWindowStartReached: (overshoot, currWindow) => {
      return {index: overshoot, window: currWindow};
    },
    scrollDirection: 'horizontal',
    onBindComponent: (index, component) => {

    },
    mode: 'infinite',
    size: () => {
      return this.getSize();
    }
  };

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.updateSizes();
  }

  @Input() get scrollDirection(): SlyPagerDirection {
    return this._scrollDirection;
  }


  set scrollDirection(value: SlyPagerDirection) {
    this.setScrollDirection(value);
  }


  @Input() get swipeThreshold(): number {
    return this._swipeThreshold;
  }

  set swipeThreshold(value: number) {
    this.setSwipeThreshold(value);
  }

  constructor(private elRef: ElementRef,
              private renderer: Renderer2) {
  }

  ngOnInit() {
    this._container = this.elRef.nativeElement.querySelector('.sly-pager-container');
    this.initHammer(this._container);
  }

  ngAfterViewInit(): void {
    this.wrapper.initialize(this.config);
  }

  private getSize(): {width: number, height: number} {
    return {width: this._container.offsetWidth, height: this._container.offsetHeight};
  }

  private updateSizes() {

  }

  private initHammer(wrapper: EventTarget) {
    this.hammer = new Hammer.Manager(wrapper, {
      enable: true,
      recognizers: [
        [Hammer.Pan, {direction: this._scrollDirection}],
        [Hammer.Swipe, {direction: this._scrollDirection, threshold: this._swipeThreshold}, ['pan']]
      ]
    });

    this.hammer.on('panstart', (ev) => this.onPanStart(ev));
    this.hammer.on('panend', (ev) => this.onPanEndCancel(ev));
    this.hammer.on('pancancel', (ev) => this.onPanEndCancel(ev));

    this.initDirectional();
  }

  private initDirectional() {
    if (this._scrollDirection === SlyPagerDirection.DIRECTION_HORIZONTAL) {
      this.initHorizontalListeners();
    } else {
      this.initVerticalListeners();
    }
  }

  private initHorizontalListeners() {
    this.hammer.off('swipeup');
    this.hammer.off('swipedown');
    this.hammer.off('pandown');
    this.hammer.off('panup');
    this.hammer.on('swipeleft', (ev) => this.onSwipeLeft(ev));
    this.hammer.on('swiperight', (ev) => this.onSwipeRight(ev));
    this.hammer.on('panleft', (ev) => this.onPanLeft(ev));
    this.hammer.on('panright', (ev) => this.onPanRight(ev));
  }

  private initVerticalListeners() {
    this.hammer.off('panleft');
    this.hammer.off('panright');
    this.hammer.off('swiperight');
    this.hammer.off('swipeleft');
    this.hammer.on('panup', (ev) => this.onPanUp(ev));
    this.hammer.on('pandown', (ev) => this.onPanDown(ev));
    this.hammer.on('swipeup', (ev) => this.onSwipeUp(ev));
    this.hammer.on('swipedown', (ev) => this.onSwipeDown(ev));
  }


  public setScrollDirection(direction: SlyPagerDirection) {
    if (this._scrollDirection === direction) {
      return;
    }

    this._scrollDirection = direction;

    if (!this.hammer) {
      return;
    }

    this.hammer.get('pan').set({direction: direction});
    this.hammer.get('swipe').set({direction: direction});
    this.initDirectional();
  }

  public setSwipeThreshold(threshold: number) {
    if (this._swipeThreshold === threshold) {
      return;
    }

    this._swipeThreshold = threshold;

    if (!this.hammer) {
      return;
    }

    this.hammer.get('swipe').set({threshold: threshold});
  }

  onPanStart(event: any) {
    event.preventDefault();
  }

  onPanLeft(event: any) {
    event.preventDefault();
    console.log('Pan left ' + event.deltaX);
    this.wrapper.setTranslation(event.deltaX);
  }

  onPanRight(event: any) {
    event.preventDefault();
    console.log('Pan right ' + event.deltaX);
    this.wrapper.setTranslation(event.deltaX);
  }

  onPanUp(event: any) {
    event.preventDefault();
    console.log('Pan up ' + event.deltaY);
    this.wrapper.setTranslation(event.deltaY);
  }

  onPanDown(event: any) {
    event.preventDefault();
    console.log('Pan down ' + event.deltaY);
    this.wrapper.setTranslation(event.deltaY);
  }

  onPanEndCancel(event: any) {
    event.preventDefault();
    if (this._scrollDirection === SlyPagerDirection.DIRECTION_HORIZONTAL) {
      if (event.deltaX > 0) {
        if (event.deltaX > this._swipeThreshold * this.getSize().width) {
          this.wrapper.goToPrevious();
          return;
        }
      } else if (event.deltaX < 0) {
        if (Math.abs(event.deltaX) > this._swipeThreshold * this.getSize().width) {
          this.wrapper.goToNext();
          return;
        }
      }
    } else {
      if (event.deltaY > 0) {
        if (event.deltaY > this._swipeThreshold * this.getSize().height) {
          this.wrapper.goToNext();
          return;
        }
      } else if (event.deltaY < 0) {
        if (Math.abs(event.deltaY) > this._swipeThreshold * this.getSize().height) {
          this.wrapper.goToPrevious();
          return;
        }
      }
    }
    this.wrapper.goToCurrent();
  }

  onSwipeLeft(event: any) {
    event.preventDefault();
    console.log('Swipe left ' + event.deltaX);
  }

  onSwipeRight(event: any) {
    event.preventDefault();
    console.log('Swipe right ' + event.deltaX);
  }

  onSwipeUp(event: any) {
    event.preventDefault();
    console.log('Swipe up ' + event.deltaX);
  }

  onSwipeDown(event: any) {
    event.preventDefault();
    console.log('Swipe down ' + event.deltaX);
  }

}
