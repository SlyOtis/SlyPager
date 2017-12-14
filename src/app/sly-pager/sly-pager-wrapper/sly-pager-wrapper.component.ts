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
  isRecycled: boolean;
}
export interface SlyPagerWrapperConfig {
  startIndex: SlyPagerIndex;
  onCreateComponent: (index: SlyPagerIndex) => Type<{}>;
  onBindComponent: (index: SlyPagerIndex, component: any) => void;
  onWindowStartReached: (overshoot: number, currWindow: SlyPagerWindow) => SlyPagerIndex;
  onWindowEndReached: (overshoot: number, currWindow: SlyPagerWindow) => SlyPagerIndex;
  scrollDirection: 'vertical' | 'horizontal';
  mode: 'loop' | 'infinite';
  blockOnAnimate: boolean;
}
@Component({
  selector: 'app-sly-pager-wrapper,[SlyPagerWrapper]',
  templateUrl: './sly-pager-wrapper.component.html',
  styleUrls: ['./sly-pager-wrapper.component.css']
})
export class SlyPagerWrapperComponent implements OnInit {

  @Input() config: SlyPagerWrapperConfig;
  @ViewChild('viewContainerRef', {read: ViewContainerRef}) vcr: ViewContainerRef;
  @ViewChild('wrapper') wrapperRef: ElementRef;

  private maxPageCount = 5;
  private pages: SlyPagerPage[];
  private itemIndex: SlyPagerIndex;
  private pageIndex: number;
  private nextPageIndex: number;
  private pageCenter: number;
  private printLog = true;
  private refSize: number;
  private refSide: string;
  private refTrans: string;
  private isAnimating: boolean;

  constructor(private hostElRef: ElementRef,
              private renderer: Renderer2,
              private resolver: ComponentFactoryResolver) {
  }


  ngOnInit(): void {
    this.print(`maxComponentCount: ${this.maxPageCount}`);
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
    this.scrollToComponent(this.nextPageIndex = this.pageIndex - 1);
  }

  public goToNext() {
    this.scrollToComponent(this.nextPageIndex = this.pageIndex + 1);
  }

  public goToCurrent() {
    this.scrollToComponent(this.pageIndex);
  }

  public scrollToIndex(index: number) {
    // TODO:: Fix this for indexes
    this.scrollToComponent(index);
  }

  public setTranslation(translation: number) {
    if (this.config.blockOnAnimate && this.isAnimating) {
      return;
    }

    this.removeWrapperAnimations();
    this.setWrapperStyle( 'transform', `${this.refTrans}(${translation}px)`);
  }

  private scrollToComponent(index: number) {

    // TODO:: Implement other vairations than infinite
    this.print(`Scrolling to page: ${index}`);
    this.removeWrapperAnimations(true);
    this.setWrapperStyle( 'transform', `${this.refTrans}(0)` );
    this.addWrapperAnimations();
    this.setWrapperStyle( this.refSide, - (this.refSize * index) + 'px');
  }

  private initIndexes() {
    switch (this.config.mode) {
      case 'loop': {
        this.print('Wrapper set to loop mode');
        this.maxPageCount = Math.min(this.maxPageCount, this.config.startIndex.window.size);
        break;
      }
      case 'infinite':
      default: {
        this.print('Wrapper set to infinite mode');
        break;
      }
    }


    if (this.config.scrollDirection === 'vertical') {
      this.refSize = this.hostElRef.nativeElement.offsetHeight;
      this.refSide = 'top';
      this.refTrans = 'translateY';
    } else {
      this.refSize = this.hostElRef.nativeElement.offsetWidth;
      this.refSide = 'left';
      this.refTrans = 'translateX';
    }

    this.print(`Ref side: ${this.refSide} \n Ref size: ${this.refSize} \n Ref trans: ${this.refTrans}`);

    this.pageCenter = Math.floor(this.maxPageCount / 2);
    this.pageIndex = this.pageCenter;
    this.itemIndex = this.config.startIndex;
  }

  private initPages() {
    this.vcr.clear();

    // INFINTE support per now
    const startIndex = this.itemIndex.index - this.pageCenter;
    let currIndex = this.itemIndex;

    if (startIndex < 0) {
      currIndex = this.onStartReached(Math.abs(startIndex));
    }

    for (let i = 0; i < this.maxPageCount; i++) {
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

    this.print(`The offset width: ${this.hostElRef.nativeElement.offsetHeight}`);

    if (this.config.scrollDirection === 'vertical') {
      this.setWrapperStyle('height', this.maxPageCount * this.refSize + 'px');
      this.setWrapperStyle('width', '100%');
    } else {
      this.setWrapperStyle('width', this.maxPageCount * this.refSize + 'px');
      this.setWrapperStyle('height', '100%');
    }

    this.setWrapperStyle(this.refSide, - (this.refSize * this.pageIndex) + 'px');

    this.renderer.listen(this.wrapperRef.nativeElement, 'transitionend', (e) => {
      this.onAnimationEnd(e);
    });

  }

  private onAnimationEnd(event: Event) {
    this.removeWrapperAnimations();

    if (this.nextPageIndex < this.pageIndex) {
      this.recyclePrevious();
    } else if (this.nextPageIndex > this.pageIndex) {
      this.recycleNext();
    }
  }

  private recyclePrevious(amount = 1) {
    this.print('Recycling previous');
    this.pages = this.pages.map((page, i) => {
      // SHould never go more than one cycle
      const shift = page.compIndex + amount;
      if (shift >= this.maxPageCount) {
        page.isRecycled = true;
        page.
      } else {
        page.compIndex = shift;
        page.isRecycled = false;
      }
      return page;
    });
  }

  private recycleNext(amount = 1) {
    this.print('Recycling next');
    this.pages = this.pages.map((page, i) => {
      // SHould never go more than one cycle
      if ()
      const shift = page.compIndex - amount;
      page.compIndex = shift < 0 ? this.maxPageCount + shift : shift;
      return page;
    });
  }

  private getPage(pageID): SlyPagerPage {
    this.
  }

  private initPageStyle(page: SlyPagerPage, i) {
    this.setPageStyle(page, 'background-color', this.getRandomColor());
    this.setPageStyle(page, 'position', 'absolute');
    this.setPageWidth(page, this.hostElRef.nativeElement.offsetWidth);
    this.setPageHeight(page, this.hostElRef.nativeElement.offsetHeight);
    this.setPagePosition(page, i);
  }

  private setPageWidth(page: SlyPagerPage, width: number) {
    this.setPageStyle(page, 'width', width + 'px');
  }

  private setPageHeight(page: SlyPagerPage, height: number) {
    this.setPageStyle(page, 'height', height + 'px');
  }

  private setPagePosition(page: SlyPagerPage, position: number) {
    this.setPageStyle(page, this.refSide, this.refSize * position + 'px');
  }

  private setPageStyle(page: SlyPagerPage, style: string, value: any) {
    this.renderer.setStyle(page.componentRef.location.nativeElement, style, value);
  }

  private addWrapperAnimations(isAnimating = true) {
    this.isAnimating = isAnimating;
    this.renderer.addClass(this.wrapperRef.nativeElement, 'animate');
  }

  private removeWrapperAnimations(isAnimating = false) {
    this.renderer.removeClass(this.wrapperRef.nativeElement, 'animate');
    this.isAnimating = isAnimating;
  }

  private setWrapperStyle(style: string, value: any) {
    this.renderer.setStyle(this.wrapperRef.nativeElement, style, value);
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
