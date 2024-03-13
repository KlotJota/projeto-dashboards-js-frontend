import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { idUserLogged } from 'app/app.component';
import { StatusEnum, Task, TaskFilterEnum } from 'app/models/task';
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
    this.dashService.list().subscribe((res) => {
      this.setTotalDash(res.body, idUserLogged);
      this.setOptionMyTask(res.body, idUserLogged);
      this.setOptionTaskResponsible(res.body);
    });
  }

  private setTotalDash(tasks: Task[], idUserLogged: string): void {
    this.totalMy = tasks.filter((task) => task.responsible._id === idUserLogged).length;
    this.totalOpened = tasks.filter((task) => task.status === StatusEnum.OPEN).length;
    this.totalFinished = tasks.filter((task) => task.status === StatusEnum.FINISHED).length;
    this.totalAll = tasks.length;
  }

  private setOptionMyTask(tasks: Task[], idUserLogged: string): void {
    this.optionMyTasks = {
      title: {
        text: 'Total de tarefas',
        left: 'center',
        textStyle: {
          color: 'rgba(255, 255, 255, 0.3)',
        },
      },

      tooltip: {
        trigger: 'item',
      },

      visualMap: {
        show: false,
        min: 80,
        max: 600,
      },
      series: [
        {
          name: 'Tarefa',
          type: 'pie',
          radius: '55%',
          center: ['50%', '50%'],
          data: this.getDataOptionMyTask(tasks, idUserLogged),
          roseType: 'radius',
          label: {
            color: 'rgba(255, 255, 255, 0.3)',
          },
          labelLine: {
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.3)',
            },
            smooth: 0.2,
            length: 10,
            length2: 20,
          },
          itemStyle: {
            shadowBlur: 200,
          },

          animationType: 'scale',
          animationEasing: 'elasticOut',
          animationDelay(idx) {
            return Math.random() * 200;
          },
        },
      ],
    };
  }

  private getDataOptionMyTask(tasks: Task[], idUserLogged: string) {
    const opened = tasks.filter((task) => (task.status === StatusEnum.OPEN && task.responsible._id === idUserLogged)).length;
    const finished = tasks.filter((task) => (task.status === StatusEnum.FINISHED && task.responsible._id === idUserLogged)).length;

    return [
      { value: opened, name: 'Em Aberto', itemStyle: { color: '#6220db' } },
      { value: finished, name: 'Finalizadas', itemStyle: { color: '#14974b' } },
    ];
  }

  private setOptionTaskResponsible(tasks: Task[]): void {
    this.optionTaskResponsible = {
      title: {
        text: 'Tarefas por responsável',
        left: 'center',
        textStyle: {
          color: 'rgba(255, 255, 255, 0.3)',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        data: ['Em Aberto', 'Finalizadas'],
        bottom: 20,
        left: 'center',
        textStyle: {
          color: 'rgba(255, 255, 255, 0.3)',
        },
      },
      grid: {
        bottom: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        boundaryGap: [0, 0.01],
      },
      yAxis: this.getyAxisOptionTaskResponsible(tasks),
      series: this.getSeriesOptionTaskResponsible(tasks),
    };
  }

  private getyAxisOptionTaskResponsible(tasks: Task[]): { type, data } {
    const names = [...new Set(tasks.map((task) => task.responsible.name))];
    return { type: 'category', data: names };
  }

  private getSeriesOptionTaskResponsible(tasks: Task[]): any {
    const dataOpened = [];
    const dataFinished = [];

    const ids = [...new Set(tasks.map((task) => task.responsible._id))];
    ids.forEach((id) => {
      dataOpened.push(tasks.filter((task) => (task.status === StatusEnum.OPEN && task.responsible._id === id)).length);
      dataFinished.push(tasks.filter((task) => (task.status === StatusEnum.FINISHED && task.responsible._id === id)).length);
    });

    return [
      {
        name: 'Em Aberto',
        type: 'bar',
        data: dataOpened,
        color: '#6220db',
      },
      {
        name: 'Finalizadas',
        type: 'bar',
        data: dataFinished,
        color: '#14974b',
      },
    ];
  }

  public btnGoToMy() {
    this.goTo(TaskFilterEnum.MY);
  }

  public btnGoToOpened() {
    this.goTo(TaskFilterEnum.OPENED);
  }

  public btnGoToFinished() {
    this.goTo(TaskFilterEnum.FINISHED);
  }

  public btnGoToAll() {
    this.goTo(TaskFilterEnum.ALL);
  }

  private goTo(filter: TaskFilterEnum) {
    this.router.navigateByUrl(`/pages/task?filter=${filter}`);
  }
}
