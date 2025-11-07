class ProjectManager { // Project Manager
    constructor() {
        let project = this.get_project();
        this.title = project.name;
        this.desc = project.desc;
        this.storyline = project.storyline;
        this.characters = project.characters;
        this.settings = project.settings;
    }
    async get_project() {
        let resp = await fetch('/cur-project/get-all');
        return resp.json();
    }
}