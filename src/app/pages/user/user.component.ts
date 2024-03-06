import {
  Component, OnInit, TemplateRef, ViewChild,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NbDialogRef, NbDialogService, NbToastrService } from '@nebular/theme';
import { User } from 'app/models/user';
import { UserService } from 'app/services/user.service';
import { Ng2SmartTableComponent } from 'ng2-smart-table';
import { Row } from 'ng2-smart-table/lib/lib/data-set/row';

@Component({
  selector: 'user',
  styleUrls: ['user.component.scss'],
  templateUrl: './user.component.html',
})
export class UserComponent implements OnInit {
  @ViewChild('ng2TbUser') ng2TbUser: Ng2SmartTableComponent; // tratam-se de templates contidas no arquivo component.html
  @ViewChild('dialogUser') dialogUser: TemplateRef<any>;
  @ViewChild('dialogDelete') dialogDelete: TemplateRef<any>;

  dialogRef: NbDialogRef<any>;

  tbUserData: User[];
  tbUserConfig: Object;
  userSelected: User;

  formUser = this.formBuilder.group({
    _id: [null],
    name: [null, Validators.required],
    email: [null, [Validators.required, Validators.email]], // validador automatico de email fornecido pelo angular
    password: [null, Validators.required],
    creation: { value: null, disabled: true },
  });

  constructor(private formBuilder: FormBuilder,
              private dialogService: NbDialogService,
              private toastrService: NbToastrService,
              private userService: UserService) { }

  ngOnInit(): void {
    this.setConfigTbUser();
    this.setDataTbUser();
  }

  private setConfigTbUser() {
    this.tbUserConfig = {
      mode: 'external',
      actions: { columnTitle: 'Ações', add: false, position: 'right' },
      edit: {
        editButtonContent: '<span class="nb-edit"  title="Editar"></span>',
      },
      delete: {
        deleteButtonContent: '<span class="nb-trash"  title="Excluir"></span>',
      },
      noDataMessage: 'Nenhum usuário cadastrado.',
      columns: {
        name: {
          title: 'Nome',
        },
        email: {
          title: 'E-mail',
        },
      },
    };
  }

  private setDataTbUser() {
    this.userService.list().subscribe((res) => {
      this.tbUserData = res.body;
    });
  }

  public openModalUser(event: Row) {
    this.formUser.reset();

    if (event) {
      const user: User = event.getData();
      this.userService.findById(user._id).subscribe((res) => {
        this.formUser.patchValue(res.body);
      });
    }

    this.dialogRef = this.dialogService.open(this.dialogUser);
  }

  public openModalExclusion(event: Row) {
    this.userSelected = event.getData();
    this.dialogRef = this.dialogService.open(this.dialogDelete, { context: this.userSelected.name });
  }

  public btnSave() {
    if (this.formUser.invalid) return this.setFormInvalid();

    if (this.isAdded()) this.addUser();
    else this.editUser();
  }

  private setFormInvalid() {
    this.toastrService.warning('Existem um ou mais campos obrigatório que não foram preenchidos.', 'Atenção');
    this.formUser.get('name').markAsTouched();
    this.formUser.get('email').markAsTouched();
    this.formUser.get('password').markAsTouched();
  }

  private isAdded(): boolean {
    return !this.formUser.get('_id').value;
  }

  private addUser() {
    this.userService.create(this.findFormAdd()).subscribe((res) => {
      this.tbUserData.push(res.body);
      this.ng2TbUser.source.refresh();
      this.toastrService.success('Usuário criado com sucesso', 'Sucesso');
      this.dialogRef.close();
    });
  }

  private findFormAdd() {
    const usuario = this.formUser.value;
    delete usuario._id; // remove o id do usuario no processo de envio, nao precisamos desse dado

    return usuario;
  }

  private editUser() {
    this.userService.edit(this.formUser.value).subscribe((res) => {
      this.tbUserData = this.tbUserData.map((user: User) => {
        if (user._id === this.formUser.value._id) return this.formUser.value;
        return user;
      });
      this.toastrService.success('Usuário editado com sucesso', 'Sucesso');
      this.dialogRef.close();
    });
  }

  public findOperation(): string {
    return this.isAdded() ? 'Inclusão' : 'Edição';
  }

  public btnDelete() {
    this.userService.delete(this.userSelected._id).subscribe((res) => {
      this.tbUserData = this.tbUserData.filter(((user) => user._id !== this.userSelected._id));
      this.toastrService.success('Usuário deletado com sucesso.', 'Sucesso');
      this.dialogRef.close();
    });
  }
}
