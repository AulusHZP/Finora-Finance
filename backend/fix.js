const fs = require('fs');
const files = ['dashboard', 'transaction', 'goal', 'category', 'budget'].map(f => 'src/routes/' + f + '.routes.ts');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace('import { DEV_USER_ID } from "../config/constants";', 'import { requireUserId } from "../utils/request";');
  content = content.replace(/DEV_USER_ID/g, 'requireUserId(req)');
  fs.writeFileSync(f, content);
});
