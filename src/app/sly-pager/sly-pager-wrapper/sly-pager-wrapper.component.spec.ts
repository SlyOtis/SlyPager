import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SlyPagerWrapperComponent } from './sly-pager-wrapper.component';

describe('SlyPagerWrapperComponent', () => {
  let component: SlyPagerWrapperComponent;
  let fixture: ComponentFixture<SlyPagerWrapperComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SlyPagerWrapperComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SlyPagerWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
