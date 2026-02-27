// =====================================================
// SUPABASE CONFIG
// =====================================================
var SUPABASE_URL = 'https://ittjnozvqldykjealtxb.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dGpub3p2cWxkeWtqZWFsdHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDM4NzMsImV4cCI6MjA4Nzc3OTg3M30.Dpx47bXzlfZYTH5aat4dAOxi4h7IqPxuQYS9VtCYmUo';
var _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =====================================================
// STATE
// =====================================================
var currentUser = null;
var empresasList = [];
var projetosList = [];
var registrosList = [];
var idContador = 0;
var editandoId = null;

// =====================================================
// INIT
// =====================================================
window.onload = function () {
    checkSession();
};

async function checkSession() {
    showLoading(true);
    var { data } = await _supabase.auth.getSession();
    if (data.session) {
        currentUser = data.session.user;
        await initApp();
    }
    showLoading(false);

    _supabase.auth.onAuthStateChange(function (event, session) {
        if (event === 'SIGNED_IN' && session) {
            currentUser = session.user;
            initApp();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            document.getElementById('auth-screen').style.display = '';
            document.getElementById('app-screen').style.display = 'none';
        }
    });
}

async function initApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = '';
    // Load profile name
    var { data: profile } = await _supabase.from('profiles').select('nome').eq('id', currentUser.id).single();
    var nome = profile ? profile.nome : currentUser.email;
    document.getElementById('user-name').textContent = nome;
    // Setup
    document.getElementById('campo-data').value = hoje();
    await loadEmpresas();
    await loadProjetos();
    populateProjetoDropdown();
    adicionarIntervalo();
    // Listeners
    document.getElementById('filtro-data-de').addEventListener('change', renderHistorico);
    document.getElementById('filtro-data-ate').addEventListener('change', renderHistorico);
    document.getElementById('filtro-projeto-hist').addEventListener('change', renderHistorico);
    document.getElementById('filtro-ticket').addEventListener('input', renderHistorico);
    document.getElementById('filtro-status').addEventListener('change', renderHistorico);
    showTab('form');
}

// =====================================================
// AUTH
// =====================================================
function showAuthTab(tab) {
    document.querySelectorAll('.auth-tabs button').forEach(function (b) { b.classList.remove('active'); });
    document.querySelectorAll('.auth-form').forEach(function (f) { f.classList.remove('active'); });
    document.getElementById('auth-tab-' + tab).classList.add('active');
    document.getElementById('auth-form-' + tab).classList.add('active');
    document.getElementById('auth-error').style.display = 'none';
}

async function doLogin() {
    var email = document.getElementById('login-email').value.trim();
    var password = document.getElementById('login-password').value;
    if (!email || !password) { showAuthError('Preencha email e senha.'); return; }
    showLoading(true);
    var { error } = await _supabase.auth.signInWithPassword({ email: email, password: password });
    showLoading(false);
    if (error) { showAuthError(error.message === 'Invalid login credentials' ? 'Email ou senha incorretos.' : error.message); return; }
}

async function doRegister() {
    var nome = document.getElementById('reg-nome').value.trim();
    var email = document.getElementById('reg-email').value.trim();
    var password = document.getElementById('reg-password').value;
    if (!nome || !email || !password) { showAuthError('Preencha todos os campos.'); return; }
    if (password.length < 6) { showAuthError('A senha deve ter pelo menos 6 caracteres.'); return; }
    showLoading(true);
    var { error } = await _supabase.auth.signUp({ email: email, password: password, options: { data: { nome: nome } } });
    showLoading(false);
    if (error) { showAuthError(error.message); return; }
    showAuthError('');
    showToast('Conta criada! Verifique seu email para confirmar, ou faça login.');
    showAuthTab('login');
}

async function doLogout() {
    await _supabase.auth.signOut();
    currentUser = null;
    document.getElementById('auth-screen').style.display = '';
    document.getElementById('app-screen').style.display = 'none';
}

