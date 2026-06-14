const fs = require('fs');

// 1. Fix GoalController.php
const gcFile = '../praise-api/app/Http/Controllers/Api/V1/GoalController.php';
let gc = fs.readFileSync(gcFile, 'utf8');
gc = gc.replace(
  /'history' => fn \(\$q\) => \$q->latest\(\)->take\(10\),/,
  "'history' => fn ($q) => $q->with('changedByEmployee')->latest()->take(10),"
);
fs.writeFileSync(gcFile, gc);
console.log('Fixed', gcFile);

// 2. Fix api.php
const apiFile = '../praise-api/routes/api.php';
let api = fs.readFileSync(apiFile, 'utf8');
api = api.replace(
  /\$history = \$goal->history\(\)->paginate\(20\);/,
  "$history = $goal->history()->with('changedByEmployee')->paginate(20);"
);
fs.writeFileSync(apiFile, api);
console.log('Fixed', apiFile);

// 3. Fix goals/[goal_no]/page.jsx
const pageFile = 'app/(dashboard)/goals/[goal_no]/page.jsx';
let page = fs.readFileSync(pageFile, 'utf8');
page = page.replace(/item\.employee/g, "(item.changed_by_employee || item.employee)");
fs.writeFileSync(pageFile, page);
console.log('Fixed', pageFile);

