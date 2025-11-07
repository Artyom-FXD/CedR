// editor.js - Визуальные взаимодействия и управление интерфейсом
class EditorUI {
    constructor() {
        this.init();
    }

    init() {
        this.initSettingsTabs();
        this.initHierarchy();
        this.initResizeHandles();
        this.initKeyboardShortcuts();
        this.updateStatistics();
        
        console.log('Editor UI initialized');
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
const openSettingsBtn = document.getElementById('openSettingsBtn')
const settingsOverlay = document.getElementById('settings-overlay')
openSettingsBtn.addEventListener('click', () => {
    settingsOverlay.style.display = 'flex';
});
settingsOverlay.addEventListener('click', (e) => {
    if (e.target === settingsOverlay) {
        settingsOverlay.style.display = 'none';
    }
});
// Переключение вкладок настроек
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Убираем активный класс у всех кнопок и контента
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // Добавляем активный класс текущей кнопке
        btn.classList.add('active');

        // Показываем соответствующий контент
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
});
class QuickSettings {
    constructor() {
        this.settings = {};
        this.saveTimeout = null;
    }

    // Загрузка всех настроек
    async loadAll() {
        try {
            const resp = await fetch('/api/settings');
            this.settings = await resp.json();
            this.applyToUI();
            console.log('Настройки загружены');
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            this.settings = this.getDefaultSettings();
        }
    }

    // Быстрое сохранение всех настроек
    async saveAll() {
        try {
            this.collectFromUI();
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.settings)
            });
            console.log('Настройки сохранены');
            this.showNotice('Настройки сохранены');
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            this.showNotice('Ошибка сохранения', 'error');
        }
    }

    // Получить значение настройки
    get(key) {
        const keys = key.split('.');
        let value = this.settings;
        for (const k of keys) {
            value = value?.[k];
        }
        return value;
    }

    // Установить значение настройки
    set(key, value) {
        const keys = key.split('.');
        let obj = this.settings;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) obj[keys[i]] = {};
            obj = obj[keys[i]];
        }

        obj[keys[keys.length - 1]] = value;
        this.applyToUI();
        this.debouncedSave();
    }

    // Применить настройки к UI
    applyToUI() {
        // Тема
        const theme = this.get('personalisation.theme') || 'light';
        document.body.className = theme + '-theme';
        this.setValue('#theme-selector', theme);

        // Размер шрифта
        this.setValue('#editor-font-size', this.get('personalisation.editorFontSize') || 16);
        this.updateText('.range-value', this.get('personalisation.editorFontSize') + 'px');

        // Формат экспорта
        this.setRadio('input[name="format"]', this.get('exportParameters.format') || 'american');

        // Скорость текста
        this.setValue('#text-speed', this.get('exportParameters.textSpeed') || 120);

        // Автосохранение
        this.setValue('#auto-save-interval', this.get('editor.autosaves') || 5);

        // Структура
        this.setChecked('#create-main-context', this.get('structure.createMainContext') !== false);
        this.setChecked('#scene-autonumeration', this.get('structure.sceneAutonumeration') !== false);
    }

    // Собрать настройки с UI
    collectFromUI() {
        this.settings = {
            personalisation: {
                theme: this.getValue('#theme-selector') || 'light',
                editorFontSize: parseInt(this.getValue('#editor-font-size')) || 16
            },
            exportParameters: {
                format: this.getRadioValue('input[name="format"]') || 'american',
                textSpeed: parseInt(this.getValue('#text-speed')) || 120
            },
            editor: {
                autosaves: parseInt(this.getValue('#auto-save-interval')) || 5
            },
            structure: {
                createMainContext: this.getChecked('#create-main-context'),
                sceneAutonumeration: this.getChecked('#scene-autonumeration')
            }
        };
    }

    // Настройки по умолчанию
    getDefaultSettings() {
        return {
            personalisation: { theme: 'light', editorFontSize: 16 },
            exportParameters: { format: 'american', textSpeed: 120 },
            editor: { autosaves: 5 },
            structure: { createMainContext: true, sceneAutonumeration: true }
        };
    }

    // Вспомогательные методы для работы с DOM
    setValue(selector, value) {
        const el = document.querySelector(selector);
        if (el) el.value = value;
    }

    getValue(selector) {
        const el = document.querySelector(selector);
        return el ? el.value : null;
    }

    setChecked(selector, checked) {
        const el = document.querySelector(selector);
        if (el) el.checked = checked;
    }

    getChecked(selector) {
        const el = document.querySelector(selector);
        return el ? el.checked : false;
    }

    setRadio(name, value) {
        const radios = document.querySelectorAll(name);
        radios.forEach(radio => {
            radio.checked = (radio.value === value);
        });
    }

    getRadioValue(name) {
        const radio = document.querySelector(`${name}:checked`);
        return radio ? radio.value : null;
    }

    updateText(selector, text) {
        const el = document.querySelector(selector);
        if (el) el.textContent = text;
    }

    // Отложенное сохранение
    debouncedSave() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => this.saveAll(), 500);
    }

    // Уведомление
    showNotice(message, type = 'success') {
        const notice = document.createElement('div');
        notice.textContent = message;
        notice.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 10px 15px;
            background: ${type === 'error' ? '#ef4444' : '#10b981'};
            color: white; border-radius: 5px; z-index: 10000;
        `;
        document.body.appendChild(notice);
        setTimeout(() => notice.remove(), 2000);
    }
}

// Создаем глобальный экземпляр
window.settings = new QuickSettings();
// Автоматическая инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем настройки
    window.settings.loadAll();

    // Вешаем обработчики на все элементы настроек
    const settingElements = [
        '#theme-selector',
        '#editor-font-size',
        '#text-speed',
        '#auto-save-interval',
        '#create-main-context',
        '#scene-autonumeration',
        'input[name="format"]'
    ];

    settingElements.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            el.addEventListener('change', () => window.settings.saveAll());
        });
    });

    // Особый обработчик для ползунка размера шрифта
    const fontSizeSlider = document.querySelector('#editor-font-size');
    const rangeValue = document.querySelector('.range-value');

    if (fontSizeSlider && rangeValue) {
        fontSizeSlider.addEventListener('input', () => {
            rangeValue.textContent = fontSizeSlider.value + 'px';
            window.settings.saveAll();
        });
    }

    // Обработчики для кнопок в модалке настроек
    const saveBtn = document.querySelector('.settings-save-btn');
    const cancelBtn = document.querySelector('.settings-cancel-btn');

    if (saveBtn) {
        saveBtn.addEventListener('click', () => window.settings.saveAll());
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => window.settings.loadAll());
    }
});

themeSelector.addEventListener('change', async () => {
    const selectedTheme = themeSelector.value;
    document.body.className = selectedTheme + '-theme';

    await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: theme })
    });
});
// Функция уведомления
function showNotification(message, type = 'success') {
    // Удаляем существующие уведомления
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 8px;
        z-index: 10000;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}