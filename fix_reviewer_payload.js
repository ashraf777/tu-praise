const fs = require('fs');

const file = 'components/praise/ReviewerSection.jsx';
let content = fs.readFileSync(file, 'utf8');

// The payload sent to goalsApi.addReviewer is:
// { employee_no: parseInt(form.employee_no), reviewer_type: parseInt(form.reviewer_type) }
// We need to change `employee_no:` to `reviewer:`
content = content.replace(
  /employee_no:\s*parseInt\(form\.employee_no\)/,
  "reviewer: parseInt(form.employee_no)"
);

fs.writeFileSync(file, content);
console.log('Fixed', file);
