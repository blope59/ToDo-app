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

  //sort incomplete then complete
  let sortedTasks = [...tasks].sort((a, b) => {
    // Move completed tasks to bottom
    if (a.done && !b.done) return 1;
    if (!a.done && b.done) return -1;

    // Both done, compare due dates
    if (a.date && b.date){
    let dateA = new Date(`${a.date}T${a.time}`);
    let dateB = new Date(`${b.date}T${b.time}`);
    return dateA - dateB; 
    }

    return 0;
  });

  sortedTasks.forEach((task, index) => {
    let li = document.createElement("li");

    // Task 
    let span = document.createElement("span");
    span.textContent = task.name;
    if (task.done) {
      span.classList.add("done");
    }
    li.appendChild(span);

  // Due date/time (if available)
    if (task.date && task.time) {
      let due = document.createElement("span");
      due.classList.add("due-date");
      
      // Format date and time 
      let dueDateTime = new Date(`${task.date}T${task.time}`);
      let options = { month: "short", day: "numeric", year: "numeric" };
      let formattedDate = dueDateTime.toLocaleDateString(undefined, options);
      let formattedTime = dueDateTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });

      due.textContent = `📅 ${formattedDate} ⏰ ${formattedTime}`;

      let now = new Date();
      let today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Highlight overdue tasks
      if (new Date() > dueDateTime && !task.done) {
        due.classList.add("overdue");
      }

      //Highlight due today
      else if (
        dueDateTime >= today &&
        dueDateTime < new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1) && !task.done
      ) {
      due.classList.add("due-today");
    }
      

      li.appendChild(due);
    }  
    
    // Buttons
    let buttonGroup = document.createElement("div");
    buttonGroup.classList.add("button-group");

    let completeBtn = document.createElement("button");
    completeBtn.textContent = "Complete";
    completeBtn.onclick = () => completeTask(tasks.indexOf(task));
    buttonGroup.appendChild(completeBtn);

    let deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = () => deleteTask(tasks.indexOf(task));
    buttonGroup.appendChild(deleteBtn);

    li.appendChild(buttonGroup);
    taskList.appendChild(li);
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
  tasks[index].done = true;
  saveTasks();     // save after marking complete
  renderTasks();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  saveTasks();     // save after deleting
  renderTasks();
}
