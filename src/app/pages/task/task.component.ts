import {
  Component, OnInit, TemplateRef, ViewChild,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NbDialogRef, NbDialogService, NbToastrService } from '@nebular/theme';
import {
  StatusEnum, Task, TaskFilter, TaskFilterEnum,
} from 'app/models/task';
import { TaskService } from 'app/services/task.service';
import { Ng2SmartTableComponent } from 'ng2-smart-table';
import { Row } from 'ng2-smart-table/lib/lib/data-set/row';
import { User } from 'app/models/user';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { UserService } from 'app/services/user.service';
import { OperatorFunction } from 'rxjs';
import { ResponseApp } from 'app/models/response';
import { map } from 'rxjs/operators';

@Component({
  selector: 'task',
  styleUrls: ['task.component.scss'],
  templateUrl: './task.component.html',
})
export class TaskComponent implements OnInit {
  @ViewChild('ng2TbTask') ng2TbTask: Ng2SmartTableComponent; // tratam-se de templates contidas no arquivo component.html
  @ViewChild('dialogTask') dialogTask: TemplateRef<any>;
  @ViewChild('dialogDelete') dialogDelete: TemplateRef<any>;

  dialogRef: NbDialogRef<any>;

  tbTaskData: Task[];
  tbTaskConfig: Object;
  taskSelected: Task;
  taskFilter: TaskFilterEnum;

  optionsStatus = [
    { value: StatusEnum.OPEN, name: 'Em aberto' },
    { value: StatusEnum.FINISHED, name: 'Finalizado' },
  ]

  optionsResponsible: User[];

  formTask = this.formBuilder.group({
    _id: [null],
    description: [null, Validators.required],
    status: [null, [Validators.required]],
    concluded: { value: null, disabled: true },
    responsible: [null, Validators.required],
    creation: { value: null, disabled: true },
  });

  constructor(private activatedRoute: ActivatedRoute,
              private router: Router,
              private formBuilder: FormBuilder,
              private dialogService: NbDialogService,
              private toastrService: NbToastrService,
              private taskService: TaskService,
              private userService: UserService) {
    this.setRouteReuse();
    this.setTaskFilter();
  }

  private setRouteReuse(): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
  } // responsavel por ajudar no recarregamento e identificação da rota atual de filtro das tasks

  private setTaskFilter(): void {
    this.activatedRoute.queryParams.subscribe((params: Params) => this.taskFilter = params.filter ? params.filter : TaskFilterEnum.ALL);
  } // caso tiver filtro, pega o filtro, caso não, mostra todas as tasks

  ngOnInit(): void {
    this.setConfigTbTask();
    this.setDataTbTask();
  }

  private setConfigTbTask() {
    this.tbTaskConfig = {
      mode: 'external',
      actions: { columnTitle: 'Ações', add: false, position: 'right' },
      edit: {
        editButtonContent: '<span class="nb-edit"  title="Editar"></span>',
      },
      delete: {
        deleteButtonContent: '<span class="nb-trash"  title="Excluir"></span>',
      },
      noDataMessage: 'Nenhum tarefa cadastrado.',
      columns: {
        statusTranslate: {
          title: 'Status',
        },
        description: {
          title: 'Descrição',
        },
        responsibleName: {
          title: 'Responsável',
        },
      },
    };
  }

  private setDataTbTask() {
    this.taskService.list(this.taskFilter).pipe(this.formatTaskResponse()).subscribe((res) => {
      this.tbTaskData = res;
    });
  }

  private formatTaskResponse(): OperatorFunction<ResponseApp<Task[]>, Task[]> {
    return map((tasks: ResponseApp<Task[]>) => tasks.body.map((task: Task) => new Task(task)));
  } // ajuda a formatar a resposta da requisiçao (statusTranslate e responsibleName do model task)

  public openModalTask(event: Row) {
    this.userService.list().subscribe((res) => {
      this.optionsResponsible = res.body;

      this.formTask.reset();
      this.formTask.get('status').patchValue(StatusEnum.OPEN);

      if (event) {
        const task: Task = event.getData();
        this.taskService.findById(task._id).subscribe((res) => {
          this.formTask.patchValue(res.body);
        });
      }

      this.dialogRef = this.dialogService.open(this.dialogTask);
    });
  }

  public openModalExclusion(event: Row) {
    this.taskSelected = event.getData();
    this.dialogRef = this.dialogService.open(this.dialogDelete, { context: this.taskSelected.description });
  }

  public btnSave() {
    if (this.formTask.invalid) return this.setFormInvalid();

    if (this.isAdded()) this.addTask();
    else this.editTask();
  }

  private setFormInvalid() {
    this.toastrService.warning('Existem um ou mais campos obrigatório que não foram preenchidos.', 'Atenção');
    this.formTask.get('status').markAsTouched();
    this.formTask.get('description').markAsTouched();
    this.formTask.get('responsible').markAsTouched();
  }

  private isAdded(): boolean {
    return !this.formTask.get('_id').value;
  }

  private addTask() {
    this.taskService.create(this.findFormAdd()).subscribe((res) => {
      this.tbTaskData.push(new Task(res.body));
      this.ng2TbTask.source.refresh();
      this.toastrService.success('Tarefa criada com sucesso', 'Sucesso');
      this.dialogRef.close();
    });
  }

  private findFormAdd() {
    const task = this.formTask.value;
    delete task._id; // remove o id do task no processo de envio, nao precisamos desse dado

    return task;
  }

  private editTask() {
    this.taskService.edit(this.formTask.value).subscribe((res) => {
      this.tbTaskData = this.tbTaskData.map((task: Task) => {
        if (task._id === this.formTask.value._id) return new Task(res.body);
        return task;
      });
      this.toastrService.success('Tarefa editada com sucesso', 'Sucesso');
      this.dialogRef.close();
    });
  }

  public findOperation(): string {
    return this.isAdded() ? 'Inclusão' : 'Edição';
  }

  public btnDelete() {
    this.taskService.delete(this.taskSelected._id).subscribe((res) => {
      this.tbTaskData = this.tbTaskData.filter(((task) => task._id !== this.taskSelected._id));
      this.toastrService.success('Tarefa deletada com sucesso.', 'Sucesso');
      this.dialogRef.close();
    });
  }

  public isTaskNotConcluded(): boolean {
    const concluded = this.formTask.get('concluded').value;
    return !concluded;
  }
}
