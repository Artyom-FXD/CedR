// editor.js - Дополнения для новой иерархии

// В функцию createProjectElement добавляем логику для контекстов
function createProjectElement(type) {
    const hierarchySection = document.querySelector('.hierarchy-section:first-child');
    
    let item, icon, title, number;
    
    switch(type) {
        case 'new-character':
            // Создание персонажа (остаётся как было)
            const characterSection = document.querySelector('.hierarchy-section:last-child');
            item = document.createElement('div');
            item.className = 'hierarchy-item character';
            icon = '|@|';
            title = 'Новый персонаж';
            
            item.innerHTML = `
                <div class="item-icon">${icon}</div>
                <div class="item-content">
                    <div class="item-title">${title}</div>
                </div>
            `;
            
            characterSection.appendChild(item);
            break;
            
        case 'new-context':
            // Создание контекста
            item = document.createElement('div');
            item.className = 'hierarchy-item context context-item';
            icon = '|^|';
            title = 'Новый контекст';
            
            // Получаем номер для нового контекста
            const contexts = document.querySelectorAll('.hierarchy-item.context');
            number = contexts.length + 1;
            const contextId = `context-${Date.now()}`;
            
            item.innerHTML = `
                <button class="collapse-toggle" data-context="${contextId}">
                    <span class="toggle-icon">▼</span>
                </button>
                <div class="item-icon">${icon}</div>
                <div class="item-content">
                    <span class="context-number">${number}</span>
                    <div class="item-title">${title}</div>
                    <div class="item-subtitle">0 сцен • Нажмите для сворачивания</div>
                </div>
            `;
            
            // Создаем контейнер для дочерних сцен
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'context-children';
            childrenContainer.id = contextId;
            
            hierarchySection.appendChild(item);
            hierarchySection.appendChild(childrenContainer);
            
            // Инициализируем обработчик для новой кнопки сворачивания
            initCollapseToggle(item.querySelector('.collapse-toggle'));
            break;
            
        case 'new-scene':
            // Создание сцены
            item = document.createElement('div');
            icon = '|A|';
            title = 'Новая сцена';
            
            // Проверяем, есть ли выбранный контекст
            const selectedContext = document.querySelector('.hierarchy-item.context.selected');
            
            if (selectedContext) {
                // Создаём сцену внутри контекста
                item.className = 'hierarchy-item scene scene-in-context';
                
                // Находим контейнер дочерних элементов контекста
                const contextId = selectedContext.querySelector('.collapse-toggle').getAttribute('data-context');
                const contextChildren = document.getElementById(contextId);
                
                // Автоматически разворачиваем контекст, если он свернут
                if (contextChildren.classList.contains('collapsed')) {
                    contextChildren.classList.remove('collapsed');
                    const toggle = selectedContext.querySelector('.collapse-toggle');
                    toggle.classList.remove('collapsed');
                    toggle.querySelector('.toggle-icon').style.transform = 'rotate(0deg)';
                }
                
                // Получаем номер контекста и номер сцены внутри него
                const contextNumber = selectedContext.querySelector('.context-number').textContent;
                const scenesInContext = contextChildren.querySelectorAll('.scene-in-context');
                const sceneNumber = scenesInContext.length + 1;
                
                item.innerHTML = `
                    <div class="item-icon">${icon}</div>
                    <div class="item-content">
                        <span class="scene-number">${contextNumber}.${sceneNumber}</span>
                        <div class="item-title">${title}</div>
                        <div class="item-subtitle">0 действий</div>
                    </div>
                `;
                
                // Вставляем в контейнер дочерних элементов
                contextChildren.appendChild(item);
                
                // Обновляем счетчик сцен в контексте
                updateContextSceneCount(selectedContext, scenesInContext.length + 1);
            } else {
                // Создаём независимую сцену
                item.className = 'hierarchy-item scene';
                
                // Получаем номер для новой сцены
                const allScenes = document.querySelectorAll('.hierarchy-item.scene:not(.scene-in-context)');
                const independentScenes = Array.from(allScenes).filter(scene => !scene.classList.contains('scene-in-context'));
                number = independentScenes.length + 1;
                
                item.innerHTML = `
                    <div class="item-icon">${icon}</div>
                    <div class="item-content">
                        <span class="scene-number">${number}</span>
                        <div class="item-title">${title}</div>
                        <div class="item-subtitle">0 действий</div>
                    </div>
                `;
                
                hierarchySection.appendChild(item);
            }
            break;
    }
    
    if (item) {
        // Анимация появления
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            item.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
        }, 10);
        
        // Инициализируем обработчики для нового элемента
        initHierarchyItem(item);
        
        // Показываем уведомление
        showNotification(`Создан новый элемент: ${title}`);
        
        // Обновляем статистику
        updateStats();
    }
    
    return item;
}

