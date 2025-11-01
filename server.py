from flask import Flask, send_file, send_from_directory, request, jsonify
import webbrowser
import threading
import time
import os
import json
from pathlib import Path
import sys

class CedRDesktopApp:
    def __init__(self):
        self.app = Flask(__name__)
        self.setup_routes()
        
    def setup_routes(self):
        # Главные страницы
        @self.app.route('/')
        def index():
            return self.serve_file('start.html')
        
        @self.app.route('/editor')
        def editor():
            return self.serve_file('editor.html')
        
        # API endpoints
        @self.app.route('/api/projects', methods=['GET', 'POST'])
        def handle_projects():
            if request.method == 'GET':
                return jsonify({"projects": [
                    {
                        "id": 1,
                        "title": "Пример проекта для бэкенда", 
                        "description": "Тестовый проект",
                        "created_at": "2025-10-31",
                        "scenes": []
                    }
                ]})
            else:
                data = request.json
                return jsonify({
                    "status": "success", 
                    "message": "Проект создан",
                    "project": {
                        "id": 2,
                        "title": data.get('title', 'Новый проект'),
                        "description": data.get('description', '')
                    }
                })
        
        @self.app.route('/api/settings', methods=['GET', 'POST'])
        def handle_settings():
            if request.method == 'GET':
                return jsonify({"theme": "light", "auto_save": True})
            else:
                return jsonify({"status": "success", "message": "Настройки сохранены"})
        
        # Статические файлы
        @self.app.route('/<path:filename>')
        def serve_static(filename):
            return self.serve_file(filename)
        
        @self.app.route('/css/<path:filename>')
        def serve_css(filename):
            return self.serve_file(filename)
        
        @self.app.route('/js/<path:filename>')
        def serve_js(filename):
            return self.serve_file(filename)

    def serve_file(self, filename):
        """Умное обслуживание файлов из папки web"""
        try:
            # Базовые файлы
            if filename in ['start.html', 'editor.html']:
                return send_file(f'web/{filename}')
            
            # CSS файлы
            if filename.endswith('.css'):
                return send_file(f'web/{filename}')
            
            # JS файлы  
            if filename.endswith('.js'):
                return send_file(f'web/{filename}')
            
            # Изображения
            if filename.endswith('.png'):
                return send_file(f'web/{filename}')
            
            # Пробуем найти файл напрямую
            file_path = Path('web') / filename
            if file_path.exists():
                return send_file(str(file_path))
            
            return f"File {filename} not found", 404
            
        except Exception as e:
            print(f"Error serving {filename}: {str(e)}")
            return f"Error serving file", 500

    def run(self):
        """Запуск приложения"""
        def open_browser():
            time.sleep(1.5)
            webbrowser.open('http://localhost:5000')
        
        print("=" * 60)
        print("🚀 CedR Desktop Application")
        print("📍 http://localhost:5000")
        print("🛑 Ctrl+C to stop")
        print("=" * 60)
        
        # Запускаем браузер
        threading.Thread(target=open_browser, daemon=True).start()
        
        # Запускаем сервер
        self.app.run(port=5000, debug=False, host='127.0.0.1')

