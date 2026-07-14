const fs = require('fs');
const text = fs.readFileSync('C:\\\\Users\\\\Somiari Nene\\\\.gemini\\\\antigravity\\\\brain\\\\f8742153-322f-4baf-90fe-2a5517bbbb72\\\\.system_generated\\\\steps\\\\2919\\\\content.md', 'utf8');
const regex = /https:\/\/[^\s"'<>\\]+|api\/[^\s"'<>\\]+/gi;
const urls = text.match(regex) || [];
const uniqueUrls = [...new Set(urls)];
console.log(uniqueUrls.filter(u => !u.includes('mintlify') && !u.includes('cloudflare') && !u.includes('schema.org') && !u.includes('fontawesome')).join('\n'));
