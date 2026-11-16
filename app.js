(() => {
  const D = window.PHONICS_DATA;
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const esc = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const slug = s => String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-');
  const shuffle = a => [...a].sort(()=>Math.random()-.5);
  const storage = {
    get(k, fallback){try{const v=localStorage.getItem('phonics-'+k);return v===null?fallback:JSON.parse(v)}catch(e){return fallback}},
    set(k,v){try{localStorage.setItem('phonics-'+k,JSON.stringify(v))}catch(e){}}
  };
  const state = {page:'home',vowel:'A',lesson:null,lessonSearch:'',lessonStage:'all',familySearch:'',familyVowel:'all',familyCategory:'all',ruleSearch:'',ruleGroup:'all',atlasSearch:'',quiz:null,quizIndex:0,quizAnswers:[],quizScore:0};
  let completed = storage.get('completed',[]);
  let bestScore = storage.get('best-score',0);
  let selectedVoice = '';

  const pageNames = {home:'Tổng quan',lessons:'Lộ trình 72 bài',vowels:'Nguyên âm A–Y',families:'Word Families',rules:'Kho quy tắc',atlas:'Thư viện ảnh',documents:'Tài liệu nguồn',practice:'Luyện tập & kiểm tra'};
  function setPage(page){state.page=page;state.lesson=null;render();window.scrollTo({top:0,behavior:'smooth'});}
  function speak(text){
    if(!('speechSynthesis' in window)){alert('Trình duyệt này chưa hỗ trợ đọc văn bản.');return;}
    window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(String(text).replace(/[\[\]{}]/g,''));
    const voices=window.speechSynthesis.getVoices();
    let v=voices.find(x=>x.name===selectedVoice);
    if(!v) v=voices.find(x=>/^en-GB/i.test(x.lang)) || voices.find(x=>/^en/i.test(x.lang));
    if(v) u.voice=v;
    u.lang=v?.lang || 'en-GB'; u.rate=.86; u.pitch=1;
    window.speechSynthesis.speak(u);
  }
  function initVoices(){
    const sel=$('#voice-select'); if(!sel || !('speechSynthesis' in window)) return;
    const voices=window.speechSynthesis.getVoices();
    const keep=sel.value;
    sel.innerHTML='<option value="">Tự chọn en-GB</option>'+voices.filter(v=>/^en/i.test(v.lang)).map(v=>`<option value="${esc(v.name)}">${esc(v.name)} · ${esc(v.lang)}</option>`).join('');
    if(keep) sel.value=keep;
  }
  function speakButton(word){return `<button class="speak-btn" data-speak="${esc(word)}" title="Nghe phát âm">▶</button>`;}
  function wordChip(word){return `<span class="word-chip"><b>${esc(word)}</b>${speakButton(word)}</span>`;}
  function progressPct(){return Math.round(completed.length/D.lessons.length*100)||0;}
  function stageFor(id){return D.stages.find(s=>id>=s.start&&id<=s.end)||D.stages[0];}
  function stageStats(s){const total=s.end-s.start+1;const done=completed.filter(id=>id>=s.start&&id<=s.end).length;return {total,done};}
  function updateNav(){
    $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===state.page));
    $('#page-crumb').textContent=pageNames[state.page]||'';
  }
  function render(){
    updateNav();
    const root=$('#app-content');
    const pages={home:renderHome,lessons:renderLessons,vowels:renderVowels,families:renderFamilies,rules:renderRules,atlas:renderAtlas,documents:renderDocuments,practice:renderPractice};
    root.innerHTML=(pages[state.page]||renderHome)();
    bindPageEvents();
  }
  function renderHome(){
    const pct=progressPct();
    const next=D.lessons.find(x=>!completed.includes(x.id))||D.lessons[D.lessons.length-1];
    return `
      <div class="hero">
        <div><div class="eyebrow">LEARN · LISTEN · READ · SPELL</div><h1>Chinh phục phát âm<br>từng quy tắc một.</h1><p>Hệ thống học Phonics dành cho người Việt: đi từ chữ cái và âm cơ bản đến Word Families, ngoại lệ, trọng âm và đọc hiểu. Nội dung chính dùng IPA Anh–Anh (BrE).</p><div class="hero-cta"><button class="btn btn-primary" data-action="open-next">▶ Tiếp tục học · Bài ${String(next.id).padStart(2,'0')}</button><button class="btn btn-white" data-page="vowels">Khám phá nguyên âm A–Y</button></div></div>
        <div class="hero-side"><div class="hero-symbol">æ · ɪ · ʌ</div><small>PHONICS LEARNING SYSTEM</small></div>
      </div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-icon">▤</div><div><div class="stat-value">72</div><div class="stat-label">Bài học theo lộ trình</div></div></div>
        <div class="stat-card"><div class="stat-icon">A–Y</div><div><div class="stat-value">6</div><div class="stat-label">Nhóm nguyên âm</div></div></div>
        <div class="stat-card"><div class="stat-icon">▦</div><div><div class="stat-value">172</div><div class="stat-label">Khuôn âm trong chỉ mục</div></div></div>
        <div class="stat-card"><div class="stat-icon">▧</div><div><div class="stat-value">57</div><div class="stat-label">Trang ảnh học liệu</div></div></div>
      </div>
      <div class="two-col">
        <div class="card">
          <div class="progress-head"><div><div class="eyebrow">TIẾN ĐỘ CỦA BẠN</div><h2 style="margin:5px 0 0">Hành trình 72 bài học</h2></div><strong style="font-size:22px;color:var(--teal)">${pct}%</strong></div>
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
          <p class="small-text" style="margin:10px 0 0">Đã hoàn thành ${completed.length}/${D.lessons.length} bài. Tiến độ được lưu trên trình duyệt của thiết bị này.</p>
          <div class="section-row"><h3>8 giai đoạn học</h3><a href="#" data-page="lessons">Xem toàn bộ bài học →</a></div>
          <div class="stage-grid">${D.stages.map(s=>{const st=stageStats(s);return `<div class="stage-card" data-stage="${s.id}"><div class="stage-number">GIAI ĐOẠN 0${s.id} · BÀI ${s.range}</div><h3>${esc(s.title)}</h3><p>${esc(s.desc)}</p><div class="stage-progress">${st.done}/${st.total} bài hoàn thành</div></div>`}).join('')}</div>
        </div>
        <div class="card">
          <div class="eyebrow">MỘT BUỔI HỌC MẪU</div><h2 style="margin:5px 0 16px">Chu trình 35 phút</h2>
          <div class="routine-list">
            <div class="routine-item"><div class="routine-time">05′</div><div><strong>Nghe và phân biệt âm</strong><span>Nghe mẫu, quan sát khẩu hình, nhận diện âm đích.</span></div></div>
            <div class="routine-item"><div class="routine-time">07′</div><div><strong>Nhận dạng khuôn chữ</strong><span>Gạch chân grapheme và ghép âm theo thứ tự.</span></div></div>
            <div class="routine-item"><div class="routine-time">08′</div><div><strong>Gom Word Families</strong><span>Đọc các từ cùng vần, so sánh âm đầu và âm cuối.</span></div></div>
            <div class="routine-item"><div class="routine-time">08′</div><div><strong>Đọc câu ứng dụng</strong><span>Đọc 6 câu, đánh dấu khuôn âm và kiểm tra hiểu.</span></div></div>
            <div class="routine-item"><div class="routine-time">07′</div><div><strong>Nghe – viết – tự sửa</strong><span>Viết 3 từ và 1 câu, kiểm tra lại âm cuối.</span></div></div>
          </div>
          <div class="note-box" style="margin-top:18px">Nguyên tắc quan trọng: khuôn chữ là dấu hiệu nhận dạng, không phải định luật tuyệt đối. Với các nhóm nhiều cách đọc như <b>ea, oo, ou, ow, ough</b>, hãy học theo từ mẫu và IPA.</div>
        </div>
      </div>`;
  }
  function renderLessons(){
    if(state.lesson){return renderLessonDetail(state.lesson);}
    const q=state.lessonSearch.toLowerCase();
    const list=D.lessons.filter(l=>(state.lessonStage==='all'||Number(state.lessonStage)===stageFor(l.id).id)&&(!q||`${l.id} ${l.title} ${l.focus} ${l.pattern} ${l.raw_text}`.toLowerCase().includes(q)));
    return `<div class="page-head"><div><div class="eyebrow">CHƯƠNG TRÌNH TỪ CƠ BẢN ĐẾN NÂNG CAO</div><h1>Lộ trình 72 bài học</h1><p>Giữ thứ tự 34 bài nền tảng từ bộ ảnh “Order of Phonics”, sau đó mở rộng Word Families, khuôn âm khó và kỹ năng đọc.</p></div><span class="tag">${completed.length}/72 hoàn thành</span></div>
      <div class="toolbar"><input class="field search-field" id="lesson-search" placeholder="Tìm bài học, khuôn chữ, IPA..." value="${esc(state.lessonSearch)}"><select class="field" id="lesson-stage"><option value="all">Tất cả giai đoạn</option>${D.stages.map(s=>`<option value="${s.id}" ${String(s.id)===state.lessonStage?'selected':''}>GĐ ${s.id} · Bài ${s.range}</option>`).join('')}</select><button class="btn btn-outline" data-action="reset-lesson-filter">Đặt lại</button></div>
      <div class="section-row"><h2>${list.length} bài học</h2><span class="small-text">Chọn một bài để mở nội dung, từ mẫu và bài đọc</span></div>
      <div class="lesson-grid">${list.map(l=>{const st=stageFor(l.id);const done=completed.includes(l.id);return `<div class="lesson-card ${done?'done':''}" data-lesson-id="${l.id}"><span class="lesson-status">${done?'✓':''}</span><div class="lesson-num">BÀI ${String(l.id).padStart(2,'0')} · GIAI ĐOẠN ${st.id}</div><h3>${esc(l.title)}</h3><p>${esc(l.focus||l.pattern||st.title)}</p></div>`}).join('')||'<div class="empty-state">Không tìm thấy bài học phù hợp.</div>'}</div>`;
  }
  function renderLessonDetail(id){
    const l=D.lessons.find(x=>x.id===id); if(!l)return '';
    const st=stageFor(id);const done=completed.includes(id);
    const sampleWords=(l.tower||[]).join(' ').match(/[A-Za-z]+(?:['’-][A-Za-z]+)?/g)||[];
    const uniqueWords=[...new Set(sampleWords)].filter(w=>w.length>1&&!/^(IPA|âm|cụm|mục|tiêu|đọc|tăng|dần|từ|mẫu|nghe|chuẩn)$/i.test(w)).slice(0,12);
    return `<div class="page-head"><div><button class="btn btn-soft btn-small" data-action="back-lessons">← Danh sách bài học</button><div class="eyebrow" style="margin-top:14px">GIAI ĐOẠN ${st.id} · BÀI ${String(id).padStart(2,'0')}</div><h1>${esc(l.title)}</h1><p>${esc(st.title)} · ${esc(l.focus)}</p></div><span class="tag">IPA Anh–Anh · BrE</span></div>
      <div class="lesson-detail">
        <div class="detail-main">
          <div class="detail-banner"><div class="eyebrow">KHUÔN CHỮ TRỌNG TÂM</div><h2><span class="pattern-chip">${esc(l.pattern||'Xem nội dung bài')}</span></h2><p>${esc(l.teaching_note||'Nhận diện mẫu chữ, nghe âm và kiểm tra cách đọc bằng từ mẫu.')}</p></div>
          <div class="info-box"><h3>①② Nghe âm & nhận dạng quy tắc</h3><p>Giáo viên đọc từ mẫu; người học nghe, xác định âm mục tiêu, gạch chân chữ hoặc nhóm chữ tương ứng và đọc lại theo IPA.</p><div class="word-cloud">${uniqueWords.slice(0,6).map(wordChip).join('')}</div></div>
          <div class="info-box"><h3>③ Word Family – gom họ từ</h3><p>${esc(l.family_text||'Phân nhóm từ có cùng phần vần và cùng âm mục tiêu.')}</p></div>
          <div class="info-box"><h3>④ Tháp đọc – từ âm đến chữ và từ</h3><ul class="inline-list">${(l.tower||[]).map(x=>`<li>${esc(x)} ${speakButton((x.match(/[A-Za-z]+/g)||[]).slice(1,5).join(' '))}</li>`).join('')}</ul></div>
          <div class="info-box"><h3>⑤ Đọc ứng dụng – 6 câu</h3><div class="sentence-list">${(l.sentences||[]).map(s=>`<div class="sentence-row"><span class="sentence-text">${esc(s)}</span>${speakButton(s.replace(/^\d+\.\s*/,''))}</div>`).join('')}</div></div>
          ${l.quick_practice?`<div class="info-box"><h3>✎ Bài tập nhanh</h3><p>${esc(l.quick_practice)}</p></div>`:''}
          ${l.exception?`<div class="note-box"><b>⚠ Ngoại lệ / dễ nhầm:</b> ${esc(l.exception)}</div>`:''}
          <details class="info-box raw-details"><summary>Xem toàn bộ ghi chú của bài trong giáo trình</summary><div class="raw-text">${esc(l.raw_text||'')}</div></details>
        </div>
        <aside class="detail-side">
          <div class="info-box"><div class="eyebrow">TỰ ĐÁNH GIÁ</div><h3 style="margin-top:7px">Đạt trước khi chuyển bài</h3><p class="small-text">Đọc đúng ít nhất 8/10 từ, viết đúng 4/5 từ và giải thích được vì sao từ thuộc nhóm đang học.</p><div class="note-box">${esc(l.self_check||'Đọc đúng 8/10 từ · Viết đúng 4/5 từ · Hiểu 6 câu')}</div><button class="btn ${done?'btn-outline':'btn-primary'}" style="width:100%;margin-top:13px" data-action="toggle-complete" data-id="${id}">${done?'✓ Đã hoàn thành · Bỏ đánh dấu':'Đánh dấu hoàn thành'}</button></div>
          <div class="info-box"><div class="eyebrow">ĐIỀU HƯỚNG</div><div class="check-row" style="margin-top:12px"><button class="btn btn-outline btn-small" data-action="lesson-prev" ${id===1?'disabled':''}>← Bài trước</button><button class="btn btn-primary btn-small" data-action="lesson-next" ${id===72?'disabled':''}>Bài tiếp →</button></div><p class="small-text" style="margin:12px 0 0">${id}/72 · ${st.title}</p></div>
          <div class="info-box"><div class="eyebrow">LƯU Ý PHÁT ÂM</div><p class="small-text">Âm cuối phải được giữ rõ; không tự thêm nguyên âm /ə/ sau phụ âm cuối. Nghe giọng mẫu trên thiết bị để đối chiếu.</p></div>
        </aside>
      </div>`;
  }
  const vowelExamples={
    A:{'/æ/':['cat','map','bad'],'/eɪ/':['lake','name','rain','day'],'/ɑː/':['car','bar','star'],'/ɔː/':['tall','saw','fault'],'/ɒ/':['want','wash','watch','what'],'/ə/':['about','ago','soda'],'/eə/':['care','share','hair','fair'],'/ɪ/':['village','message'],'/e/':['many','any']},
    E:{'/e/':['pen','bed','ten','left'],'/iː/':['he','she','me','tree','sea'],'/ɪ/':['begin','event','effect'],'/ə/':['problem','taken','open'],'/ɜː/':['her','term','person'],'/ɪə/':['here','mere','engineer'],'/eə/':['there','where','bear'],'/eɪ/':['break','great','steak']},
    I:{'/ɪ/':['sit','big','milk','fish'],'/aɪ/':['time','like','fine'],'/iː/':['machine','police','unique'],'/ɜː/':['bird','girl','first','shirt'],'/ə/':['pencil','fossil','civil'],'/aɪə/':['fire','hire','tire'],'/ɪə/':['pier','fierce']},
    O:{'/ɒ/':['hot','box','dog','stop'],'/əʊ/':['home','note','rose','go','no'],'/ʌ/':['son','love','money','come'],'/uː/':['do','move','lose','prove'],'/ʊ/':['woman','wolf'],'/ɔː/':['short','horse','more','board'],'/ɜː/':['word','work','world','worse'],'/ə/':['police','lemon'],'/aʊ/':['now','town','brown'],'/ɔɪ/':['coin','point','boy','toy'],'/w/':['one','once']},
    U:{'/ʌ/':['cup','sun','bus','luck'],'/juː/':['cube','use','tune','music'],'/uː/':['rule','June','rude','truth'],'/ʊ/':['put','full','bush','push'],'/ɜː/':['turn','nurse','burn','hurt'],'/ə/':['support','supply','upon'],'/ɪ/':['busy','business'],'/e/':['bury']},
    Y:{'/j/':['yes','yellow','young'],'/aɪ/':['my','try','fly','reply'],'/i/ (hoặc /iː/)':['happy','city','baby'],'/ɪ/':['gym','myth','system','symbol'],'/ɜː/':['myrtle'],'/ə/':['kiểm tra theo từ điển'],'/aɪ.ə/':['tyre','pyre']}
  };
  function renderVowels(){
    const v=D.vowels.find(x=>x.letter===state.vowel)||D.vowels[0];
    return `<div class="page-head"><div><div class="eyebrow">VOWEL SOUND MAP</div><h1>Hệ thống nguyên âm A–E–I–O–U–Y</h1><p>Mỗi chữ có thể biểu thị nhiều âm. Học theo âm IPA, dấu hiệu nhận dạng và ví dụ; không suy cách đọc chỉ từ một chữ cái đơn lẻ.</p></div><span class="tag">BrE · IPA</span></div>
      <div class="vowel-tabs">${D.vowels.map(x=>`<button class="vowel-tab ${x.letter===state.vowel?'active':''}" data-vowel="${x.letter}">${x.letter}</button>`).join('')}</div>
      <div class="section-row"><div><h2>Nguyên âm ${v.letter}</h2><p class="small-text" style="margin:0">${v.sounds.length} cách đọc / nhóm âm được liệt kê trong tài liệu quy tắc.</p></div><span class="tag">${v.sounds.length} âm / nhóm</span></div>
      <div class="sound-grid">${v.sounds.map(s=>{const examples=(vowelExamples[v.letter]||{})[s.ipa]||[];return `<div class="sound-card"><div class="sound-ipa">${esc(s.ipa)}</div><p>${esc(s.description)}</p><div class="example-line">${examples.map(w=>`<span class="example-word"><b>${esc(w)}</b>${speakButton(w)}</span>`).join('')||'<span class="small-text">Đối chiếu từng từ trong từ điển BrE.</span>'}</div></div>`}).join('')}</div>
      <div class="note-box" style="margin-top:18px"><b>Nguyên tắc học:</b> các dấu hiệu trên là xu hướng nhận dạng, không phải quy tắc tuyệt đối. Với từ ngoại lệ, từ nhiều âm tiết hoặc cách đọc thay đổi theo từ loại, hãy tra IPA BrE.</div>`;
  }
  function renderFamilies(){
    const q=state.familySearch.toLowerCase();
    const list=D.families.filter(f=>{
      const hay=`${f.pattern} ${f.family} ${f.sound_IPA} ${f.category} ${f.exceptions} ${f.notes} ${(f.words||[]).join(' ')}`.toLowerCase();
      return (!q||hay.includes(q))&&(state.familyVowel==='all'||f.vowel===state.familyVowel)&&(state.familyCategory==='all'||f.category===state.familyCategory);
    });
    const cats=[...new Set(D.families.map(f=>f.category).filter(Boolean))].sort();
    return `<div class="page-head"><div><div class="eyebrow">WORD FAMILY EXPLORER</div><h1>Tra cứu khuôn vần & gia đình từ</h1><p>Tìm khuôn chữ, IPA, nhóm quy tắc, số lượng từ, ghi chú ngoại lệ và danh sách ví dụ có trong sổ tay 5 nguyên âm ngắn.</p></div><span class="tag">172 mục tra cứu</span></div>
      <div class="toolbar"><input class="field search-field" id="family-search" placeholder="Tìm -at, /æ/, magic e, ship..." value="${esc(state.familySearch)}"><select class="field" id="family-vowel"><option value="all">Tất cả nguyên âm</option>${['A','E','I','O','U'].map(v=>`<option value="${v}" ${state.familyVowel===v?'selected':''}>Nguyên âm ${v}</option>`).join('')}</select><select class="field" id="family-category"><option value="all">Tất cả nhóm</option>${cats.map(c=>`<option value="${esc(c)}" ${state.familyCategory===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div>
      <div class="section-row"><h2>${list.length} khuôn âm</h2><span class="small-text">63 họ từ âm ngắn có danh sách từ mẫu; các mục khác có dữ liệu chỉ mục và ghi chú.</span></div>
      <div class="family-grid">${list.map(f=>`<div class="family-card"><div class="family-pattern">${esc(f.pattern)}</div><div class="family-ipa">${esc(f.sound_IPA||'')}</div><div class="family-meta">${esc(f.category||'')} · ${esc(f.number_of_words||'—')} từ tham khảo</div>${f.exceptions?`<p><b>Ngoại lệ:</b> ${esc(f.exceptions)}</p>`:''}${f.notes?`<p>${esc(f.notes)}</p>`:''}${f.words?.length?`<div class="word-cloud">${f.words.slice(0,22).map(wordChip).join('')}${f.words.length>22?`<span class="tag">+${f.words.length-22} từ</span>`:''}</div>`:'<p class="small-text">Mục chỉ mục – xem tài liệu nguồn để đối chiếu danh sách từ chi tiết.</p>'}</div>`).join('')||'<div class="empty-state">Không có khuôn âm phù hợp.</div>'}</div>`;
  }
  function renderRules(){
    const q=state.ruleSearch.toLowerCase();
    const list=D.rules.filter(r=>(state.ruleGroup==='all'||r.group===state.ruleGroup)&&(!q||`${r.id} ${r.group} ${r.scope} ${r.pattern}`.toLowerCase().includes(q)));
    const groups=[...new Set(D.rules.map(r=>r.group))];
    return `<div class="page-head"><div><div class="eyebrow">RULE INDEX</div><h1>Kho quy tắc đánh vần</h1><p>Danh mục quy tắc cấu trúc được chuyển từ tài liệu nguồn sang bảng tra cứu. Mỗi dòng là một mẫu nhận dạng, không đồng nghĩa với một quy tắc phát âm tuyệt đối.</p></div><span class="tag">${D.rules.length} mục dữ liệu</span></div>
      <div class="toolbar"><input class="field search-field" id="rule-search" placeholder="Tìm tiền tố, hậu tố, -ing, Magic E..." value="${esc(state.ruleSearch)}"><select class="field" id="rule-group"><option value="all">Tất cả nhóm</option>${groups.map(g=>`<option value="${esc(g)}" ${state.ruleGroup===g?'selected':''}>${esc(g)}</option>`).join('')}</select></div>
      <div class="section-row"><h2>${list.length} mục hiển thị</h2><span class="small-text">Nguồn: Bộ quy tắc đánh vần – bản hệ thống hóa</span></div>
      <div class="card" style="padding:0;overflow:auto"><table class="rule-table"><thead><tr><th>STT</th><th>Nhóm quy tắc</th><th>Phạm vi</th><th>Mẫu nhận dạng</th></tr></thead><tbody>${list.map(r=>`<tr><td class="rule-index">${esc(r.id)}</td><td>${esc(r.group)}</td><td>${esc(r.scope)}</td><td>${esc(r.pattern)}</td></tr>`).join('')}</tbody></table></div>
      <div class="note-box" style="margin-top:15px">Tài liệu nguồn chia các mục thành đầu từ/tiền tố, cụm chữ bên trong từ, hậu tố, cấu trúc -ing/-er, trọng âm và ngoại lệ. Hãy kết hợp từng mẫu với từ thật và IPA BrE trước khi giảng dạy.</div>`;
  }
  function renderAtlas(){
    const q=state.atlasSearch.toLowerCase();
    const list=D.images.filter(im=>!q||`${im.id} ${im.title} ${im.description}`.toLowerCase().includes(q));
    return `<div class="page-head"><div><div class="eyebrow">VISUAL LEARNING LIBRARY</div><h1>Thư viện 57 trang ảnh</h1><p>Atlas ảnh được trích xuất từ sách Phonics đã biên soạn. Chọn ảnh để phóng to; ảnh gốc được giữ theo tỷ lệ, không cắt nội dung.</p></div><span class="tag">57 hình ảnh</span></div>
      <div class="toolbar"><input class="field search-field" id="atlas-search" placeholder="Tìm tên ảnh, nhóm âm, số hình..." value="${esc(state.atlasSearch)}"></div>
      <div class="atlas-grid">${list.map(im=>`<div class="atlas-card" data-image-id="${im.id}"><img src="${im.file}" alt="${esc(im.title)}" loading="lazy"><div class="atlas-caption"><strong>H${String(im.id).padStart(2,'0')} · ${esc(im.title)}</strong><span>Trang nguồn ${im.source_page} · Mở ảnh phóng to</span></div></div>`).join('')||'<div class="empty-state">Không tìm thấy hình ảnh.</div>'}</div>`;
  }
  function renderDocuments(){
    return `<div class="page-head"><div><div class="eyebrow">SOURCE LIBRARY</div><h1>Thư viện tài liệu nguồn</h1><p>Các file quy tắc và giáo trình được đóng gói cùng ứng dụng. Có thể mở PDF, tải Word/CSV về máy hoặc dùng trực tiếp nội dung đã tích hợp trong các mục học tập.</p></div><span class="tag">9 tài liệu</span></div>
      <div class="doc-grid">${D.documents.map(doc=>`<div class="doc-card"><div class="doc-type">${esc(doc.type)} · PHONICS SOURCE</div><h3>${esc(doc.title)}</h3><p>${esc(doc.description)}</p><div class="doc-actions"><a class="btn btn-primary btn-small" href="assets/documents/${encodeURIComponent(doc.file)}" download>Tải tài liệu ↓</a>${doc.type==='PDF'?`<a class="btn btn-outline btn-small" href="assets/documents/${encodeURIComponent(doc.file)}" target="_blank" rel="noopener">Mở xem</a>`:''}</div></div>`).join('')}</div>
      <div class="note-box" style="margin-top:18px"><b>Lưu ý:</b> ứng dụng đã tích hợp 72 bài học, 6 bảng nguyên âm, 172 mục chỉ mục Word Family, 164 dòng quy tắc và 57 ảnh. Các tài liệu nguồn được giữ riêng để bạn có thể đối chiếu và biên tập tiếp.</div>`;
  }
  function createQuiz(){
    const pool=D.shortVowelFamilies.filter(f=>f.words?.length);
    const questions=[];
    for(let i=0;i<10;i++){
      const f=pool[Math.floor(Math.random()*pool.length)];
      if(i%2===0){
        const correct=f.ipa;
        const opts=shuffle([...new Set([correct,...shuffle(['/æ/','/e/','/ɪ/','/ɒ/','/ʌ/']).filter(x=>x!==correct).slice(0,3)])]);
        questions.push({type:'sound',prompt:`Khuôn vần <b>${esc(f.pattern)}</b> thuộc âm IPA nào?`,options:opts,correct,explain:`${f.pattern} thường được đọc ${f.ipa} trong nhóm nguyên âm ${f.vowel}.`});
      }else{
        const word=f.words[Math.floor(Math.random()*f.words.length)];
        const candidates=pool.filter(x=>x.vowel===f.vowel&&x.pattern!==f.pattern);
        const opts=shuffle([f.pattern,...shuffle(candidates).slice(0,3).map(x=>x.pattern)]);
        questions.push({type:'family',prompt:`Từ <b>${esc(word)}</b> thuộc khuôn vần nào trong bảng họ từ âm ngắn?`,options:opts,correct:f.pattern,explain:`Trong sổ tay, ${word} được xếp vào họ ${f.pattern} (${f.ipa}).`});
      }
    }
    state.quiz=questions;state.quizIndex=0;state.quizAnswers=[];state.quizScore=0;
  }
  function renderPractice(){
    if(!state.quiz){return `<div class="quiz-panel"><div class="page-head"><div><div class="eyebrow">PRACTICE LAB</div><h1>Luyện tập & kiểm tra</h1><p>Kiểm tra khả năng nhận diện khuôn vần, âm IPA và phân loại Word Family. Mỗi lượt có 10 câu hỏi ngẫu nhiên.</p></div></div><div class="quiz-intro"><div class="quiz-number">PHONICS QUICK CHECK</div><div style="font-size:62px;margin:12px 0">✎</div><h2>Kiểm tra kiến thức của bạn</h2><p class="muted">10 câu hỏi · 2 dạng bài · có đáp án và giải thích sau mỗi câu</p><div class="small-text" style="margin:10px 0 18px">Điểm cao nhất hiện tại: <b>${bestScore}/10</b></div><button class="btn btn-primary" data-action="start-quiz">Bắt đầu luyện tập →</button></div></div>`;}
    if(state.quizIndex>=state.quiz.length){
      const score=state.quizScore;bestScore=Math.max(bestScore,score);storage.set('best-score',bestScore);
      return `<div class="quiz-panel"><div class="quiz-intro"><div class="quiz-number">KẾT QUẢ LUYỆN TẬP</div><div style="font-size:58px;margin:12px 0">${score>=8?'🏆':score>=5?'⭐':'📘'}</div><h2>Bạn đạt ${score}/10 điểm</h2><p class="muted">${score>=8?'Rất tốt! Bạn đã nhận diện khuôn âm khá chắc.':score>=5?'Bạn đã nắm được một phần. Hãy xem lại các câu sai và luyện thêm.':'Hãy quay lại phần nguyên âm và Word Families, sau đó thử lại.'}</p><div class="small-text" style="margin:12px 0 20px">Điểm cao nhất: <b>${bestScore}/10</b></div><button class="btn btn-primary" data-action="start-quiz">Làm lượt mới</button> <button class="btn btn-outline" data-page="families">Ôn Word Families</button></div></div>`;
    }
    const i=state.quizIndex,q=state.quiz[i],answer=state.quizAnswers[i];
    return `<div class="quiz-panel"><div class="page-head"><div><div class="eyebrow">PRACTICE LAB · CÂU ${i+1}/10</div><h1>Kiểm tra nhanh</h1><p>Chọn một đáp án đúng nhất. Hãy đọc kỹ mẫu chữ và âm IPA.</p></div><span class="tag">Điểm: ${state.quizScore}</span></div><div class="card"><div class="progress-head"><span class="small-text">Tiến độ bài kiểm tra</span><b>${i+1}/10</b></div><div class="progress-track"><div class="progress-fill" style="width:${(i+1)*10}%"></div></div><div class="quiz-number" style="margin-top:24px">${q.type==='sound'?'NHẬN DIỆN ÂM IPA':'PHÂN LOẠI WORD FAMILY'}</div><div class="quiz-question">${q.prompt}</div><div class="quiz-options">${q.options.map(o=>`<button class="quiz-option ${answer?(o===q.correct?'correct':o===answer?'wrong':''):''}" data-quiz-option="${esc(o)}" ${answer?'disabled':''}>${esc(o)}</button>`).join('')}</div>${answer?`<div class="quiz-feedback ${answer===q.correct?'good':'bad'}"><b>${answer===q.correct?'Chính xác!':'Chưa đúng.'}</b> ${esc(q.explain)}</div><div style="display:flex;justify-content:flex-end;margin-top:15px"><button class="btn btn-primary" data-action="quiz-next">${i===9?'Xem kết quả':'Câu tiếp theo →'}</button></div>`:''}</div></div>`;
  }
  function bindPageEvents(){
    $$('[data-page]', $('#app-content')).forEach(b=>b.addEventListener('click',e=>{e.preventDefault();setPage(b.dataset.page)}));
    $$('[data-speak]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();speak(b.dataset.speak)}));
    $$('[data-lesson-id]').forEach(b=>b.addEventListener('click',()=>{state.lesson=Number(b.dataset.lessonId);render();window.scrollTo({top:0,behavior:'smooth'})}));
    $$('[data-stage]').forEach(b=>b.addEventListener('click',()=>{state.lessonStage=b.dataset.stage;state.page='lessons';render()}));
    $$('[data-vowel]').forEach(b=>b.addEventListener('click',()=>{state.vowel=b.dataset.vowel;render()}));
    $$('[data-image-id]').forEach(b=>b.addEventListener('click',()=>openImage(Number(b.dataset.imageId))));
    const ls=$('#lesson-search'); if(ls) ls.addEventListener('input',()=>{state.lessonSearch=ls.value;const pos=ls.selectionStart;render();const n=$('#lesson-search');n?.focus();n?.setSelectionRange(pos,pos)});
    const lstage=$('#lesson-stage'); if(lstage) lstage.addEventListener('change',()=>{state.lessonStage=lstage.value;render()});
    const fs=$('#family-search'); if(fs) fs.addEventListener('input',()=>{state.familySearch=fs.value;const pos=fs.selectionStart;render();const n=$('#family-search');n?.focus();n?.setSelectionRange(pos,pos)});
    const fv=$('#family-vowel'); if(fv) fv.addEventListener('change',()=>{state.familyVowel=fv.value;render()});
    const fc=$('#family-category'); if(fc) fc.addEventListener('change',()=>{state.familyCategory=fc.value;render()});
    const rs=$('#rule-search'); if(rs) rs.addEventListener('input',()=>{state.ruleSearch=rs.value;const pos=rs.selectionStart;render();const n=$('#rule-search');n?.focus();n?.setSelectionRange(pos,pos)});
    const rg=$('#rule-group'); if(rg) rg.addEventListener('change',()=>{state.ruleGroup=rg.value;render()});
    const as=$('#atlas-search'); if(as) as.addEventListener('input',()=>{state.atlasSearch=as.value;const pos=as.selectionStart;render();const n=$('#atlas-search');n?.focus();n?.setSelectionRange(pos,pos)});
    $$('[data-action]').forEach(b=>b.addEventListener('click',()=>handleAction(b)));
    $$('[data-quiz-option]').forEach(b=>b.addEventListener('click',()=>answerQuiz(b.dataset.quizOption)));
  }
  function handleAction(b){
    const a=b.dataset.action;
    if(a==='open-next'){const l=D.lessons.find(x=>!completed.includes(x.id))||D.lessons[0];state.page='lessons';state.lesson=l.id;render();}
    if(a==='back-lessons'){state.lesson=null;render();}
    if(a==='toggle-complete'){const id=Number(b.dataset.id);completed=completed.includes(id)?completed.filter(x=>x!==id):[...completed,id].sort((a,b)=>a-b);storage.set('completed',completed);render();}
    if(a==='lesson-prev'){state.lesson=Math.max(1,state.lesson-1);render();}
    if(a==='lesson-next'){state.lesson=Math.min(72,state.lesson+1);render();}
    if(a==='reset-lesson-filter'){state.lessonSearch='';state.lessonStage='all';render();}
    if(a==='start-quiz'){createQuiz();render();}
    if(a==='quiz-next'){state.quizIndex++;render();}
  }
  function answerQuiz(answer){
    if(state.quizAnswers[state.quizIndex])return;
    const q=state.quiz[state.quizIndex];state.quizAnswers[state.quizIndex]=answer;if(answer===q.correct)state.quizScore++;render();
  }
  function openImage(id){
    const im=D.images.find(x=>x.id===id);if(!im)return;
    $('#modal-root').innerHTML=`<div class="modal-backdrop" data-close-modal><div class="modal-card" role="dialog" aria-modal="true"><div class="modal-top"><div><div class="eyebrow">HÌNH ${String(im.id).padStart(2,'0')} / 57</div><h3>${esc(im.title)}</h3></div><button class="icon-button" data-close-modal aria-label="Đóng">✕</button></div><img src="${im.file}" alt="${esc(im.title)}"><p class="small-text" style="margin:12px 0 0">${esc(im.description)} · Trang nguồn ${im.source_page}</p></div></div>`;
    $$('[data-close-modal]').forEach(el=>el.addEventListener('click',e=>{if(e.target===el||e.currentTarget===el)$('#modal-root').innerHTML='';}));
  }
  $('#theme-toggle')?.addEventListener('click',()=>{document.body.classList.toggle('dark');storage.set('dark',document.body.classList.contains('dark'));});
  $('#voice-select')?.addEventListener('change',e=>{selectedVoice=e.target.value;});
  const isDark=storage.get('dark',false);if(isDark)document.body.classList.add('dark');
  $$('.nav-item').forEach(b=>b.addEventListener('click',()=>setPage(b.dataset.page)));
  if('speechSynthesis' in window){initVoices();window.speechSynthesis.onvoiceschanged=initVoices;}
  render();
  // Optional PWA support when served from localhost or HTTPS. The app also works by opening index.html directly.
  if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){navigator.serviceWorker.register('sw.js').catch(()=>{});}
})();
