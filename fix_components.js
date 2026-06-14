const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('components');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace array fallbacks
    content = content.replace(/res\.data\?\.reviewers \|\| res\.data \|\| \[\]/g, "res.data?.data?.reviewers || res.data?.reviewers || res.data?.data || (Array.isArray(res.data) ? res.data : [])");
    content = content.replace(/res\.data\?\.employees \|\| res\.data \|\| \[\]/g, "res.data?.data?.employees || res.data?.employees || res.data?.data || (Array.isArray(res.data) ? res.data : [])");
    content = content.replace(/res\.data\?\.comments \|\| res\.data \|\| \[\]/g, "res.data?.data?.comments || res.data?.comments || res.data?.data || (Array.isArray(res.data) ? res.data : [])");

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Fixed', file);
    }
});
