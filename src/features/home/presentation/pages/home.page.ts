import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

@Component({
  selector: 'home-page',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: '',
  },
  templateUrl:'home.page.html',

})
export class HomePage {}
