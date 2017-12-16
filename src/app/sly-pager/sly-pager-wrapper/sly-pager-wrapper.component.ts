import {
  Component, ComponentFactoryResolver, ComponentRef, ElementRef, Input, OnInit, Renderer2, Type, ViewChild,
  ViewContainerRef
} from '@angular/core';

export class SlyPagerWindow {
  id: number;
  size: number;
}
export class SlyPagerIndex {
  index: number;
  window: SlyPagerWindow;
}
export class SlyPagerPage {
  index: SlyPagerIndex;
  compIndex: number;
  componentRef: ComponentRef<{}>;
}
export interface SlyPagerWrapperConfig {
  startIndex: SlyPagerIndex;
  onCreateComponent: (index: SlyPagerIndex) => Type<{}>;
  onIndexChanged?: (index: SlyPagerIndex) => any;
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
    this.recyclePrevious();
    this.scrollToComponent(this.pageCenter - 1);
  }

  public goToNext() {
    this.recycleNext();
    this.scrollToComponent(this.pageCenter + 1);
  }

  public goToCurrent() {
    this.scrollToComponent(this.pageCenter);
  }

  public scrollToIndex(index: SlyPagerIndex) {
    // TODO:: Fix this for indexes
    if (this.itemIndex.window.id < index.window.id) {

    } else if (this.itemIndex.window.id > index.window.id) {

    } else {

    }

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
    this.print(`Scrolling to position: ${index}`);
    this.removeWrapperAnimations(true);
    this.setWrapperStyle( 'transform', `${this.refTrans}(0)` );
    this.addWrapperAnimations();
    this.setWrapperStyle( this.refSide, - (this.refSize * index) + 'px');
    if (this.itemIndex !== this.pages[index].index) {
      this.onIndexChanged(this.itemIndex = this.pages[index].index);
    }
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
    this.itemIndex = this.config.startIndex;
  }

  private initPages() {
    this.vcr.clear();

    // INFINTE support per now
    const startIndex = this.itemIndex.index - this.pageCenter;
    let currIndex = this.itemIndex;
    this.pages = [];

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
      this.pages.push(page);

      this.print(`Created page: ${currIndex.index}/${currIndex.window.size}: ${currIndex.window.id}`);

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

    this.setWrapperStyle(this.refSide, - (this.refSize * this.pageCenter) + 'px');

    this.renderer.listen(this.wrapperRef.nativeElement, 'transitionend', (e) => {
      this.onAnimationEnd(e);
    });

  }

  private onAnimationEnd(event: Event) {
    this.removeWrapperAnimations();
  }

  private onIndexChanged(index: SlyPagerIndex) {
    this.print(`Index changed: ${index.index}/${index.window.size}: ${index.window.id}`);
    this.config.onIndexChanged(index);
  }

  private recyclePrevious(amount = 1) {
    this.print('Recycling previous');

    const start = this.pages[0].index;
    amount = amount > this.pageCenter ? this.pageCenter : amount;
    this.print(`Ref index: ${start.index}/${start.window.size}: ${start.window.id}`);

    for (let i = 0; i < amount; i++) {
      const page = this.pages.pop();
      this.print(`Recycling page: ${page.compIndex}`);
      page.index = this.decreasePageIndex(start, i);
      this.print(`Page index: ${page.index.index}/${page.index.window.size}: ${page.index.window.id}`);
      this.onBindPage(page);
      this.pages.unshift(page);
    }

    this.pages.forEach((page, i) => {
      this.print(`Page: ${page.compIndex} => ${i}, Index: ${page.index.index}/${page.index.window.size}: ${page.index.window.id}`);
      this.setPagePosition(page, i);
    });

    this.setWrapperStyle(this.refSide, - (this.refSize * (this.pageCenter + amount)) + 'px');
  }

  private recycleNext(amount = 1) {
    this.print('Recycling Next');

    const end = this.pages[this.maxPageCount - 1].index;
    amount = amount > this.pageCenter ? this.pageCenter : amount;
    this.print(`Ref index: ${end.index}/${end.window.size}: ${end.window.id}`);

    for (let i = 0; i < amount; i++) {
      const page = this.pages.shift();
      this.print(`Recycling page: ${page.compIndex}`);
      page.index = this.increasePageIndex(end, i);
      this.print(`Page index: ${page.index.index}/${page.index.window.size}: ${page.index.window.id}`);
      this.onBindPage(page);
      this.pages.push(page);
    }

    this.pages.forEach((page, i) => {
      this.print(`Page: ${page.compIndex} => ${i}, Index: ${page.index.index}/${page.index.window.size}: ${page.index.window.id}`);
      this.setPagePosition(page, i);
    });

    this.setWrapperStyle(this.refSide, - (this.refSize * (this.pageCenter - amount)) + 'px');
  }

  private increasePageIndex(index: SlyPagerIndex, amount: number): SlyPagerIndex {
    const next = index.index + amount;
    if (next >= index.window.size) {
      return this.onEndReached(index.index - next, index.window);
    }
    index.index = next;
    return index;
  }

  private decreasePageIndex(index: SlyPagerIndex, amount: number): SlyPagerIndex {
    const prev = index.index - amount;
    if (prev < 0) {
      return this.onEndReached(-prev, index.window);
    }
    index.index = prev;
    return index;
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

  private print(data: any) {
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
