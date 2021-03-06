import {
  Component, ComponentFactoryResolver, ComponentRef, ElementRef, HostListener, Input, OnInit,
  Renderer2, Type,
  ViewChild, ViewContainerRef
} from '@angular/core';
import * as Hammer from 'hammerjs';

export interface SlyPagerWindow {
  id: number;
  size: number;
}
export interface SlyPagerIndex {
  index: number;
  window: SlyPagerWindow;
}
export class SlyPagerPage {
  index: SlyPagerIndex;
  compIndex: number;
  componentRef: ComponentRef<{}>;
}
export enum SlyPagerDirection {
  HORIZONTAL = 6,
  VERTICAL = 24
}
export interface SlyPagerConfig {
  startIndex: SlyPagerIndex;
  onCreateComponent: (index: SlyPagerIndex) => Type<{}>;
  onIndexChanged?: (index: SlyPagerIndex, component: any) => any;
  onBindComponent: (index: SlyPagerIndex, component: any) => void;
  onWindowStartReached: (overshoot: number, currWindow: SlyPagerWindow) => SlyPagerIndex | false;
  onWindowEndReached: (overshoot: number, currWindow: SlyPagerWindow) => SlyPagerIndex | false;
  scrollDirection: SlyPagerDirection;
  blockOnAnimate: boolean;
  markIndexChangedOnInitialize: boolean;
}
@Component({
  selector: 'app-sly-pager, [app-sly-pager], sly-pager, [sly-pager]',
  templateUrl: './sly-pager.component.html',
  styleUrls: ['./sly-pager.component.css']
})
export class SlyPagerComponent implements OnInit {

  @Input() config: SlyPagerConfig;
  @ViewChild('viewContainerRef', {read: ViewContainerRef}) vcr: ViewContainerRef;