function showAuthError(msg) {
    var el = document.getElementById('auth-error');
    if (msg) { el.textContent = msg; el.style.display = 'block'; }
    else { el.style.display = 'none'; }
}

// =====================================================
// TABS
// =====================================================
function showTab(tab) {
    document.querySelectorAll('.nav-tabs-custom button').forEach(function (b) { b.classList.remove('active'); });
    document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('active'); });
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById(tab + '-panel').classList.add('active');
    if (tab === 'history') renderHistorico();
    if (tab === 'cadastros') { renderEmpresas(); renderProjetos(); }
}

// =====================================================
// EMPRESAS CRUD
// =====================================================
async function loadEmpresas() {
    var { data } = await _supabase.from('empresas').select('*').order('nome');
    empresasList = data || [];
}

async function addEmpresa() {
    var input = document.getElementById('nova-empresa');
    var nome = input.value.trim();
    if (!nome) return;
    var { error } = await _supabase.from('empresas').insert({ user_id: currentUser.id, nome: nome });
    if (error) { showToast('Erro: ' + error.message, true); return; }
    input.value = '';
    await loadEmpresas();
    await loadProjetos();
    renderEmpresas();
    populateProjetoDropdown();
    populateEmpresaDropdownCadastro();
    showToast('Empresa cadastrada!');
}

async function deleteEmpresa(id) {
    if (!confirm('Excluir esta empresa? Projetos vinculados ficarão sem empresa.')) return;
    await _supabase.from('empresas').delete().eq('id', id);
    await loadEmpresas();
    await loadProjetos();
    renderEmpresas();
    renderProjetos();
    populateProjetoDropdown();
    populateEmpresaDropdownCadastro();
    showToast('Empresa excluída!');
}

function renderEmpresas() {
    var list = document.getElementById('empresas-list');
    if (empresasList.length === 0) { list.innerHTML = '<div class="empty-state" style="padding:16px;"><i class="bi bi-building"></i><p>Nenhuma empresa cadastrada.</p></div>'; return; }
    var html = '';
    empresasList.forEach(function (e) {
        html += '<div class="cadastro-item"><div><div class="item-name">' + escapeHtml(e.nome) + '</div></div>' +
            '<div class="item-actions"><button class="btn-del" onclick="deleteEmpresa(' + e.id + ')" title="Excluir"><i class="bi bi-trash3"></i></button></div></div>';
    });
    list.innerHTML = html;
}

// =====================================================
// PROJETOS CRUD
// =====================================================
async function loadProjetos() {
    var { data } = await _supabase.from('projetos').select('*, empresas(nome)').order('nome');
    projetosList = data || [];
}

async function addProjeto() {
    var input = document.getElementById('novo-projeto');
    var sel = document.getElementById('projeto-empresa-sel');
    var nome = input.value.trim();
    if (!nome) return;
    var empresaId = sel.value ? parseInt(sel.value) : null;
    var { error } = await _supabase.from('projetos').insert({ user_id: currentUser.id, nome: nome, empresa_id: empresaId });
    if (error) { showToast('Erro: ' + error.message, true); return; }
    input.value = '';
    await loadProjetos();
    renderProjetos();
    populateProjetoDropdown();
    showToast('Projeto cadastrado!');
}

async function deleteProjeto(id) {
    if (!confirm('Excluir este projeto? Registros vinculados ficarão sem projeto.')) return;
    await _supabase.from('projetos').delete().eq('id', id);
    await loadProjetos();
    renderProjetos();
    populateProjetoDropdown();
    showToast('Projeto excluído!');
}

