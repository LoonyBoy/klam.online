import pool from '../src/db';
import fs from 'fs';
import path from 'path';

async function applyMigration() {
  try {
    const migrationFile = process.argv[2] || '003_add_department_to_participants.sql';
    console.log(`🚀 Applying migration ${migrationFile}...`);
    
    const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Разбиваем на отдельные SQL команды
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('USE'));
    
    for (const statement of statements) {
      if (statement) {
        console.log(`Executing: ${statement.substring(0, 100)}...`);
        await pool.query(statement);
      }
    }
    
    console.log('✅ Migration applied successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

applyMigration();
