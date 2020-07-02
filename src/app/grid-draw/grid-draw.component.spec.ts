import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GridDrawComponent } from './grid-draw.component';

describe('GridDrawComponent', () => {
  let component: GridDrawComponent;
  let fixture: ComponentFixture<GridDrawComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GridDrawComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GridDrawComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
