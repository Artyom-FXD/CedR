extends TextureRect
@export var project: Dictionary
@export var label = $Label.text
@export var filename = ""

@onready var core = get_node("/root/Core")

func _on_edit_pressed() -> void:
	core.load_project.emit(project)

func _on_delete_pressed() -> void:
	var file = DirAccess.open("res://projects/")
	file.remove(filename)
	queue_free()
