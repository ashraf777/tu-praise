const fs = require('fs');

// 1. Add goal relationship to PraiseNewsFeed.php
const modelFile = '../praise-api/app/Models/PraiseNewsFeed.php';
let model = fs.readFileSync(modelFile, 'utf8');
if (!model.includes('public function goal()')) {
    model = model.replace(
        /}\s*$/,
        `
    public function goal()
    {
        return $this->belongsTo(PraiseGoal::class, 'goal_no', 'goal_no');
    }
}
`
    );
    fs.writeFileSync(modelFile, model);
    console.log('Fixed', modelFile);
}

// 2. Eager load goal in NewsFeedController.php
const ctrlFile = '../praise-api/app/Http/Controllers/Api/V1/NewsFeedController.php';
let ctrl = fs.readFileSync(ctrlFile, 'utf8');
ctrl = ctrl.replace(
    /PraiseNewsFeed::with\('feedType'\)/,
    "PraiseNewsFeed::with(['feedType', 'goal'])"
);
fs.writeFileSync(ctrlFile, ctrl);
console.log('Fixed', ctrlFile);

// 3. Fix frontend feed/page.jsx
const pageFile = 'app/(dashboard)/feed/page.jsx';
let page = fs.readFileSync(pageFile, 'utf8');

// Fix name
page = page.replace(
    /\(item\.employee\?\.employee_name \|\| item\.employee\?\.name\)/g,
    "item.employee_name"
);
page = page.replace(
    /item\.employee\?\.name/g,
    "item.employee_name"
);

// Fix created_at to created
page = page.replace(
    /item\.created_at/g,
    "item.created"
);

// Fix type description. The relation is feedType, so the object is feed_type.
// Let's just use item.feed_type?.post_type_desc
page = page.replace(
    /item\.feed_type_desc \|\| item\.description/g,
    "item.feed_type?.post_type_desc || item.feed_type_desc || item.description"
);

fs.writeFileSync(pageFile, page);
console.log('Fixed', pageFile);
