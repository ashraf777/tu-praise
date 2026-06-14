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

const files = walk('app');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace array fallbacks: somethingRes.data?.prop || somethingRes.data || []
    content = content.replace(/([a-zA-Z0-9]+Res\.data(?:\?\.\w+)? \|\| )\1?([a-zA-Z0-9]+Res\.data) \|\| \[\]/g, '$1$2?.data || (Array.isArray($2) ? $2 : [])');
    
    // Specifically handle the known lines
    content = content.replace(/cycRes\.data\?\.cycles \|\| cycRes\.data \|\| \[\]/g, "cycRes.data?.cycles || cycRes.data?.data || (Array.isArray(cycRes.data) ? cycRes.data : [])");
    content = content.replace(/clientRes\.data\?\.clients \|\| clientRes\.data \|\| \[\]/g, "clientRes.data?.clients || clientRes.data?.data || (Array.isArray(clientRes.data) ? clientRes.data : [])");
    content = content.replace(/empRes\.data\?\.employees \|\| empRes\.data \|\| \[\]/g, "empRes.data?.employees || empRes.data?.data || (Array.isArray(empRes.data) ? empRes.data : [])");
    content = content.replace(/histRes\.data\?\.history \|\| histRes\.data \|\| \[\]/g, "histRes.data?.history || histRes.data?.data || (Array.isArray(histRes.data) ? histRes.data : [])");

    // Replace object fallbacks: goalRes.data?.goal || goalRes.data
    content = content.replace(/goalRes\.data\?\.goal \|\| goalRes\.data/g, "goalRes.data?.goal || goalRes.data?.data || goalRes.data");
    
    // Dashboard page: const data = res.data -> const data = res.data?.data || res.data
    // Only if it's strictly const data = res.data
    content = content.replace(/const data = res\.data(\n|;)/g, "const data = res.data?.data || res.data$1");

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Fixed', file);
    }
});
