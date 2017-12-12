import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SlyPagerPageComponent } from './sly-pager-page.component';

describe('SlyPagerPageComponent', () => {
  let component: SlyPagerPageComponent;
  let fixture: ComponentFixture<SlyPagerPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SlyPagerPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SlyPagerPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
