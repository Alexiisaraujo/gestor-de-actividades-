/* ================= ESTADO GLOBAL ================= */

let activities = JSON.parse(localStorage.getItem("activities")) || [];
let currentActivityId = localStorage.getItem("currentActivity") || null;

/* ================= UTILIDADES ================= */

function saveToStorage() {
    localStorage.setItem("activities", JSON.stringify(activities));
    localStorage.setItem("currentActivity", currentActivityId);
}

function generateId() {
    return Date.now().toString();
}

function showView(viewId) {
    document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
    document.getElementById(viewId).classList.remove("hidden");
}

/* ================= SELECTOR ================= */

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

    selector.onchange = (e) => {
        currentActivityId = e.target.value;
        saveToStorage();
        renderMain();
    };
}

/* ================= RENDER PRINCIPAL ================= */

function renderMain() {
    const activity = activities.find(a => a.id === currentActivityId);
    const title = document.getElementById("activityTitle");
    const meta = document.getElementById("activityMeta");
    const container = document.getElementById("stepsContainer");

    container.innerHTML = "";

    if (!activity) {
        title.textContent = "Sin actividad seleccionada";
        meta.textContent = "";
        return;
    }

    title.textContent = activity.name;
    meta.textContent = "Creada: " + new Date(activity.createdAt).toLocaleString();

    let total = 0;
    let completed = 0;

    activity.steps.forEach(step => {
        total++;
        if (step.completed) completed++;

        const stepDiv = createStepElement(step, false, step);
        container.appendChild(stepDiv);

        step.substeps.forEach(sub => {
            total++;
            if (sub.completed) completed++;

            const subDiv = createStepElement(sub, true, step);
            container.appendChild(subDiv);
        });
    });

    updateProgress(total, completed);
}

/* ================= CREAR ELEMENTO PASO ================= */

function createStepElement(stepObj, isSub, parentStep) {
    const div = document.createElement("div");
    div.className = "step" + (isSub ? " sub-step" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = stepObj.completed;

    checkbox.onchange = () => {
        stepObj.completed = checkbox.checked;
        stepObj.completedAt = checkbox.checked ? Date.now() : null;

        if (!isSub) {
            stepObj.substeps.forEach(s => {
                s.completed = checkbox.checked;
                s.completedAt = checkbox.checked ? Date.now() : null;
            });
        }

        if (isSub) {
            parentStep.completed = parentStep.substeps.every(s => s.completed);
        }

        saveToStorage();
        renderMain();
    };

    const span = document.createElement("span");
    span.textContent = stepObj.text;

    div.appendChild(checkbox);
    div.appendChild(span);

    return div;
}

/* ================= PROGRESO ================= */

function updateProgress(total, completed) {
    const percent = total ? Math.round((completed / total) * 100) : 0;
    document.getElementById("progressFill").style.width = percent + "%";
    document.getElementById("progressText").textContent = percent + "% completado";
}

/* ================= CREAR ACTIVIDAD ================= */

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
    subBtn.className = "secondary-btn";

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
            const substeps = [];

            for (let i = 1; i < inputs.length; i++) {
                if (inputs[i].value.trim()) {
                    substeps.push({
                        text: inputs[i].value.trim(),
                        completed: false,
                        completedAt: null
                    });
                }
            }

            steps.push({
                text: inputs[0].value.trim(),
                completed: false,
                completedAt: null,
                substeps
            });
        }
    });

    const newActivity = {
        id: generateId(),
        name,
        createdAt: Date.now(),
        steps
    };

    activities.push(newActivity);
    currentActivityId = newActivity.id;

    saveToStorage();
    renderSelector();
    renderMain();
    showView("mainView");
};

/* ================= HISTORIAL ================= */

document.getElementById("btnHistory").onclick = () => {
    renderHistory();
    showView("historyView");
};

function renderHistory() {
    const list = document.getElementById("historyList");
    list.innerHTML = "";

    activities.forEach(act => {
        const div = document.createElement("div");
        div.className = "card";

        div.innerHTML = `
            <strong>${act.name}</strong><br>
            <span class="meta-text">Creada: ${new Date(act.createdAt).toLocaleString()}</span>
        `;

        const editBtn = document.createElement("button");
        editBtn.textContent = "Editar";
        editBtn.className = "secondary-btn";
        editBtn.onclick = () => editActivity(act.id);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Eliminar";
        deleteBtn.className = "primary-btn";
        deleteBtn.onclick = () => {
            activities = activities.filter(a => a.id !== act.id);

            if (currentActivityId === act.id) {
                currentActivityId = activities.length ? activities[0].id : null;
            }

            saveToStorage();
            renderSelector();
            renderHistory();
            renderMain();
        };

        div.appendChild(document.createElement("br"));
        div.appendChild(editBtn);
        div.appendChild(deleteBtn);
        list.appendChild(div);
    });
}

/* ================= EDITAR COMPLETO ================= */

function editActivity(id) {
    const act = activities.find(a => a.id === id);
    const container = document.getElementById("editContainer");

    container.classList.remove("hidden");
    container.innerHTML = "";

    const nameInput = document.createElement("input");
    nameInput.value = act.name;
    container.appendChild(nameInput);

    act.steps.forEach(step => {
        const stepInput = document.createElement("input");
        stepInput.value = step.text;
        container.appendChild(stepInput);

        step.substeps.forEach(sub => {
            const subInput = document.createElement("input");
            subInput.style.marginLeft = "20px";
            subInput.value = sub.text;
            container.appendChild(subInput);
        });
    });

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Guardar cambios";
    saveBtn.className = "primary-btn";

    saveBtn.onclick = () => {
        act.name = nameInput.value;

        const inputs = container.querySelectorAll("input");
        let index = 1;

        act.steps.forEach(step => {
            step.text = inputs[index++].value;
            step.substeps.forEach(sub => {
                sub.text = inputs[index++].value;
            });
        });

        saveToStorage();
        renderSelector();
        renderHistory();
        renderMain();
        container.classList.add("hidden");
    };

    container.appendChild(saveBtn);
}

/* ================= INIT ================= */

renderSelector();
renderMain();