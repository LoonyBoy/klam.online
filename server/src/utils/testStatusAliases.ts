// ============================================================================
// Тестовый скрипт для проверки парсера статусов
// Запуск: npx ts-node src/utils/testStatusAliases.ts
// ============================================================================

import { 
  parseStatusCommands, 
  formatStatusChangeResponse,
  getStatusByAlias,
  getAliasesForStatus 
} from './statusAliases';

console.log('🧪 Testing Status Aliases Parser\n');
console.log('='.repeat(60));

// Тест 1: Простые команды
console.log('\n📋 Test 1: Simple commands');
console.log('-'.repeat(60));

const test1 = parseStatusCommands('АР-001 ок');
console.log('Input: "АР-001 ок"');
console.log('Result:', JSON.stringify(test1, null, 2));

// Тест 2: Множественные команды
console.log('\n📋 Test 2: Multiple commands');
console.log('-'.repeat(60));

const test2 = parseStatusCommands(`
АР-001 ок
КР-002 замечания
АР-003 +
`);
console.log('Input: Multi-line message with 3 commands');
console.log('Result:', JSON.stringify(test2, null, 2));

// Тест 3: Эмодзи
console.log('\n📋 Test 3: Emoji aliases');
console.log('-'.repeat(60));

const test3 = parseStatusCommands('АР-001 ✅');
console.log('Input: "АР-001 ✅"');
console.log('Result:', JSON.stringify(test3, null, 2));

// Тест 4: Смешанный текст
console.log('\n📋 Test 4: Mixed text with commands');
console.log('-'.repeat(60));

const test4 = parseStatusCommands(`
Проверил альбомы:
АР-001 принято
Нужно исправить АР-002 замечания
Отлично! КР-003 ок
`);
console.log('Input: Text with embedded commands');
console.log('Result:', JSON.stringify(test4, null, 2));

// Тест 5: Все варианты одного статуса
console.log('\n📋 Test 5: All aliases for "accepted" status');
console.log('-'.repeat(60));

const aliases = getAliasesForStatus('accepted');
console.log('Aliases for "accepted":', aliases);

// Тест 6: Форматирование ответов
console.log('\n📋 Test 6: Response formatting');
console.log('-'.repeat(60));

console.log('Success:', formatStatusChangeResponse('АР-001', 'accepted', true));
console.log('Failure:', formatStatusChangeResponse('АР-001', 'accepted', false));

// Тест 7: Проверка алиасов
console.log('\n📋 Test 7: Alias lookup');
console.log('-'.repeat(60));

const testAliases = ['ок', '+', '!', 'отправил', '🏭', 'замечания'];
testAliases.forEach(alias => {
  const status = getStatusByAlias(alias);
  console.log(`"${alias}" → ${status || 'NOT FOUND'}`);
});

// Тест 8: Невалидные команды
console.log('\n📋 Test 8: Invalid commands (should be empty)');
console.log('-'.repeat(60));

const test8 = parseStatusCommands('Просто обычный текст без команд');
console.log('Input: "Просто обычный текст без команд"');
console.log('Result:', JSON.stringify(test8, null, 2));

// Тест 9: Разные форматы кодов альбомов
console.log('\n📋 Test 9: Different album code formats');
console.log('-'.repeat(60));

const test9 = parseStatusCommands(`
АР-001 ок
КР-0002 ок
OVVK-123 ок
ES-9999 ок
`);
console.log('Input: Different code formats');
console.log('Result:', JSON.stringify(test9, null, 2));

// Тест 10: Производительность
console.log('\n📋 Test 10: Performance test');
console.log('-'.repeat(60));

const longText = Array(1000).fill('АР-001 ок').join('\n');
const start = Date.now();
const test10 = parseStatusCommands(longText);
const end = Date.now();

console.log(`Parsed ${test10.length} commands in ${end - start}ms`);

console.log('\n' + '='.repeat(60));
console.log('✅ All tests completed!');
