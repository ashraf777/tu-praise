const fs = require('fs');

const file = 'components/layout/Sidebar.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace wrapper
content = content.replace(
  /className="flex h-full flex-col" style=\{\{ backgroundColor: 'var\(--sidebar\)' \}\}/,
  'className="flex h-full flex-col bg-white border-r border-slate-200"'
);

// Replace logo border and text
content = content.replace(
  /border-b border-indigo-900\/50/,
  'border-b border-slate-100'
);
content = content.replace(
  /bg-indigo-500 shadow/,
  'bg-indigo-600 shadow-sm'
);
content = content.replace(
  /font-bold text-white tracking-tight/,
  'font-bold text-slate-800 tracking-tight'
);

// Replace close button
content = content.replace(
  /text-indigo-300 hover:text-white hover:bg-indigo-900\/50/,
  'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
);

// Replace nav active/inactive
content = content.replace(
  /'bg-indigo-600 text-white shadow-sm'/,
  "'bg-indigo-50 text-indigo-700 shadow-sm'"
);
content = content.replace(
  /'text-indigo-200 hover:bg-indigo-900\/60 hover:text-white'/,
  "'text-slate-600 hover:bg-slate-100 hover:text-slate-900'"
);

// Replace footer border
content = content.replace(
  /border-t border-indigo-900\/50/,
  'border-t border-slate-100'
);

// Replace avatar
content = content.replace(
  /bg-indigo-500 text-white text-xs/,
  'bg-indigo-100 text-indigo-700 text-xs'
);

// Replace employee name and role
content = content.replace(
  /text-sm font-semibold text-white/,
  'text-sm font-semibold text-slate-800'
);
content = content.replace(
  /text-xs text-indigo-300/,
  'text-xs text-slate-500'
);

// Replace logout button
content = content.replace(
  /text-indigo-300 hover:bg-red-500\/20 hover:text-red-300/,
  'text-slate-600 hover:bg-red-50 hover:text-red-600'
);

fs.writeFileSync(file, content);
console.log('Fixed', file);