function renderProjetos() {
    var list = document.getElementById('projetos-list');
    populateEmpresaDropdownCadastro();
    if (projetosList.length === 0) { list.innerHTML = '<div class="empty-state" style="padding:16px;"><i class="bi bi-folder"></i><p>Nenhum projeto cadastrado.</p></div>'; return; }
    var html = '';
    projetosList.forEach(function (p) {
        var empNome = p.empresas ? p.empresas.nome : 'Sem empresa';
        html += '<div class="cadastro-item"><div><div class="item-name">' + escapeHtml(p.nome) + '</div>' +
            '<div class="item-sub"><i class="bi bi-building"></i> ' + escapeHtml(empNome) + '</div></div>' +
            '<div class="item-actions"><button class="btn-del" onclick="deleteProjeto(' + p.id + ')" title="Excluir"><i class="bi bi-trash3"></i></button></div></div>';
    });
    list.innerHTML = html;
}

function populateEmpresaDropdownCadastro() {
    var sel = document.getElementById('projeto-empresa-sel');
    var html = '<option value="">Sem empresa</option>';
    empresasList.forEach(function (e) { html += '<option value="' + e.id + '">' + escapeHtml(e.nome) + '</option>'; });
    sel.innerHTML = html;
}

function populateProjetoDropdown() {
    var sel = document.getElementById('campo-projeto');
    var selHist = document.getElementById('filtro-projeto-hist');
    // Group by empresa
    var grupos = {};
    var semEmpresa = [];
    projetosList.forEach(function (p) {
        if (p.empresas) {
            if (!grupos[p.empresas.nome]) grupos[p.empresas.nome] = [];
            grupos[p.empresas.nome].push(p);
        } else {
            semEmpresa.push(p);
        }
    });
    var html = '<option value="">-- Selecione um projeto --</option>';
    var htmlHist = '<option value="">Todos os projetos</option>';
    Object.keys(grupos).sort().forEach(function (emp) {
        html += '<optgroup label="' + escapeHtml(emp) + '">';
        htmlHist += '<optgroup label="' + escapeHtml(emp) + '">';
        grupos[emp].forEach(function (p) {
            html += '<option value="' + p.id + '">' + escapeHtml(p.nome) + '</option>';
            htmlHist += '<option value="' + p.id + '">' + escapeHtml(p.nome) + '</option>';
        });
        html += '</optgroup>';
        htmlHist += '</optgroup>';
    });
    if (semEmpresa.length > 0) {
        html += '<optgroup label="Sem empresa">';
        htmlHist += '<optgroup label="Sem empresa">';
        semEmpresa.forEach(function (p) {
            html += '<option value="' + p.id + '">' + escapeHtml(p.nome) + '</option>';
            htmlHist += '<option value="' + p.id + '">' + escapeHtml(p.nome) + '</option>';
        });
        html += '</optgroup>';
        htmlHist += '</optgroup>';
    }
    sel.innerHTML = html;
    selHist.innerHTML = htmlHist;
}

// =====================================================
// INTERVALOS
// =====================================================
function adicionarIntervalo(de, ate) {
    de = de || ''; ate = ate || '';
    var novoId = idContador++;
    var div = document.createElement('div');
    div.className = 'intervalo'; div.id = 'intervalo-' + novoId;
    div.innerHTML =
        '<div style="flex:1;min-width:90px;"><label class="form-label mb-0" for="de-' + novoId + '">De</label>' +
        '<input type="time" class="form-control" value="' + de + '" onchange="calcularTotal()" id="de-' + novoId + '"></div>' +
        '<div style="flex:1;min-width:90px;"><label class="form-label mb-0" for="ate-' + novoId + '">Até</label>' +
        '<input type="time" class="form-control" value="' + ate + '" onchange="calcularTotal()" id="ate-' + novoId + '"></div>' +
        '<div class="parcial-badge" id="parcial-' + novoId + '">—</div>' +
        '<button type="button" class="btn-sm-icon remove" onclick="removerIntervalo(' + novoId + ')" title="Remover"><i class="bi bi-trash3"></i></button>';
    document.getElementById('intervalos').appendChild(div);
    calcularTotal();
}

function removerIntervalo(id) {
    var el = document.getElementById('intervalo-' + id);
    if (el) { el.remove(); calcularTotal(); }
}

