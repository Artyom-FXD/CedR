const version = 'build 2025.10.31'

// Открытие/закрытие модальных окон
const newProjectBtn = document.getElementById('new-project-btn');
const settingsBtn = document.getElementById('settings-btn');
const aboutBtn = document.getElementById('about-btn');
const modalOverlay = document.getElementById('modal-overlay');
const settingsOverlay = document.getElementById('settings-overlay');
const aboutOverlay = document.getElementById('about-overlay');
const createBtn = document.querySelector('.create-btn');
const aboutCloseBtn = document.querySelector('.about-close-btn');

const applySettx = document.getElementById('applySettx');

newProjectBtn.addEventListener('click', () => {
    modalOverlay.style.display = 'flex';
});

settingsBtn.addEventListener('click', () => {
    settingsOverlay.style.display = 'flex';
});

aboutBtn.addEventListener('click', () => {
    aboutOverlay.style.display = 'flex';
});

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        modalOverlay.style.display = 'none';
    }
});

settingsOverlay.addEventListener('click', (e) => {
    if (e.target === settingsOverlay) {
        settingsOverlay.style.display = 'none';
    }
});
applySettx.addEventListener('click', (e) => {
    if (e.target === applySettx) {
        settingsOverlay.style.display = 'none';
        settings.saveAll
    }
});

aboutOverlay.addEventListener('click', (e) => {
    if (e.target === aboutOverlay) {
        aboutOverlay.style.display = 'none';
    }
});

createBtn.addEventListener('click', () => {
    modalOverlay.style.display = 'none';
});

aboutCloseBtn.addEventListener('click', () => {
    aboutOverlay.style.display = 'none';
});

// Анимация фона при наведении на левую часть
const leftSpace = document.querySelector('.left-space');
const backgroundAnimation = document.querySelector('.background-animation');

leftSpace.addEventListener('mouseenter', () => {
    backgroundAnimation.classList.add('active');
});