  private _swipeThreshold = 0.75;
  private _hammer: HammerManager;
  private _container: HTMLElement;
  private _wrapper: HTMLElement;
  private _maxPageCount = 5;
  private _outsideRange: boolean;
  private _pages: SlyPagerPage[];
  private _itemIndex: SlyPagerIndex;
  private _compIndex: number;
  private _refIndex: number;
  private _pageCenter: number;
  private _isDebugging = false;
  private _refSize: number;
  private _refSide: string;
  private _refTrans: string;
  private _isAnimating: boolean;
  private _state: 'recycling' | 'scrolling' | 'ready' | 'resizing';

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.updateSizes();
  }

  @Input() get swipeThreshold(): number {
    return this._swipeThreshold;
  }

  set swipeThreshold(value: number) {
    this.setSwipeThreshold(value);
  }

  constructor(private elRef: ElementRef,
              private renderer: Renderer2,
              private resolver: ComponentFactoryResolver) {
  }

  ngOnInit(): void {
    this.initialize();
  }

  public initialize(config?: SlyPagerConfig) {
    if (!config) {
      if (!this.config) {
        this.print('Missing sly pager wrapper config');
        return;
      }
    } else {
      this.config = config;
    }

    this._container = this.elRef.nativeElement.querySelector('.sly-pager-container');
    this._wrapper = this.elRef.nativeElement.querySelector('.sly-pager-wrapper');
    this.initHammer(this._wrapper);
    this.initIndexes();
    this.initWrapper();
    this.initPages();
    this._state = 'ready';
  }

  private initIndexes() {

    this._maxPageCount = Math.min(this._maxPageCount, this.config.startIndex.window.size);
    this.print('Wrapper set to infinite mode');


    if (this.config.scrollDirection === 24) {
      this._refSize = this._container.offsetHeight;
      this._refSide = 'top';
      this._refTrans = 'translateY';
    } else {
      this._refSize = this._container.offsetWidth;
      this._refSide = 'left';
      this._refTrans = 'translateX';
    }

    this.print(`Ref side: ${this._refSide} \n Ref size: ${this._refSize} \n Ref trans: ${this._refTrans}`);

    this._refIndex = this._pageCenter = this._compIndex = Math.floor(this._maxPageCount / 2);
    this._itemIndex = this.config.startIndex;
  }
  private initPages() {
    this.vcr.clear();
    let currIndex = this.getStartIndex();
    if (currIndex) {
      this._pages = [];

      for (let i = 0; i < this._maxPageCount; i++) {
        const page = {
          index: this.createIndex(currIndex.index, currIndex.window.id, currIndex.window.size),
          componentRef: this.createComponent(currIndex), compIndex: i
        };
        this.onBindPage(page);

        this.vcr.insert(page.componentRef.hostView, i);
        this.initPageStyle(page, i);
        this._pages.push(page);

        this.print(`Created page: ${currIndex.index}/${currIndex.window.size}: ${currIndex.window.id}`);

        if (this.config.markIndexChangedOnInitialize) {
          this.setIndexChanged(page);
        }

        // TODO:: Fix this
        currIndex = <SlyPagerIndex>this.increasePageIndex(currIndex, 1);
      }
    }
  }
  private initWrapper() {

    this.print(`The offset width: ${this._container.offsetHeight}`);

    if (this.config.scrollDirection === 24) {
      this.setWrapperStyle('height', this._maxPageCount * this._refSize + 'px');
      this.setWrapperStyle('width', '100%');
    } else {
      this.setWrapperStyle('width', this._maxPageCount * this._refSize + 'px');
      this.setWrapperStyle('height', '100%');
    }

    this.setWrapperStyle(this._refSide, - (this._refSize * this._refIndex) + 'px');

    this.renderer.listen(this._wrapper, 'transitionend', (e) => {
      this.onAnimationEnd(e);
    });

  }
  private initPageStyle(page: SlyPagerPage, i) {
    this.setPageStyle(page, 'background-color', this.getRandomColor());
    this.setPageStyle(page, 'position', 'absolute');
    this.setPageWidth(page, this._container.offsetWidth);
    this.setPageHeight(page, this._container.offsetHeight);
    this.setPagePosition(page, i);
  }
  private initHammer(wrapper: EventTarget) {
    this._hammer = new Hammer.Manager(wrapper, {
      enable: true,
      recognizers: [
        [Hammer.Swipe, {direction: this.config.scrollDirection, threshold: this._swipeThreshold}],
        [Hammer.Pan, {direction: this.config.scrollDirection}, ['swipe']]
      ]
    });

    this._hammer.on('panstart', (ev) => this.onPanStart(ev));
    this._hammer.on('panend', (ev) => this.onPanEndCancel(ev));
    this._hammer.on('pancancel', (ev) => this.onPanEndCancel(ev));

    this.initDirectional();
  }
  private initDirectional() {
    if (this.config.scrollDirection === 6) {
      this.initHorizontalListeners();
    } else {
      this.initVerticalListeners();
    }
  }
  private initHorizontalListeners() {
    this._hammer.off('swipeup');
    this._hammer.off('swipedown');
    this._hammer.off('pandown');
    this._hammer.off('panup');
    this._hammer.on('swipeleft', (ev) => this.onSwipeLeft(ev));
    this._hammer.on('swiperight', (ev) => this.onSwipeRight(ev));
    this._hammer.on('panleft', (ev) => this.onPanLeft(ev));
    this._hammer.on('panright', (ev) => this.onPanRight(ev));
  }
  private initVerticalListeners() {
    this._hammer.off('panleft');
    this._hammer.off('panright');
    this._hammer.off('swiperight');
    this._hammer.off('swipeleft');
    this._hammer.on('panup', (ev) => this.onPanUp(ev));
    this._hammer.on('pandown', (ev) => this.onPanDown(ev));
    this._hammer.on('swipeup', (ev) => this.onSwipeUp(ev));
    this._hammer.on('swipedown', (ev) => this.onSwipeDown(ev));
  }
  private getStartIndex(): SlyPagerIndex | false {
    // INFINTE support per now
    // TODO:: Must fix this
    let start = this.decreasePageIndex(this._itemIndex, this._pageCenter);
    let end = this.increasePageIndex(this._itemIndex, this._pageCenter);
    if (start && end) {
      return start;
    } else if (end) {
      if (start = this.decreasePageIndex(end, this._maxPageCount - 1)) {
        return start;
      } else {
        for (let i = 0; i < this._maxPageCount; i++) {
          end = this.increasePageIndex(<SlyPagerIndex>end, 1);
          if (start = this.decreasePageIndex(<SlyPagerIndex>end, this._maxPageCount - 1)) {
            return start;
          }
        }
        return false;
      }
    } else if (start) {
      if (end = this.increasePageIndex(start, this._maxPageCount - 1)) {
        return end;
      } else {
        for (let i = 0; i < this._maxPageCount; i++) {
          start = this.decreasePageIndex(<SlyPagerIndex>start, 1);
          if (end = this.increasePageIndex(<SlyPagerIndex>start, this._maxPageCount - 1)) {
            return start;
          }
        }
        return false;
      }
    }
    return false;
  }
  public goToPrevious() {
    if (this.isScrolling()) {
      return;
    }
    if (this._refIndex !== this._pageCenter) {
      this.scrollToPosition(this._refIndex - 1, true);
    } else {
      this.scrollToPosition(this._refIndex - 1, this._outsideRange = !this.recyclePrevious());
    }
    this.setIndexChanged(this._pages[this._refIndex]);
  }
  public goToNext() {
    if (this.isScrolling()) {
      return;
    }
    if (this._refIndex !== this._pageCenter) {
      this.scrollToPosition(this._refIndex + 1, true);
    } else {
      this.scrollToPosition(this._refIndex + 1, this._outsideRange = !this.recycleNext());
    }
    this.setIndexChanged(this._pages[this._refIndex]);
  }
  public goToCurrent() {
    if (this.isScrolling()) {
      return;
    }
    this.scrollToPosition(this._refIndex, false);
  }
  public isScrolling(): boolean {
    return this._state !== 'ready';
  }
  public scrollToIndex(index: SlyPagerIndex) {
    // TODO:: Fix this for indexes
    if (this._itemIndex.window.id < index.window.id) {

    } else if (this._itemIndex.window.id > index.window.id) {

    } else {

    }

  }
  public setTranslation(translation: number) {
    if (this.config.blockOnAnimate && this._isAnimating) {
      return;
    }

    this.removeWrapperAnimations();
    this.setWrapperStyle( 'transform', `${this._refTrans}(${translation}px)`);
  }
  private scrollToPosition(index: number, updateRefIndex: boolean) {
    // TODO:: Implement other vairations than infinite
    if (updateRefIndex) {
      if (index < 0) {
        index = 0;
      } else if (index >= this._maxPageCount) {
        index  = this._maxPageCount - 1;
      }
    }

    this.print(`Scrolling to position: ${index}`);
    this._state = 'scrolling';
    this.removeWrapperAnimations(true);
    this.setWrapperStyle( 'transform', `${this._refTrans}(0)` );
    this.addWrapperAnimations();
    this.setWrapperStyle( 'transform', `${this._refTrans}(${this._refSize * (this._refIndex - index)}px)`);

    if (updateRefIndex) {
      this._refIndex = index;
    }
  }

  private setIndexChanged(page: SlyPagerPage) {
    this._compIndex = page.compIndex;
    this._itemIndex = page.index;
    this.print(`Comp index: ${this._compIndex},
     Index changed: ${page.index.index}/${page.index.window.size}: ${page.index.window.id}`);
    this.config.onIndexChanged(page.index, page.componentRef.instance);
  }

  private recyclePrevious(amount = 1): boolean {
    this.print('Recycling previous');
    this._state = 'recycling';

    const start = this._pages[0].index;
    amount = amount > this._pageCenter ? this._pageCenter : amount;
    this.print(`Ref index: ${start.index}/${start.window.size}: ${start.window.id}`);

    for (let i = 0; i < amount; i++) {
      const page = this._pages.pop();
      this.print(`Recycling page: ${page.compIndex}`);
      const tmp = this.decreasePageIndex(start, i + 1);
      if (tmp) {
        page.index = tmp;
        this.print(`Page index: ${page.index.index}/${page.index.window.size}: ${page.index.window.id}`);
        this.onBindPage(page);
        this._pages.unshift(page);
      } else {
        this._pages.push(page);
        return false;
      }
    }
    return true;
  }

  private recycleNext(amount = 1): boolean {
    this.print('Recycling Next');
    this._state = 'recycling';

    const end = this._pages[this._maxPageCount - 1].index;
    amount = amount > this._pageCenter ? this._pageCenter : amount;
    this.print(`Ref index: ${end.index}/${end.window.size}: ${end.window.id}`);

    for (let i = 0; i < amount; i++) {
      const page = this._pages.shift();
      this.print(`Recycling page: ${page.compIndex}`);
      const tmp = this.increasePageIndex(end, i + 1);
      if (tmp) {
        page.index = tmp;
        this.print(`Page index: ${page.index.index}/${page.index.window.size}: ${page.index.window.id}`);
        this.onBindPage(page);
        this._pages.push(page);
      } else {
        this._pages.unshift(page);
        return false;
      }
    }
    return true;
  }

  private positionPages(adjustWrapperPos = true) {
    this._pages.forEach((page, i) => {
      this.print(`Page: ${page.compIndex} => ${i}, Index: ${page.index.index}/${page.index.window.size}: ${page.index.window.id}`);
      this.setPagePosition(page, i);
      if (i === this._refIndex) {
        this.setWrapperStyle(this._refSide, - (this._refSize * this._refIndex) + 'px');
      }
    });
  }

  private increasePageIndex(index: SlyPagerIndex, amount: number): SlyPagerIndex | false {
    const next = index.index + amount;
    if (next >= index.window.size) {
      return this.onEndReached( next - index.window.size, index.window);
    }
    return this.createIndex(next, index.window.id, index.window.size);
  }

  private decreasePageIndex(index: SlyPagerIndex, amount: number): SlyPagerIndex | false {
    const prev = index.index - amount;
    if (prev < 0) {
      return this.onStartReached(-prev, index.window);
    }
    return this.createIndex(prev, index.window.id, index.window.size);
  }

  private createIndex(index: number, windowId: number, windowSize: number) {
    return {index: index, window: {id: windowId, size: windowSize}};
  }

  private setPageWidth(page: SlyPagerPage, width: number) {
    this.setPageStyle(page, 'width', width + 'px');
  }

  private setPageHeight(page: SlyPagerPage, height: number) {
    this.setPageStyle(page, 'height', height + 'px');
  }

  private setPagePosition(page: SlyPagerPage, position: number) {
    this.setPageStyle(page, this._refSide, this._refSize * position + 'px');
  }

  private setPageStyle(page: SlyPagerPage, style: string, value: any) {
    this.renderer.setStyle(page.componentRef.location.nativeElement, style, value);
  }

  private addWrapperAnimations(isAnimating = true) {
    this._isAnimating = isAnimating;
    this.renderer.addClass(this._wrapper, 'animate');
  }

  private removeWrapperAnimations(isAnimating = false) {
    this.renderer.removeClass(this._wrapper, 'animate');
    this._isAnimating = isAnimating;
  }

  private setWrapperStyle(style: string, value: any) {
    this.renderer.setStyle(this._wrapper, style, value);
  }


  private onAnimationEnd(event: Event) {
    this.removeWrapperAnimations(true);
    this.setWrapperStyle( 'transform', `${this._refTrans}(0)` );
    this.positionPages(true);
    this._isAnimating = false;
    this._state = 'ready';
  }

  private onBindPage(page: SlyPagerPage) {
    this.config.onBindComponent(page.index, page.componentRef.instance);
  }

  private onStartReached(overshoot: number, window: SlyPagerWindow = this._itemIndex.window): SlyPagerIndex | false {
    return this.config.onWindowStartReached(overshoot, window);
  }

  private onEndReached(overshoot: number, window: SlyPagerWindow = this._itemIndex.window): SlyPagerIndex | false {
    return this.config.onWindowEndReached(overshoot, window);
  }

  private createComponent(index: SlyPagerIndex): ComponentRef<{}> {
    const factory = this.resolver.resolveComponentFactory(this.config.onCreateComponent(index));
    return this.vcr.createComponent(factory);
  }

  private print(data: any) {
    if (this._isDebugging) {
      console.log(data);
    }
  }

  private getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  private getSize(): {width: number, height: number} {
    return {width: this._container.offsetWidth, height: this._container.offsetHeight};
  }

  private updateSizes() {
    this._state = 'resizing';
    if (this.config.scrollDirection === 24) {
      this._refSize = this._container.offsetHeight;
      this.setWrapperStyle('height', this._maxPageCount * this._refSize + 'px');
      this.setWrapperStyle('width', '100%');
    } else {
      this._refSize = this._container.offsetWidth;
      this.setWrapperStyle('width', this._maxPageCount * this._refSize + 'px');
      this.setWrapperStyle('height', '100%');
    }

    this._pages.forEach((page, i) => {
      this.setPageWidth(page, this._container.offsetWidth);
      this.setPageHeight(page, this._container.offsetHeight);
      this.setPagePosition(page, i);
    });

    this.setWrapperStyle(this._refSide, - (this._refSize * this._refIndex) + 'px');
    this._state = 'ready';
  }

  public setSwipeThreshold(threshold: number) {
    if (this._swipeThreshold === threshold) {
      return;
    }

    this._swipeThreshold = threshold;

    if (!this._hammer) {
      return;
    }

    this._hammer.get('swipe').set({threshold: threshold});
  }

  onPanStart(event: any) {
    event.preventDefault();
  }

  onPanLeft(event: any) {
    event.preventDefault();
    if (Math.abs(event.deltaX) < this._container.offsetWidth) {
      this.setTranslation(event.deltaX);
    }
  }

  onPanRight(event: any) {
    event.preventDefault();
    if (Math.abs(event.deltaX) < this._container.offsetWidth) {
      this.setTranslation(event.deltaX);
    }
  }

  onPanUp(event: any) {
    event.preventDefault();
    if (Math.abs(event.deltaY) < this._container.offsetHeight) {
      this.setTranslation(event.deltaY);
    }
  }

  onPanDown(event: any) {
    event.preventDefault();
    if (Math.abs(event.deltaY) < this._container.offsetHeight) {
      this.setTranslation(event.deltaY);
    }
  }

  onPanEndCancel(event: any) {
    event.preventDefault();
    if (this.config.scrollDirection === 6) {
      if (event.deltaX > 0) {
        if (event.deltaX > this._swipeThreshold * this.getSize().width) {
          this.goToPrevious();
          return;
        }
      } else if (event.deltaX < 0) {
        if (Math.abs(event.deltaX) > this._swipeThreshold * this.getSize().width) {
          this.goToNext();
          return;
        }
      }
    } else {
      if (event.deltaY > 0) {
        if (event.deltaY > this._swipeThreshold * this.getSize().height) {
          this.goToNext();
          return;
        }
      } else if (event.deltaY < 0) {
        if (Math.abs(event.deltaY) > this._swipeThreshold * this.getSize().height) {
          this.goToPrevious();
          return;
        }
      }
    }
    this.goToCurrent();
  }

  onSwipeLeft(event: any) {
    event.preventDefault();
    this.goToNext();
  }

  onSwipeRight(event: any) {
    event.preventDefault();
    this.goToPrevious();
  }

  onSwipeUp(event: any) {
    event.preventDefault();
    this.goToNext();
  }

  onSwipeDown(event: any) {
    event.preventDefault();
    this.goToPrevious();
  }

}
