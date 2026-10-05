// ============ 설정 · 공통 도구 ============
const sb = !SB_URL.startsWith("여기에") && window.supabase ? window.supabase.createClient(SB_URL, SB_KEY) : null;
const $ = i => document.getElementById(i);

// ============ 공항 데이터 · 상태 ============
const REG = [["대한민국", { ICN: "서울/인천", GMP: "서울/김포", CJU: "제주", TAE: "대구", CJJ: "청주", KWJ: "광주", PUS: "부산/김해" }], ["일본", { NRT: "도쿄/나리타", KIX: "오사카/간사이", FUK: "후쿠오카", CTS: "삿포로", OKA: "오키나와" }, 1], ["동남아시아", { BKK: "방콕", DAD: "다낭", SGN: "호치민", MNL: "마닐라", CEB: "세부" }], ["동북아시아", { TPE: "타이베이", HKG: "홍콩" }], ["유럽", { CDG: "파리", LHR: "런던" }], ["호주/괌", { GUM: "괌", SYD: "시드니" }], ["미주", { HNL: "하와이", LAX: "로스앤젤레스" }], ["몽골/중앙아시아", { ULN: "울란바토르", TAS: "타슈켄트" }]];
const AP = Object.assign({}, ...REG.map(r => r[1])), FAV = new Set(["GMP", "CJU"]);
const S = { o: null, d: null, a: 1, date: null };
let isAdmin = false;
const BK = { TRN482: { n: "김로블", o: "GMP", d: "CJU", fl: "TR 101", date: "2026-10-12", dep: "10:40", taken: ["1A", "1B", "2C", "4E", "7B", "9A"] } };
const pad = n => String(n).padStart(2, "0"), iso = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
function toast(m) {
    const t = $("toast");
    t.textContent = m;
    t.style.display = "block";
    clearTimeout(t._);
    t._ = setTimeout(() => t.style.display = "none", 2400);
}
function go(v) {
    if (v == "admin" && !isAdmin)
        v = "home";
    ["home", "checkin", "info", "admin", "notice"].forEach(x => $(x).classList.toggle("hid", x != v));
    document.querySelectorAll("nav button").forEach(b => b.classList.toggle("on", b.dataset.v == v));
    if (v == "checkin") {
        ["c2", "c3"].forEach(x => $(x).classList.add("hid"));
        $("c1").classList.remove("hid");
    }
    window.scrollTo(0, 0);
}
document.querySelectorAll("nav button").forEach(b => b.onclick = () => go(b.dataset.v));

