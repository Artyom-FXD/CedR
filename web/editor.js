// editor.js - Визуальные взаимодействия и управление интерфейсом
class EditorUI {
    constructor() {
        this.init();
    }

    init() {
        this.initSettingsModal();
        this.initSettingsTabs();
        this.initHierarchy();
        this.initResizeHandles();
        this.initModeSwitcher();
        this.initKeyboardShortcuts();
        this.updateStatistics();
        
        console.log('Editor UI initialized');
    }

    // 1. Управление модальным окном настроек
    initSettingsModal() {
        const openBtn = document.getElementById('openSettingsBtn');
        const modal = document.getElementById('settings-modal');
        const cancelBtn = document.querySelector('.settings-cancel-btn');
        
        if (openBtn && modal) {
            openBtn.addEventListener('click', () => modal.classList.add('active'));
            
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => modal.classList.remove('active'));
            }
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('active');
            });
        }
    }

    // 2. Переключение вкладок настроек
    initSettingsTabs() {
        const tabs = document.querySelectorAll('.settings-tab');
        const contents = document.querySelectorAll('.settings-tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                
                // Обновляем активные элементы
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                const targetContent = document.getElementById(tabId);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }

    // 3. Управление иерархией проекта
    initHierarchy() {
        // Сворачивание/разворачивание контекстов
        const collapseToggles = document.querySelectorAll('.collapse-toggle');
        
        collapseToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const contextId = toggle.getAttribute('data-context');
                const children = document.getElementById(contextId);
                const contextItem = toggle.closest('.context-item');
                
                if (children) {
                    children.classList.toggle('collapsed');
                    toggle.classList.toggle('collapsed');
                    contextItem.classList.toggle('collapsed');
                    
                    // Анимируем иконку
                    const icon = toggle.querySelector('.toggle-icon');
                    if (icon) {
                        icon.style.transform = children.classList.contains('collapsed') 
                            ? 'rotate(-90deg)' 
                            : 'rotate(0deg)';
                    }
                }
            });
        });
        
        // Выбор элементов иерархии
        const hierarchyItems = document.querySelectorAll('.hierarchy-item');
        hierarchyItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Не срабатывает при клике на кнопку сворачивания
                if (e.target.closest('.collapse-toggle')) return;
                
                hierarchyItems.forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                
                // Загружаем контент элемента
                this.loadElementContent(item);
            });
        });

        // Кнопки создания элементов
        this.initCreationButtons();
    }

    // Кнопки создания новых элементов
    initCreationButtons() {
        const createButtons = {
            'createCharacter': 'character',
            'createContext': 'context', 
            'createScene': 'scene'
        };

        Object.keys(createButtons).forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => {
                    this.createNewElement(createButtons[btnId]);
                });
            }
        });
    }

    // 4. Система перетаскивания и ресайза
    initResizeHandles() {
        const resizeHandles = document.querySelectorAll('.resize-handle');
        
        resizeHandles.forEach(handle => {
            handle.addEventListener('mousedown', this.startResize.bind(this));
        });
    }

    startResize(e) {
        e.preventDefault();
        const panel = e.target.closest('.panel');
        const isLeftPanel = panel.classList.contains('left-panel');
        const startX = e.clientX;
        const startWidth = parseInt(getComputedStyle(panel).width);
        
        function resize(moveEvent) {
            const deltaX = moveEvent.clientX - startX;
            let newWidth = startWidth + (isLeftPanel ? deltaX : -deltaX);
            
            // Ограничения по размерам
            newWidth = Math.max(200, Math.min(500, newWidth));
            panel.style.width = `${newWidth}px`;
            
            // Обновляем layout
            document.dispatchEvent(new CustomEvent('layoutChanged'));
        }
        
        function stopResize() {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
            document.body.style.cursor = '';
        }
        
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
        document.body.style.cursor = 'col-resize';
    }

    // 5. Переключение режимов редактор/суфлёр
    initModeSwitcher() {
        const modeButtons = document.querySelectorAll('.header-button[data-mode]');
        
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.getAttribute('data-mode');
                
                modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.switchMode(mode);
            });
        });
    }

    switchMode(mode) {
        const centerArea = document.querySelector('.center-area');
        const editorContainer = document.querySelector('.editor-container');
        
        if (mode === 'prompter') {
            centerArea.classList.add('prompter-mode');
            this.initPrompterMode();
        } else {
            centerArea.classList.remove('prompter-mode');
            // Возврат к обычному редактору
        }
    }

    initPrompterMode() {
        // Реализация режима суфлёра
        console.log('Prompter mode activated');
        // Здесь будет логика для режима суфлёра
    }

    // 6. Горячие клавиши для навигации
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+S - настройки
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                document.getElementById('settings-modal')?.classList.add('active');
            }
            
            // Escape - закрыть модалки
            if (e.key === 'Escape') {
                document.querySelectorAll('.settings-modal-overlay.active').forEach(modal => {
                    modal.classList.remove('active');
                });
            }
        });
    }

    // 7. Обновление статистики
    updateStatistics() {
        const sceneContent = document.querySelector('.scene-content');
        const elements = sceneContent ? sceneContent.querySelectorAll('.scene-element') : [];
        
        const stats = {
            characters: this.countCharacters(),
            actions: elements.length,
            scenes: document.querySelectorAll('.hierarchy-item.scene').length,
            contexts: document.querySelectorAll('.hierarchy-item.context').length
        };
        
        // Обновляем UI статистики
        document.querySelectorAll('.stat-item').forEach((statItem, index) => {
            const statValue = statItem.querySelector('.stat-value');
            const values = Object.values(stats);
            if (statValue && values[index] !== undefined) {
                statValue.textContent = values[index];
            }
        });
    }

    countCharacters() {
        // Простая реализация подсчета символов
        const sceneContent = document.querySelector('.scene-content');
        if (!sceneContent) return 0;
        
        let totalChars = 0;
        sceneContent.querySelectorAll('.element-content').forEach(element => {
            totalChars += element.textContent.length;
        });
        return totalChars;
    }

    // 8. Загрузка контента элемента
    loadElementContent(element) {
        const elementType = Array.from(element.classList).find(cls => 
            ['character', 'context', 'scene'].includes(cls));
        
        if (!elementType) return;
        
        // Обновляем заголовок
        const titleElement = document.querySelector('.current-element-path');
        if (titleElement) {
            const itemTitle = element.querySelector('.item-title');
            titleElement.textContent = itemTitle ? itemTitle.textContent : 'Неизвестный элемент';
        }
        
        // Загружаем свойства в правую панель
        this.loadElementProperties(element, elementType);
        
        // Для сцен загружаем контент в редактор
        if (elementType === 'scene') {
            this.loadSceneContent(element);
        }
    }

    // 9. Загрузка свойств элемента
    loadElementProperties(element, type) {
        // Здесь будет загрузка свойств из данных элемента
        console.log(`Loading properties for ${type}`, element);
        
        // Временная реализация - можно расширить
        const titleElement = element.querySelector('.item-title');
        if (titleElement) {
            const titleInput = document.querySelector('.property-input[type="text"]');
            if (titleInput) {
                titleInput.value = titleElement.textContent;
            }
        }
    }

    // 10. Загрузка контента сцены
    loadSceneContent(sceneElement) {
        // Здесь будет загрузка контента сцены из данных
        console.log('Loading scene content', sceneElement);
    }

    // 11. Создание нового элемента
    createNewElement(type) {
        const newElement = {
            character: this.createCharacter(),
            context: this.createContext(),
            scene: this.createScene()
        }[type];
        
        if (newElement) {
            // Добавляем в иерархию
            this.addToHierarchy(newElement, type);
            this.updateStatistics();
        }
    }

    createCharacter() {
        return {
            type: 'character',
            name: 'Новый персонаж',
            description: 'Описание персонажа',
            colors: ['#3b82f6', '#60a5fa', '#93c5fd']
        };
    }

    createContext() {
        return {
            type: 'context', 
            title: 'Новый контекст',
            description: 'Описание контекста',
            scenes: []
        };
    }

    createScene() {
        return {
            type: 'scene',
            title: 'Новая сцена', 
            description: 'Описание сцены',
            content: []
        };
    }

    addToHierarchy(element, type) {
        // Временная реализация - можно улучшить
        console.log('Adding to hierarchy:', element, type);
    }

    // Вспомогательная функция для debounce
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Инициализация при загрузке документа
document.addEventListener('DOMContentLoaded', function() {
    window.editorUI = new EditorUI();
    
    // Загрузка проекта из URL параметров
    loadProjectFromURL();
});

// Загрузка проекта из URL
async function loadProjectFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectName = urlParams.get('project');
    
    if (projectName) {
        try {
            const response = await fetch(`/api/projects/load?name=${encodeURIComponent(projectName)}`);
            if (response.ok) {
                const projectData = await response.json();
                renderProject(projectData);
            } else {
                console.error('Ошибка загрузки проекта:', response.status);
            }
        } catch (error) {
            console.error('Ошибка загрузки проекта:', error);
        }
    }
}

// Рендер проекта (заглушка - будет расширена)
function renderProject(projectData) {
    console.log('Rendering project:', projectData);
    // Здесь будет логика отображения проекта в интерфейсе
}