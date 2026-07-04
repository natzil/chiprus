(function(){
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const iso = () => new Date().toISOString();
  const ccna = Array.from({ length: 63 }, (_, i) => ({
    id: `ccna-${i + 1}`,
    branch: 'learning',
    track: 'ccna',
    title: `CCNA Day ${i + 1}`,
    description: `Jeremy's IT Lab · Day ${i + 1}`,
    xp: 40,
    status: i < 11 ? 'done' : i === 11 ? 'active' : 'not_started',
    progress: i < 11 ? 100 : 0,
    completed_at: i < 11 ? yesterday : ''
  }));

  window.RPG_DEFAULT_STATE = {
    version: 3,
    settings: {
      character_name: 'Оператор',
      english_target_hours: 300,
      sync_enabled: true
    },
    branches: [
      { id:'learning', title:'Обучение', accent:'#6ee7da', tracks:['ccna','english','linux'] },
      { id:'projects', title:'Проекты', accent:'#c9895b', tracks:['nas','esp32','arduino','chiptuning'] },
      { id:'health', title:'Здоровье / рутина', accent:'#8ccf7e', tracks:['pool','routine','walking'] },
      { id:'work', title:'Работа / развитие', accent:'#d7b56d', tracks:['noc-devops','resume','interviews'] }
    ],
    tracks: [
      { id:'ccna', branch:'learning', title:'CCNA', target_xp:2520 },
      { id:'english', branch:'learning', title:'English', target_xp:3000 },
      { id:'linux', branch:'learning', title:'Linux', target_xp:700 },
      { id:'nas', branch:'projects', title:'NAS / проекты', target_xp:500 },
      { id:'esp32', branch:'projects', title:'ESP32 + RFID', target_xp:400 },
      { id:'arduino', branch:'projects', title:'Arduino бар', target_xp:300 },
      { id:'chiptuning', branch:'projects', title:'Чиптюнинг', target_xp:600 },
      { id:'pool', branch:'health', title:'Бассейн', target_xp:360 },
      { id:'routine', branch:'health', title:'Базовая рутина', target_xp:300 },
      { id:'walking', branch:'health', title:'Ходьба', target_xp:300 },
      { id:'noc-devops', branch:'work', title:'NOC/DevOps путь', target_xp:800 },
      { id:'resume', branch:'work', title:'Резюме', target_xp:250 },
      { id:'interviews', branch:'work', title:'Собеседования', target_xp:350 }
    ],
    tasks: [
      ...ccna,
      { id:'eng-daily-1', branch:'learning', track:'english', title:'English · 15 мин listening/speaking', description:'Короткая практика без перегруза', xp:15, status:'active', progress:0, due_date:today },
      { id:'eng-tutor-1', branch:'learning', track:'english', title:'Tutor / speaking practice', description:'30 минут разговора или shadowing', xp:30, status:'not_started', progress:0 },
      { id:'linux-anki-1', branch:'learning', track:'linux', title:'Повторение прав доступа', description:'chmod, chown, groups, Anki', xp:15, status:'active', progress:0, due_date:today },
      { id:'nas-1', branch:'projects', track:'nas', title:'Выбрать ОС для сервера', description:'TrueNAS / Debian / Unraid', xp:60, status:'active', progress:0 },
      { id:'nas-2', branch:'projects', track:'nas', title:'Настроить Samba-шару', description:'Папки, права, доступ с Windows', xp:60, status:'not_started', progress:0 },
      { id:'esp32-1', branch:'projects', track:'esp32', title:'Проверить чтение UID карты', description:'ESP32 + RFID reader smoke test', xp:45, status:'not_started', progress:0 },
      { id:'arduino-1', branch:'projects', track:'arduino', title:'Собрать MVP Arduino bar', description:'Мини-проект с понятным демо', xp:50, status:'not_started', progress:0 },
      { id:'chip-1', branch:'projects', track:'chiptuning', title:'Собрать список услуг', description:'Stage 1, DPF/EGR, диагностика, тексты', xp:40, status:'not_started', progress:0 },
      { id:'pool-1', branch:'health', track:'pool', title:'Бассейн 6:30', description:'2-3 раза в неделю, спокойный темп', xp:25, status:'active', progress:0, due_date:today },
      { id:'routine-1', branch:'health', track:'routine', title:'Базовая рутина', description:'Сон, вода, порядок, короткий план дня', xp:15, status:'active', progress:0, due_date:today },
      { id:'walking-1', branch:'health', track:'walking', title:'Ходьба / активность', description:'20-30 минут без героизма', xp:15, status:'not_started', progress:0 },
      { id:'noc-1', branch:'work', track:'noc-devops', title:'Linux/network practice', description:'1 маленькая практика для NOC/DevOps пути', xp:30, status:'active', progress:0 },
      { id:'resume-1', branch:'work', track:'resume', title:'Обновить резюме', description:'Один блок: навыки, проекты или опыт', xp:30, status:'not_started', progress:0 },
      { id:'interview-1', branch:'work', track:'interviews', title:'Подготовить 5 вопросов', description:'Собеседования: network/Linux/support', xp:25, status:'not_started', progress:0 }
    ],
    log: [
      { id:'log-seed-1', task_id:'ccna-1', title:'CCNA Day 1', branch:'learning', track:'ccna', xp:40, done_at:yesterday + 'T10:00:00' },
      { id:'log-seed-2', task_id:'eng-seed', title:'Tutor conversation', branch:'learning', track:'english', xp:30, minutes:60, done_at:yesterday + 'T18:00:00' },
      { id:'log-seed-3', task_id:'eng-seed-2', title:'Podcast shadowing', branch:'learning', track:'english', xp:15, minutes:25, done_at:iso() }
    ],
    undoStack: [],
    sync: { status:'local', last_synced_at:'', last_error:'' }
  };

  window.APP_STATE = structuredClone ? structuredClone(window.RPG_DEFAULT_STATE) : JSON.parse(JSON.stringify(window.RPG_DEFAULT_STATE));
})();
