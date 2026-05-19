const fs = require('fs');
const path = require('path');

function getJidFromLidMapping(botId, lid) {
    const cleanLid = lid.split('@')[0];
    const sessionDir = path.join(__dirname, `../sessions/bot_${botId}`);
    const filePath = path.join(sessionDir, `lid-mapping-${cleanLid}_reverse.json`);
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
    } catch(e) {
        console.error(e);
    }
    return null;
}

console.log('Result:', getJidFromLidMapping(59, '6000757223428@lid'));
