document.addEventListener("DOMContentLoaded", () => {

let activities = JSON.parse(localStorage.getItem("activities")) || [];
let currentActivityId = localStorage.getItem("currentActivity") || null;

function save() {
  localStorage.setItem("activities", JSON.stringify(activities));
  localStorage.setItem("currentActivity", currentActivityId);
}

function generateId() {
  return Date.now().toString();
}

function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  document.getElementById(id)?.classList.remove("hidden");
}

function renderSelector() {
  const selector = document.getElementById("activitySelector");
  selector.innerHTML = "";

  activities.forEach(act => {
    const option = document.createElement("option");
    option.value = act.id;
    option.textContent = act.name;
    if (act.id === currentActivityId) option.selected = true;
    selector.appendChild(option);
  });

  selector.onchange = e => {
    currentActivityId = e.target.value;
    save();
    renderMain();
  };
}

function renderMain() {
  const activity = activities.find(a => a.id === currentActivityId);
  const container = document.getElementById("stepsContainer");
  const title = document.getElementById("activityTitle");
  const meta = document.getElementById("activityMeta");

  container.innerHTML = "";

  if (!activity) {
    title.textContent = "Sin actividad";
    meta.textContent = "";
    updateProgress(0,0);
    return;
  }

  title.textContent = activity.name;
  meta.textContent = "Creada: " + new Date(activity.createdAt).toLocaleString();

  let total = 0;
  let done = 0;

  activity.steps.forEach(step => {
    total++;
    if (step.completed) done++;

    container.appendChild(createStep(step,false,step));

    step.substeps.forEach(sub => {
      total++;
      if (sub.completed) done++;
      container.appendChild(createStep(sub,true,step));
    });
  });

  updateProgress(total,done);
}

function createStep(obj,isSub,parent) {
  const div = document.createElement("div");
  div.className = "step" + (isSub ? " sub-step" : "");

  const check = document.createElement("input");
  check.type = "checkbox";
  check.checked = obj.completed;

  check.onchange = () => {
    obj.completed = check.checked;
    obj.completedAt = check.checked ? Date.now() : null;

    if (!isSub) {
      obj.substeps.forEach(s => {
        s.completed = check.checked;
        s.completedAt = check.checked ? Date.now() : null;
      });
    }

    if (isSub) {
      parent.completed = parent.substeps.every(s => s.completed);
    }

    save();
    renderMain();
  };

  const span = document.createElement("span");
  span.textContent = obj.text;

  div.appendChild(check);
  div.appendChild(span);
  return div;
}

function updateProgress(total,done) {
  const percent = total ? Math.round((done/total)*100) : 0;
  document.getElementById("progressFill").style.width = percent+"%";
  document.getElementById("progressText").textContent = percent+"% completado";
}

/* CREAR ACTIVIDAD */

document.getElementById("btnCreate").onclick = () => showView("createView");

document.getElementById("addStepBtn").onclick = () => {
  const builder = document.getElementById("builderContainer");

  const stepDiv = document.createElement("div");
  stepDiv.className = "builder-step";

  const stepInput = document.createElement("input");
  stepInput.placeholder = "Nombre del paso";

  const subBtn = document.createElement("button");
  subBtn.textContent = "+ Subpaso";
  subBtn.type = "button";

  const subContainer = document.createElement("div");

  subBtn.onclick = () => {
    const subInput = document.createElement("input");
    subInput.placeholder = "Nombre del subpaso";
    subContainer.appendChild(subInput);
  };

  stepDiv.appendChild(stepInput);
  stepDiv.appendChild(subBtn);
  stepDiv.appendChild(subContainer);
  builder.appendChild(stepDiv);
};

document.getElementById("saveActivityBtn").onclick = () => {
  const name = document.getElementById("newActivityName").value.trim();
  if (!name) return;

  const steps = [];

  document.querySelectorAll(".builder-step").forEach(stepDiv => {
    const inputs = stepDiv.querySelectorAll("input");
    if (inputs[0].value.trim()) {
      const subs = [];
      for (let i=1;i<inputs.length;i++) {
        if (inputs[i].value.trim()) {
          subs.push({ text: inputs[i].value.trim(), completed:false, completedAt:null });
        }
      }
      steps.push({ text: inputs[0].value.trim(), completed:false, completedAt:null, substeps: subs });
    }
  });

  const newActivity = { id: generateId(), name, createdAt: Date.now(), steps };

  activities.push(newActivity);
  currentActivityId = newActivity.id;
  save();
  renderSelector();
  renderMain();
  showView("mainView");
};

/* HISTORIAL */

document.getElementById("btnHistory").onclick = () => {
  renderHistory();
  showView("historyView");
};

document.getElementById("btnHome").onclick = () => showView("mainView");

function renderHistory() {
  const list = document.getElementById("historyList");
  list.innerHTML = "";

  activities.forEach(act => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<strong>${act.name}</strong><br><span class="meta">Creada: ${new Date(act.createdAt).toLocaleString()}</span>`;

    const edit = document.createElement("button");
    edit.textContent = "Editar";
    edit.onclick = () => editActivity(act.id);

    const del = document.createElement("button");
    del.textContent = "Eliminar";
    del.onclick = () => {
      activities = activities.filter(a=>a.id!==act.id);
      if (currentActivityId===act.id) currentActivityId = activities[0]?.id || null;
      save();
      renderSelector();
      renderHistory();
      renderMain();
    };

    div.appendChild(edit);
    div.appendChild(del);
    list.appendChild(div);
  });
}

function editActivity(id) {
  const act = activities.find(a=>a.id===id);
  const container = document.getElementById("editContainer");
  container.classList.remove("hidden");
  container.innerHTML = "";

  const nameInput = document.createElement("input");
  nameInput.value = act.name;
  container.appendChild(nameInput);

  act.steps.forEach(step=>{
    const stepInput = document.createElement("input");
    stepInput.value = step.text;
    container.appendChild(stepInput);

    step.substeps.forEach(sub=>{
      const subInput = document.createElement("input");
      subInput.value = sub.text;
      subInput.style.marginLeft = "20px";
      container.appendChild(subInput);
    });
  });

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Guardar cambios";

  saveBtn.onclick = ()=>{
    act.name = nameInput.value;
    const inputs = container.querySelectorAll("input");
    let i=1;
    act.steps.forEach(step=>{
      step.text = inputs[i++].value;
      step.substeps.forEach(sub=>{
        sub.text = inputs[i++].value;
      });
    });
    save();
    renderSelector();
    renderHistory();
    renderMain();
    container.classList.add("hidden");
  };

  container.appendChild(saveBtn);
}

if (!currentActivityId && activities.length>0) currentActivityId = activities[0].id;

renderSelector();
renderMain();
showView("mainView");

});
