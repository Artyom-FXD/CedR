extends Node
@export var projects = []

@export var current_project = {}
# prj: prj_name, content = [], settings = {} - но это пока нас ебать не должно
@export var prj_name = ""

@export var characters = []
# chars: "char", id, el_name, gender, color1, color2, color3, desc
@export var contexts = []
# contexts: "context", id, el_name, desc, content = []
@export var scenes = []
# scene: "scene", id, is_contexted: context or "no", el_name, color1, color2, color3, desc, dialog: []
@export var current_scene = {}
var maxid = 0

signal load_project(project: Dictionary)

func _ready() -> void:
	load_project.connect(import_prj)

func new_context(el_name: String, desc = ""):
	var id = maxid + 1
	var context = ["context", id, el_name, desc, []]
	contexts.append(context)
	maxid += 1

func new_scene(context: String, el_name: String, color1: Color, color2: Color, color3: Color, desc = ""):
	var id = maxid + 1
	var scene = ["scene", id, context, el_name, color1, color2, color3, desc, []]
	if context != "no":
		for fcontext in contexts:
			if fcontext[2] == context:
				fcontext[4].append(scene)
	scenes.append(scene)
	maxid += 1

func new_character(el_name: String, gender: String, color1: Color, color2: Color, color3: Color, desc = ""):
	var id = maxid + 1
	var char = ["char", id, el_name, gender, color1, color2, color3, desc]
	characters.append(char)
	maxid += 1

func delete_obj_by_id(id):
	for el in contexts:
		if el[1] == id: contexts.remove(el)
	for el in scenes:
		if el[1] == id: contexts.remove(el)
	for el in characters:
		if el[1] == id: contexts.remove(el)

############# PRJ

func find_prjs():
	var files = []
	var dir = DirAccess.open("res://projects/")
	if dir:
		dir.list_dir_begin()
		var file_name = dir.get_next()
		while file_name != "":
			if !dir.current_is_dir() and file_name.get_extension() == "json":
				files.append(String(dir.get_current_dir() + "/" + file_name.get_file()))
			file_name = dir.get_next()
		dir.list_dir_end()
	for fm in files:
		var file = FileAccess.open(fm, FileAccess.READ)
		var content = file.get_as_text()
		print(content)
		file.close()
		var json = JSON.new()
		if json.parse(content) == OK:
			projects.append(json.data)

func import_prj(prj):
	current_project = prj
	sort_elements()

func sort_elements():
	for el in current_project.content:
		if el[0] == "char":
			characters.append(el)
			maxid += 1
		elif el[0] == "context":
			contexts.append(el)
			maxid += 1
		elif el[0] == "scene":
			scenes.append(el)
			maxid += 1
	if contexts.lenth() > 0: 
		for context in contexts:
			for el in context.content:
				if el[0] == "scene":
					context.content.remove(el)
					scenes.append(el)
	current_project.content = []

func new_prj(to_name,):
	current_project.prj_name = to_name
	current_project.content = [
		["context", 1, "main context", "main", []]
	]
	sort_elements()

func json_save():
	var toreturn = current_project
	#contentify
	for context in contexts:
		toreturn.content.append(context)
	for scene in scenes:
		if scene[1] == "no":
			toreturn.content.append(scene)
		else:
			for context in toreturn.content:
				if context[2] == scene.is_contexted:
					context[4].append(scene)
	
	var jsoned = JSON.stringify(toreturn)
	var filename = "res://projects/" + current_project.name + ".json"
	var file = FileAccess.open(filename, FileAccess.WRITE)
	if file:
		file.store_string(jsoned)
		file.close()
	else:
		print("Err: saving")
