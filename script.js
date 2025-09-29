// Basic jsPsych starter with second-screen ON/OFF via URL ?cond=0/1 and pid
// Within-subject factors: ad_format (incontent vs popup) × timing (arousal vs calm)
// Replace STIM_LIST with your actual MP4 file names.

function qp(name, def=null){
  const url = new URL(window.location.href);
  return url.searchParams.get(name) ?? def;
}

const PID = qp('pid', 'P' + Math.floor(Math.random()*1e6));
const SECOND_SCREEN = Number(qp('cond', '0')); // 0=OFF,1=ON

// --- Mock stimuli list (replace with real file names in /assets) ---
const STIM_LIST = [
  // each item cycles through the 4 within-subject cells
  {id:'BKB_001'},
  {id:'BKB_002'},
  {id:'BKB_003'},
  {id:'BKB_004'},
  {id:'BKB_005'},
  {id:'BKB_006'}
];

// Build 4 cells per item
const CELLS = [
  {ad_format:'incontent', timing:'arousal'},
  {ad_format:'incontent', timing:'calm'},
  {ad_format:'popup',     timing:'arousal'},
  {ad_format:'popup',     timing:'calm'}
];

// Simple shuffle
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

// Chat stream dummy data
const CHAT_LINES = [
  "레츠고! 🔥", "디펜스! 디펜스!", "와 미쳤다", "이건 3점 각", "타임아웃?", "MVP 누구?",
  "심판 뭐함;;", "쐐기 3점 가자", "리바운드좀", "GG"
];

function showChatPane(){
  const pane = document.getElementById('chatPane');
  if(SECOND_SCREEN===1){ pane.style.display='flex'; streamChat(); }
}

let chatTimer=null, toastTimer=null;
function streamChat(){
  const stream = document.getElementById('chatStream');
  function pushLine(){
    const div = document.createElement('div');
    div.className='msg';
    div.textContent = CHAT_LINES[Math.floor(Math.random()*CHAT_LINES.length)];
    stream.appendChild(div);
    stream.scrollTop = stream.scrollHeight;
  }
  pushLine();
  chatTimer = setInterval(pushLine, 1200);
}

function toast(msg, ms=3000){
  if(SECOND_SCREEN!==1) return;
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.display='block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{ el.style.display='none'; }, ms);
}

// Video & overlay control
const video = () => document.getElementById('video');
const bug = () => document.getElementById('bug');
const popup = () => document.getElementById('popup');

async function playStim(stim){ // stim: {id, ad_format, timing}
  return new Promise(async (resolve)=>{
    const vp = document.getElementById('container');
    vp.style.display='flex';
    showChatPane();
    bug().style.display='none'; popup().style.display='none';

    // choose a placeholder video (user should replace with real assets)
    // For demo, we just load the same sample from web if offline assets missing
    const src = `assets/${stim.id}_${stim.timing}_${stim.ad_format}.mp4`;

    const v = video();
    v.src = src;
    v.currentTime = 0;
    v.play().catch(()=>{});

    // Simulate timing: we don't know T0, so we schedule overlay at 10.5s/12.9s for arousal,
    // and at 4.0s/6.4s for calm. Adjust to your actual clips.
    const schedule = (stim.timing==='arousal')
      ? [10500, 12900]
      : [4000, 6400];

    const overlay = (stim.ad_format==='incontent') ? bug() : popup();
    const on = () => { overlay.style.display='block'; };
    const off = () => { overlay.style.display='none'; };

    // Toast lockout: skip toast ±1000ms around ad
    let adWindows = schedule.map(t=>[t-1000, t+1000]);

    const t0 = performance.now();
    const tick = setInterval(()=>{
      const t = performance.now() - t0;

      // schedule overlays
      if(Math.abs(t - schedule[0]) < 80 || Math.abs(t - schedule[1]) < 80){
        on();
        setTimeout(off, 1300); // 1.3s display
      }

      // schedule occasional toast
      if(SECOND_SCREEN===1 && Math.random() < 0.02){
        const insideAd = adWindows.some(([a,b])=> t>=a && t<=b);
        if(!insideAd){ toast("다음 하이라이트 추천: 역전 상황 ▶", 3000); }
      }

      // end after 18s
      if(t>18000){
        clearInterval(tick);
        v.pause(); overlay.style.display='none'; resolve();
      }
    }, 50);
  });
}

// jsPsych timeline
const jsPsych = initJsPsych({
  on_finish: function(){
    jsPsych.data.get().localSave('json', `data_${PID}.json`);
  }
});

const welcome = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `<div class="center">
    <h2>농구 하이라이트 시청 실험(데모)</h2>
    <div class="small">참가자 ID: <b>${PID}</b> / 세컨드 스크린: <b>${SECOND_SCREEN===1?'ON':'OFF'}</b></div>
    <p>이어지는 화면에서 하이라이트 영상을 시청하고 간단한 과제를 수행합니다.<br>
    실제 연구에서는 동의서와 자세한 안내를 먼저 보여주세요.</p>
  </div>`,
  choices: ['시작']
};

const preload = {
  type: jsPsychPreload,
  auto_preload: false,
  message: '자극 불러오는 중...',
  // files: []  // real videos can be preloaded
};

// Build trials
let trials = [];
STIM_LIST.forEach(item=>{
  const order = shuffle([...CELLS]); // randomize within the 4 cells
  order.forEach(cell=>{
    trials.push({id:item.id, ...cell});
  });
});
trials = shuffle(trials); // randomize overall order

const playTrials = trials.map(stim => ({
  type: jsPsychCallFunction,
  func: async ()=>{ await playStim(stim); },
  data: ()=>({pid:PID, second_screen:SECOND_SCREEN, ...stim, phase:'exposure'})
}));

// Simple RT priming task (demo): brand vs neutral word
const PRIME_STIM = shuffle([
  {prime:'ACME', target:'좋다', corr:'j'},
  {prime:'ACME', target:'중립', corr:'f'},
  {prime:'중립', target:'좋다', corr:'j'},
  {prime:'중립', target:'중립', corr:'f'}
]).slice(0,12);

const prime_trials = [];
PRIME_STIM.forEach((s,i)=>{
  prime_trials.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div style="font-size:46px;font-weight:800">${s.prime}</div>`,
    choices: "NO_KEYS",
    trial_duration: 200
  });
  prime_trials.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div style="font-size:40px">${s.target}</div><div class="small">좋다:J / 중립:F</div>`,
    choices: ['j','f'],
    data: {pid:PID, second_screen:SECOND_SCREEN, phase:'priming', prime:s.prime, target:s.target, corr:s.corr},
    on_finish: (d)=>{ d.correct = (d.response===d.corr); }
  });
});

const survey = {
  type: jsPsychSurveyLikert,
  preamble: "<h3>지각 평가(데모)</h3>",
  questions: [
    {prompt:"세컨드 스크린 때문에 주의가 분산되었다.", labels:["1","2","3","4","5","6","7"], required:true},
    {prompt:"광고 타이밍이 방해되었다.", labels:["1","2","3","4","5","6","7"], required:true}
  ]
};

jsPsych.run([welcome, preload, ...playTrials, ...prime_trials, survey]);
