const fs = require('fs');

const content = fs.readFileSync('src/app/docs/page.tsx', 'utf-8');

const events = [];
const eventRegex = /<h3>Event (\d+): (.*?)<\/h3>([\s\S]*?)(?=<h3>Event \d+:|<h2>4\.)/g;

let match;
while ((match = eventRegex.exec(content)) !== null) {
  const id = parseInt(match[1]);
  const title = match[2];
  let body = match[3];

  const purposeMatch = body.match(/<p><strong>Purpose:<\/strong> (.*?)<\/p>/);
  const purpose = purposeMatch ? purposeMatch[1] : '';

  const payloadMatch = body.match(/<pre><code>{`([\s\S]*?)`}<\/code><\/pre>/);
  const payload = payloadMatch ? payloadMatch[1] : '';

  const targetsMatch = body.match(/<h4>Database Insertion Targets<\/h4>\s*<ul>([\s\S]*?)<\/ul>/);
  const targets = targetsMatch ? targetsMatch[1] : '';

  const invariantsMatch = body.match(/<h4>Verification Invariants<\/h4>\s*<ul>([\s\S]*?)<\/ul>/);
  const invariants = invariantsMatch ? invariantsMatch[1] : '';

  events.push({ id, title, purpose, payload, targets, invariants });
}

let eventsDataStr = 'const eventsData = [\n';
events.forEach(e => {
  eventsDataStr += `  {
    id: ${e.id},
    title: ${JSON.stringify(e.title)},
    purpose: ${JSON.stringify(e.purpose)},
    targets: (
      <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
        ${e.targets.trim()}
      </ul>
    ),
    invariants: (
      <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
        ${e.invariants.trim()}
      </ul>
    ),
    payload: \`${e.payload.replace(/`/g, '\\`')}\`
  },
`;
});
eventsDataStr += '];\n';

fs.writeFileSync('scratch/events_data.tsx', eventsDataStr);
console.log('Success, wrote to scratch/events_data.tsx');
