let tasks = [];
let collapsedSections = {}; 

// Safe UUID generator with fallback
function genId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
}

// Load saved tasks and collapsed sections
window.onload = () => {
  const savedTasks = localStorage.getItem("tasks");
  if (savedTasks) {
    try { tasks = JSON.parse(savedTasks); } catch (e) { tasks = []; }
  }
  const savedCollapsed = localStorage.getItem("collapsedSections");
  if (savedCollapsed) {
    try { collapsedSections = JSON.parse(savedCollapsed); } catch (e) { collapsedSections = {}; }
  }
  renderTasks();
};

// Save tasks & collapsed state
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}
function saveCollapsed() {
  localStorage.setItem("collapsedSections", JSON.stringify(collapsedSections));
}

// Add new task
function addTask() {
  const input = document.getElementById("taskInput");
  const dateInput = document.getElementById("dateInput");
  const timeInput = document.getElementById("timeInput");
  const importantInput = document.getElementById("importantInput");

  if (!input || input.value.trim() === "") {
    alert("Please enter a task name.");
    return;
  }

  tasks.push({
    id: genId(),
    name: input.value.trim(),
    date: dateInput.value || null,
    time: timeInput.value || null,
    important: importantInput.checked,
    done: false
  });

  // reset inputs
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

// Delete
function deleteTask(id) {
  if (!confirm("Are you sure you want to delete this task?")) return;
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

// Edit (inline)
function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const taskList = document.getElementById("taskList");
  const li = taskList.querySelector(`li[data-id="${id}"]`);
  if (!li) return;

  // clear and apply editing class
  li.innerHTML = "";
  li.classList.add("editing");

  // Create inputs
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.value = task.name;

  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.value = task.date || "";

  const timeInput = document.createElement("input");
  timeInput.type = "time";
  timeInput.value = task.time || "";

  const importantInput = document.createElement("input");
  importantInput.type = "checkbox";
  importantInput.checked = task.important;
  const importantLabel = document.createElement("label");
  importantLabel.textContent = "⭐ Important ";
  importantLabel.appendChild(importantInput);

  // Save & Cancel buttons
  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save";
  saveBtn.addEventListener("click", () => {
    task.name = nameInput.value.trim() || task.name;
    task.date = dateInput.value || null;
    task.time = timeInput.value || null;
    task.important = importantInput.checked;
    li.classList.remove("editing");
    saveTasks();
    renderTasks();
  });

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.addEventListener("click", () => {
    li.classList.remove("editing");
    renderTasks();
  });

  // append inputs & buttons
  li.appendChild(nameInput);
  li.appendChild(dateInput);
  li.appendChild(timeInput);
  li.appendChild(importantLabel);
  li.appendChild(saveBtn);
  li.appendChild(cancelBtn);

  // focus and key handlers
  nameInput.focus();

  const allInputs = [nameInput, dateInput, timeInput];
  // For checkbox we need keydown on the label or document; still include it
  allInputs.forEach(el => {
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveBtn.click();
      if (e.key === "Escape") cancelBtn.click();
    });
  });

  // Make Enter/Escape also work on checkbox via keydown on li
  li.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveBtn.click();
    if (e.key === "Escape") cancelBtn.click();
  });

  // clicking the importance checkbox saves immediately
  importantInput.addEventListener("change", () => saveBtn.click());
}

// Render tasks
function renderTasks() {
  const taskList = document.getElementById("taskList");
  if (!taskList) return;
  taskList.innerHTML = "";

  const filterSelect = document.getElementById("filterSelect");
  const filter = filterSelect ? filterSelect.value : "all";
  const searchEl = document.getElementById("searchInput");
  const searchText = searchEl ? searchEl.value.trim().toLowerCase() : "";

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

  // Sort tasks: not-done first, important first, then date/time
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

  // Apply filter + search
  const filteredTasks = sortedTasks.filter(task => {
    if (filter === "active" && task.done) return false;
    if (filter === "completed" && !task.done) return false;
    if (filter === "important" && !task.important) return false;
    if (searchText && !task.name.toLowerCase().includes(searchText)) return false;
    return true;
  });

  // Group into sections
  filteredTasks.forEach(task => {
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

  // Render each section
  Object.keys(sections).forEach(sectionName => {
    const list = sections[sectionName];
    if (list.length === 0) return;

    const header = document.createElement("h3");
    header.textContent = sectionName;
    header.classList.add(sectionName.toLowerCase().replace(" ", "-"));
    if (collapsedSections[sectionName]) header.classList.add("collapsed");
    taskList.appendChild(header);

    header.addEventListener("click", () => {
      collapsedSections[sectionName] = !collapsedSections[sectionName];
      saveCollapsed();
      renderTasks();
    });

    if (collapsedSections[sectionName]) return;

    list.forEach(task => {
      const li = document.createElement("li");
      li.setAttribute("data-id", task.id);
      if (task.important) li.classList.add("important-task");

      // name
      const span = document.createElement("span");
      span.textContent = task.name;
      if (task.done) span.classList.add("done");
      li.appendChild(span);

      // due
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

      // buttons
      const buttonGroup = document.createElement("div");
      buttonGroup.classList.add("button-group");

      const completeBtn = document.createElement("button");
      completeBtn.textContent = task.done ? "Undo" : "Complete";
      completeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        completeTask(task.id);
      });
      buttonGroup.appendChild(completeBtn);

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteTask(task.id);
      });
      buttonGroup.appendChild(deleteBtn);

      li.appendChild(buttonGroup);
      taskList.appendChild(li);

      // dblclick anywhere on row (except buttons/inputs) to edit
      li.addEventListener("dblclick", (e) => {
        if (!e.target.closest("button") && !e.target.closest("input")) {
          editTask(task.id);
        }
      });
    });
  });

  // update progress for currently visible tasks
  updateProgress(filteredTasks);
}

// Clear completed
function clearCompleted() {
  tasks = tasks.filter(task => !task.done);
  saveTasks();
  renderTasks();
}

// Event listeners (safe if elements don't exist yet)
document.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.getElementById("addTaskBtn");
  if (addBtn) addBtn.addEventListener("click", addTask);

  const clearBtn = document.getElementById("clearCompletedBtn");
  if (clearBtn) clearBtn.addEventListener("click", clearCompleted);

  const filterSelect = document.getElementById("filterSelect");
  if (filterSelect) filterSelect.addEventListener("change", renderTasks);

  const searchInput = document.getElementById("searchInput");
  if (searchInput) searchInput.addEventListener("input", renderTasks);

  const mainTaskInput = document.getElementById("taskInput");
  if (mainTaskInput) mainTaskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addTask();
  });
});

// add reapeatable tasks in the future 