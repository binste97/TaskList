const template = document.createElement("template");
template.innerHTML = `
    <link rel="stylesheet" type="text/css" href="${import.meta.url.match(/.*\//)[0]}/tasklist.css"/>
    <div id="tasklist"></div>
`;

const tasktable = document.createElement("template");
tasktable.innerHTML = `
    <table>
        <thead><tr><th>Task</th><th>Status</th><th>Change status</th><th>Remove</th></tr></thead>
        <tbody></tbody>
    </table>
`;

const taskrow = document.createElement("template");
taskrow.innerHTML = `
    <tr>
        <td></td>
        <td></td>
        <td>
            <select>
                <option value="0" selected>&lt;Select&gt;</option>
            </select>
        </td>
        <td><button type="button">Remove</button></td>
    </tr>
`;

/**
 * TaskList
 * Manage view with list of tasks
 */
class TaskList extends HTMLElement {
	#statuslist = null;
	#callbackChangeStatus = null;
	#callbackRemove = null;
	#table = null;

	constructor() {
		super();
		const content = template.content.cloneNode(true);
		this.appendChild(content);
	}

	// Sets the list of possible statuses for tasks
	setStatuseslist(allstatuses) {
		this.#statuslist = allstatuses;
	}

	// Registers the callback function for handling task status changes
	changestatusCallback(callback) {
		this.#callbackChangeStatus = callback;
	}

	// Registers the callback function for handling task removal
	deletetaskCallback(callback) {
		this.#callbackRemove = callback;
	}

	// Adds “change status” event listener in a specific task-row
	#setStatusChangeCallback(row) {
		const id = row.getAttribute("task-id");
		const selectElm = row.querySelector("select");
		selectElm.addEventListener("input", () => {
			const newStatus = selectElm.value;
			const confirmed = window.confirm(`Set '${row.querySelector("td").innerText}' to ${newStatus}?`);
			if (confirmed) {
				this.#callbackChangeStatus(id, newStatus);
			}
			selectElm.value = 0;
		});
	}

	// Responsible for the "Remove" button in a specific task row.
	#setRemoveCallback(row) {
		const id = row.getAttribute("task-id");
		const removeBtn = row.querySelector("button");
		removeBtn.addEventListener("click", () => {
			const confirmed = window.confirm(`Delete task '${row.querySelector("td").innerText}'?`);
			if (confirmed) {
				this.#callbackRemove(id);
			}
		});
	}

	// Adds a task to the display table at the top of the list
	showTask(task) {
		if (this.#table === null) {
			const containerDiv = this.querySelector("div#tasklist");
			if (containerDiv === null) {
				return;
			}
			containerDiv.appendChild(tasktable.content.cloneNode(true));
			this.#table = containerDiv.querySelector("table");
		}

		let tableBody = this.querySelector("tbody");
		if (tableBody === null) {
			tableBody = this.#table.createTBody();
		}

		const newRow = taskrow.content.cloneNode(true);
		const row = newRow.querySelector("tr");
		row.setAttribute("task-id", task.id);
		row.children[0].innerText = task.title;
		row.children[1].innerText = task.status;

		const statusSelect = row.querySelector("select");

		// Conditionally populate the status dropdown if statuses are available
		if (this.#statuslist) {
			this.#statuslist.forEach(status => {
				const newStatus = document.createElement("option");
				newStatus.value = status;
				newStatus.innerText = status;
				statusSelect.appendChild(newStatus);
			});
		} else {
			// Disable the dropdown to indicate statuses are not available
			statusSelect.disabled = true;
		}

		// Set callbacks if defined
		if (this.#callbackChangeStatus) this.#setStatusChangeCallback(row);
		if (this.#callbackRemove) this.#setRemoveCallback(row);

		tableBody.prepend(newRow);
	}


	// Updates the status of a specific task in the view
	updateTask({ id, status }) {
		this.querySelector(`tr[task-id="${id}"]`).children[1].innerText = status;
	}

	// Removes a task from the view based on its ID
	removeTask(id) {
		const taskElement = this.querySelector(`tr[task-id="${id}"]`);
		if (taskElement === null) {
			console.error(`Task with id ${id} not found.`);
			return;
		}
		taskElement.remove();
	}

	// Returns the count of tasks displayed in the view
	getNumtasks() {
		if (this.#table === null || this.#table.tBodies[0] === undefined) {
			return 0;
		}
		return this.#table.tBodies[0].rows.length;
	}
}

customElements.define('task-list', TaskList);