const fs = require('fs');

// 1. Fix GoalController.php to eager load changeType
const gcFile = '../praise-api/app/Http/Controllers/Api/V1/GoalController.php';
let gc = fs.readFileSync(gcFile, 'utf8');
gc = gc.replace(
  /'history' => fn \(\$q\) => \$q->with\('changedByEmployee'\)->latest\(\)->take\(10\),/,
  "'history' => fn ($q) => $q->with(['changedByEmployee', 'changeType'])->latest()->take(10),"
);
fs.writeFileSync(gcFile, gc);
console.log('Fixed', gcFile);

// 2. Fix api.php to eager load changeType
const apiFile = '../praise-api/routes/api.php';
let api = fs.readFileSync(apiFile, 'utf8');
api = api.replace(
  /\$history = \$goal->history\(\)->with\('changedByEmployee'\)->paginate\(20\);/,
  "$history = $goal->history()->with(['changedByEmployee', 'changeType'])->paginate(20);"
);
fs.writeFileSync(apiFile, api);
console.log('Fixed', apiFile);

// 3. Fix goals/[goal_no]/page.jsx
const pageFile = 'app/(dashboard)/goals/[goal_no]/page.jsx';
let page = fs.readFileSync(pageFile, 'utf8');

// Inject the formatChanges helper right before HistoryTimeline
if (!page.includes('const formatChanges =')) {
  page = page.replace(
    /\/\/ History timeline/,
    `// Format changes for History
const formatChanges = (beforeStr, afterStr) => {
  try {
    const before = JSON.parse(beforeStr || '{}')
    const after = JSON.parse(afterStr || '{}')
    const changes = []
    for (const key in after) {
      if (before[key] !== after[key]) {
        changes.push(\`\${key}: \${before[key] ?? 'none'} → \${after[key] ?? 'none'}\`)
      }
    }
    return changes.length ? changes.join(' \\n ') : ''
  } catch (e) {
    return ''
  }
}

// History timeline`
  );
}

// Update the timeline rendering
page = page.replace(
  /<p className="text-slate-700 font-medium">\{item\.action \|\| item\.description\}<\/p>/,
  `<p className="text-slate-700 font-medium">{item.change_type?.desc || item.action || 'Updated Goal'}</p>
            {item.parameters_after && (
              <p className="text-slate-500 text-xs mt-1 whitespace-pre-wrap leading-relaxed border-l-2 border-slate-200 pl-2">
                {formatChanges(item.parameters_before, item.parameters_after)}
              </p>
            )}`
);

fs.writeFileSync(pageFile, page);
console.log('Fixed', pageFile);