// ============ 검색 바 (출발지 · 도착지 · 탑승자) ============
function fill() {
    [["fo", "o", "출발지"], ["fd", "d", "도착지"]].forEach(([id, k, ph]) => {
        const b = $(id).querySelector("b");
        if (S[k]) {
            b.className = "";
            b.innerHTML = AP[S[k]] + `<i>${S[k]}</i>`;
        }
        else {
            b.className = "g";
            b.textContent = ph;
        }
    });
    $("pt").textContent = `성인 ${S.a}`;
}
let pop = null, cat = 0;
function closePop() {
    $("bar").classList.remove("open");
    if (pop) {
        pop.remove();
        pop = null;
    }
    document.querySelectorAll(".act").forEach(x => x.classList.remove("act"));
}
function mk(cls, html, btn) {
    closePop();
    pop = document.createElement("div");
    pop.className = "pop " + cls;
    pop.innerHTML = html;
    $("bar").appendChild(pop);
    btn.classList.add("act");
    $("bar").classList.add("open");
    pop.onclick = e => e.stopPropagation();
}
function airportPop(key, btn) {
    mk("ap", `<div class="sr"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="8.5" cy="8.5" r="6"/><path d="M13 13l5 5"/></svg><input id="q" placeholder="${key == "o" ? "출발지" : "도착지"}를 입력해 주세요." autocomplete="off"></div><div class="cols"><ul id="cats"></ul><ul id="al"></ul></div>`, btn);
    cat = 0;
    const draw = () => {
        const q = $("q").value.trim().toLowerCase();
        $("cats").innerHTML = [["즐겨 찾는 노선"], ...REG].map((r, i) => {
            const on = !q && cat == i - 1;
            return `<li><button data-c="${i - 1}" class="${on ? "on" : ""}"><span>${i ? "" : "★ "}${r[0]}${r[2] ? '<span class="n">N</span>' : ""}</span><span>${on ? "›" : ""}</span></button></li>`;
        }).join("");
        const items = (q ? Object.entries(AP).filter(([k, v]) => v.toLowerCase().includes(q) || k.toLowerCase().includes(q)) : cat < 0 ? [...FAV].map(k => [k, AP[k]]) : Object.entries(REG[cat][1])).filter(([k]) => !(key == "d" && k == S.o));
        $("al").innerHTML = items.length ? items.map(([k, v]) => `<li><button class="r" data-k="${k}">${v}<i>${k}</i></button><button class="s ${FAV.has(k) ? "on" : ""}" data-s="${k}" aria-label="${v} 즐겨찾기">${FAV.has(k) ? "★" : "☆"}</button></li>`).join("") : '<li style="padding:12px;color:var(--mute)">검색 결과가 없어요.</li>';
    };
    pop.onclick = e => {
        e.stopPropagation();
        const t = e.target.closest("button");
        if (!t)
            return;
        const d = t.dataset;
        if (d.c !== undefined) {
            cat = +d.c;
            $("q").value = "";
            draw();
        }
        else if (d.s) {
            FAV.has(d.s) ? FAV.delete(d.s) : FAV.add(d.s);
            draw();
        }
        else if (d.k) {
            const o = key == "o" ? "d" : "o";
            if (d.k == S[o])
                S[o] = S[key];
            S[key] = d.k;
            fill();
            closePop();
            if (key == "o" && !S.d)
                airportPop("d", $("fd"));
            else if (key == "d" && !S.date)
                calPop(document.querySelector(".dates"));
        }
    };
    $("q").oninput = draw;
    $("q").focus();
    draw();
}
function paxPop(btn) {
    const row = (k, l) => `<div class="pr"><div>${l}</div><div class="step"><button data-k="${k}" data-v="-1" aria-label="${l} 줄이기">−</button><b id="n${k}">${S[k]}</b><button data-k="${k}" data-v="1" aria-label="${l} 늘리기">+</button></div></div>`;
    mk("pp", '<button class="x" aria-label="닫기">×</button>' + row("a", "성인"), btn);
    pop.onclick = e => {
        e.stopPropagation();
        const t = e.target.closest("button");
        if (!t)
            return;
        if (t.classList.contains("x"))
            closePop();
        else {
            const k = t.dataset.k;
            S[k] = Math.max(k == "a" ? 1 : 0, Math.min(9, S[k] + +t.dataset.v));
            pop.querySelector("#n" + k).textContent = S[k];
            fill();
        }
    };
}
$("fo").onclick = e => {
    e.stopPropagation();
    airportPop("o", e.currentTarget);
};
$("fd").onclick = e => {
    if (!S.o) {
        toast("출발지를 먼저 선택해 주세요");
        return;
    }
    e.stopPropagation();
    airportPop("d", e.currentTarget);
};
$("fp").onclick = e => {
    e.stopPropagation();
    paxPop(e.currentTarget);
};
$("swap").onclick = () => {
    if (!S.o || !S.d) {
        toast("출발지와 도착지를 먼저 선택해 주세요");
        return;
    }
    [S.o, S.d] = [S.d, S.o];
    fill();
};
document.addEventListener("click", closePop);
document.addEventListener("keydown", e => {
    if (e.key == "Escape")
        closePop();
});

