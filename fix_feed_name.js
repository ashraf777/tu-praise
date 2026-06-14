const fs = require('fs');
const file = 'app/(dashboard)/feed/page.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/item\.employee\?\.name/g, "(item.employee?.employee_name || item.employee?.name)");

fs.writeFileSync(file, content);
console.log('Fixed', file);
