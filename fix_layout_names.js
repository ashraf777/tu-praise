const fs = require('fs');

const files = [
  'components/layout/Sidebar.jsx',
  'components/layout/TopBar.jsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/employee\?\.name/g, "(employee?.employee_name || employee?.name)");
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
});