// ============ 날짜 선택 달력 ============
const today = new Date();
today.setHours(0, 0, 0, 0);
const dayN = ["일", "월", "화", "수", "목", "금", "토"];
let vm = new Date(today.getFullYear(), today.getMonth(), 1), sel = null;
function showDate() {
    const b = $("b1");
    if (!S.date) {
        b.textContent = "가는 날";
        b.classList.remove("has");
        return;
    }
    b.textContent = S.date;
    b.classList.add("has");
}
function calPop(box) {
    mk("cal", '<button class="nv pv" aria-label="이전 달">‹</button><button class="nv nx" aria-label="다음 달">›</button><div class="ms"></div><div class="cf"><div><div class="cs">✈ 구간1</div><b id="cd">YYYY-MM-DD</b></div><button class="ok">확인</button></div>', box);
    sel = S.date;
    const draw = () => {
        pop.querySelector(".ms").innerHTML = [0, 1].map(k => {
            const m = new Date(vm.getFullYear(), vm.getMonth() + k, 1), y = m.getFullYear(), mo = m.getMonth(), n = new Date(y, mo + 1, 0).getDate();
            let h = `<div class="mo"><h3>${y}.${pad(mo + 1)}</h3><div class="wk">${dayN.map(x => `<span>${x}</span>`).join("")}</div><div class="dg">` + "<i></i>".repeat(m.getDay());
            for (let d = 1; d <= n; d++) {
                const dt = new Date(y, mo, d), id = iso(dt), wd = dt.getDay(), past = dt < today;
                h += `<button class="d${wd % 6 == 0 ? " we" : ""}${past ? " past" : ""}${id == iso(today) ? " td" : ""}${id == sel ? " sel" : ""}" data-d="${id}" ${past ? "disabled" : ""}>${d}</button>`;
            }
            return h + "</div></div>";
        }).join("");
        pop.querySelector(".pv").disabled = vm <= new Date(today.getFullYear(), today.getMonth(), 1);
        pop.querySelector(".nx").disabled = vm >= new Date(today.getFullYear(), today.getMonth() + 10, 1);
        $("cd").textContent = sel || "YYYY-MM-DD";
    };
    pop.onclick = e => {
        e.stopPropagation();
        const t = e.target.closest("button");
        if (!t)
            return;
        if (t.dataset.d) {
            sel = t.dataset.d;
            draw();
        }
        else if (t.classList.contains("pv")) {
            vm = new Date(vm.getFullYear(), vm.getMonth() - 1, 1);
            draw();
        }
        else if (t.classList.contains("nx")) {
            vm = new Date(vm.getFullYear(), vm.getMonth() + 1, 1);
            draw();
        }
        else if (t.classList.contains("ok")) {
            if (!sel) {
                toast("가는 날을 선택해 주세요");
                return;
            }
            S.date = sel;
            showDate();
            closePop();
        }
    };
    draw();
}
function resetHome() {
    closePop();
    if (dlg.open)
        dlg.close();
    Object.assign(S, { o: null, d: null, a: 1, date: null });
    sel = null;
    vm = new Date(today.getFullYear(), today.getMonth(), 1);
    fill();
    showDate();
    $("results").innerHTML = "";
    go("home");
}
document.querySelector(".dates").onclick = e => {
    if (!S.o || !S.d) {
        toast("출발지와 도착지를 먼저 선택해 주세요");
        return;
    }
    e.stopPropagation();
    calPop(e.currentTarget);
};
fill();
function hash(s) {
    let h = 0;
    for (const c of s)
        h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return h;
}

// ============ 항공편 · 공지 데이터 (Supabase) ============
const mins = t => +t.slice(0, 2) * 60 + +t.slice(3);
const esc = t => String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const TM = /^\d\d:\d\d$/, DT = /^\d{4}-\d\d-\d\d$/;
const data = { flights: [], notices: [] };
const nf = { flights: (id, d) => ({ id: /^[\w-]+$/.test(id) ? id : "", no: String(d.no || "").replace(/[^A-Za-z0-9 ]/g, "").slice(0, 8), o: AP[d.o] ? d.o : "", d: AP[d.d] ? d.d : "", dep: TM.test(d.dep) ? d.dep : "00:00", arr: TM.test(d.arr) ? d.arr : "00:00", dur: +d.dur || 0, date: DT.test(d.date) ? d.date : "" }),
    notices: (id, d) => ({ id: /^[\w-]+$/.test(id) ? id : "", time: TM.test(d.time) ? d.time : "", title: String(d.title || "").slice(0, 80), body: String(d.body || "").slice(0, 3000), date: DT.test(d.date) ? d.date : "" }) };
