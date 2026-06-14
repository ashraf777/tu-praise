const fs = require('fs');

const dashFile = 'app/(dashboard)/dashboard/page.jsx';
let dashContent = fs.readFileSync(dashFile, 'utf8');
dashContent = dashContent.replace(/employee\?\.name/g, "(employee?.employee_name || employee?.name)");
fs.writeFileSync(dashFile, dashContent);
console.log('Fixed', dashFile);

const layoutFile = 'app/(dashboard)/layout.jsx';
if (fs.existsSync(layoutFile)) {
    let layoutContent = fs.readFileSync(layoutFile, 'utf8');
    layoutContent = layoutContent.replace(/employee\?\.name/g, "(employee?.employee_name || employee?.name)");
    layoutContent = layoutContent.replace(/employee\?\.email/g, "(employee?.employee_email || employee?.email)");
    fs.writeFileSync(layoutFile, layoutContent);
    console.log('Fixed', layoutFile);
}
