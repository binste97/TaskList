import "../tasklist/tasklist.js";
import "../taskbox/taskbox.js";

const template = document.createElement("template");
template.innerHTML = `
    <link rel="stylesheet" type="text/css" href="${import.meta.url.match(/.*\//)[0]}/taskview.css"/>
    <h1>Tasks</h1>
    <div id="message"><p>Waiting for server data.</p></div>
    <div id="newtask">
        <button type="button" disabled>New task</button>
    </div>
    <!-- The task list -->
    <task-list></task-list>
    <!-- The Modal -->
    <task-box></task-box>
`;

class TaskView extends HTMLElement {
    #tasklist;
    #taskbox;
    #dataserviceurl;
    #statuseslist;

    constructor() {
        super();
        const content = template.content.cloneNode(true);

        // Initialize references to `task-list` and `task-box` components
        this.#tasklist = content.querySelector("task-list");
        this.#taskbox = content.querySelector("task-box");

        // Set the data service URL from the element attribute, or use a default
        this.#dataserviceurl = this.getAttribute("data-serviceurl") || "./api";

        // Disable "New Task" button initially and add click event to show the task box dialog
        const btn = content.querySelector("#newtask>button");
        btn.disabled = true;
        btn.addEventListener("click", () => {
            this.#taskbox.show();
        });

        // Append the cloned content to the shadow DOM
        this.appendChild(content);

        // Fetch status list first, then fetch tasks once statuses are available
       /*this.#updateStatusList().then(() => {
            this.#updateTaskList();
        });*/

        this.#updateStatusList()
            .catch(error => {
                console.error("Failed to load statuses:", error);
            })
            .finally(() => {
                this.#updateTaskList();
            });



        // Set up the callback for status changes in `task-list`
        this.#tasklist.changestatusCallback(async (id, newStatus) => {
            try {
                const response = await fetch(`${this.#dataserviceurl}/task/${id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ "status": newStatus })
                });
                const json = await response.json();
                if (json["responseStatus"] === true) {
                    this.#tasklist.updateTask({ "id": json.id, "status": json.status });
                }
            } catch (error) {
                console.error(error);
            }
        });

        // Set up callback for creating a new task through `task-box`
        this.#taskbox.newtaskCallback(async (title, status) => {
            try {
                const response = await fetch(`${this.#dataserviceurl}/task`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ "title": title, "status": status })
                });
                const json = await response.json();
                if (json["responseStatus"] === true) {
                    this.#tasklist.showTask(json["task"]);
                    this.#updateAmountShown();
                }
            } catch (error) {
                console.error(error);
            }
        });

        // Set up callback for deleting a task in `task-list`
        this.#tasklist.deletetaskCallback(async (id) => {
            try {
                const response = await fetch(`${this.#dataserviceurl}/task/${id}`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                    }
                });
                const json = await response.json();
                if (json["responseStatus"] === true) {
                    this.#tasklist.removeTask(json["id"]);
                    this.#updateAmountShown();
                }
            } catch (error) {
                console.error(error);
            }
        });
    }

    // Fetches list of statuses from the server and updates `task-list` and `task-box` with them
    async #updateStatusList() {

        try {
            //await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
            const response = await fetch(`${this.#dataserviceurl}/allstatuses`);
            const json = await response.json();

            if (json.allstatuses) {
                this.#statuseslist = json.allstatuses;
                this.#tasklist.setStatuseslist(this.#statuseslist);
                this.#taskbox.setStatusesList(this.#statuseslist);
            }

            if (!this.#statuseslist || this.#statuseslist.length === 0) {
                throw new Error("Failed to load statuses: Status list is empty or not available");
            }
            this.querySelector("#newtask > button").disabled = false;
        } catch (error) {
            console.error(error);
        }
    }

    // Fetches tasks from the server and displays them in `task-list`
    async #updateTaskList() {
        try {
            //await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
            const response = await fetch(`${this.#dataserviceurl}/tasklist`);

            if (!response.ok) {
                throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`);
            }

            const json = await response.json();

            if (json.tasks) {
                for (const task of json.tasks) {
                    this.#tasklist.showTask(task);
                }
                this.#updateAmountShown();
                //this.querySelector("#newtask > button").disabled = false;
            } else {
                this.querySelector("#message>p").innerText = "No tasks available.";
            }
        } catch (error) {
            console.error("Failed to fetch tasks from the backend:", error);
            this.querySelector("#message>p").innerText = "Error: Unable to load tasks.";
            this.querySelector("#newtask > button").disabled = true;

        }
    }

    // Updates the displayed task count in the message area
    #updateAmountShown() {
        this.querySelector("#message>p").innerText = `Found ${this.#tasklist.getNumtasks()} tasks.`;
    }
}

customElements.define('task-view', TaskView);