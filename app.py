from flask import Flask, send_file, send_from_directory, request, jsonify
import webbrowser
import threading
import time
import os
import json
from pathlib import Path
import sys
from server import CedRDesktopApp

def main():
    try:
        # Проверяем существование папки web
        if not Path('web').exists():
            print("❌ ERROR: Folder 'web' not found!")
            print("Please make sure you have 'web' folder with all HTML/CSS/JS files")
            input("Press Enter to exit...")
            return
        
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
            return
        
        print("✅ All files found, starting application...")
        
        # Запускаем приложение
        app = CedRDesktopApp()
        app.run()
        
    except KeyboardInterrupt:
        print("\n👋 Application stopped by user")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        input("Press Enter to exit...")

if __name__ == '__main__':
    main()