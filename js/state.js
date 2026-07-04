(function(){
  const { nowIso, todayKey } = window.APP_UTILS;
  const yesterday = new Date(Date.now() - 86400000).toISOString();

  const checklist = (items) => items.map((text, index) => ({ id:`c${index + 1}`, text, done:false }));
  const makeQuest = (data) => ({
    id: data.id,
    branch_id: data.branch_id,
    track_id: data.track_id,
    title: data.title,
    goal: data.goal || data.description || '',
    theory: data.theory || 'Коротко сформулируй, что понял перед зачётом.',
    practice: data.practice || data.description || 'Сделай маленький практический шаг.',
    checklist: data.checklist || checklist(['Открыл материал', 'Сделал практику', 'Записал результат']),
    note: data.note || '',
    result: data.result || '',
    status: data.status || 'not_started',
    xp: Number(data.xp || 10),
    estimated_minutes: Number(data.estimated_minutes || 20),
    difficulty: data.difficulty || 'normal',
    review_at: data.review_at || '',
    source_url: data.source_url || '',
    order_index: Number(data.order_index || 0),
    due_date: data.due_date || '',
    completed_at: data.completed_at || ''
  });

  const ccnaQuests = Array.from({ length: 63 }, (_, i) => {
    const day = i + 1;
    const done = day <= 11;
    return makeQuest({
      id:`ccna-${day}`,
      branch_id:'learning',
      track_id:'ccna',
      title: day === 12 ? 'CCNA Day 12 — OSPF: основы' : `CCNA Day ${day}`,
      goal: `Закрыть Jeremy's IT Lab Day ${day} и понять основные идеи урока.`,
      theory: 'Посмотри урок, выпиши 2-3 ключевые идеи своими словами.',
      practice: 'Сделай Packet Tracer / lab часть или короткий recall без подсказок.',
      checklist: checklist(['Видео просмотрено', 'Практика сделана', '3 тезиса записаны']),
      status: done ? 'done' : day === 12 ? 'in_progress' : 'locked',
      xp: 40,
      estimated_minutes: 45,
      difficulty: day >= 12 ? 'medium' : 'normal',
      order_index: day,
      completed_at: done ? yesterday : ''
    });
  });

  const seedLogs = ccnaQuests.filter(q => q.status === 'done').map(q => ({
    id:`log-${q.id}`,
    quest_id:q.id,
    client_event_id:`seed-${q.id}`,
    title:q.title,
    branch_id:q.branch_id,
    track_id:q.track_id,
    xp:q.xp,
    done_at:yesterday
  }));

  window.RPG_DEFAULT_STATE = {
    version: 4,
    ui: { view:'overview', branch_id:'learning', track_id:'ccna', quest_id:'ccna-12' },
    session: { owner_id:'local', anonymous:false },
    settings: {
      character_name: 'Оператор',
      sync_enabled: true,
      daily_xp_soft_cap: 180
    },
    branches: [
      { id:'learning', title:'Обучение', accent:'#6ee7da', description:'CCNA, English, Linux' },
      { id:'projects', title:'Проекты', accent:'#c9895b', description:'NAS, ESP32, Arduino, чиптюнинг' },
      { id:'health', title:'Здоровье / рутина', accent:'#8ccf7e', description:'Бассейн, рутина, активность' },
      { id:'work', title:'Работа / развитие', accent:'#d7b56d', description:'NOC/DevOps, резюме, собеседования' }
    ],
    tracks: [
      { id:'ccna', branch_id:'learning', title:'CCNA', target_xp:2520 },
      { id:'english', branch_id:'learning', title:'English', target_xp:900 },
      { id:'linux', branch_id:'learning', title:'Linux', target_xp:700 },
      { id:'nas', branch_id:'projects', title:'NAS / проекты', target_xp:500 },
      { id:'esp32', branch_id:'projects', title:'ESP32 + RFID', target_xp:400 },
      { id:'arduino', branch_id:'projects', title:'Arduino бар', target_xp:300 },
      { id:'chiptuning', branch_id:'projects', title:'Чиптюнинг', target_xp:600 },
      { id:'pool', branch_id:'health', title:'Бассейн', target_xp:360 },
      { id:'routine', branch_id:'health', title:'Базовая рутина', target_xp:300 },
      { id:'walking', branch_id:'health', title:'Ходьба', target_xp:300 },
      { id:'noc-devops', branch_id:'work', title:'NOC/DevOps путь', target_xp:800 },
      { id:'resume', branch_id:'work', title:'Резюме', target_xp:250 },
      { id:'interviews', branch_id:'work', title:'Собеседования', target_xp:350 }
    ],
    quests: [
      ...ccnaQuests,
      makeQuest({ id:'english-daily', branch_id:'learning', track_id:'english', title:'English — 15 мин listening/speaking', goal:'Поддержать ежедневный контакт с английским.', practice:'15 минут clean practice: listening + speaking/shadowing.', checklist:checklist(['15 минут сделано', '1 фраза вслух', 'короткая заметка']), xp:15, status:'in_progress', due_date:todayKey() }),
      makeQuest({ id:'linux-perms', branch_id:'learning', track_id:'linux', title:'Повторение прав доступа', goal:'Вспомнить chmod/chown/groups.', practice:'Сделать 5 Anki/retrieval вопросов.', xp:15, status:'in_progress', due_date:todayKey() }),
      makeQuest({ id:'nas-samba', branch_id:'projects', track_id:'nas', title:'NAS — настроить Samba-шару', goal:'Сделать рабочую шару для домашней сети.', practice:'Папка, права, доступ с Windows.', checklist:checklist(['Выбрана папка', 'Права настроены', 'Проверен доступ']), xp:60, status:'in_progress' }),
      makeQuest({ id:'esp32-uid', branch_id:'projects', track_id:'esp32', title:'ESP32 — проверить UID карты', goal:'Понять, читает ли RFID связка карту стабильно.', practice:'Serial log + 3 успешных чтения подряд.', xp:45, status:'not_started' }),
      makeQuest({ id:'arduino-bar', branch_id:'projects', track_id:'arduino', title:'Arduino бар — MVP demo', goal:'Собрать маленькое демонстрационное действие.', practice:'Одна кнопка/датчик + понятный вывод.', xp:50, status:'not_started' }),
      makeQuest({ id:'chip-services', branch_id:'projects', track_id:'chiptuning', title:'Чиптюнинг — список услуг', goal:'Собрать структуру услуг сайта.', practice:'Stage 1, DPF/EGR, диагностика, тексты.', xp:40, status:'not_started' }),
      makeQuest({ id:'pool-0630', branch_id:'health', track_id:'pool', title:'Бассейн 6:30', goal:'Поддержать ритм 2-3 раза в неделю.', practice:'Спокойная тренировка без перегруза.', xp:25, status:'in_progress', due_date:todayKey() }),
      makeQuest({ id:'routine-base', branch_id:'health', track_id:'routine', title:'Базовая рутина', goal:'Сон, вода, порядок, короткий план дня.', practice:'Закрыть минимум рутины.', xp:15, status:'in_progress', due_date:todayKey() }),
      makeQuest({ id:'walking-20', branch_id:'health', track_id:'walking', title:'Ходьба / активность', goal:'20-30 минут движения.', practice:'Прогулка без героизма.', xp:15, status:'not_started' }),
      makeQuest({ id:'noc-practice', branch_id:'work', track_id:'noc-devops', title:'Linux/network practice', goal:'Один маленький шаг в NOC/DevOps путь.', practice:'Команда, заметка, вывод.', xp:30, status:'in_progress' }),
      makeQuest({ id:'resume-update', branch_id:'work', track_id:'resume', title:'Обновить резюме', goal:'Улучшить один блок резюме.', practice:'Навык, проект или опыт.', xp:30, status:'not_started' }),
      makeQuest({ id:'interview-questions', branch_id:'work', track_id:'interviews', title:'Подготовить 5 вопросов', goal:'Собеседования: network/Linux/support.', practice:'5 вопросов + короткие ответы.', xp:25, status:'not_started' })
    ],
    quest_logs: seedLogs,
    reviews: [],
    undo_stack: [],
    queue: [],
    sync: { status:'local saved', last_synced_at:'', last_error:'' }
  };

  window.APP_STATE = window.APP_UTILS.clone(window.RPG_DEFAULT_STATE);
})();
