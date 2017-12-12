import {
  AfterViewInit,
  Component, ComponentFactoryResolver, ElementRef, HostBinding, HostListener, Inject, Input, OnInit, Renderer2,
  ViewChild, ViewChildren, ViewContainerRef
} from '@angular/core';
import * as Hammer from 'hammerjs';

export interface SlyPagerPage {
  element: HTMLElement;
  index?: number;
  pageNumber: number;
  component?: any;
}
export enum SlyPagerDirection {
  DIRECTION_VERTICAL = Hammer.DIRECTION_VERTICAL,
  DIRECTION_HORIZONTAL = Hammer.DIRECTION_HORIZONTAL
}
@Component({
  selector: 'app-sly-pager',
  templateUrl: './sly-pager.component.html',
  styleUrls: ['./sly-pager.component.css']
})
export class SlyPagerComponent implements OnInit, AfterViewInit {

  @ViewChild('sly-pager-wrapper', { read: ViewContainerRef }) wrapperRef: ViewContainerRef;

  private _swipeThreshold = 0.10;
  private _scrollDirection: SlyPagerDirection = SlyPagerDirection.DIRECTION_HORIZONTAL;
  private hammer: HammerManager;
  private _wrapper: HTMLElement;
  private _container: HTMLElement;
  private _pages: SlyPagerPage[];
  private _pageIndex: number;
  private _index: number;
  private _maxItemCount: number;
  private _maxPageCount = 5;
  private _pageIndexCenter: number;
  private _pageSize: number;
  private _pageOffsetSide: string;

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
              private renderer: Renderer2,
              private resolver: ComponentFactoryResolver) {
  }

  ngOnInit() {
    this._wrapper = this.elRef.nativeElement.querySelector('.sly-pager-wrapper');
    this._container = this.elRef.nativeElement.querySelector('.sly-pager-container');
    this.initHammer(this._wrapper);
    this.initPages();
    this.initIndexes();
    this.initialize();
  }

  ngAfterViewInit(): void {

  }

  private initPages() {

    this._pages = [];
    const tmp_pages = this._wrapper.querySelectorAll('.sly-pager-page');
    for (let i = 0; i < tmp_pages.length; i++) {
      this._pages.push(this.setPagePosAndSize({element: <HTMLElement>tmp_pages[i], pageNumber: i}));
    }

    if (!this._pages) {
      for (let i = 0; i < this._maxPageCount; i++) {
        const elem = <HTMLElement>this.renderer.createElement('div');
        elem.className = 'sly-pager-page';
        this._wrapper.appendChild(elem);
        this._pages.push(this.setPagePosAndSize({element: elem, pageNumber: i}));
      }
    }
    if (this._pages.length > this._maxPageCount) {
      // TODO:: Prompt error or extend
    }
    if (this._pages.length < this._maxPageCount) {
      for (let i = this._pages.length; i < this._maxPageCount; i++) {
        const elem = <HTMLElement>this.renderer.createElement('div');
        elem.className = 'sly-pager-page';
        elem.style.backgroundColor = this.getRandomColor();
        this._wrapper.appendChild(elem);
        this._pages.push(this.setPagePosAndSize({element: elem, pageNumber: i}));
      }
    }
  }

  private updateSizes() {

  }

  private setPagePosAndSize(page: SlyPagerPage): SlyPagerPage {
    this.renderer.setStyle(page.element, 'width', this._container.offsetWidth + 'px');
    this.renderer.setStyle(page.element, 'height', this._container.offsetHeight + 'px');
    this.renderer.setStyle(page.element, 'left', this._container.offsetWidth * page.pageNumber + 'px');
    return page;
  }

  private getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  private initIndexes() {
    // TODO:: Make this proper for even numbered page count.
    this._pageIndexCenter = Math.floor(this._maxPageCount / 2) + 1;
    this._pageIndex = this._pageIndexCenter;

  }

  public initialize() {
    this.setWrapperIndex(this._pageIndex);
  }

  private setWrapperIndex(index: number) {
    this.renderer.setStyle(this._wrapper, this._pageOffsetSide, - (index * this._pageSize) + 'px');
  }

  private setWrapperPos(pos: number) {
    this.renderer.setStyle(this._wrapper, this._pageOffsetSide, - pos + 'px');
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
    this.hammer.on('panend', (ev) => this.onPanEnd(ev));
    this.hammer.on('pancancel', (ev) => this.onPanCancel(ev));

    this.initDirectional();
  }

  private initDirectional() {
    if (this._scrollDirection === SlyPagerDirection.DIRECTION_HORIZONTAL) {
      this.initHorizontalListeners();
      this._pageSize = this._container.offsetWidth;
      this._pageOffsetSide = 'left';
    } else {
      this.initVerticalListeners();
      this._pageSize = this._container.offsetHeight;
      this._pageOffsetSide = 'top';
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
  }

  onPanRight(event: any) {
    event.preventDefault();
    console.log('Pan right ' + event.deltaX);
  }

  onPanUp(event: any) {
    event.preventDefault();
    console.log('Pan up ' + event.deltaX);
  }

  onPanDown(event: any) {
    event.preventDefault();
    console.log('Pan down ' + event.deltaX);
  }

  onPanEnd(event: any) {
    event.preventDefault();
  }

  onPanCancel(event: any) {
    event.preventDefault();
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
