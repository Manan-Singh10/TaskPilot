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
const tasks = JSON.parse(localStorage.getItem('allTasks')) || defaultTasks;
const timeSelector = document.querySelector('.time-selector');
const monthSelector = document.querySelector('.month-selector');
const chart = document.querySelector('.chart');
const hamburger = document.querySelectorAll('.hamburger');
const menu = document.querySelector('.menu');
const body = document.body;
const naviIcon = document.querySelectorAll('.navigation-icon');
const header = document.querySelector('.header');
const darkMode = document.querySelector('.toggle__input');

const today = new Date();
const formattedDate = today.toISOString().split('T')[0];
const ctx = chart.getContext('2d');
let chartBox = null;

const taskByMonths = Object.groupBy(
  tasks,
  task => months[+task.date.slice(5, 7) - 1]
);
const taskByThisWeek = tasks.filter(
  task =>
    formattedDate.slice(0, 8) === task.date.slice(0, 8) &&
    formattedDate.slice(8) - task.date.slice(8) <= 7 &&
    formattedDate.slice(8) - task.date.slice(8) >= 0
);
const taskByToday = tasks.filter(task => formattedDate === task.date);

menu.classList.add('hidden');

// Event liseteners
timeSelector.addEventListener('change', function (e) {
  const target = e.target;
  const value = target.value;
  chart.classList.remove('hidden');

  if (value === 'today') renderTodaysChart(taskByToday);
  if (value === 'week') renderChart(taskByThisWeek);
  if (value === 'months') renderMonthsChart(taskByMonths);
});

monthSelector.addEventListener('change', function (e) {
  const value = e.target.value;
  const month = value[0].toUpperCase() + value.slice(1);

  const dataMonth = taskByMonths[month];
  if (!dataMonth) {
    alert(`No tasks for ${month}`);
    return;
  }
  renderChart(dataMonth);
});

darkMode.addEventListener('change', function () {
  body.classList.toggle('dark-body');
  header.classList.toggle('dark-header');
  hamburger.forEach(ham => ham.classList.toggle('dark-navigation-icon'));
  menu.classList.toggle('dark-menu');
  naviIcon.forEach(icon => icon.classList.toggle('dark-navigation-icon'));
});

hamburger.forEach(ham =>
  ham.addEventListener('click', function () {
    menu.classList.toggle('hidden');
  })
);

// Functions
const renderBarChart = function (completedTasks, totalTasks, dates) {
  if (chartBox) chartBox.destroy();

  chartBox = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Total tasks',
          data: totalTasks,
          backgroundColor: 'rgba(255, 131, 131, 0.9)',
          borderWidth: 1,
        },
        {
          label: 'Completed tasks',
          data: completedTasks,
          backgroundColor: 'rgba(163, 255, 145, 0.9)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            display: false,
          },
          ticks: {
            color: 'white',
          },
          border: {
            color: 'white',
            width: 2,
          },
        },
        x: {
          stacked: false,
          grid: {
            display: false,
          },
          ticks: {
            color: 'white',
          },
          border: {
            color: 'white',
            width: 2,
          },
        },
      },
      barPercentage: 1,
      categoryPercentage: 0.8,
      plugins: {
        legend: {
          labels: {
            color: 'white',
          },
        },
      },
    },
  });
};

const getWeekdata = function (tasks) {
  const groupedTasks = Map.groupBy(tasks, task => task.date.slice(8));
  const weekTasksData = [];
  groupedTasks.forEach((arr, date) => {
    const data = [];
    let completedTasks = 0;
    arr.forEach(task => {
      if (task.status === 'completed') completedTasks++;
    });
    data.push(arr.length);
    data.push(completedTasks);
    data.push(date);

    weekTasksData.push(data);
  });
  return weekTasksData;
};

// Chart Generating
const renderTodaysChart = function (tasks) {
  const completedTasks = tasks.filter(
    task => task.status === 'completed'
  ).length;
  const remainingTasks = tasks.length - completedTasks;

  if (chartBox) chartBox.destroy();

  chartBox = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Completed Tasks', 'Remaining Tasks'],
      datasets: [
        {
          data: [completedTasks, remainingTasks],
          backgroundColor: [
            'rgba(163, 255, 145, 0.9)',
            'rgba(255, 131, 131, 0.9)',
          ],
          borderWidth: 0,
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: 'white',
          },
        },
      },
    },
  });
};
renderTodaysChart(taskByToday);

const renderChart = function (tasks) {
  const data = getWeekdata(tasks);
  data.sort((a, b) => a[2] - b[2]);

  const dates = [];
  const totalTasks = [];
  const completedTasks = [];

  data.forEach(value => {
    totalTasks.push(value[0]);
    completedTasks.push(value[1]);
    dates.push(value[2]);
  });

  renderBarChart(completedTasks, totalTasks, dates);
};

const renderMonthsChart = function (tasks) {
  monthSelector.classList.remove('hidden');
  const date = new Date();
  const currentMonth = months[date.getMonth()];
  monthSelector.value = currentMonth.toLowerCase();

  const dataMonth = tasks[currentMonth];
  renderChart(dataMonth);
};
