let tasks = [];

// Load saved tasks when the page opens
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

function renderTasks() {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";

  let now = new Date();
  let startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfToday.getDate() + 1);
  let startOfDayAfterTomorrow = new Date(startOfToday);
  startOfDayAfterTomorrow.setDate(startOfToday.getDate() + 2);

  //Grouping section
  let sections = {
    "Today": [],
    "Tomorrow": [],
    "Upcoming": [],
    "No Date": []
  };

  //sort incomplete then complete
  let sortedTasks = [...tasks].sort((a, b) => {
    // Move completed tasks to bottom
    if (a.done && !b.done) return 1;
    if (!a.done && b.done) return -1;

    if (a.date && b.date) {
      let [yA, mA, dA] = a.date.split("-").map(Number);
      let [hA, minA] = a.time.split(":").map(Number);
      let dateA = new Date(yA, mA - 1, dA, hA, minA);

      let [yB, mB, dB] = b.date.split("-").map(Number);
      let [hB, minB] = b.time.split(":").map(Number);
      let dateB = new Date(yB, mB - 1, dB, hB, minB);

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
      let [y, m, d] = task.date.split("-").map(Number);
      let [h, min] = task.time.split(":").map(Number);
      let taskDate = new Date(y, m - 1, d, h, min);

      if (taskDate >= startOfToday && taskDate < startOfTomorrow) {
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

    // Group header
    let header = document.createElement("h3");
    header.textContent = sectionName;
    header.classList.add(sectionName.toLowerCase().replace(" ", "-"));
    taskList.appendChild(header);

    sections[sectionName].forEach(task => {
      let li = document.createElement("li");

      //Task name
      let span = document.createElement("span");
      span.textContent = task.name;
      if (task.done) span.classList.add("done");
      li.appendChild(span);

    // Due time
      if (task.date && task.time) {
        let due = document.createElement("span");
        due.classList.add("due-date");

        let [y, m, d] = task.date.split("-").map(Number);
        let [h, min] = task.time.split(":").map(Number);
        let dueDateTime = new Date(y, m - 1, d, h, min);

        let formattedTime = dueDateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        due.textContent = `⏰ ${formattedTime}`;

        // Highlight overdue / today
        if (!task.done && dueDateTime < now) due.classList.add("overdue");
        else if (!task.done && sectionName === "Today") due.classList.add("due-today");

        li.appendChild(due);
      }
    
    // Buttons
    let buttonGroup = document.createElement("div");
    buttonGroup.classList.add("button-group");

    let completeBtn = document.createElement("button");
    completeBtn.textContent = task.done ? "Undo" : "Complete";
    completeBtn.onclick = () => completeTask(tasks.indexOf(task));
    buttonGroup.appendChild(completeBtn);

    let deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = () => deleteTask(tasks.indexOf(task));
    buttonGroup.appendChild(deleteBtn);

    li.appendChild(buttonGroup);
    taskList.appendChild(li);
    });
  });
}

function addTask() {
  const input = document.getElementById("taskInput");
  const dateInput = document.getElementById("dateInput");
  const timeInput = document.getElementById("timeInput");

  if (input.value.trim() !== "" && dateInput.value && timeInput.value) {
    tasks.push({
      name: input.value,
      date: dateInput.value,
      time: timeInput.value,
      done: false
    });

    // Clear inputs
    input.value = "";
    dateInput.value = "";
    timeInput.value = "";

    saveTasks();   // save after adding
    renderTasks();
  } else {
    alert("Please enter task, date, and time.");
  }
}

function completeTask(index) {
  tasks[index].done = !tasks[index].done;
  saveTasks();     // save after marking complete
  renderTasks();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  saveTasks();     // save after deleting
  renderTasks();
}

// tomorrow fix upcoming section so it shows dates 