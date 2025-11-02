from flask import Flask, send_file, request, jsonify
from flask_cors import CORS
import webbrowser
import threading
import time
import os
import json
from pathlib import Path
from settings_loader import get_settings
from examples import *

app = Flask(__name__)
CORS(app)  # Разрешаем запросы от фронтенда

# Константы
CEDR_VERSION = "2025.12.1"

def ensure_directories():
    """Создаем необходимые папки если их нет"""
    os.makedirs('web', exist_ok=True)
    os.makedirs('projects', exist_ok=True)

def load_settings():
    """Загрузка настроек"""
    try:
        if os.path.exists('settings.json'):
            with open('settings.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            # Настройки по умолчанию
            default_settings = {
                "personalisation": {"theme": "light", "editorFontSize": 16},
                "exportParameters": {"format": "US", "textSpeed": 120},
                "editor": {"autosaves": 5},
                "structure": {"createMainContext": True, "sceneAutonumeration": True}
            }
            with open('settings.json', 'w', encoding='utf-8') as f:
                json.dump(default_settings, f, indent=2, ensure_ascii=False)
            return default_settings
    except Exception as e:
        print(f"Error loading settings: {e}")
        return {}

def save_settings(settings):
    """Сохранение настроек"""
    try:
        with open('settings.json', 'w', encoding='utf-8') as f:
            json.dump(settings, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving settings: {e}")
        return False

def get_crs_files():
    """Получение списка проектов"""
    try:
        if not os.path.exists("projects"):
            os.makedirs("projects", exist_ok=True)
            return []
        
        files = []
        for item in os.listdir("projects"):
            if item.endswith('.crs'):
                # Убираем расширение .crs
                name = item[:-4] if item.endswith('.crs') else item
                files.append(name)
        return files
    except Exception as e:
        print(f"Error getting CRS files: {e}")
        return []

# Маршруты Flask
@app.route('/')
def index():
    return send_file('web/start.html')

@app.route('/editor')
def editor():
    return send_file('web/editor.html')

@app.route('/cosmetic/version', methods=['GET'])
def get_version():
    return jsonify({"version": CEDR_VERSION})


@app.route('/api/settings', methods=['GET', 'POST'])
def handle_settings():
    try:
        if request.method == 'GET':
            settings = load_settings()
            return jsonify(settings)
        else:
            new_settings = request.get_json()
            if save_settings(new_settings):
                return jsonify({"status": "success", "message": "Настройки сохранены"})
            else:
                return jsonify({"error": "Ошибка сохранения"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Проекты

@app.route('/projects/get-projects-list', methods=['GET'])
def get_projects_list():
    try:
        projects = get_crs_files()
        return jsonify(projects)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/projects/create-project', methods=['POST'])
def create_project():
    try:
        data = request.get_json()
        project_name = data.get('name', 'Новый проект')
        description = data.get('description', '')
        
        # Создаем файл проекта
        project_data = {
            "name": project_name,
            "description": description,
            "content": [],
            "settings": []
        }

        if get_settings('none', 'struct', 'context_mode', 'get'):
            project_data.content.append(main_context)
        
        filename = f"projects/{project_name}.crs"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(project_data, f, indent=2, ensure_ascii=False)
        
        return jsonify({
            "status": "success", 
            "message": "Проект создан",
            "project": project_data
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Статические файлы
@app.route('/<path:filename>')
def serve_static(filename):
    try:
        # Пробуем найти файл в папке web
        file_path = Path('web') / filename
        if file_path.exists():
            return send_file(str(file_path))
        
        # Если файл не найден
        return f"File {filename} not found", 404
    except Exception as e:
        return f"Error: {str(e)}", 500

@app.route('/css/<path:filename>')
def serve_css(filename):
    return serve_static(filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    return serve_static(filename)

@app.route('/images/<path:filename>')
def serve_images(filename):
    return serve_static(filename)

def open_browser():
    """Открываем браузер после запуска сервера"""
    time.sleep(2)
    webbrowser.open('http://localhost:5000')

def run_server():
    """Запуск сервера"""
    ensure_directories()
    
    print("=" * 60)
    print("🚀 CedR Desktop Application")
    print("📍 http://localhost:5000")
    print("🛑 Ctrl+C to stop")
    print("=" * 60)
    
    # Запускаем браузер в отдельном потоке
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Запускаем сервер
    app.run(port=5000, debug=True, host='127.0.0.1')

if __name__ == '__main__':
    try:
        # Проверяем существование папки web
        if not Path('web').exists():
            print("❌ ERROR: Folder 'web' not found!")
            print("Please make sure you have 'web' folder with all HTML/CSS/JS files")
            input("Press Enter to exit...")
            exit(1)
        
        # Проверяем основные файлы
        required_files = ['start.html', 'editor.html', 'start.css', 'editor.css']
        missing_files = []
        
        for file in required_files:
            if not (Path('web') / file).exists():
                missing_files.append(file)
        
        if missing_files:
            print("❌ Missing required files:")
            for file in missing_files:
                print(f"   - {file}")
            print("\nPlease check your 'web' folder")
            input("Press Enter to exit...")
            exit(1)
        
        print("✅ All files found, starting application...")
        run_server()
        
    except KeyboardInterrupt:
        print("\n👋 Application stopped by user")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        input("Press Enter to exit...")