// Обновляем функцию initHierarchy для работы с новой структурой
function initHierarchy() {
    const hierarchyItems = document.querySelectorAll('.hierarchy-item');
    const panelActions = document.querySelectorAll('.panel-action-btn');
    const collapseToggles = document.querySelectorAll('.collapse-toggle');
    
    // Обработка выбора элементов иерархии
    hierarchyItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Не снимаем выделение с контекста при клике на сцену внутри него
            if (!this.classList.contains('scene-in-context') || e.ctrlKey) {
                // Снимаем выделение со всех элементов
                hierarchyItems.forEach(i => i.classList.remove('selected'));
            }
            
            // Выделяем текущий элемент
            this.classList.add('selected');
            
            // Для контекста - подсвечиваем все сцены внутри
            if (this.classList.contains('context')) {
                const scenesInContext = this.parentElement.querySelectorAll('.scene-in-context');
                scenesInContext.forEach(scene => {
                    scene.style.background = 'rgba(16, 185, 129, 0.1)';
                });
            }
            
            // Обновляем свойства в правой панели
            updateProperties(this);
        });
    });
    
    // Обработка кнопок создания элементов
    panelActions.forEach(button => {
        button.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            createProjectElement(action);
            
            // Анимация нажатия кнопки
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });

    collapseToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.stopPropagation(); // Предотвращаем всплытие, чтобы не срабатывал выбор элемента
            
            const contextId = this.getAttribute('data-context');
            const contextChildren = document.getElementById(contextId);
            const contextItem = this.closest('.context-item');
            
            if (contextChildren) {
                contextChildren.classList.toggle('collapsed');
                this.classList.toggle('collapsed');
                
                // Анимация переворота иконки
                const toggleIcon = this.querySelector('.toggle-icon');
                toggleIcon.style.transform = contextChildren.classList.contains('collapsed') 
                    ? 'rotate(-90deg)' 
                    : 'rotate(0deg)';
                
                // Обновляем подзаголовок
                const subtitle = contextItem.querySelector('.item-subtitle');
                if (contextChildren.classList.contains('collapsed')) {
                    subtitle.textContent = `${getSceneCount(contextChildren)} сцен • Развернуть`;
                } else {
                    subtitle.textContent = `${getSceneCount(contextChildren)} сцен • Нажмите для сворачивания`;
                }
            }
        });
    });
}

function getSceneCount(contextElement) {
    return contextElement.querySelectorAll('.scene-in-context').length;
}

function initCollapseToggle(toggle) {
    toggle.addEventListener('click', function(e) {
        e.stopPropagation();
        
        const contextId = this.getAttribute('data-context');
        const contextChildren = document.getElementById(contextId);
        const contextItem = this.closest('.context-item');
        
        if (contextChildren) {
            contextChildren.classList.toggle('collapsed');
            this.classList.toggle('collapsed');
            
            // Анимация переворота иконки
            const toggleIcon = this.querySelector('.toggle-icon');
            toggleIcon.style.transform = contextChildren.classList.contains('collapsed') 
                ? 'rotate(-90deg)' 
                : 'rotate(0deg)';
            
            // Обновляем подзаголовок
            updateContextSubtitle(contextItem);
        }
    });
}


// Добавляем CSS для анимаций сворачивания
const collapseStyles = document.createElement('style');
collapseStyles.textContent = `
    .context-children {
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        overflow: hidden;
    }
    
    .context-children:not(.collapsed) {
        animation: slideDown 0.3s ease-out;
    }
    
    @keyframes slideDown {
        from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            max-height: 1000px;
            transform: translateY(0);
        }
    }
    
    .context-children.collapsed {
        display: none;
    }
    
    .collapse-toggle {
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    
    .collapse-toggle .toggle-icon {
        transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    
    /* Улучшенные стили для вложенных сцен */
    .scene-in-context {
        transition: all 0.3s ease;
    }
    
    .context-children:not(.collapsed) .scene-in-context {
        animation: fadeInUp 0.4s ease-out;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(collapseStyles);

// Добавляем CSS для новых классов
const hierarchyStyles = document.createElement('style');
hierarchyStyles.textContent = `
    .hierarchy-item.context-item {
        border-left: 3px solid var(--accent-green);
        margin-bottom: 8px;
    }
    
    .hierarchy-item.scene-in-context {
        background: rgba(16, 185, 129, 0.05);
        border-left: 2px solid var(--accent-purple);
        margin-left: 20px;
        margin-bottom: 4px;
        transform-origin: left center;
    }
    
    .hierarchy-item.scene-in-context:hover {
        background: rgba(16, 185, 129, 0.1);
        transform: translateX(8px) translateY(-2px);
    }
    
    .hierarchy-item.context.selected {
        box-shadow: var(--glow-green);
    }
    
    .scene-number, .context-number {
        font-size: 10px;
        font-weight: 700;
        padding: 3px 6px;
        border-radius: 6px;
        margin-right: 8px;
    }
    
    .scene-number {
        background: linear-gradient(135deg, var(--accent-yellow), #f59e0b);
    }
    
    .context-number {
        background: linear-gradient(135deg, var(--accent-green), #059669);
    }
    
    /* Эффекты для всех кнопок в стиле start */
    .header-button:active::after,
    .panel-action-btn:active::after,
    .toolbar-btn:active::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        right: 2px;
        bottom: 2px;
        border-radius: inherit;
        background: rgba(0, 0, 0, 0.1);
    }
    
    /* Улучшенные transition */
    .panel {
        transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    
    .hierarchy-item {
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    
    .scene-element {
        transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
`;
document.head.appendChild(hierarchyStyles);