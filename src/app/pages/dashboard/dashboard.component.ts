import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TaskFilterEnum } from 'app/models/task';
import { DashService } from 'app/services/dash.service';
import { TaskService } from 'app/services/task.service';
import { UserService } from 'app/services/user.service';
import { EChartsOption } from 'echarts';

@Component({
  selector: 'dashboard',
  styleUrls: ['dashboard.component.scss'],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  totalMy = 0;
  totalOpened = 0;
  totalFinished = 0;
  totalAll = 0;

  optionMyTasks: EChartsOption;
  optionTaskResponsible: EChartsOption;

  constructor(private dashService: DashService,
              private router: Router) {
    this.dashService.list().subscribe((dash) => {
      console.log('dash: ', dash);
    });
  }
}
