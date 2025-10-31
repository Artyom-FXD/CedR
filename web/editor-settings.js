// settings.js - Функциональность модального окна настроек

const openSettingsBtn = document.getElementById('openSettingsBtn');
const settingsOverlay = document.getElementById('settings-modal');
openSettingsBtn.addEventListener('click', () => {
    settingsOverlay.style.display = 'flex';
})
settingsOverlay.addEventListener('click', (e) => {
    if (e.target === settingsOverlay) {
        settingsOverlay.style.display = 'none';
    }
});

// Переключение вкладок настроек
const tabBtns = document.querySelectorAll('.settings-tab');
const tabContents = document.querySelectorAll('.settings-tab-content');

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

// Смена темы
const themeSelector = document.getElementById('theme-selector');

themeSelector.addEventListener('change', () => {
    const selectedTheme = themeSelector.value;
    document.body.className = selectedTheme + '-theme';
});