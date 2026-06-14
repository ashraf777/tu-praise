const fs = require('fs');

const file = 'components/praise/CommentThread.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace c.employee with (c.author || c.employee) to be safe
content = content.replace(/c\.employee/g, "(c.author || c.employee)");

fs.writeFileSync(file, content);
console.log('Fixed', file);
