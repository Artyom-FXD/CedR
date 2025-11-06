from flask import Flask, send_file, request, jsonify
from flask_cors import CORS
import webbrowser
import threading
import time
import os
import json
from pathlib import Path
from datetime import datetime
from project_manager import ProjectManager

app = Flask(__name__)
CORS(app)

# Константы
CEDR_VERSION = "версия: 2025.12.1"

project = ProjectManager()

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
                "exportParameters": {"format": "american", "textSpeed": 120},
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
    """Получение списка проектов с информацией о дате изменения"""
    try:
        if not os.path.exists("projects"):
            os.makedirs("projects", exist_ok=True)
            return []
        
        files = []
        for item in os.listdir("projects"):
            if item.endswith('.crs'):
                file_path = os.path.join("projects", item)
                if not os.path.exists(file_path):
                    continue
                
                # Убираем расширение .crs
                name = item[:-4] if item.endswith('.crs') else item
                
                # Получаем время последнего изменения файла
                mtime = os.path.getmtime(file_path)
                
                # Также пытаемся получить дату создания из метаданных файла
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        project_data = json.load(f)
                    created_at = project_data.get('created_at', '')
                    updated_at = project_data.get('updated_at', '')
                except:
                    created_at = ''
                    updated_at = ''
                
                files.append({
                    'name': name,
                    'mtime': mtime,
                    'created_at': created_at,
                    'updated_at': updated_at,
                    'file_path': file_path
                })
        
        # Сортируем по дате изменения (новые сверху)
        files.sort(key=lambda x: x['mtime'], reverse=True)
        return files
        
    except Exception as e:
        print(f"Error getting CRS files: {e}")
        return []

def create_empty_project_data(project_name, description=""):
    """Создание структуры пустого проекта для новой иерархии"""
    current_time = datetime.now().isoformat()
    
    return {
        "name": project_name,
        "description": description,
        "created_at": current_time,
        "updated_at": current_time,
        "content": [
            {
                "type": "character",
                "id": f"character-{int(time.time())}-1",
                "name": "Новый персонаж",
                "description": "Описание персонажа",
                "colors": ["#3b82f6", "#60a5fa", "#93c5fd"],
                "gender": "unknown"
            }
        ],
        "settings": {}
    }

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
        projects_data = get_crs_files()
        # Возвращаем только имена проектов для совместимости с фронтендом
        project_names = [project['name'] for project in projects_data]
        return jsonify(project_names)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/projects/get-projects-detailed', methods=['GET'])
def get_projects_detailed():
    """Получение списка проектов с подробной информацией включая даты"""
    try:
        projects_data = get_crs_files()
        
        # Форматируем даты для удобного отображения
        formatted_projects = []
        for project in projects_data:
            # Преобразуем timestamp в читаемую дату
            mtime_dt = datetime.fromtimestamp(project['mtime'])
            formatted_date = mtime_dt.strftime("%d.%m.%Y %H:%M")
            
            formatted_projects.append({
                'name': project['name'],
                'last_modified': formatted_date,
                'created_at': project.get('created_at', ''),
                'updated_at': project.get('updated_at', ''),
                'timestamp': project['mtime']
            })
        
        return jsonify(formatted_projects)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/projects/create-project', methods=['POST'])
def create_project():
    try:
        data = request.get_json()
        project_name = data.get('name', 'Новый проект').strip()
        description = data.get('description', '').strip()
        
        if not project_name:
            return jsonify({"error": "Название проекта не может быть пустым"}), 400
        
        # Проверяем, не существует ли уже проект с таким именем
        existing_projects = [p['name'] for p in get_crs_files()]
        if project_name in existing_projects:
            return jsonify({"error": "Проект с таким именем уже существует"}), 400
        
        # Создаем структуру проекта для новой иерархии
        project_data = create_empty_project_data(project_name, description)
        
        # Создаем папку projects если её нет
        os.makedirs('projects', exist_ok=True)
        
        filename = f"projects/{project_name}.crs"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(project_data, f, indent=2, ensure_ascii=False)
        
        print(f"Проект создан: {filename}")
        
        return jsonify({
            "status": "success", 
            "message": "Проект создан",
            "project": project_name
        })
        
    except Exception as e:
        print(f"Ошибка при создании проекта: {str(e)}")
        return jsonify({"error": f"Внутренняя ошибка сервера: {str(e)}"}), 500

@app.route('/api/projects/delete-project', methods=['POST'])
def delete_project():
    try:
        data = request.get_json()
        project_name = data.get('name', '').strip()
        
        if not project_name:
            return jsonify({"error": "Название проекта не может быть пустым"}), 400
        
        # Проверяем, существует ли проект
        filename = f"projects/{project_name}.crs"
        if not os.path.exists(filename):
            return jsonify({"error": "Проект не найден"}), 404
        
        # Удаляем файл проекта
        os.remove(filename)
        
        print(f"Проект удален: {filename}")
        
        return jsonify({
            "status": "success", 
            "message": "Проект удален"
        })
        
    except Exception as e:
        print(f"Ошибка при удалении проекта: {str(e)}")
        return jsonify({"error": f"Внутренняя ошибка сервера: {str(e)}"}), 500

