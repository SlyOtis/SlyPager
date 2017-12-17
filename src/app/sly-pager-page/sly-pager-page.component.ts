import { Component, OnInit } from '@angular/core';
import * as moment from "moment";

@Component({
  selector: 'app-sly-pager-page',
  templateUrl: './sly-pager-page.component.html',
  styleUrls: ['./sly-pager-page.component.css']
})
export class SlyPagerPageComponent implements OnInit {

  text: string;
  constructor() { }

  ngOnInit() {
  }

  public setText(text: moment.Moment) {
    this.text = `Year: ${text.year()}, month: ${text.isoWeek()}`;
  }
}
