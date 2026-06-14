const fs = require('fs');
const file = 'app/(dashboard)/admin/employees/page.jsx';
let content = fs.readFileSync(file, 'utf8');

// The toggle function:
// const newStatus = emp.status === 1 ? 0 : 1
// change 0 to 4
content = content.replace(
  /const newStatus = emp\.status === 1 \? 0 : 1/g,
  "const newStatus = emp.status === 1 ? 4 : 1"
);

fs.writeFileSync(file, content);
console.log('Fixed', file);