function calcularTotal() {
    var totalMinutos = 0;
    for (var i = 0; i < idContador; i++) {
        var de = document.getElementById('de-' + i);
        var ate = document.getElementById('ate-' + i);
        var parcial = document.getElementById('parcial-' + i);
        if (de && ate && de.value && ate.value) {
            var p1 = de.value.split(':'), p2 = ate.value.split(':');
            var mins = (parseInt(p2[0]) * 60 + parseInt(p2[1])) - (parseInt(p1[0]) * 60 + parseInt(p1[1]));
            if (mins > 0) { totalMinutos += mins; if (parcial) parcial.textContent = formatarTempo(mins); }
            else { if (parcial) parcial.textContent = '—'; }
        } else { if (parcial) parcial.textContent = '—'; }
    }
    document.getElementById('total').textContent = formatarTempo(totalMinutos);
}

function coletarIntervalos() {
    var intervalos = [];
    for (var i = 0; i < idContador; i++) {
        var de = document.getElementById('de-' + i);
        var ate = document.getElementById('ate-' + i);
        if (de && ate && de.value && ate.value) intervalos.push({ de: de.value, ate: ate.value });
    }
    return intervalos;
}

// =====================================================
// SALVAR REGISTRO
// =====================================================
async function salvarRegistro() {
    var projetoId = document.getElementById('campo-projeto').value;
    var data = document.getElementById('campo-data').value;
    var ticket = document.getElementById('campo-ticket').value.trim();
    var descricao = document.getElementById('campo-descricao').value.trim();
    var intervalos = coletarIntervalos();
    if (!projetoId) { showToast('Selecione um projeto!', true); return; }
    if (!data) { showToast('Informe a data!', true); return; }
    if (intervalos.length === 0) { showToast('Adicione pelo menos um intervalo!', true); return; }
    var totalMinutos = 0;
    intervalos.forEach(function (iv) {
        var p1 = iv.de.split(':'), p2 = iv.ate.split(':');
        var mins = (parseInt(p2[0]) * 60 + parseInt(p2[1])) - (parseInt(p1[0]) * 60 + parseInt(p1[1]));
        if (mins > 0) totalMinutos += mins;
    });
    showLoading(true);
    if (editandoId !== null) {
        var { error } = await _supabase.from('registros').update({
            projeto_id: parseInt(projetoId), data: data, ticket: ticket, descricao: descricao,
            intervalos: intervalos, total_minutos: totalMinutos
        }).eq('id', editandoId);
        editandoId = null;
        showLoading(false);
        if (error) { showToast('Erro: ' + error.message, true); return; }
        showToast('Registro atualizado!');
    } else {
        var { error } = await _supabase.from('registros').insert({
            user_id: currentUser.id, projeto_id: parseInt(projetoId), data: data, ticket: ticket,
            descricao: descricao, intervalos: intervalos, total_minutos: totalMinutos
        });
        showLoading(false);
        if (error) { showToast('Erro: ' + error.message, true); return; }
        showToast('Registro salvo!');
    }
    resetFormulario();
}

function resetFormulario() {
    document.getElementById('campo-projeto').value = '';
    document.getElementById('campo-data').value = hoje();
    document.getElementById('campo-ticket').value = '';
    document.getElementById('campo-descricao').value = '';
    document.getElementById('intervalos').innerHTML = '';
    idContador = 0; editandoId = null;
    adicionarIntervalo();
}

