import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SlyPagerComponent } from './sly-pager.component';

describe('SlyPagerComponent', () => {
  let component: SlyPagerComponent;
  let fixture: ComponentFixture<SlyPagerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SlyPagerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SlyPagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
