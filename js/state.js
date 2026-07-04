(function(){
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const demoLessons = Array.from({ length: 63 }, (_, i) => ({
    id: 'ccna-' + (i + 1), course: 'ccna', day_number: i + 1, title: 'CCNA Day ' + (i + 1),
    description: 'Jeremy\'s IT Lab CCNA Free Course — Day ' + (i + 1), xp: 40,
    status: i < 11 ? 'done' : 'not_started', completed_at: i < 11 ? yesterday : null
  }));

  window.LEVELS = [0,100,250,500,900,1400,2000,2800,3800,5000];
  window.APP_STATE = {
    session: null,
    user: null,
    demoMode: true,
    loading: false,
    settings: { english_target_hours: 300, character_name: 'Оператор' },
    quests: [
      { id:'q1', title:'CCNA · Day 12 — OSPF: основы', description:'видео + Packet Tracer лаба', branch:'learning', area:'CCNA', type:'lesson', xp:40, minutes:45, status:'active', due_date:today, created_at:yesterday },
      { id:'q2', title:'English · 15 мин listening/speaking', description:'короткая практика без перегруза', branch:'learning', area:'English', type:'english_activity', xp:15, minutes:15, status:'active', due_date:today, created_at:yesterday },
      { id:'q3', title:'NAS — выбрать ОС для сервера', description:'следующий шаг проекта', branch:'hobby', area:'NAS', type:'project_task', xp:60, minutes:60, status:'active', due_date:today, created_at:yesterday }
    ],
    projects: [
      { id:'p1', name:'NAS / домашний сервер', description:'Домашнее хранилище и сервисы', area:'hobby', status:'active', importance:'высокая', difficulty:'средняя', target_xp:500, current_stage:'настройка ОС и RAID', created_at:yesterday },
      { id:'p2', name:'ESP32 + RFID замок', description:'Контроль доступа на ESP32', area:'hobby', status:'active', importance:'средняя', difficulty:'средняя', target_xp:400, current_stage:'прошивка чтения карт', created_at:yesterday },
      { id:'p3', name:'Chip tuning ECU', description:'Пауза', area:'hobby', status:'paused', importance:'низкая', difficulty:'высокая', target_xp:600, current_stage:'на паузе', created_at:yesterday }
    ],
    projectTasks: [
      { id:'pt1', project_id:'p1', title:'Выбрать ОС для сервера', description:'TrueNAS / Debian / Unraid', xp:60, status:'active', created_at:yesterday },
      { id:'pt2', project_id:'p1', title:'Samba share draft', description:'Черновая конфигурация', xp:120, status:'done', completed_at:yesterday, created_at:yesterday },
      { id:'pt3', project_id:'p2', title:'RFID read sketch', description:'Проверить чтение UID', xp:90, status:'done', completed_at:yesterday, created_at:yesterday }
    ],
    courseLessons: demoLessons,
    englishActivities: [
      { id:'e1', title:'Tutor conversation', minutes:60, xp:30, skills:['listening','speaking','tutor'], note:'B2 practice', activity_date:yesterday, created_at:yesterday },
      { id:'e2', title:'Podcast shadowing', minutes:25, xp:15, skills:['listening','speaking'], note:'clean minutes', activity_date:today, created_at:today }
    ],
    xpEvents: [
      { id:'x1', amount:40, area:'CCNA', source_type:'lesson', source_id:'ccna-1', note:'CCNA Day 1', created_at:yesterday + 'T10:00:00' },
      { id:'x2', amount:30, area:'English', source_type:'english_activity', source_id:'e1', note:'Tutor conversation', created_at:yesterday + 'T18:00:00' },
      { id:'x3', amount:15, area:'English', source_type:'english_activity', source_id:'e2', note:'Podcast shadowing', created_at:today + 'T09:00:00' },
      { id:'x4', amount:120, area:'NAS', source_type:'project_task', source_id:'pt2', note:'Samba draft', created_at:yesterday + 'T20:00:00' },
      { id:'x5', amount:90, area:'ESP32', source_type:'project_task', source_id:'pt3', note:'RFID read sketch', created_at:yesterday + 'T21:00:00' }
    ]
  };
})();
