const fs = require('fs');

const empFile = 'app/(dashboard)/admin/employees/page.jsx';
let empContent = fs.readFileSync(empFile, 'utf8');

// Fix the payload for employee creation/update
empContent = empContent.replace(
  /const payload = { name: form.name, email: form.email, role: form.role, comp_id: parseInt\(form.comp_id\) }/,
  "const payload = { employee_name: form.name, employee_email: form.email, role: form.role, comp_id: parseInt(form.comp_id) }"
);

// Fix initial state mapping
empContent = empContent.replace(
  /initial\.name, email: initial\.email/g,
  "initial.employee_name || initial.name, email: initial.employee_email || initial.email"
);

// Fix filtering and display
empContent = empContent.replace(/e\.name\?/g, "(e.employee_name || e.name)?");
empContent = empContent.replace(/e\.email\?/g, "(e.employee_email || e.email)?");
empContent = empContent.replace(/\{emp\.name\}/g, "{emp.employee_name || emp.name}");
empContent = empContent.replace(/\{emp\.email\}/g, "{emp.employee_email || emp.email}");
empContent = empContent.replace(/getInitials\(emp\.name\)/g, "getInitials(emp.employee_name || emp.name)");

fs.writeFileSync(empFile, empContent);
console.log('Fixed', empFile);

const revFile = 'components/praise/ReviewerSection.jsx';
let revContent = fs.readFileSync(revFile, 'utf8');
revContent = revContent.replace(/\{e\.name\}/g, "{e.employee_name || e.name}");
revContent = revContent.replace(/\{r\.employee\?\.name\}/g, "{r.employee?.employee_name || r.employee?.name}");
revContent = revContent.replace(/getInitials\(r\.employee\?\.name\)/g, "getInitials(r.employee?.employee_name || r.employee?.name)");
fs.writeFileSync(revFile, revContent);
console.log('Fixed', revFile);

const commFile = 'components/praise/CommentThread.jsx';
if (fs.existsSync(commFile)) {
    let commContent = fs.readFileSync(commFile, 'utf8');
    commContent = commContent.replace(/\{c\.employee\?\.name\}/g, "{c.employee?.employee_name || c.employee?.name}");
    commContent = commContent.replace(/getInitials\(c\.employee\?\.name\)/g, "getInitials(c.employee?.employee_name || c.employee?.name)");
    fs.writeFileSync(commFile, commContent);
    console.log('Fixed', commFile);
}