const okf = { flights: f => f.id && f.no && f.o && f.d && f.date, notices: n => n.id && n.title && n.date };
function search(o, d, date) {
    return data.flights.filter(f => f.o == o && f.d == d && f.date == date).sort((x, y) => x.dep < y.dep ? -1 : 1);
}
const toRow = { flights: f => ({ id: f.id, no: f.no, origin: f.o, dest: f.d, dep: f.dep, arr: f.arr, dur: f.dur, date: f.date }), notices: n => ({ id: n.id, title: n.title, body: n.body, date: n.date, time: n.time }) };
const fromRow = { flights: r => ({ ...r, o: r.origin, d: r.dest }), notices: r => r };
const NOSB = () => new Error("Supabase 설정이 필요해요");
async function loadAll() {
    if (!sb)
        return;
    for (const k of ["flights", "notices"]) {
        const { data: rows, error } = await sb.from(k).select("*");
        if (error) {
            toast("데이터를 불러오지 못했어요");
            console.error(error);
            continue;
        }
        data[k] = rows.map(r => nf[k](String(r.id), fromRow[k](r))).filter(okf[k]);
    }
    renderAll();
}
async function save(k, o) {
    if (!sb)
        throw NOSB();
    const { error } = await sb.from(k).insert(toRow[k](o));
    if (error)
        throw error;
    await loadAll();
}
async function del(k, id) {
    if (!sb)
        throw NOSB();
    const { data: r, error } = await sb.from(k).delete().eq("id", id).select();
    if (error)
        throw error;
    if (!r || !r.length)
        throw new Error("삭제 권한이 없어요");
    await loadAll();
}
const delBtn = (k, id) => `<button class="btn g" style="margin:0;padding:6px 12px" data-k="${k}" data-x="${id}">삭제</button>`;
function renderAll() {
    const F = [...data.flights].sort((x, y) => (x.date + x.dep) < (y.date + y.dep) ? -1 : 1);
    $("fcount").textContent = `(${F.length}편)`;
    $("ftb").innerHTML = F.length ? '<tr><th>운항 날짜</th><th>편명</th><th>구간</th><th>시간</th><th></th></tr>' + F.map(f => `<tr><td>${f.date}</td><td><b>${esc(f.no)}</b></td><td>${f.o} → ${f.d}<br><small>${AP[f.o]} → ${AP[f.d]}</small></td><td>${f.dep} → ${f.arr}${f.arr < f.dep ? " (+1일)" : ""}</td><td>${delBtn("flights", f.id)}</td></tr>`).join("") : '<tr><td style="color:var(--mute)">등록된 항공편이 없어요.</td></tr>';
    const N = [...data.notices].sort((x, y) => (y.date + y.id) < (x.date + x.id) ? -1 : 1);
    $("ncount").textContent = `(${N.length}개)`;
    $("ntb").innerHTML = N.length ? '<tr><th>작성일</th><th>제목</th><th></th></tr>' + N.map(n => `<tr><td>${n.date}</td><td style="white-space:normal">${esc(n.title)}</td><td>${delBtn("notices", n.id)}</td></tr>`).join("") : '<tr><td style="color:var(--mute)">등록된 공지가 없어요.</td></tr>';
    $("nlist").innerHTML = N.length ? N.map(n => `<li><button class="ni" data-n="${n.id}"><span>${esc(n.title)}</span><time>${n.date}</time></button></li>`).join("") : '<li style="color:var(--mute)">등록된 공지가 없어요.</li>';
    document.querySelectorAll(".store").forEach(e => e.textContent = "등록한 내용은 서버에 저장되어 모든 방문자에게 보여요.");
}
document.getElementById("admin").onclick = async (e) => {
    const b = e.target.closest("[data-x]");
    if (!b)
        return;
    try {
        await del(b.dataset.k, b.dataset.x);
        toast("삭제했어요");
    }
    catch (x) {
        toast("삭제 실패: " + (x.code || x.message));
    }
};
document.querySelectorAll(".tabs2 [data-t]").forEach(b => b.onclick = () => {
    document.querySelectorAll(".tabs2 [data-t]").forEach(x => x.classList.toggle("on", x == b));
    $("ap-f").classList.toggle("hid", b.dataset.t != "f");
    $("ap-n").classList.toggle("hid", b.dataset.t != "n");
});
$("fo2").innerHTML = $("fd2").innerHTML = '<option value="">선택</option>' + REG.map(r => `<optgroup label="${r[0]}">` + Object.entries(r[1]).map(([k, v]) => `<option value="${k}">${v} (${k})</option>`).join("") + "</optgroup>").join("");
$("ff").min = iso(today);
$("ff").value = iso(today);
$("fadd").onclick = async () => {
    const no = $("fn").value.trim().toUpperCase().replace(/\s+/g, " "), o = $("fo2").value, d = $("fd2").value, t1 = $("ft1").value, t2 = $("ft2").value, date = $("ff").value, e = m => {
        $("ferr").textContent = m;
    };
    if (!/^[A-Z0-9 ]{2,8}$/.test(no))
        return e("편명은 영문·숫자 2~8자로 입력해 주세요. (예: TR 301)");
    if (!o || !d)
        return e("출발지와 도착지를 선택해 주세요.");
    if (o == d)
        return e("출발지와 도착지가 같아요.");
    if (!date || date < iso(today))
        return e("운항 날짜를 확인해 주세요.");
    if (data.flights.some(x => x.no == no && x.date == date))
        return e("같은 날짜에 이미 등록된 편명이에요.");
    if (!t1 || !t2 || t1 == t2)
        return e("출발·도착 시간을 확인해 주세요.");
    e("");
    const fl = { id: "f" + Date.now().toString(36), no, o, d, date, dep: t1, arr: t2, dur: (mins(t2) - mins(t1) + 1440) % 1440 };
    try {
        await save("flights", fl);
        toast(`항공편 ${no} 등록 완료`);
        ["fn", "ft1", "ft2"].forEach(i => $(i).value = "");
        $("fo2").value = $("fd2").value = "";
    }
    catch (x) {
        e("저장에 실패했어요: " + (x.message || x.code));
    }
};
$("nadd").onclick = async () => {
    const title = $("nt").value.trim(), body = $("nb").value.trim(), e = m => {
        $("nerr").textContent = m;
    };
    if (!title)
        return e("제목을 입력해 주세요.");
    e("");
    try {
        await save("notices", { id: "n" + Date.now().toString(36), title: title.slice(0, 80), body: body.slice(0, 3000), date: iso(new Date()), time: pad(new Date().getHours()) + ":" + pad(new Date().getMinutes()) });
        toast("공지를 등록했어요");
        $("nt").value = $("nb").value = "";
    }
    catch (x) {
        e("저장에 실패했어요: " + (x.message || x.code));
    }
};
(async () => {
    if (!sb) {
        document.body.insertAdjacentHTML("afterbegin", '<div style="background:#B4503C;color:#fff;padding:8px 16px;font-size:13px;text-align:center">서버 설정이 아직 안 되어 있어요. config.js 의 SB_URL, SB_KEY를 확인해 주세요.</div>');
        return;
    }
    await loadAll();
    await refreshAuth();
    sb.auth.onAuthStateChange(() => setTimeout(refreshAuth, 0));
})();
renderAll();
$("nlist").onclick = e => {
    const b = e.target.closest("[data-n]");
    if (!b)
        return;
    const n = data.notices.find(x => x.id == b.dataset.n);
    if (!n)
        return;
    $("nvt").textContent = n.title;
    $("nvd").textContent = "작성일 : " + n.date + (n.time ? " " + n.time : "");
    $("nvb").innerHTML = esc(n.body || "").replace(/\*\*(.+?)\*\*/g, '<b class="hl">$1</b>');
    go("notice");
};
$("nok").onclick = () => {
    go("home");
    $("nlist").scrollIntoView();
};

