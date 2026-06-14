const fs = require('fs');

// 1. DashboardController: remove take(5) from team()
const dbFile = '../praise-api/app/Http/Controllers/Api/V1/DashboardController.php';
let dbContent = fs.readFileSync(dbFile, 'utf8');
dbContent = dbContent.replace(/->take\(5\)/, '');
fs.writeFileSync(dbFile, dbContent);
console.log('Fixed', dbFile);

// 2. routes/api.php: remove check.role middleware for dashboard/team
const apiFile = '../praise-api/routes/api.php';
let apiContent = fs.readFileSync(apiFile, 'utf8');
apiContent = apiContent.replace(
  /Route::middleware\('check\.role:hr_admin,supervisor'\)\s*->get\('dashboard\/team', \[DashboardController::class, 'team'\]\);/,
  "Route::get('dashboard/team', [DashboardController::class, 'team']);"
);
fs.writeFileSync(apiFile, apiContent);
console.log('Fixed', apiFile);

// 3. Sidebar.jsx: make Team menu visible to everyone
const sidebarFile = 'components/layout/Sidebar.jsx';
let sidebarContent = fs.readFileSync(sidebarFile, 'utf8');
sidebarContent = sidebarContent.replace(
  /\{ href: '\/team', label: 'Team', icon: Users, roles: \['supervisor', 'hr_admin'\] \},/,
  "{ href: '/team', label: 'Team', icon: Users, roles: ['*'] },"
);
fs.writeFileSync(sidebarFile, sidebarContent);
console.log('Fixed', sidebarFile);

// 4. GoalController: fix My Goals so supervisors see their OWN goals
const gcFile = '../praise-api/app/Http/Controllers/Api/V1/GoalController.php';
let gcContent = fs.readFileSync(gcFile, 'utf8');
const oldGcBlock = `            if ($employee->role === 'hr_admin') {
                // Can see all; optionally filter by employee_no
                if ($request->filled('employee_no')) {
                    $query->where('employee_no', $request->employee_no);
                }
            } elseif ($employee->role === 'supervisor') {
                // Supervisor sees goals where they are assigned as a reviewer
                $reviewedGoalNos = \\App\\Models\\PraiseGoalReviewer::where('reviewer', $employee->employee_no)
                    ->where('status', 1)
                    ->pluck('goal_no');

                if ($request->filled('employee_no')) {
                    $query->where('employee_no', $request->employee_no)
                          ->whereIn('goal_no', $reviewedGoalNos);
                } else {
                    $query->whereIn('goal_no', $reviewedGoalNos);
                }
            } else {
                // Regular employee sees own goals only
                $query->where('employee_no', $employee->employee_no);
            }`;

const newGcBlock = `            if ($employee->role === 'hr_admin') {
                if ($request->filled('employee_no')) {
                    $query->where('employee_no', $request->employee_no);
                } else {
                    $query->where('employee_no', $employee->employee_no);
                }
            } elseif ($employee->role === 'supervisor') {
                if ($request->filled('employee_no')) {
                    $reviewedGoalNos = \\App\\Models\\PraiseGoalReviewer::where('reviewer', $employee->employee_no)
                        ->where('status', 1)
                        ->pluck('goal_no');
                    $query->where('employee_no', $request->employee_no)
                          ->whereIn('goal_no', $reviewedGoalNos);
                } else {
                    $query->where('employee_no', $employee->employee_no);
                }
            } else {
                $query->where('employee_no', $employee->employee_no);
            }`;

if (gcContent.includes("if ($employee->role === 'hr_admin') {")) {
  gcContent = gcContent.replace(oldGcBlock, newGcBlock);
  fs.writeFileSync(gcFile, gcContent);
  console.log('Fixed', gcFile);
} else {
  console.log('Could not find GoalController block to replace');
}