// =====================================================
// HISTORICO
// =====================================================
async function renderHistorico() {
    var listEl = document.getElementById('history-list');
    var countEl = document.getElementById('history-count');
    listEl.innerHTML = '<div class="empty-state"><div class="spinner" style="margin:0 auto;"></div><p style="margin-top:12px;">Carregando...</p></div>';
    var query = _supabase.from('registros').select('*, projetos(nome, empresas(nome))').eq('user_id', currentUser.id).order('data', { ascending: false }).order('created_at', { ascending: false });
    var filtroDe = document.getElementById('filtro-data-de').value;
    var filtroAte = document.getElementById('filtro-data-ate').value;
    var filtroProjeto = document.getElementById('filtro-projeto-hist').value;
    var filtroTicket = document.getElementById('filtro-ticket').value.toLowerCase().trim();
    var filtroStatus = document.getElementById('filtro-status').value;
    if (filtroDe) query = query.gte('data', filtroDe);
    if (filtroAte) query = query.lte('data', filtroAte);
    if (filtroProjeto) query = query.eq('projeto_id', parseInt(filtroProjeto));
    if (filtroStatus === 'sim') query = query.eq('apontado', true);
    if (filtroStatus === 'nao') query = query.eq('apontado', false);
    var { data, error } = await query;
    if (error) { listEl.innerHTML = '<div class="empty-state"><p>Erro ao carregar: ' + error.message + '</p></div>'; return; }
    var filtrados = data || [];
    if (filtroTicket) {
        filtrados = filtrados.filter(function (r) { return r.ticket && r.ticket.toLowerCase().indexOf(filtroTicket) !== -1; });
    }
    registrosList = filtrados;
    var totalGeralMin = 0;
    filtrados.forEach(function (r) { totalGeralMin += r.total_minutos; });
    countEl.textContent = filtrados.length + ' registro(s) \u00b7 Total: ' + formatarTempo(totalGeralMin);
    if (filtrados.length === 0) { listEl.innerHTML = '<div class="empty-state"><i class="bi bi-inbox"></i><p>Nenhum registro encontrado.</p></div>'; return; }
    var grupos = {};
    filtrados.forEach(function (r) { if (!grupos[r.data]) grupos[r.data] = []; grupos[r.data].push(r); });
    var html = '';
    Object.keys(grupos).sort().reverse().forEach(function (dt) {
        var partes = dt.split('-');
        var dataFormatada = partes[2] + '/' + partes[1] + '/' + partes[0];
        var diaSemana = getDiaSemana(dt);
        var totalDiaMin = 0;
        grupos[dt].forEach(function (r) { totalDiaMin += r.total_minutos; });
        html += '<div class="date-group-header"><i class="bi bi-calendar3"></i> ' + dataFormatada + ' \u2014 ' + diaSemana +
            '<span style="margin-left:auto;font-size:0.82rem;color:var(--accent);font-weight:700;">' + formatarTempo(totalDiaMin) + '</span></div>';
        grupos[dt].forEach(function (r) {
            var projNome = r.projetos ? r.projetos.nome : 'Sem projeto';
            var empNome = r.projetos && r.projetos.empresas ? r.projetos.empresas.nome : '';
            var ivHtml = '';
            (r.intervalos || []).forEach(function (iv) {
                var p1 = iv.de.split(':'), p2 = iv.ate.split(':');
                var mins = (parseInt(p2[0]) * 60 + parseInt(p2[1])) - (parseInt(p1[0]) * 60 + parseInt(p1[1]));
                ivHtml += '<span><i class="bi bi-arrow-right-short"></i>' + iv.de + ' \u2013 ' + iv.ate + ' (' + formatarTempo(Math.max(0, mins)) + ')</span>';
            });
            var isAp = r.apontado;
            html += '<div class="history-card' + (isAp ? ' apontado' : '') + '">' +
                '<div class="apontado-wrapper"><label class="apontado-toggle"><input type="checkbox" ' + (isAp ? 'checked' : '') + ' onchange="toggleApontado(' + r.id + ')"><span class="apontado-slider"></span></label>' +
                '<span class="apontado-label' + (isAp ? ' checked' : '') + '">' + (isAp ? '<i class="bi bi-check-circle-fill"></i> Apontado' : 'N\u00e3o apontado') + '</span></div>' +
                '<div class="d-flex justify-content-between align-items-start"><div>' +
                '<div class="project-name">' + escapeHtml(projNome) +
                (empNome ? ' <span style="font-size:0.72rem;background:rgba(6,182,212,0.1);color:var(--accent);padding:2px 8px;border-radius:6px;margin-left:4px;font-weight:600;">' + escapeHtml(empNome) + '</span>' : '') +
                (r.ticket ? ' <span style="font-size:0.75rem;background:var(--primary-bg);color:var(--primary);padding:2px 8px;border-radius:6px;margin-left:4px;font-weight:600;">' + escapeHtml(r.ticket) + '</span>' : '') +
                '</div></div><span class="total-badge">' + formatarTempo(r.total_minutos) + '</span></div>' +
                (r.descricao ? '<div class="desc-text">' + escapeHtml(r.descricao) + '</div>' : '') +
                '<div class="intervals-list">' + ivHtml + '</div>' +
                '<div class="actions"><button class="btn-outline-custom" onclick="editarRegistro(' + r.id + ')" style="padding:5px 12px;font-size:0.8rem;"><i class="bi bi-pencil"></i> Editar</button>' +
                '<button class="btn-danger-custom" onclick="excluirRegistro(' + r.id + ')" style="padding:5px 12px;font-size:0.8rem;"><i class="bi bi-trash3"></i> Excluir</button></div></div>';
        });
    });
    listEl.innerHTML = html;
}

