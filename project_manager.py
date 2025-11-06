import json
import examples

class ProjectManager:
    def __init__(self):
        self.current_project = {}
        self.characters = []
        self.storyline = []

        self.contexts = []
        self.scenes = []
        self.idcount = 0
    
    def serve_project(self):
        for element in self.current_project.content:
            if element.type == "character":
                self.characters.append(element)
                self.idcount += 1
            elif element.type == "context":
                self.contexts.append(element)
                self.storyline.append(element)
                self.idcount += 1
                for scene in element.content:
                    self.scenes.append(scene)
                    scene.name = "[!CHILD]" + scene.name
                    self.storyline.append(scene)
                    self.idcount += 1
            elif element.type == "scene":
                self.scenes.append(element)
                self.storyline.append(scene)
                self.idcount += 1
        self.current_project.content = []

    def select_project(self, project: dict):
        self.current_project = project
        self.serve_project()
    
    def add_element(self, element_type: str):
        if element_type == 'context':
            self.idcount += 1
            new_context = examples.context
            new_context.name = "context" + str(self.idcount)
            self.contexts.append(new_context)
            self.storyline.append(new_context)
        elif element_type == 'scene':
            self.idcount += 1
            new_scene = examples.scene
            new_scene.name = "scene" + str(self.idcount)
            self.scenes.append(new_scene)
            self.scenes.append(new_scene)
        elif element_type == 'character':
            self.idcount += 0
            new_character = examples.character
            new_character.name = "character" + str(self.idcount)
            self.characters.append(new_character)
    
    def remove_element(self, element_name: str):
        for element in self.characters:
            if element_name == element.name:
                self.characters.remove(element)
                break
        for element in self.contexts:
            if element_name == element.name:
                self.contexts.remove(element)
        for element in self.scenes:
            if element_name == element.name:
                self.scenes.remove(element)
        for element in self.storyline:
            if element_name == element.name:
                self.storyline.remove(element)

    def get_settx(self):
        return self.current_project.settings
    
    def set_settx(self, settings: dict):
        self.current_project.settings = settings

    def get_element(self, element_name):
        for element in self.characters:
            if element_name == element.name:
                return element
        for element in self.contexts:
            if element_name == element.name:
                return element
        for element in self.scenes:
            if element_name == element.name:
                return element
    
    def set_element(self, new_element):
        for element in self.characters:
            if new_element.name == element.name:
                return element
        for element in self.contexts:
            if new_element.name == element.name:
                return element
        for element in self.scenes:
            if new_element.name == element.name:
                return element