import { executeIntegrationFunction } from './src/services/IntegrationExecutor.js';

const config = {
    googleSheetUrl: 'https://docs.google.com/spreadsheets/d/1oygNrIx7ZVTA2cf2nGKSc3-bxyMhZLCTPz3KuB1O2gg/edit?gid=0#gid=0',
    googleSheetColumns: 'Имя, Телефон, Дата'
};

const args = {
    data: JSON.stringify({
        "Имя": "Тест",
        "Телефон": "+7 777 777 7777",
        "Дата": "2026-06-21"
    })
};

executeIntegrationFunction('save_to_google_sheets', args, config)
    .then(console.log)
    .catch(console.error);
