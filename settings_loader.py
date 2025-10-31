import json

def load_settings():
    with open('settings.json', 'r') as sttx_cfg:
        sttx = json.load(sttx_cfg)
        return sttx
    
def save_settings(sttx):
    with open('settings.json', 'w', encoding='utf-8') as file:
        json.dump(sttx)

def get_settings(argument, folder = 'pers/export/editor/struct', element = 'theme as example', action = 'get or set', ):
    sttx = load_settings()
    if folder == 'pers':
        if action == 'get':
            return get_personalisation()
        elif action == 'set':
            get_personalisation()
    elif folder == 'export':
        if action == 'get':
            return get_export_parameters()
        elif action == 'set':
            get_export_parameters()
    elif folder == 'editor':
        if action == 'get':
            return get_editor()
        elif action == 'set':
            get_editor()
    elif folder == 'struct':
        if action == 'get':
            return get_structure()
        elif action == 'set':
            get_structure()

    def get_personalisation():
        if element == 'theme' and action == 'set':
            set_theme(argument)
        elif element == 'theme' and action == 'get':
            return get_theme()
        elif element == 'font-size' and action == 'set':
            set_editor_font_size(argument)
        elif element == 'font-size' and action == 'get':
            return get_editor_font_size()

        def set_theme(theme: str):
            sttx.personalisation.theme = theme
            save_settings(sttx=sttx)
        def get_theme():
            return sttx.personalisation.theme
        def set_editor_font_size(size: int):
            sttx.personalisation.editorFontSize = size
            save_settings(sttx=sttx)
        def get_editor_font_size():
            return sttx.personalisation.editorFontSize
    
    def get_export_parameters():
        if element == 'format' and action == 'set':
            set_format(argument)
        elif element == 'format' and action == 'get':
            return get_format()
        elif element == 'text_speed' and action == 'set':
            set_text_speed(argument)
        elif element == 'text_speed' and action == 'get':
            return get_text_speed()

        def set_format(format: str):
            sttx.exportParameters.format = format
            save_settings(sttx=sttx)
        def get_format():
            return sttx.exportParameters.format
        def set_text_speed(speed: int):
            sttx.exportParameters.textSpeed = speed
            save_settings(sttx=sttx)
        def get_text_speed():
            return sttx.exportParameters.textSpeed
        
    def get_editor():
        if element == 'autosaves' and action == 'set':
            set_autosaves(argument)
        elif element == 'autosaves' and action == 'get':
            return get_autosaves()

        def set_autosaves(time: int):
            sttx.editor.autosaves = time
            save_settings(sttx=sttx)
        def get_autosaves():
            return sttx.editor.autosaves
    
    def get_structure():
        if element == 'context_mode' and action == 'set':
            toggle_main_context(argument)
        elif element == 'context_mode' and action == 'get':
            return get_main_context_mode()
        elif element == 'autonum' and action == 'set':
            toggle_scenes_autonum(argument)
        elif element == 'autonum' and action == 'get':
            return get_scenes_autonum_mode()

        def toggle_main_context(to: bool):
            sttx.structure.createMainContext = to
            save_settings(sttx=sttx)
        def get_main_context_mode():
            return sttx.structure.createMainContext
        def toggle_scenes_autonum(to: bool):
            sttx.structure.sceneAutonumeration = to
            save_settings(sttx=sttx)
        def get_scenes_autonum_mode():
            return sttx.structure.sceneAutonumeration
    

if __name__ == "__main__":
    pass