@app.route('/api/projects/update-project-timestamp', methods=['POST'])
def update_project_timestamp():
    try:
        data = request.get_json()
        project_name = data.get('name', '').strip()
        
        if not project_name:
            return jsonify({"error": "Название проекта не может быть пустым"}), 400
        
        filename = f"projects/{project_name}.crs"
        if not os.path.exists(filename):
            return jsonify({"error": "Проект не найден"}), 404
        
        # Загружаем текущие данные проекта
        with open(filename, 'r', encoding='utf-8') as f:
            project_data = json.load(f)
        
        # Обновляем время модификации
        project_data['updated_at'] = datetime.now().isoformat()
        
        # Сохраняем обратно
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(project_data, f, indent=2, ensure_ascii=False)
        
        # Также обновляем время файла системы
        os.utime(filename, None)
        
        return jsonify({
            "status": "success", 
            "message": "Время обновлено"
        })
        
    except Exception as e:
        print(f"Ошибка при обновлении времени проекта: {str(e)}")
        return jsonify({"error": f"Внутренняя ошибка сервера: {str(e)}"}), 500

# EDITOR ----------------------------------------------------------------------
@app.route('/api/projects/load')
def load_project():
    try:
        project_name = request.args.get('name')
        if not project_name:
            return jsonify({"error": "Имя проекта не указано"}), 400
        
        filename = f"projects/{project_name}.crs"
        if not os.path.exists(filename):
            return jsonify({"error": "Проект не найден"}), 404
        
        with open(filename, 'r', encoding='utf-8') as f:
            project_data = json.load(f)
        
        # Обновляем структуру старых проектов до новой версии
        project_data = update_project_structure(project_data)
        
        return jsonify(project_data)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/projects/save', methods=['POST'])
def save_project():
    try:
        data = request.get_json()
        project_name = data.get('name')
        project_data = data.get('data')
        
        if not project_name or not project_data:
            return jsonify({"error": "Неверные данные"}), 400
        
        # Загружаем существующий проект
        filename = f"projects/{project_name}.crs"
        if os.path.exists(filename):
            with open(filename, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
        else:
            existing_data = create_empty_project_data(project_name, "")
        
        # Обновляем данные сцены
        existing_data.update(project_data)
        existing_data['updated_at'] = datetime.now().isoformat()
        
        # Сохраняем обратно
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, indent=2, ensure_ascii=False)
        
        return jsonify({"status": "success", "message": "Проект сохранен"})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/projects/open', methods=['POST'])
def open_project():
    try:
        data = request.get_json()
        project_name = data.get('name')
        
        # Проверяем существование проекта
        filename = f"projects/{project_name}.crs"
        if not os.path.exists(filename):
            return jsonify({"error": "Проект не найден"}), 404
            
        # Обновляем время последнего открытия
        return jsonify({
            "status": "success", 
            "redirect": f"/editor?project={project_name}"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def update_project_structure(project_data):
    # Если проект уже в новой структуре, возвращаем как есть
    if 'content' in project_data and isinstance(project_data['content'], list):
        return project_data
    
    # Миграция старых проектов
    updated_data = {
        "name": project_data.get("name", "Без названия"),
        "description": project_data.get("description", ""),
        "created_at": project_data.get("created_at", datetime.now().isoformat()),
        "updated_at": project_data.get("updated_at", datetime.now().isoformat()),
        "content": [],
        "settings": project_data.get("settings", {})
    }
    
    # Переносим существующие данные в новую структуру
    if 'scenes' in project_data:
        for scene in project_data.get('scenes', []):
            updated_data['content'].append({
                "type": "scene",
                "id": scene.get('id', f"scene-{int(time.time())}"),
                "name": scene.get('name', 'Новая сцена'),
                "description": scene.get('description', ''),
                "content": scene.get('content', [])
            })
    
    if 'characters' in project_data:
        for character in project_data.get('characters', []):
            updated_data['content'].append({
                "type": "character",
                "id": character.get('id', f"character-{int(time.time())}"),
                "name": character.get('name', 'Новый персонаж'),
                "description": character.get('description', ''),
                "colors": character.get('colors', ['#3b82f6', '#60a5fa', '#93c5fd']),
                "gender": character.get('gender', 'unknown')
            })
    
    # Если ничего не было, добавляем пустую структуру
    if not updated_data['content']:
        updated_data['content'] = [
            {
                "type": "character",
                "id": f"character-{int(time.time())}-1",
                "name": "Новый персонаж",
                "description": "Описание персонажа",
                "colors": ["#3b82f6", "#60a5fa", "#93c5fd"],
                "gender": "unknown"
            }
        ]
    
    return updated_data

# Статические файлы
@app.route('/<path:filename>')
def serve_static(filename):
    try:
        # Пробуем найти файл в папке web
        file_path = Path('web') / filename
        if file_path.exists():
            return send_file(str(file_path))
        
        # Пробуем найти в web/js
        file_path = Path('web') / 'js' / filename
        if file_path.exists():
            return send_file(str(file_path))
            
        # Пробуем найти в web/css  
        file_path = Path('web') / 'css' / filename
        if file_path.exists():
            return send_file(str(file_path))
            
        # Пробуем найти в web/images
        file_path = Path('web') / 'images' / filename
        if file_path.exists():
            return send_file(str(file_path))
            
        # Если файл не найден
        return f"File {filename} not found", 404
    except Exception as e:
        return f"Error: {str(e)}", 500

@app.route('/css/<path:filename>')
def serve_css(filename):
    return serve_static(f"css/{filename}")

@app.route('/js/<path:filename>')
def serve_js(filename):
    return serve_static(f"js/{filename}")

@app.route('/images/<path:filename>')
def serve_images(filename):
    return serve_static(f"images/{filename}")

def open_browser():
    """Открываем браузер после запуска сервера"""
    time.sleep(2)
    webbrowser.open('http://localhost:5000')

def run_server():
    """Запуск сервера"""
    ensure_directories()
    
    print("=" * 60)
    print("🚀 CedR Desktop Application")
    print(f"📍 http://localhost:5000")
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