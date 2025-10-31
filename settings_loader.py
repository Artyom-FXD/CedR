import json

def load_settings():
    with open('settings.json', 'r') as sttx_cfg:
        sttx = json.load(sttx_cfg)
        return sttx

def get_settings():
    sttx = load_settings()
    
    def get_personalisation():

        def set_theme(theme: str):
            sttx.personalisation.theme = theme
        def get_theme():
            return sttx.personalisation.theme
        def set_editor_font_size(size: int):
            sttx.personalisation.editorFontSize = size
        def get_editor_font_size():
            return sttx.personalisation.editorFontSize
    
    def get_export_parameters():
        def set_format(format: str):
            sttx.exportParameters.format = format
        def get_format():
            return sttx.exportParameters.format
        def set_text_speed(speed: int):
            sttx.exportParameters.textSpeed = speed
        def get_text_speed():
            return sttx.exportParameters.textSpeed
        
    def get_editor():
        def set_autosaves(time: int):
            sttx.editor.autosaves = time
        def get_autosaves():
            return sttx.editor.autosaves
    
    def get_structure():
        def toggle_main_context(to: bool):
            sttx.structure.createMainContext = to
        def get_main_context_mode():
            return sttx.structure.createMainContext
        def toggle_scenes_autonum(to: bool):
            sttx.structure.sceneAutonumeration = to
        def get_scenes_autonum_mode():
            return sttx.structure.sceneAutonumeration
    

if __name__ == "__main__":
    load_settings()