import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-todo',
  standalone: true, // <-- tells Angular this component can work alone
  imports: [CommonModule, FormsModule], // <-- fixes ngFor, ngIf, ngModel, ngClass
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.css']
})
export class TodoComponent {
  newTask = '';
  priority = 'Medium';
  tasks: { text: string; priority: string; completed: boolean }[] = [];

  addTask() {
    if (this.newTask.trim() !== '') {
      this.tasks.push({
        text: this.newTask,
        priority: this.priority,
        completed: false
      });
      this.newTask = '';
    }
  }

  removeTask(index: number) {
    this.tasks.splice(index, 1);
  }

  toggleComplete(task: any) {
    task.completed = !task.completed;
  }
}
