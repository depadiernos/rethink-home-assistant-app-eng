;(function () {
    'use strict'

    const LANGUAGE_KEY = 'rethink.ui.language'
    const THEME_KEY = 'rethink.ui.theme'

    const enToRu = new Map(
        Object.entries({
            'Rethink management panel': 'Панель управления Rethink',
            Connectivity: 'Подключение',
            'Browser 🡘 Rethink': 'Браузер 🡘 Rethink',
            'Rethink 🡘 MQTT': 'Rethink 🡘 MQTT',
            'Connected devices': 'Подключённые устройства',
            ID: 'ID',
            Model: 'Модель',
            Platform: 'Платформа',
            Bridge: 'Мост',
            Monitor: 'Мониторинг',
            'Follow the': 'Следуйте',
            'wiki instructions': 'инструкциям в wiki',
            'to connect new devices.': 'для подключения новых устройств.',
            'Bridge mode': 'Режим моста',
            'Status:': 'Состояние:',
            Status: 'Состояние:',
            'Log into your LG account': 'Войти в учётную запись LG',
            logout: 'Выйти',
            'Log into your LG ThinQ account': 'Вход в учётную запись LG ThinQ',
            'Make sure to enter a country code that matches your account. The LG login page will open in a window. Please proceed with the login, then copy the URL from the final blank page.':
                'Укажите код страны, соответствующий учётной записи. Страница входа LG откроется в новом окне. Выполните вход и скопируйте адрес итоговой пустой страницы.',
            'Country code': 'Код страны',
            'Log in': 'Войти',
            'Paste the final URL below.': 'Вставьте итоговый адрес ниже.',
            URL: 'URL',
            Continue: 'Продолжить',
            Close: 'Закрыть',
            'Logout confirmation': 'Подтверждение выхода',
            'Logging out will disable bridge mode for all your devices.':
                'Выход отключит режим моста для всех устройств.',
            'Log out': 'Выйти',
            Cancel: 'Отмена',
            'Select device type': 'Выбор типа устройства',
            'Please select the appropriate type for this device. This value usually consists of three digits and can be obtained during the setup process. The device will only register with the ThinQ cloud if the device type is set correctly.':
                'Выберите подходящий тип устройства. Обычно это три цифры, полученные при настройке. Регистрация в ThinQ возможна только при правильно выбранном типе.',
            'Device type': 'Тип устройства',
            'Device status': 'Состояние устройства',
            'Device ID:': 'ID устройства:',
            'Device model:': 'Модель устройства:',
            Messages: 'Сообщения',
            'Auto-scroll': 'Автопрокрутка',
            Off: 'Выкл.',
            On: 'Вкл.',
            'Send to device': 'Отправить устройству',
            Send: 'Отправить',
            'Inject from device': 'Имитировать сообщение устройства',
            Unknown: 'Неизвестно',
            Ok: 'Готово',
            'Not configured': 'Не настроено',
            'Waiting for rethink connection...': 'Ожидание подключения к Rethink…',
            offline: 'не в сети',
            online: 'в сети',
            'This will disable bridge mode for all your devices.':
                'Режим моста будет отключён для всех устройств.',
            'This device is not supported by rethink. It will not be mapped to HomeAssistant':
                'Устройство не поддерживается Rethink и не будет добавлено в Home Assistant.',
            '101 (Refrigerator)': '101 (Холодильник)',
            '201 (Washer)': '201 (Стиральная машина)',
            '202 (Dryer)': '202 (Сушильная машина)',
            '204 (Dishwasher)': '204 (Посудомоечная машина)',
            '223 (WashTower)': '223 (Стирально-сушильная колонна)',
            '301 (Gas Range)': '301 (Газовая плита)',
            '302 (Microwave)': '302 (Микроволновая печь)',
            '401 (Air Conditioner)': '401 (Кондиционер)',
        }),
    )
    const ruToEn = new Map(Array.from(enToRu, ([en, ru]) => [ru, en]))

    let language = readSetting(LANGUAGE_KEY) || 'ru'
    let theme = readSetting(THEME_KEY) || preferredTheme()
    let observer
    let controls
    let enhancementFrame

    function readSetting(key) {
        try {
            return window.localStorage.getItem(key)
        } catch {
            return null
        }
    }

    function writeSetting(key, value) {
        try {
            window.localStorage.setItem(key, value)
        } catch {}
    }

    function preferredTheme() {
        return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    }

    function normalise(value) {
        return value.replace(/\s+/g, ' ').trim()
    }

    function translated(value) {
        const dictionary = language === 'ru' ? enToRu : ruToEn
        return dictionary.get(normalise(value))
    }

    function translateText(node) {
        if (!node.nodeValue || node.parentElement?.classList.contains('material-icons')) return
        if (node.parentElement?.closest('.rethink-ui-controls')) return

        const replacement = translated(node.nodeValue)
        if (!replacement) return

        const leading = node.nodeValue.match(/^\s*/)?.[0] || ''
        const trailing = node.nodeValue.match(/\s*$/)?.[0] || ''
        node.nodeValue = `${leading}${replacement}${trailing}`
    }

    function translateAttributes(element) {
        for (const name of ['title', 'data-tooltip', 'placeholder', 'aria-label']) {
            const value = element.getAttribute?.(name)
            const replacement = value && translated(value)
            if (replacement) element.setAttribute(name, replacement)
        }
    }

    function translateTree(root) {
        if (!root) return
        if (root.nodeType === Node.TEXT_NODE) {
            translateText(root)
            return
        }
        if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return

        if (root.nodeType === Node.ELEMENT_NODE) translateAttributes(root)
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT)
        let node
        while ((node = walker.nextNode())) {
            if (node.nodeType === Node.TEXT_NODE) translateText(node)
            else translateAttributes(node)
        }
    }

    function applyLanguage(nextLanguage, persist = true) {
        language = nextLanguage === 'en' ? 'en' : 'ru'
        document.documentElement.lang = language
        document.title = language === 'ru' ? 'Панель управления Rethink' : 'Rethink management panel'
        if (persist) writeSetting(LANGUAGE_KEY, language)
        translateTree(document.body)
        refreshControls()
        refreshEnhancementLabels()
    }

    function applyTheme(nextTheme, persist = true) {
        theme = nextTheme === 'light' ? 'light' : 'dark'
        document.documentElement.classList.toggle('rethink-dark', theme === 'dark')
        document.documentElement.classList.toggle('rethink-light', theme === 'light')
        if (persist) writeSetting(THEME_KEY, theme)
        refreshControls()
    }

    function refreshControls() {
        if (!controls) return
        controls.querySelectorAll('[data-language]').forEach((button) => {
            const active = button.dataset.language === language
            button.classList.toggle('active', active)
            button.setAttribute('aria-pressed', String(active))
        })

        const themeButton = controls.querySelector('[data-theme-toggle]')
        const switchLabel =
            language === 'ru'
                ? theme === 'dark'
                    ? 'Включить светлую тему'
                    : 'Включить тёмную тему'
                : theme === 'dark'
                  ? 'Use light theme'
                  : 'Use dark theme'
        themeButton.title = switchLabel
        themeButton.setAttribute('aria-label', switchLabel)
        themeButton.querySelector('.material-icons').textContent = theme === 'dark' ? 'light_mode' : 'dark_mode'
    }

    function createControls() {
        const nav = document.querySelector('nav .nav-wrapper')
        if (!nav || nav.querySelector('.rethink-ui-controls')) return

        controls = document.createElement('div')
        controls.className = 'rethink-ui-controls'
        controls.innerHTML = `
            <div class="rethink-language-switch" role="group" aria-label="Language">
                <button type="button" class="rethink-ui-button" data-language="ru">RU</button>
                <button type="button" class="rethink-ui-button" data-language="en">EN</button>
            </div>
            <button type="button" class="rethink-ui-button rethink-theme-toggle" data-theme-toggle>
                <span class="material-icons" aria-hidden="true">dark_mode</span>
            </button>`
        nav.appendChild(controls)

        controls.querySelectorAll('[data-language]').forEach((button) => {
            button.addEventListener('click', () => applyLanguage(button.dataset.language))
        })
        controls.querySelector('[data-theme-toggle]').addEventListener('click', () => {
            applyTheme(theme === 'dark' ? 'light' : 'dark')
        })
    }

    function localised(element, ru, en, attribute) {
        element.dataset.labelRu = ru
        element.dataset.labelEn = en
        if (attribute) element.dataset.labelAttribute = attribute
        applyElementLabel(element)
        return element
    }

    function applyElementLabel(element) {
        const value = language === 'ru' ? element.dataset.labelRu : element.dataset.labelEn
        const attribute = element.dataset.labelAttribute
        if (!value) return
        if (attribute) {
            if (element.getAttribute(attribute) !== value) element.setAttribute(attribute, value)
        } else if (element.textContent !== value) element.textContent = value
    }

    function refreshEnhancementLabels() {
        document.querySelectorAll('[data-label-ru][data-label-en]').forEach(applyElementLabel)
    }

    function summaryItem(id, ru, en) {
        const item = document.createElement('div')
        item.className = 'rethink-summary-item'
        const label = localised(document.createElement('span'), ru, en)
        label.className = 'rethink-summary-label'
        const value = document.createElement('strong')
        value.className = 'rethink-summary-value'
        value.id = id
        value.textContent = '0'
        item.append(label, value)
        return item
    }

    function actionButton(icon, ru, en) {
        const button = document.createElement('button')
        button.type = 'button'
        button.className = 'rethink-action'
        button.innerHTML = `<span class="material-icons" aria-hidden="true">${icon}</span><span></span>`
        localised(button.querySelector('span:last-child'), ru, en)
        return button
    }

    function enhancePanel() {
        const tableBody = document.getElementById('devices_body')
        const table = tableBody?.closest('table')
        if (!table || document.getElementById('rethink-device-summary')) return

        const summary = document.createElement('div')
        summary.id = 'rethink-device-summary'
        summary.className = 'rethink-summary'
        summary.append(
            summaryItem('rethink-device-total', 'Всего устройств', 'Total devices'),
            summaryItem('rethink-device-supported', 'Поддерживается', 'Supported'),
            summaryItem('rethink-device-bridged', 'Режим моста', 'Bridge enabled'),
            summaryItem('rethink-device-updated', 'Последнее обновление', 'Last update'),
        )

        const toolbar = document.createElement('div')
        toolbar.className = 'rethink-toolbar'

        const search = document.createElement('input')
        search.type = 'search'
        search.className = 'rethink-search'
        search.id = 'rethink-device-search'
        localised(search, 'Поиск по ID, модели или платформе', 'Search ID, model or platform', 'placeholder')
        search.addEventListener('input', filterDevices)

        const refresh = actionButton('refresh', 'Обновить', 'Refresh')
        refresh.addEventListener('click', () => window.location.reload())

        const setup = document.createElement('a')
        setup.className = 'rethink-action'
        setup.href = 'https://github.com/akinin/rethink-home-assistant-app/blob/main/apk/README.md'
        setup.target = '_blank'
        setup.rel = 'noopener noreferrer'
        setup.innerHTML = '<span class="material-icons" aria-hidden="true">add_link</span><span></span>'
        localised(setup.querySelector('span:last-child'), 'Подключить устройство', 'Connect a device')

        toolbar.append(search, refresh, setup)
        table.before(summary, toolbar)
        updateDeviceSummary()
    }

    function filterDevices() {
        const query = normalise(document.getElementById('rethink-device-search')?.value || '').toLowerCase()
        document.querySelectorAll('#devices_body > tr').forEach((row) => {
            row.classList.toggle('rethink-device-hidden', !!query && !normalise(row.textContent).toLowerCase().includes(query))
        })
    }

    function updateDeviceSummary() {
        const rows = Array.from(document.querySelectorAll('#devices_body > tr'))
        const unsupported = rows.filter((row) => row.querySelector('[data-tooltip*="not supported"], [data-tooltip*="не поддерживается"]'))
        const bridged = rows.filter((row) => row.querySelector('input[type="checkbox"]:checked'))
        const now = new Date().toLocaleTimeString(language === 'ru' ? 'ru-RU' : 'en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        })

        setText('rethink-device-total', String(rows.length))
        setText('rethink-device-supported', String(rows.length - unsupported.length))
        setText('rethink-device-bridged', String(bridged.length))
        setText('rethink-device-updated', now)
        filterDevices()
    }

    function enhanceMonitor() {
        const messages = document.getElementById('messages')
        if (!messages || document.getElementById('rethink-monitor-toolbar')) return

        const summary = document.createElement('div')
        summary.id = 'rethink-monitor-summary'
        summary.className = 'rethink-summary'
        summary.append(
            summaryItem('rethink-message-total', 'Всего сообщений', 'Total messages'),
            summaryItem('rethink-message-rx', 'Получено (RX)', 'Received (RX)'),
            summaryItem('rethink-message-tx', 'Отправлено (TX)', 'Sent (TX)'),
            summaryItem('rethink-message-updated', 'Последнее сообщение', 'Last message'),
        )

        const toolbar = document.createElement('div')
        toolbar.id = 'rethink-monitor-toolbar'
        toolbar.className = 'rethink-toolbar rethink-monitor-tools'

        const search = document.createElement('input')
        search.type = 'search'
        search.className = 'rethink-search'
        search.id = 'rethink-message-search'
        localised(search, 'Фильтр по содержимому сообщений', 'Filter message contents', 'placeholder')
        search.addEventListener('input', filterMessages)

        const clear = actionButton('delete_sweep', 'Очистить', 'Clear')
        clear.addEventListener('click', () => {
            messages.replaceChildren()
            updateMessageSummary()
        })

        const download = actionButton('download', 'Скачать журнал', 'Download log')
        download.addEventListener('click', downloadMessages)

        toolbar.append(search, clear, download)
        messages.before(summary, toolbar)
        updateMessageSummary()
    }

    function filterMessages() {
        const query = normalise(document.getElementById('rethink-message-search')?.value || '').toLowerCase()
        document.querySelectorAll('#messages > .message').forEach((message) => {
            message.classList.toggle(
                'rethink-message-hidden',
                !!query && !normalise(message.textContent).toLowerCase().includes(query),
            )
        })
    }

    function updateMessageSummary() {
        const messages = Array.from(document.querySelectorAll('#messages > .message'))
        const rx = messages.filter((message) => message.classList.contains('rx'))
        const tx = messages.filter((message) => message.classList.contains('tx'))
        const latest = messages.at(-1)?.querySelector('.timestamp')?.textContent || '—'
        setText('rethink-message-total', String(messages.length))
        setText('rethink-message-rx', String(rx.length))
        setText('rethink-message-tx', String(tx.length))
        setText('rethink-message-updated', latest)
        filterMessages()
    }

    function downloadMessages() {
        const lines = Array.from(document.querySelectorAll('#messages > .message')).map((message) => {
            const direction = message.classList.contains('rx') ? 'RX' : 'TX'
            const injected = message.classList.contains('injected') ? ' INJECTED' : ''
            return `[${direction}${injected}] ${normalise(message.textContent)}`
        })
        const blob = new Blob([`${lines.join('\n')}\n`], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `rethink-device-${new Date().toISOString().replaceAll(':', '-')}.log`
        link.click()
        URL.revokeObjectURL(url)
    }

    function setText(id, value) {
        const element = document.getElementById(id)
        if (element && element.textContent !== value) element.textContent = value
    }

    function updateEnhancements() {
        window.cancelAnimationFrame(enhancementFrame)
        enhancementFrame = window.requestAnimationFrame(() => {
            enhancePanel()
            enhanceMonitor()
            updateDeviceSummary()
            updateMessageSummary()
            refreshEnhancementLabels()
        })
    }

    function initialise() {
        applyTheme(theme, false)
        createControls()
        applyLanguage(language, false)
        enhancePanel()
        enhanceMonitor()

        observer = new MutationObserver((mutations) => {
            observer.disconnect()
            for (const mutation of mutations) {
                if (mutation.type === 'characterData') translateText(mutation.target)
                mutation.addedNodes.forEach(translateTree)
            }
            observer.observe(document.body, { childList: true, characterData: true, subtree: true })
            updateEnhancements()
        })
        observer.observe(document.body, { childList: true, characterData: true, subtree: true })
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise)
    else initialise()
})()
