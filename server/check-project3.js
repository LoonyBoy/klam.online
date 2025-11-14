const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'klamuser',
    password: 'SecureP@ss2024!',
    database: 'klamonline',
    waitForConnections: true,
    connectionLimit: 10
  });

  const projectId = 3;
  
  console.log('=== Участники проекта ID=3 ===\n');
  
  const [rows] = await pool.query(`
    SELECT 
      pp.participant_id, 
      p.first_name, 
      p.last_name, 
      p.email, 
      p.role_type 
    FROM project_participants pp 
    JOIN participants p ON pp.participant_id = p.id 
    WHERE pp.project_id = ?
  `, [projectId]);
  
  console.log('Всего участников:', rows.length);
  console.log('\nДетали:');
  rows.forEach(r => {
    console.log(`  ${r.first_name} ${r.last_name} - ${r.role_type} (${r.email})`);
  });
  
  await pool.end();
})();
