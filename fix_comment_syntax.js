const fs = require('fs');

const file = 'components/praise/CommentThread.jsx';
let content = fs.readFileSync(file, 'utf8');

// Fix syntax error
content = content.replace(
  /\(c\.author \|\| c\.employee\)_no/g,
  "(c.author || c.employee)?.employee_no"
);

// Fix the display name not picking up employee_name
content = content.replace(
  /\{\(c\.author \|\| c\.employee\)\?\.name \|\| 'Unknown'\}/g,
  "{(c.author || c.employee)?.employee_name || (c.author || c.employee)?.name || 'Unknown'}"
);

// Also fix the currentEmployee name for Add comment text area
content = content.replace(
  /currentEmployee\?\.name/g,
  "(currentEmployee?.employee_name || currentEmployee?.name)"
);

fs.writeFileSync(file, content);
console.log('Fixed syntax error in', file);