leftSpace.addEventListener('mouseleave', () => {
    backgroundAnimation.classList.remove('active');
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

// Обновление значения range
const rangeInput = document.querySelector('.setting-range');
const rangeValue = document.querySelector('.range-value');

if (rangeInput && rangeValue) {
    rangeInput.addEventListener('input', () => {
        rangeValue.textContent = `${rangeInput.value}px`;
    });
}



// ---------------Соединение с бэком--------------------
async function getVersion() {
    try {
        let resp = await fetch('/cosmetic/version');
        let data = await resp.json();
        return data.version;
    } catch (error) {
        console.error('Error getting version:', error);
        return 'build 2025.10.31';
    }
}

//Настройки
// Смена темы
const themeSelector = document.getElementById('theme-selector');

// Загрузка
// Загрузка настроек с сервера
// Менеджер настроек
// Быстрый менеджер настроек
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

// Проекты
async function getProjects() {
    try {
        // Используем новый эндпоинт для получения проектов с датами
        let resp = await fetch('/api/projects/get-projects-detailed');
        if (!resp.ok) {
            throw new Error(`HTTP error! status: ${resp.status}`);
        }
        let projectsData = await resp.json();

        const projectList = document.getElementById('projectList');
        projectList.innerHTML = ''; // Очищаем список

        if (!projectsData || projectsData.length === 0) {
            projectList.innerHTML = '<li class="project"><h2 class="prj-title">Нет проектов</h2></li>';
            return;
        }

        projectsData.forEach((project) => {
            const projectElement = document.createElement('li');
            projectElement.classList.add('project');
            projectElement.setAttribute('name', project.name);

            // Основная информация о проекте
            const projectInfo = document.createElement('div');
            projectInfo.classList.add('project-info');
            
            const title = document.createElement('h2');
            title.textContent = project.name;
            title.classList.add('prj-title');
            projectInfo.appendChild(title);

            const dateInfo = document.createElement('div');
            dateInfo.classList.add('prj-date');
            dateInfo.textContent = `Изменен: ${project.last_modified}`;
            
            projectInfo.appendChild(dateInfo);
            projectElement.appendChild(projectInfo);

            // Кнопки действий
            const actions = document.createElement('div');
            actions.classList.add('prj-actions');

            const editBtn = document.createElement('button');
            editBtn.classList.add('prj-action');
            editBtn.textContent = 'редактировать';
            editBtn.onclick = () => window.location.href = '/editor?project=' + encodeURIComponent(project.name);
            actions.appendChild(editBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('prj-action');
            deleteBtn.textContent = 'удалить';
            deleteBtn.onclick = () => deleteProject(project.name);
            actions.appendChild(deleteBtn);

            projectElement.appendChild(actions);
            projectList.appendChild(projectElement);
        });
    } catch (error) {
        console.error('Error loading projects:', error);
        const projectList = document.getElementById('projectList');
        projectList.innerHTML = '<li class="project"><h2 class="prj-title">Ошибка загрузки проектов</h2></li>';
    }
}

// Создание проекта

async function createNewProject(projectData) {
    try {
        const response = await fetch('/api/projects/create-project', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(projectData)
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || `Ошибка HTTP: ${response.status}`);
        }

        console.log('Проект создан:', result);
        return result;

    } catch (error) {
        console.error('Ошибка создания проекта:', error);
        throw error;
    }
}


function initProjectCreation() {
    const createBtn = document.querySelector('.create-btn');
    const projectNameInput = document.getElementById('prj-name');
    const projectDescInput = document.getElementById('description');
    const modalOverlay = document.getElementById('modal-overlay');

    if (!createBtn) return;

    createBtn.addEventListener('click', async function() {
        const name = projectNameInput.value.trim();
        const description = projectDescInput.value.trim();

        if (!name) {
            alert('Введите название проекта');
            return;
        }

        try {
            // Показываем загрузку
            createBtn.textContent = 'Создание...';
            createBtn.disabled = true;

            // Создаем проект
            const result = await createNewProject({
                name: name,
                description: description
            });

            // Успех
            console.log('Проект создан:', result);
            
            // Закрываем модалку
            modalOverlay.style.display = 'none';
            
            // Очищаем поля
            projectNameInput.value = '';
            projectDescInput.value = '';
            
            // Обновляем список проектов
            await getProjects();
            
            // Показываем уведомление
            showNotification('Проект успешно создан!', 'success');

        } catch (error) {
            console.error('Ошибка создания проекта:', error);
            alert('Ошибка создания проекта: ' + error.message);
        } finally {
            // Восстанавливаем кнопку
            createBtn.textContent = 'создать';
            createBtn.disabled = false;
        }
    });
}

// Удаление проекта
async function deleteProject(projectName) {
    // Подтверждение удаления
    if (!confirm(`Вы уверены, что хотите удалить проект "${projectName}"?`)) {
        return;
    }

    try {
        // Показываем загрузку
        const deleteBtns = document.querySelectorAll('.prj-action');
        deleteBtns.forEach(btn => btn.disabled = true);

        const response = await fetch('/api/projects/delete-project', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: projectName })
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || `Ошибка HTTP: ${response.status}`);
        }

        console.log('Проект удален:', result);
        showNotification('Проект успешно удален!', 'success');
        
        // Обновляем список проектов
        await getProjects();

    } catch (error) {
        console.error('Ошибка удаления проекта:', error);
        showNotification('Ошибка удаления проекта: ' + error.message, 'error');
    } finally {
        // Восстанавливаем кнопки
        const deleteBtns = document.querySelectorAll('.prj-action');
        deleteBtns.forEach(btn => btn.disabled = false);
    }
}

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

// Добавьте эти стили в CSS для анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initProjectCreation();
});

async function main() {
    // Версия
    const versionElement = document.getElementById('version');
    versionElement.textContent = await getVersion();

    // Проекты
    await getProjects();

    // Обработчик создания проекта
    const createBtn = document.querySelector('.create-btn');
    const projectNameInput = document.getElementById('prj-name');
    const projectDescInput = document.getElementById('description');

    createBtn.addEventListener('click', async () => {
        const name = projectNameInput.value.trim();
        const description = projectDescInput.value.trim();

        if (!name) {
            alert('Введите название проекта');
            return;
        }

        const success = await createProject(name, description);
        if (success) {
            modalOverlay.style.display = 'none';
            projectNameInput.value = '';
            projectDescInput.value = '';
        }
    });
}

// Запускаем когда страница загрузится
document.addEventListener('DOMContentLoaded', main);