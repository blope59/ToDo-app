let tasks = [];

// Load saved tasks on page load
window.onload = () => {
  const savedTasks = localStorage.getItem("tasks");
  if (savedTasks) {
    tasks = JSON.parse(savedTasks);
    renderTasks();
  }
};

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function addTask() {
  const input = document.getElementById("taskInput");
  const dateInput = document.getElementById("dateInput");
  const timeInput = document.getElementById("timeInput");
  const importantInput = document.getElementById("importantInput");

  if (input.value.trim() === "") {
    alert("Please enter a task name.");
    return;
  }

  tasks.push({
    id: crypto.randomUUID(),    // optional unique ID for future features
    name: input.value.trim(),
    date: dateInput.value || null,
    time: timeInput.value || null,
    important: importantInput.checked,
    done: false
  });

  input.value = "";
  dateInput.value = "";
  timeInput.value = "";
  importantInput.checked = false;

  saveTasks();
  renderTasks();
}

function completeTask(index) {
  tasks[index].done = !tasks[index].done;
  saveTasks();
  renderTasks();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  saveTasks();
  renderTasks();
}

function renderTasks() {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfToday.getDate() + 1);
  const startOfDayAfterTomorrow = new Date(startOfToday);
  startOfDayAfterTomorrow.setDate(startOfToday.getDate() + 2);

  const sections = {
    "Overdue": [],
    "Today": [],
    "Tomorrow": [],
    "Upcoming": [],
    "No Date": []
  };

  // Sort tasks: incomplete first, then complete, then by date
  const sortedTasks = [...tasks].sort((a, b) => {

    if (a.important && !b.important) return -1;
    if (!a.important && b.important) return 1;

    if (a.done && !b.done) return 1;
    if (!a.done && b.done) return -1;

    if (a.date && b.date) {
      const [yA, mA, dA] = a.date.split("-").map(Number);
      const [hA, minA] = (a.time || "00:00").split(":").map(Number);
      const dateA = new Date(yA, mA - 1, dA, hA, minA);

      const [yB, mB, dB] = b.date.split("-").map(Number);
      const [hB, minB] = (b.time || "00:00").split(":").map(Number);
      const dateB = new Date(yB, mB - 1, dB, hB, minB);

      return dateA - dateB;
    }

    if (a.date) return -1;
    if (b.date) return 1;

    return 0;
  });

  // Group tasks
  sortedTasks.forEach((task) => {
    if (!task.date) {
      sections["No Date"].push(task);
    } else {
      const [y, m, d] = task.date.split("-").map(Number);
      const [h, min] = (task.time || "00:00").split(":").map(Number);
      const taskDate = new Date(y, m - 1, d, h, min);

      if (!task.done && taskDate < startOfToday) {
        sections["Overdue"].push(task);
      } else if (taskDate >= startOfToday && taskDate < startOfTomorrow) {
        sections["Today"].push(task);
      } else if (taskDate >= startOfTomorrow && taskDate < startOfDayAfterTomorrow) {
        sections["Tomorrow"].push(task);
      } else {
        sections["Upcoming"].push(task);
      }
    }
  });

  // Render sections
  Object.keys(sections).forEach(sectionName => {
    if (sections[sectionName].length === 0) return;

    const header = document.createElement("h3");
    header.textContent = sectionName;
    header.classList.add(sectionName.toLowerCase().replace(" ", "-"));
    taskList.appendChild(header);

    sections[sectionName].forEach(task => {
      const li = document.createElement("li");

      // Highlight important
      if (task.important) {
        li.classList.add("important-task");
      }

      // Task name
      const span = document.createElement("span");
      span.textContent = task.name;
      if (task.done) span.classList.add("done"); 
      li.appendChild(span);

      // Due date/time
      if (task.date) {
        const due = document.createElement("span");
        due.classList.add("due-date");

        const [y, m, d] = task.date.split("-").map(Number);
        const [h, min] = (task.time || "00:00").split(":").map(Number);
        const dueDateTime = new Date(y, m - 1, d, h, min);

        let formatted;
        if (dueDateTime.getFullYear() === now.getFullYear()) {
      // If the task is in the current year, omit the year
            formatted = dueDateTime.toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
          });
        } else {
      // Include year for future years
          formatted = dueDateTime.toLocaleString([], {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
          });
        }


        due.textContent = `⏰ ${formatted}`;

        // Highlight overdue / today / upcoming
        if (!task.done && dueDateTime < now) {
          due.classList.add("overdue");
        } else if (!task.done && sectionName === "Today") {
          due.classList.add("due-today");

          if (task.important) {
            const urgentTag = document.createElement("span");
            urgentTag.textContent = "🔥Urgent";
            urgentTag.classList.add("urgent-tag");
            li.appendChild(urgentTag);
          }
        }  else if (!task.done && sectionName === "Upcoming") {
          due.classList.add("upcoming");
        }

        li.appendChild(due);
      }

      // Buttons
      const buttonGroup = document.createElement("div");
      buttonGroup.classList.add("button-group");

      const completeBtn = document.createElement("button");
      completeBtn.textContent = task.done ? "Undo" : "Complete";
      completeBtn.onclick = () => completeTask(tasks.indexOf(task));
      buttonGroup.appendChild(completeBtn);

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.onclick = () => deleteTask(tasks.indexOf(task));
      buttonGroup.appendChild(deleteBtn);

      li.appendChild(buttonGroup);
      taskList.appendChild(li);
    });
  });
}

function clearCompleted() {
  tasks = tasks.filter(task => !task.done);
  saveTasks();
  renderTasks();
}

// fix tasks not turning to overdue unless theyre a day overdue
// fix completed tasks not going to the bottom if important
// Make important checkbox more appealing 
 