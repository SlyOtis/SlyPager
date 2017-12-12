import {
  Component, ComponentFactoryResolver, ComponentRef, ElementRef, Input, OnInit, Renderer2, Type, ViewChild,
  ViewContainerRef
} from '@angular/core';

export interface SlyPagerWindow {
  id: number;
  size: number;
}
export interface SlyPagerIndex {
  index: number;
  window: SlyPagerWindow;
}
export interface SlyPagerPage {
  index: SlyPagerIndex;
  compIndex: number;
  componentRef: ComponentRef<{}>;
}
export interface SlyPagerWrapperConfig {
  startIndex: SlyPagerIndex;
  onCreateComponent: (index: SlyPagerIndex) => Type<{}>;
  onBindComponent: (index: SlyPagerIndex, component: any) => void;
  onWindowStartReached: (overshoot: number, currWindow: SlyPagerWindow) => SlyPagerIndex;
  onWindowEndReached: (overshoot: number, currWindow: SlyPagerWindow) => SlyPagerIndex;
  scrollDirection: 'vertical' | 'horizontal';
  mode: 'loop' | 'infinite';
  size: () => {width: number, height: number};
}
@Component({
  selector: 'app-sly-pager-wrapper,[SlyPagerWrapper]',
  templateUrl: './sly-pager-wrapper.component.html',
  styleUrls: ['./sly-pager-wrapper.component.css']
})
export class SlyPagerWrapperComponent implements OnInit {

  @Input() config: SlyPagerWrapperConfig;
  @ViewChild('wrapper', {read: ViewContainerRef}) vcr: ViewContainerRef;

  private maxComponentCount = 5;
  private itemIndex: SlyPagerIndex;
  private componentIndex: number;
  private componentCenter: number;
  private printLog = true;
  private size: {width: number, height: number};
  private refSize: number;
  private refSide: string;
  private refTrans: string;

  constructor(private element: ElementRef,
              private renderer: Renderer2,
              private resolver: ComponentFactoryResolver) {
  }


  ngOnInit(): void {
    this.print(`maxComponentCount: ${this.maxComponentCount}`);
    this.initialize();
  }

  public initialize(config?: SlyPagerWrapperConfig) {
    if (!config) {
      if (!this.config) {
        this.print('Missing sly pager wrapper config');
        return;
      }
    } else {
      this.config = config;
    }

    this.initIndexes();
    this.initPages();
    this.initWrapper();
  }

  public updateSizes(width: number, height: number) {

  }

  public goToPrevious() {
    this.scrollToIndex(this.componentIndex - 1);
  }

  public goToNext() {
    this.scrollToIndex(this.componentIndex + 1);
  }

  public goToCurrent() {
    this.scrollToIndex(this.componentIndex);
  }

  public scrollToIndex(index: number) {
    this.renderer.setStyle(this.element.nativeElement, 'transform', `${this.refTrans}(0px)` );
    this.renderer.setStyle(this.element.nativeElement, '-webkit-transition', '1s ease-in-out');
    this.renderer.setStyle(this.element.nativeElement, '-moz-transition', '1s ease-in-out');
    this.renderer.setStyle(this.element.nativeElement, '-o-transition', '1s ease-in-out');
    this.renderer.setStyle(this.element.nativeElement, 'transition', '1s ease-in-out');
    this.renderer.setStyle(this.element.nativeElement, this.refSide, - (this.refSize * index) + 'px');
  }

  public setTranslation(translation: number) {
    this.renderer.setStyle(this.element.nativeElement, 'transform', `${this.refTrans}(${translation}px)`);
  }

