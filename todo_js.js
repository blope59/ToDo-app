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
  tasks.forEach((task, index) => {
    let li = document.createElement("li");
    let span = document.createElement("span");
    span.textContent = task.name;
    if (task.done) {
      span.classList.add("done");
    }
    li.appendChild(span);

    let buttonGroup = document.createElement("div");
    buttonGroup.classList.add("button-group");

    let completeBtn = document.createElement("button");
    completeBtn.textContent = "Complete";
    completeBtn.onclick = () => completeTask(index);
    buttonGroup.appendChild(completeBtn);

    let deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = () => deleteTask(index);
    buttonGroup.appendChild(deleteBtn);

    li.appendChild(buttonGroup);
    taskList.appendChild(li);
  });
}

function addTask() {
  const input = document.getElementById("taskInput");
  if (input.value.trim() !== "") {
    tasks.push({ name: input.value, done: false });
    input.value = "";
    saveTasks();   // save after adding
    renderTasks();
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