// =====================================================
// TOGGLE / EDIT / DELETE
// =====================================================
async function toggleApontado(id) {
    var reg = registrosList.find(function (r) { return r.id === id; });
    if (!reg) return;
    await _supabase.from('registros').update({ apontado: !reg.apontado }).eq('id', id);
    renderHistorico();
}

function editarRegistro(id) {
    var reg = registrosList.find(function (r) { return r.id === id; });
    if (!reg) return;
    document.getElementById('campo-projeto').value = reg.projeto_id || '';
    document.getElementById('campo-data').value = reg.data;
    document.getElementById('campo-ticket').value = reg.ticket || '';
    document.getElementById('campo-descricao').value = reg.descricao || '';
    document.getElementById('intervalos').innerHTML = '';
    idContador = 0;
    (reg.intervalos || []).forEach(function (iv) { adicionarIntervalo(iv.de, iv.ate); });
    editandoId = id;
    showTab('form');
    showToast('Editando registro \u2014 altere e clique em Salvar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function excluirRegistro(id) {
    if (!confirm('Deseja realmente excluir este registro?')) return;
    await _supabase.from('registros').delete().eq('id', id);
    renderHistorico();
    showToast('Registro exclu\u00eddo!');
}

// =====================================================
// FILTROS
// =====================================================
function limparFiltros() {
    document.getElementById('filtro-data-de').value = '';
    document.getElementById('filtro-data-ate').value = '';
    document.getElementById('filtro-projeto-hist').value = '';
    document.getElementById('filtro-ticket').value = '';
    document.getElementById('filtro-status').value = 'todos';
    renderHistorico();
}

// =====================================================
// EXPORT
// =====================================================
function exportarDados() {
    if (registrosList.length === 0) { showToast('Nenhum registro para exportar!', true); return; }
    var json = JSON.stringify(registrosList, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url;
    a.download = 'horas_' + hoje().replace(/-/g, '') + '.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Arquivo exportado!');
}

// =====================================================
// UTILS
// =====================================================
function hoje() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function formatarTempo(minutos) {
    var h = Math.floor(minutos / 60).toString().padStart(2, '0');
    var m = (minutos % 60).toString().padStart(2, '0');
    return h + ':' + m;
}

function getDiaSemana(dataStr) {
    var dias = ['Domingo', 'Segunda-feira', 'Ter\u00e7a-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'S\u00e1bado'];
    var p = dataStr.split('-');
    return dias[new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2])).getDay()];
}

function escapeHtml(text) {
    var div = document.createElement('div'); div.textContent = text; return div.innerHTML;
}

function showToast(msg, isError) {
    var toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.background = isError ? 'var(--danger)' : 'var(--primary)';
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 2500);
}

function showLoading(show) {
    var el = document.getElementById('loading-overlay');
    if (el) el.style.display = show ? '' : 'none';
}
