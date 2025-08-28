const template = document.createElement("template");
template.innerHTML = `
    <link rel="stylesheet" type="text/css" href="${import.meta.url.match(/.*\//)[0]}/taskbox.css"/>
    <dialog>
        <!-- Modal content -->
        <span>&times;</span>
        <div>
            <div>Title:</div>
            <div>
                <input type="text" size="25" maxlength="80" placeholder="Task title" autofocus/>
            </div>
            <div>Status:</div>
            <div>
                <select></select>
            </div>
        </div>
        <p><button type="submit">Add task</button></p>
    </dialog>
`;

class TaskBox extends HTMLElement {
	#dialog;
	#callbackForAddTask;

	constructor() {
		super();
		const content = template.content.cloneNode(true);

		// Initialize the dialog reference
		this.#dialog = content.querySelector("dialog");

		// Add event listener for the close button ("X")
		content.querySelector("span").addEventListener("click", () => {
			this.#dialog.close();
		});

		// Event listener for "Add Task" button
		const btn = content.querySelector("button");
		btn.addEventListener("click", () => {
			const title = this.querySelector("input").value.trim();
			const status = this.querySelector("select").value;

			// Validate title and status input
			if (title === "" || status === "") {
				alert("Please enter both a title and a status for the task.");
				return;
			}


			if (this.#callbackForAddTask) { // Trigger callback if registered
				this.#callbackForAddTask(title, status);
			}
			this.close(); // Close the modal
		});

		// Append the cloned content to the element
		this.appendChild(content);
	}

	// Registers the callback function for adding a new task
	newtaskCallback(callback) {
		this.#callbackForAddTask = callback;
	}

	// Sets the list of statuses for the status dropdown
	setStatusesList(list) {
		if (!Array.isArray(list)) {
			console.error(`${list} is not a valid array`);
			return;
		}
		if (list.length < 1) {
			console.error("The status array must contain at least one status");
			return;
		}
		const select = this.querySelector("select");
		select.innerHTML = ""; // Clear any existing options
		for (let status of list) {
			const elm = document.createElement("option");
			elm.value = status;
			elm.innerText = status;
			select.appendChild(elm);
		}
	}

	// Opens the dialog box for adding a new task, resetting input fields each time
	show() {
		this.querySelector("input").value = "";
		this.querySelector("select").value = "";
		this.#dialog.showModal();
	}

	// Closes the dialog box
	close() {
		this.#dialog.close();
	}
}

customElements.define('task-box', TaskBox);