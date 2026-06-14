const fs = require('fs');
const file = 'components/praise/ReviewerSection.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace r.employee with (r.reviewer_employee || r.employee)
content = content.replace(/r\.employee/g, "(r.reviewer_employee || r.employee)");

fs.writeFileSync(file, content);
console.log('Fixed', file);
