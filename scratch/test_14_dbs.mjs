import { getSystemDatabaseHealth } from '../server/db.js';

console.log('Testing 14 Databases Health Inspection...');
const health = getSystemDatabaseHealth();

console.log('System Status:', health.status);
console.log('Total Records Across All Stores:', health.totalRecords);
console.log(`Databases Connected: ${health.databases.length} / 14`);
health.databases.forEach((db, i) => {
  console.log(`  [${i+1}] ${db.name.padEnd(30)} -> ${db.file.padEnd(25)} : ${db.count} records [${db.status}]`);
});

console.log('\nRelational Health Rates:');
Object.entries(health.relations).forEach(([rel, data]) => {
  console.log(`  🔗 ${rel}: ${data.healthRate}% (${JSON.stringify(data)})`);
});