// ============ 로그인 (디스코드) ============
let user = null;
async function isAdminRpc() {
    const { data: v, error } = await sb.rpc("is_admin");
    return !error && v === true;
}
function setAdmin(v) {
    isAdmin = v;
    $("adminNav").classList.toggle("hid", !v);
    if (!v && !$("admin").classList.contains("hid"))
        go("home");
}
function renderMe() {
    const me = $("me");
    me.textContent = "";
    $("loginBtn").textContent = user ? "로그아웃" : "로그인";
    me.classList.toggle("hid", !user);
    if (!user)
        return;
    const md = user.user_metadata || {};
    const name = (md.custom_claims && md.custom_claims.global_name) || md.full_name || md.name || user.email || "사용자";
    if (/^https:\/\//.test(md.avatar_url || "")) {
        const img = document.createElement("img");
        img.src = md.avatar_url;
        img.alt = "";
        me.append(img);
    }
    const sp = document.createElement("span");
    sp.textContent = name;
    me.append(sp);
}
function getOAuthRedirect() {
    if (location.protocol === "file:")
        return null;
    return location.href.split(/[?#]/)[0].replace(/index\.html$/, "");
}
async function refreshAuth() {
    if (!sb)
        return;
    const { data } = await sb.auth.getSession();
    user = data.session ? data.session.user : null;
    if (user && ldg.open)
        ldg.close();
    renderMe();
    setAdmin(user ? await isAdminRpc() : false);
}
$("loginBtn").onclick = async () => {
    if (user) {
        await sb.auth.signOut();
        user = null;
        renderMe();
        setAdmin(false);
        go("home");
        toast("로그아웃 되었어요");
        return;
    }
    if (!sb) {
        toast("서버 설정이 필요해요");
        return;
    }
    $("lerr").textContent = "";
    ldg.showModal();
};
$("ldc").onclick = async () => {
    if (!sb) {
        $("lerr").textContent = "서버에 연결되지 않았어요. config.js 설정을 확인해 주세요.";
        return;
    }
    if (location.protocol === "file:") {
        $("lerr").textContent = "로컬 파일 경로에서는 Discord 로그인이 불가해요. VS Code Live Server 또는 http://localhost:8000 으로 실행해 주세요.";
        return;
    }
    $("lerr").textContent = "";
    const back = getOAuthRedirect();
    const { error } = await sb.auth.signInWithOAuth({ provider: "discord", options: { redirectTo: back || window.location.origin } });
    if (error)
        $("lerr").textContent = "디스코드 로그인 실패: " + error.message;
};

// ============ 항공편 조회 ============
function render() {
    if (!S.o || !S.d) {
        toast("출발지와 도착지를 선택해 주세요");
        return;
    }
    const d1 = S.date;
    if (!d1) {
        toast("가는 날을 선택해 주세요");
        return;
    }
    const list = search(S.o, S.d, d1);
    $("results").innerHTML = `<h2>편도 · ${AP[S.o]} → ${AP[S.d]} · ${d1}</h2>` + (list.length ? list.map(f => `<div class="flt"><div class="t">${f.dep}</div><div style="color:var(--mute)">${esc(f.no)} · ${f.dur}분 소요 → 도착 ${f.arr}${f.arr < f.dep ? " (+1일)" : ""}</div><button class="btn" data-f='${JSON.stringify({ fl: f.no, o: f.o, d: f.d, date: d1, dep: f.dep, arr: f.arr })}'>선택</button></div>`).join("") : '<p style="color:var(--mute);padding:18px 4px">이 날짜에 운항하는 항공편이 없어요. 다른 날짜를 선택해 보세요.</p>');
    $("results").querySelectorAll("[data-f]").forEach(b => b.onclick = () => book(JSON.parse(b.dataset.f)));
    $("results").scrollIntoView({ behavior: "smooth" });
}
$("search").onclick = render;

// ============ 예약 ============
let pick = null;
function book(f) {
    pick = f;
    $("dsum").textContent = `${AP[f.o]} → ${AP[f.d]} · ${f.date} ${f.dep} · ${f.fl}`;
    $("pn").value = "";
    $("perr").textContent = "";
    $("done").classList.add("hid");
    $("book").style.display = "";
    dlg.showModal();
}
$("book").onclick = () => {
    const n = $("pn").value.trim();
    if (!n) {
        $("perr").textContent = "탑승객 성명을 입력해 주세요.";
        return;
    }
    let c;
    do {
        c = "TRN" + (100 + Math.floor(Math.random() * 900));
    } while (BK[c]);
    BK[c] = { n, o: pick.o, d: pick.d, fl: pick.fl, date: pick.date, dep: pick.dep, taken: ["1A", "2B", "3C", "5D", "8F"] };
    $("book").style.display = "none";
    $("done").classList.remove("hid");
    $("done").innerHTML = `<p>예약이 확정됐어요 🎉<br>예약번호 <b style="font-size:22px">${c}</b></p><button class="btn" onclick="dlg.close();go('checkin');$('code').value='${c}';$('name').value='${n.charAt(0)}'">체크인하러 가기</button>`;
};

// ============ 온라인체크인 · 탑승권 ============
let cur = null, seat = null;
$("find").onclick = () => {
    const c = $("code").value.trim().toUpperCase(), n = $("name").value.trim(), b = BK[c];
    if (!c || !n) {
        $("err").textContent = "예약번호와 성을 입력해 주세요.";
        return;
    }
    if (!b || b.n.charAt(0).toLowerCase() !== n.toLowerCase()) {
        $("err").textContent = "일치하는 예약이 없어요. 예약번호와 성을 확인해 주세요.";
        return;
    }
    $("err").textContent = "";
    cur = { ...b, c };
    seat = null;
    $("confirm").disabled = true;
    $("cinfo").textContent = `${b.n} · ${AP[b.o]} → ${AP[b.d]} · ${b.date} ${b.dep} · ${b.fl}`;
    const m = $("map");
    m.innerHTML = "<i></i>";
    "ABC".split("").forEach(x => m.insertAdjacentHTML("beforeend", `<div class="h">${x}</div>`));
    m.insertAdjacentHTML("beforeend", "<i></i>");
    "DEF".split("").forEach(x => m.insertAdjacentHTML("beforeend", `<div class="h">${x}</div>`));
    for (let r = 1; r <= 12; r++) {
        m.insertAdjacentHTML("beforeend", `<div class="rn">${r}</div>`);
        [..."ABCDEF"].forEach((x, i) => {
            if (i == 3)
                m.insertAdjacentHTML("beforeend", "<i></i>");
            const id = r + x, s = document.createElement("button");
            s.className = "seat" + (r <= 3 ? " p" : "");
            s.textContent = x;
            s.dataset.id = id;
            if (b.taken.includes(id)) {
                s.classList.add("x");
                s.disabled = true;
            }
            s.setAttribute("aria-label", id + " 좌석");
            s.onclick = () => {
                seat = id;
                m.querySelectorAll(".seat").forEach(z => z.classList.toggle("sel", z.dataset.id == id));
                $("confirm").disabled = false;
            };
            m.appendChild(s);
        });
    }
    $("c1").classList.add("hid");
    $("c2").classList.remove("hid");
};
$("confirm").onclick = () => {
    const b = cur, bt = (() => {
        const [h, m] = b.dep.split(":").map(Number), t = h * 60 + m - 40;
        return pad(Math.floor(t / 60)) + ":" + pad(t % 60);
    })();
    $("pass").innerHTML = `<div class="top"><b>TRINITY AIRLINES 탑승권</b><span>✔ 체크인 완료</span></div><div class="body"><div><small>탑승객</small><strong>${b.n}</strong></div><div><small>출발</small><strong>${b.o}</strong><small>${AP[b.o]}</small></div><div><small>도착</small><strong>${b.d}</strong><small>${AP[b.d]}</small></div><div><small>편명</small><strong>${b.fl}</strong></div><div><small>날짜</small><strong>${b.date}</strong></div><div><small>탑승 시작</small><strong>${bt}</strong></div><div><small>게이트</small><strong>${"ABC"[hash(b.c) % 3]}${1 + hash(b.c) % 9}</strong></div><div><small>좌석</small><strong>${seat}</strong></div></div><div class="bar2">${bars(b.c + seat)}<small>출발 40분 전 탑승 마감 · 예약번호 ${b.c}</small></div>`;
    b.taken.push(seat);
    BK[b.c].taken = b.taken;
    $("c2").classList.add("hid");
    $("c3").classList.remove("hid");
    scrollTo(0, 0);
};
function bars(t) {
    let h = hash(t), x = 0, r = "";
    for (let i = 0; i < 60; i++) {
        h = (h * 1103515245 + 12345) >>> 0;
        const w = 1 + (h >>> 16) % 3;
        if (i % 2 == 0)
            r += `<rect x="${x}" width="${w}" height="44" fill="currentColor"/>`;
        x += w;
    }
    return `<svg viewBox="0 0 ${x} 44" width="220" height="44" preserveAspectRatio="none" role="img" aria-label="바코드">${r}</svg>`;
}