  private initIndexes() {
    switch (this.config.mode) {
      case 'loop': {
        this.print('Wrapper set to loop mode');
        this.maxComponentCount = Math.min(this.maxComponentCount, this.config.startIndex.window.size);
        break;
      }
      case 'infinite':
      default: {
        this.print('Wrapper set to infinite mode');
        break;
      }
    }

    this.size = this.config.size();

    if (this.config.scrollDirection === 'vertical') {
      this.refSize = this.size.height;
      this.refSide = 'top';
      this.refTrans = 'translateY';
    } else {
      this.refSize = this.size.width;
      this.refSide = 'left';
      this.refTrans = 'translateX';
    }

    this.componentCenter = Math.floor(this.maxComponentCount / 2);
    this.componentIndex = this.componentCenter = this.isEven(this.componentCenter)
      ? this.componentCenter + 1 : this.componentCenter;
    this.itemIndex = this.config.startIndex;
  }

  private initPages() {
    this.vcr.clear();

    // INFINTE support per now
    const startIndex = this.itemIndex.index - this.componentCenter;
    let currIndex = this.itemIndex;

    if (startIndex < 0) {
      currIndex = this.onStartReached(Math.abs(startIndex));
    }

    for (let i = 0; i < this.maxComponentCount; i++) {
      if (currIndex.index >= currIndex.window.size) {
        currIndex = this.onEndReached(Math.abs(currIndex.index - currIndex.window.size), currIndex.window);
      }

      const page = {index: currIndex, componentRef: this.createComponent(currIndex), compIndex: i};
      this.onBindPage(page);

      this.vcr.insert(page.componentRef.hostView, i);
      this.initPageStyle(page, i);

      currIndex.index++;
    }
  }

  private initWrapper() {
    if (this.config.scrollDirection === 'vertical') {
      this.renderer.setStyle(this.element.nativeElement, 'height', this.maxComponentCount * this.refSize + 'px');
      this.renderer.setStyle(this.element.nativeElement, 'width', '100%');
    } else {
      this.renderer.setStyle(this.element.nativeElement, 'width', this.maxComponentCount * this.refSize + 'px');
      this.renderer.setStyle(this.element.nativeElement, 'height', '100%');
    }

    this.renderer.setStyle(this.element.nativeElement, this.refSide, - (this.refSize * this.componentIndex) + 'px');

    this.renderer.listen(this.element.nativeElement, 'transitionend', (e) => {
      this.onAnimationEnd(e);
    });
  }

  private onAnimationEnd(event: Event) {
    this.print(event.type);
  }

  private initPageStyle(page: SlyPagerPage, i) {
    this.setStyle(page, 'background-color', this.getRandomColor());
    this.setStyle(page, 'position', 'absolute');
    this.setPageWidth(page, this.size.width);
    this.setPageHeight(page, this.size.height);
    this.setPagePosition(page, i);
  }

  private setPageWidth(page: SlyPagerPage, width: number) {
    this.setStyle(page, 'width', width + 'px');
  }

  private setPageHeight(page: SlyPagerPage, height: number) {
    this.setStyle(page, 'height', height + 'px');
  }

  private setPagePosition(page: SlyPagerPage, position: number) {
    this.setStyle(page, this.refSide, this.refSize * position + 'px');
  }

  private setStyle(page: SlyPagerPage, style: string, value: any) {
    this.renderer.setStyle(page.componentRef.location.nativeElement, style, value);
  }

  private onBindPage(page: SlyPagerPage) {
    this.config.onBindComponent(page.index, page.componentRef.instance);
  }

  private onStartReached(overshoot: number, window: SlyPagerWindow = this.itemIndex.window): SlyPagerIndex {
    return this.config.onWindowStartReached(overshoot, window);
  }

  private onEndReached(overshoot: number, window: SlyPagerWindow = this.itemIndex.window): SlyPagerIndex {
    return this.config.onWindowEndReached(overshoot, window);
  }

  private createComponent(index: SlyPagerIndex): ComponentRef<{}> {
    const factory = this.resolver.resolveComponentFactory(this.config.onCreateComponent(index));
    return this.vcr.createComponent(factory);
  }

  private print(data: string) {
    if (this.printLog) {
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

  private isEven(n) {
    return n % 2 === 0;
  }
}
