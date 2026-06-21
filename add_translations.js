const fs = require('fs');

const file = 'frontend/app/locales/translations.ts';
let content = fs.readFileSync(file, 'utf8');

const additions = {
  EN: `
    connected: "Connected",
    telegramBot: "Telegram Bot",
    whatsappClient: "WhatsApp Client",
    instagramApi: "Instagram API",
    turnOnAi: "Turn on AI",
    turnOffAi: "Turn off AI",
    deleteChannelConfirm: "Are you sure you want to disconnect and delete this communication channel?",
    platformSelection: "Platform Selection",
    connectTelegram: "Connect Telegram",
    connectWhatsapp: "Connect WhatsApp",
    connectInstagram: "Connect Instagram",
    selectMessenger: "Select messenger for integration",
    stepToConnect: "Step to connect bot to your account",
    tgDescription: "Ideal for official bots, broadcasts, buttons, and channels.",
    igDescription: "Test connection of Instagram channel via Meta API.",
    waDescription: "To connect WhatsApp session, we will generate a secure QR code web interface.",
    waStep1: "Open WhatsApp on your phone",
    waStep2: "Go to Menu (three dots) or Settings -> Linked Devices",
    waStep3: "Tap 'Link a Device' and point your phone to this screen",
    metaToken: "Meta Page Access Token",
    metaTokenHint: "Enter Meta API settings to connect Instagram account.",
    agentTabDesc: "Communicate with the agent directly to configure its behavior and knowledge base.",
    aiBrain: "AI Brain",
    agent: "Agent",
    statusText: "Status",
`,
  RU: `
    connected: "Подключен",
    telegramBot: "Telegram Бот",
    whatsappClient: "WhatsApp Клиент",
    instagramApi: "Instagram API",
    turnOnAi: "Включить ИИ",
    turnOffAi: "Выключить ИИ",
    deleteChannelConfirm: "Вы уверены, что хотите отключить и удалить этот канал связи?",
    platformSelection: "Выбор платформы",
    connectTelegram: "Подключить Telegram",
    connectWhatsapp: "Подключить WhatsApp",
    connectInstagram: "Подключить Instagram",
    selectMessenger: "Выберите мессенджер для интеграции",
    stepToConnect: "Шаг для подключения бота к вашему аккаунту",
    tgDescription: "Идеально подходит для официальных ботов, рассылок, кнопок и каналов.",
    igDescription: "Тестовое подключение канала Instagram через Meta API.",
    waDescription: "Для подключения WhatsApp сессии мы сгенерируем безопасный веб-интерфейс с QR-кодом.",
    waStep1: "Откройте WhatsApp на вашем телефоне",
    waStep2: "Перейдите в Меню (три точки) или Настройки -> Связанные устройства",
    waStep3: "Нажмите 'Привязка устройства' и наведите телефон на этот экран",
    metaToken: "Токен доступа страницы Meta",
    metaTokenHint: "Введите настройки Meta API для подключения аккаунта Instagram.",
    agentTabDesc: "Общайтесь с агентом напрямую, чтобы настроить его поведение и базу знаний.",
    aiBrain: "Мозг ИИ",
    agent: "Агент",
    statusText: "Статус",
`,
  KZ: `
    connected: "Қосылған",
    telegramBot: "Telegram Бот",
    whatsappClient: "WhatsApp Клиенті",
    instagramApi: "Instagram API",
    turnOnAi: "ЖИ қосу",
    turnOffAi: "ЖИ өшіру",
    deleteChannelConfirm: "Осы байланыс арнасын өшіріп, жойғыңыз келетініне сенімдісіз бе?",
    platformSelection: "Платформаны таңдау",
    connectTelegram: "Telegram қосу",
    connectWhatsapp: "WhatsApp қосу",
    connectInstagram: "Instagram қосу",
    selectMessenger: "Интеграция үшін мессенджерді таңдаңыз",
    stepToConnect: "Ботты аккаунтыңызға қосу қадамы",
    tgDescription: "Ресми боттар, таратылымдар, түймелер және арналар үшін өте қолайлы.",
    igDescription: "Meta API арқылы Instagram арнасын қосуды тексеру.",
    waDescription: "WhatsApp сессиясын қосу үшін біз қауіпсіз QR-код веб-интерфейсін жасаймыз.",
    waStep1: "Телефоныңызда WhatsApp ашыңыз",
    waStep2: "Мәзірге (үш нүкте) немесе Параметрлер -> Байланысқан құрылғылар өтіңіз",
    waStep3: "'Құрылғыны байланыстыру' түймесін басып, телефоныңызды осы экранға бағыттаңыз",
    metaToken: "Meta парақшасына кіру токені",
    metaTokenHint: "Instagram аккаунтын қосу үшін Meta API параметрлерин енгізіңіз.",
    agentTabDesc: "Агенттің мінез-құлқы мен білім қорын реттеу үшін онымен тікелей сөйлесіңіз.",
    aiBrain: "ЖИ миы",
    agent: "Агент",
    statusText: "Статусы",
`
};

['EN', 'RU', 'KZ'].forEach(lang => {
    const regex = new RegExp("(" + lang + ":\\s*\\{)");
    content = content.replace(regex, "$1\\n" + additions[lang] + "\\n");
});

fs.writeFileSync(file, content, 'utf8');
console.log('Done');
