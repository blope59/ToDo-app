let tasks = [];

// Load saved tasks on page load
window.onload = () => {
  const savedTasks = localStorage.getItem("tasks");
  if (savedTasks) {
    tasks = JSON.parse(savedTasks);
    renderTasks();
  }
};

// Save to localStorage
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Add new task
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
    id: crypto.randomUUID(),
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

// Toggle complete
function completeTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.done = !task.done;
    saveTasks();
    renderTasks();
  }
}

// Delete task
function deleteTask(id) {
  if (!confirm("Are you sure you want to delete this task?")) return;
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

// Render tasks
function renderTasks() {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";

  const filter = document.getElementById("filterSelect").value;

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

  // Sorting
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.done && !b.done) return 1;
    if (!a.done && b.done) return -1;
    if (a.important && !b.important) return -1;
    if (!a.important && b.important) return 1;

    if (a.date && b.date) {
      const dateA = new Date(`${a.date}T${a.time || "00:00"}`);
      const dateB = new Date(`${b.date}T${b.time || "00:00"}`);
      return dateA - dateB;
    }
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });

  // Apply filter
  const filteredTasks = sortedTasks.filter(task => {
    if (filter === "active") return !task.done;
    if (filter === "completed") return task.done;
    if (filter === "important") return task.important;
    return true; // "all"
  });

  // Group tasks
  filteredTasks.forEach((task) => {
    if (!task.date) {
      sections["No Date"].push(task);
    } else {
      const taskDate = new Date(`${task.date}T${task.time || "00:00"}`);
      if (!task.done && taskDate < now) {
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
      if (task.important) li.classList.add("important-task");

      // Task name
      const span = document.createElement("span");
      span.textContent = task.name;
      if (task.done) span.classList.add("done");
      li.appendChild(span);

      // Due date/time
      if (task.date) {
        const due = document.createElement("span");
        due.classList.add("due-date");

        const dueDateTime = new Date(`${task.date}T${task.time || "00:00"}`);
        let formatted = dueDateTime.toLocaleString([], {
          month: "short",
          day: "numeric",
          year: dueDateTime.getFullYear() === now.getFullYear() ? undefined : "numeric",
          hour: "numeric",
          minute: "2-digit"
        });

        due.textContent = `⏰ ${formatted}`;

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
        } else if (!task.done && sectionName === "Upcoming") {
          due.classList.add("upcoming");
        }

        li.appendChild(due);
      }

      // Buttons
      const buttonGroup = document.createElement("div");
      buttonGroup.classList.add("button-group");

      const completeBtn = document.createElement("button");
      completeBtn.textContent = task.done ? "Undo" : "Complete";
      completeBtn.addEventListener("click", () => completeTask(task.id));
      buttonGroup.appendChild(completeBtn);

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => deleteTask(task.id));
      buttonGroup.appendChild(deleteBtn);

      li.appendChild(buttonGroup);
      taskList.appendChild(li);
    });
  });
}

// Clear completed
function clearCompleted() {
  tasks = tasks.filter(task => !task.done);
  saveTasks();
  renderTasks();
}

// Event listeners
document.getElementById("addTaskBtn").addEventListener("click", addTask);
document.getElementById("clearCompletedBtn").addEventListener("click", clearCompleted);
document.getElementById("filterSelect").addEventListener("change", renderTasks);

// Enter key to add task
document.getElementById("taskInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") addTask();
});

// add double click to edit task 