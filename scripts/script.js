'use strict';

import { defaultTasks } from './defaultTasks.js';

const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

////////////////////////////////////////////////////////////////////////
// Task Objects

class Task {
  constructor(title, date, time, description, priority) {
    this.title = title.toLowerCase();
    this.date = date;
    this.time = time;
    this.description = description;
    this.id = String(+new Date()).slice(-8);
    this.status = 'pending';
    this.priority = priority;
    this.timeStamp = +new Date(`${date} ${time}`);
  }
}

/////////////////////////////////////////////////////////////////////////
// Application Interface
class App {
  constructor() {
    // Elements
    this.body = document.body;
    this.header = document.querySelector('.header');
    this.naviIcon = document.querySelectorAll('.navigation-icon');
    this.addTaskBtn = document.querySelector('.add-task-btn');
    this.addTaskPopup = document.querySelector('.add-task-popup');
    this.popupCloseBtn = document.querySelector('.popup-close-btn');
    this.popupAddBtn = document.querySelector('.popup-add-btn');
    this.hamburger = document.querySelectorAll('.hamburger');
    this.menu = document.querySelector('.menu');
    this.allTasksContainer = document.querySelector('.main');
    this.tasksContainer = document.querySelector('.tasks');
    this.pendingTasksContainer = document.querySelector('.pending-tasks');
    this.completedTasksContainer = document.querySelector('.completed-tasks');
    this.statusDropdowns = document.querySelectorAll('.task-status');
    this.searchBar = document.querySelector('.search');
    this.darkMode = document.querySelector('.toggle__input');

    // Inputs
    this.titleInput = document.querySelector('.task-title');
    this.dateInput = document.querySelector('.task-date');
    this.timeInput = document.querySelector('.task-time');
    this.descriptionInput = document.querySelector('.task-description');
    this.priorityInput = document.querySelector('.priority');

    // Event Listeners
    this.addTaskBtn.addEventListener('click', this._openPopup.bind(this));
    this.popupCloseBtn.addEventListener('click', this._closePopup.bind(this));
    this.hamburger.forEach(btn =>
      btn.addEventListener('click', this._toggleMenu.bind(this))
    );
    this.popupAddBtn.addEventListener('click', this._addTask.bind(this));

    this.allTasksContainer.addEventListener(
      'click',
      this.editAndRemoveCB.bind(this)
    );

    this.allTasksContainer.addEventListener(
      'change',
      this.statusChangeCB.bind(this)
    );

    this.allTasksContainer.addEventListener('change', e => {
      const target = e.target;
      const sortBy = target.value;
      if (sortBy === 'time') this._sortBytime(target);
      if (sortBy === 'today') this._sortByToday(target);
      if (sortBy === 'status') this._sortByStatus(target);
      if (sortBy === 'default') this._sortByDefault(target);
      if (sortBy === 'priority') this._sortByPriority(target);
    });

    this.searchBar.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const search = this.searchBar.value.toLowerCase();
        const searchedTasks = this.tasks.filter(task => {
          return task.title.toLowerCase().includes(search);
        });

        this.tasksContainer.innerHTML = '';
        this.pendingTasksContainer.innerHTML = '';
        this.completedTasksContainer.innerHTML = '';
        this.isSearched = searchedTasks;
        this._renderTasksContainer(searchedTasks);
        this._renderPendingTasks(searchedTasks);
        this._renderCompleteTasks(searchedTasks);
      }
    });

    this.allTasksContainer.addEventListener('change', e => {
      if (!e.target.classList.contains('task-priority')) return;
      const id = e.target.dataset.id;
      const value = e.target.value;

      this._changePriority(id, value);
    });

    this.darkMode.addEventListener('change', () => {
      this.body.classList.toggle('dark-body');
      this.header.classList.toggle('dark-header');
      this.hamburger.forEach(ham =>
        ham.classList.toggle('dark-navigation-icon')
      );
      this.menu.classList.toggle('dark-menu');
      this.naviIcon.forEach(icon =>
        icon.classList.toggle('dark-navigation-icon')
      );
    });

    document
      .getElementById('logo')
      .addEventListener('click', () => location.reload());

    // Tasks
    this.tasks = this._getTasksFromStorage() || defaultTasks;

    this.isBeingEdited = false;
    this.isSearched = false;

    // Loading previous tasks
    this._renderAlltasks();
  }

  editAndRemoveCB(e) {
    const target = e.target;
    const taskRow = target.closest('.task-row');
    if (!taskRow) return;

    const taskId = target.dataset.id;

    if (e.target.classList.contains('task-edit-btn')) {
      this._editTask(taskId);
    }

    if (e.target.classList.contains('task-remove-btn')) {
      this._deleteTask(taskId);
    }
  }

  statusChangeCB(e) {
    const target = e.target;
    if (!target.classList.contains('task-status')) return;

    const status = e.target.value;
    const id = e.target.dataset.id;
    this._changeStatus(id, status);
  }

  _renderSorting(target, tasksBy) {
    if (target.classList.contains('sort-tasks')) {
      this.tasksContainer.innerHTML = '';
      this._renderTasksContainer(tasksBy);
    }
    if (target.classList.contains('sort-pending')) {
      this.pendingTasksContainer.innerHTML = '';
      this._renderPendingTasks(tasksBy);
    }
    if (target.classList.contains('sort-complete')) {
      this.completedTasksContainer.innerHTML = '';
      this._renderCompleteTasks(tasksBy);
    }
  }

  _sortBytime(target) {
    const tasks = this.isSearched ? this.isSearched : this.tasks;
    const tasksByTime = tasks.toSorted((a, b) => a.timeStamp - b.timeStamp);
    this._renderSorting(target, tasksByTime);
  }

  _sortByToday(target) {
    const tasks = this.isSearched ? this.isSearched : this.tasks;
    const taskByToday = tasks.filter(
      task => task.date === new Date().toISOString().split('T')[0]
    );
    this._renderSorting(target, taskByToday);
  }

  _sortByStatus(target) {
    const tasks = this.isSearched ? this.isSearched : this.tasks;
    const groupedByStatus = Object.groupBy(tasks, task =>
      task.status === 'pending' ? 'pending' : 'completed'
    );
    const taskByStatus = [
      ...groupedByStatus.pending,
      ...groupedByStatus.completed,
    ];

    this._renderSorting(target, taskByStatus);
  }

  _sortByDefault(target) {
    const tasks = this.isSearched ? this.isSearched : this.tasks;
    this._renderSorting(target, tasks);
  }

  _sortByPriority(target) {
    const groupedByPriority = Object.groupBy(this.tasks, task => task.priority);

    const tasks = [
      ...(groupedByPriority.high || ''),
      ...(groupedByPriority.medium || ''),
      ...(groupedByPriority.low || ''),
    ];

    this._renderSorting(target, tasks);
  }

  _openPopup() {
    this.addTaskPopup.classList.remove('hidden');

    if (!this.isBeingEdited) {
      this.titleInput.value = '';
      this.dateInput.value = '';
      this.timeInput.value = '';
      this.descriptionInput.value = '';
      this.priorityInput.value = 'low';
    }
  }

  _closePopup() {
    this.addTaskPopup.classList.add('hidden');
    this.isBeingEdited = false;
  }

  _toggleMenu() {
    this.menu.classList.toggle('hidden');
  }

  _addTask() {
    const title = this.titleInput.value;
    const date = this.dateInput.value;
    const time = this.timeInput.value;
    let description = this.descriptionInput.value;
    const priority = this.priorityInput.value;

    console.log(this.priorityInput.value);

    if (!title || !date || !time) return;

    description ||= this.titleInput.value;

    if (this.isBeingEdited) {
      this.isBeingEdited.title = title;
      this.isBeingEdited.date = date;
      this.isBeingEdited.time = time;
      this.isBeingEdited.description = description;
      this.isBeingEdited.priority = priority;
    } else {
      this.tasks.push(new Task(title, date, time, description, priority));
    }

    console.log(this.tasks);

    this.isBeingEdited = false;
    this._closePopup();
    this.saveToStorage();

    // Generating html for tasks
    this._renderAlltasks();
  }

  _renderTasksRows(tasks) {
    let html = '';
    tasks.forEach(task => {
      const { title, date, time, description, id, status, priority } = task;
      html += `
        <div class="task-row" data-priority=${priority}>
          <div class="task-name">${
            title[0].toUpperCase() + title.slice(1)
          }</div>
          <div class="task-date">${`${months[date[2] - 1]} ${date.slice(
            -2
          )}`}</div>
          <div class="task-time">${time}</div>
          <select class="task-priority" data-id="${id}">
            <option value="low" ${
              priority === 'low' ? 'selected' : ''
            }>Low</option>
            <option value="medium" ${
              priority === 'medium' ? 'selected' : ''
            }>Medium</option>
            <option value="high" ${
              priority === 'high' ? 'selected' : ''
            }>High</option>
          </select>
          <select class="task-status" data-id="${id}">
            <option value="pending" ${
              status === 'pending' ? 'selected' : ''
            }>Pending</option>
            <option value="completed" ${
              status === 'completed' ? 'selected' : ''
            }>Completed</option>
          </select>
          <button class="task-edit-btn" data-id="${id}">✏️</button>
          <button class="task-remove-btn" data-id="${id}">🗑️</button>
        </div>
      `;
    });
    return html;
  }

  _renderTasksContainer(tasks) {
    this.tasksContainer.innerHTML = '';
    const html = this._renderTasksRows(tasks);
    this.tasksContainer.insertAdjacentHTML('afterbegin', html);
  }

  _renderPendingTasks(tasks) {
    this.pendingTasksContainer.innerHTML = '';
    const pendingTasks = tasks.filter(task => task.status === 'pending');
    const html = this._renderTasksRows(pendingTasks);
    this.pendingTasksContainer.insertAdjacentHTML('beforeend', html);
  }

  _renderCompleteTasks(tasks) {
    this.completedTasksContainer.innerHTML = '';
    const completedTasks = tasks.filter(task => task.status === 'completed');
    const html = this._renderTasksRows(completedTasks);
    this.completedTasksContainer.insertAdjacentHTML('beforeend', html);
  }

  matchingTask(taskId) {
    return this.tasks.find(task => task.id === taskId);
  }

  _editTask(taskId) {
    const matchingTask = this.matchingTask(taskId);
    if (!matchingTask) return;

    const { title, date, time, description, priority } = matchingTask;

    this._openPopup();
    this.titleInput.value = title;
    this.timeInput.value = time;
    this.dateInput.value = date;
    this.descriptionInput.value = description;
    this.priorityInput.value = priority;

    // Sets the edit condtion for addTask fn
    this.isBeingEdited = matchingTask;
  }

  _deleteTask(taskId) {
    const matchingTask = this.matchingTask(taskId);
    const index = this.tasks.indexOf(matchingTask);
    this.tasks.splice(index, 1);

    this.saveToStorage();
    this._renderAlltasks();
  }

  _changeStatus(id, status) {
    const matchingTask = this.matchingTask(id);
    matchingTask.status = status;
    this.saveToStorage();
    this._renderAlltasks();
  }

  _changePriority(id, value) {
    const matchingTask = this.matchingTask(id);
    matchingTask.priority = value;
    this.saveToStorage();
    this._renderAlltasks();
  }

  saveToStorage() {
    localStorage.setItem('allTasks', JSON.stringify(this.tasks));
  }

  _getTasksFromStorage() {
    return JSON.parse(localStorage.getItem('allTasks'));
  }

  _renderAlltasks() {
    this._renderTasksContainer(this.tasks);
    this._renderPendingTasks(this.tasks);
    this._renderCompleteTasks(this.tasks);
  }
}

const app = new App();
