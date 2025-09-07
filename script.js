// Common frontend script for both admin.html and index.html
const API_BASE = location.origin + '/api';

// helper
function qs(id){return document.getElementById(id)}
function hide(el){el.classList.add('hidden')}
function show(el){el.classList.remove('hidden')}

// ========== Admin logic ==========
if(document.getElementById('loginForm')){
  // Admin page loaded
  const loginForm = qs('loginForm');
  const loginCard = qs('loginCard');
  const dashboardCard = qs('dashboardCard');
  const logoutBtn = qs('logoutBtn');
  const studentForm = qs('studentForm');
  const studentsTableBody = document.querySelector('#studentsTable tbody');
  const toggleDynamic = qs('toggleDynamic');
  const dynamicPairs = qs('dynamicPairs');
  const pairsContainer = qs('pairsContainer');
  const addPair = qs('addPair');
  const clearForm = qs('clearForm');

  // restore session token if exists
  let token = localStorage.getItem('z2a_token');
  if(token){
    show(dashboardCard); hide(loginCard);
    loadStudents();
  }

  loginForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const username = qs('username').value.trim();
    const password = qs('password').value.trim();
    try{
      const res = await fetch(API_BASE + '/login', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({username,password})
      });
      if(!res.ok) throw await res.json();
      const data = await res.json();
      token = data.token;
      localStorage.setItem('z2a_token', token);
      show(dashboardCard); hide(loginCard);
      loadStudents();
    }catch(err){
      alert('Login failed');
      console.error(err);
    }
  });

  logoutBtn.addEventListener('click', ()=>{
    localStorage.removeItem('z2a_token');
    token = null;
    hide(dashboardCard); show(loginCard);
  });

  toggleDynamic.addEventListener('click', ()=>{
    if(dynamicPairs.classList.contains('hidden')){
      show(dynamicPairs);
      toggleDynamic.textContent = 'Use comma-separated';
    } else {
      hide(dynamicPairs);
      toggleDynamic.textContent = 'Add more pairs';
    }
  });

  addPair.addEventListener('click', ()=>{
    const idx = pairsContainer.children.length;
    const div = document.createElement('div');
    div.className = 'pair';
    div.innerHTML = `
      <label>Subject <input class="pair-subject" placeholder="Math"></label>
      <label>Marks <input class="pair-marks" placeholder="50"></label>
      <button type="button" class="btn small pair-remove">Remove</button>
      <hr />
    `;
    pairsContainer.appendChild(div);
    div.querySelector('.pair-remove').addEventListener('click', ()=>div.remove());
  });

  clearForm.addEventListener('click', ()=>{
    studentForm.reset();
    qs('studentId').value = '';
    pairsContainer.innerHTML = '';
  });

  studentForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    // gather data
    const id = qs('studentId').value;
    const name = qs('s_name').value.trim();
    const roll = qs('s_roll').value.trim();
    const dob = qs('s_dob').value;
    const grade = qs('s_grade').value.trim();
    let subjects = [];
    let marks = [];

    const csvSubjects = qs('s_subjects_csv').value.trim();
    const csvMarks = qs('s_marks_csv').value.trim();
    if(csvSubjects && csvMarks){
      subjects = csvSubjects.split(',').map(s=>s.trim()).filter(Boolean);
      marks = csvMarks.split(',').map(m=>m.trim()).filter(Boolean);
    } else if(!dynamicPairs.classList.contains('hidden')){
      const subs = document.querySelectorAll('.pair-subject');
      const ms = document.querySelectorAll('.pair-marks');
      subs.forEach(s=>subjects.push(s.value.trim()));
      ms.forEach(m=>marks.push(m.value.trim()));
    }

    const total = qs('s_total').value.trim();
    const status = qs('s_status').value.trim();

    if(!name||!roll||!dob) return alert('Name, Roll and DOB required');

    const payload = {name,roll,dob,grade,subjects,marks,total,status};

    try{
      const url = id ? API_BASE + '/students/' + id : API_BASE + '/students';
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers:{
          'Content-Type':'application/json',
          Authorization: 'Bearer ' + localStorage.getItem('z2a_token')
        },
        body:JSON.stringify(payload)
      });
      const data = await res.json();
      if(!res.ok) throw data;
      alert('Saved');
      studentForm.reset();
      qs('studentId').value = '';
      pairsContainer.innerHTML = '';
      loadStudents();
    }catch(err){
      console.error(err);
      alert(err.message || 'Error saving');
    }
  });

  async function loadStudents(){
    try{
      const res = await fetch(API_BASE + '/students', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('z2a_token') }
      });
      const data = await res.json();
      studentsTableBody.innerHTML = '';
      data.forEach(s=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${s.name}</td>
          <td>${s.roll}</td>
          <td>${s.dob ? s.dob.split('T')[0] : ''}</td>
          <td>${s.grade || ''}</td>
          <td>${s.total || ''}</td>
          <td>${s.status || ''}</td>
          <td>
            <button class="btn small edit">Edit</button>
            <button class="btn small ghost delete">Delete</button>
          </td>
        `;
        tr.querySelector('.edit').addEventListener('click', ()=> populateEdit(s));
        tr.querySelector('.delete').addEventListener('click', ()=> deleteStudent(s._id));
        studentsTableBody.appendChild(tr);
      });
    }catch(err){
      console.error(err);
      alert('Failed to load students');
    }
  }

  function populateEdit(s){
    qs('studentId').value = s._id;
    qs('s_name').value = s.name || '';
    qs('s_roll').value = s.roll || '';
    qs('s_dob').value = s.dob ? s.dob.split('T')[0] : '';
    qs('s_grade').value = s.grade || '';
    qs('s_subjects_csv').value = (s.subjects||[]).join(',');
    qs('s_marks_csv').value = (s.marks||[]).join(',');
    qs('s_total').value = s.total || '';
    qs('s_status').value = s.status || '';
    // switch to comma mode
    hide(dynamicPairs);
  }

  async function deleteStudent(id){
    if(!confirm('Delete this student?')) return;
    try{
      const res = await fetch(API_BASE + '/students/' + id, {
        method:'DELETE',
        headers:{ Authorization: 'Bearer ' + localStorage.getItem('z2a_token') }
      });
      if(!res.ok) throw await res.json();
      alert('Deleted');
      loadStudents();
    }catch(err){
      console.error(err);
      alert('Delete failed');
    }
  }
}


// ========== Student portal logic ==========
if(document.getElementById('searchForm')){
  const form = qs('searchForm');
  const result = qs('result');
  const r_name = qs('r_name'), r_roll = qs('r_roll'), r_dob = qs('r_dob'), r_grade = qs('r_grade');
  const r_subjects = qs('r_subjects'), r_total = qs('r_total'), r_status = qs('r_status');
  const downloadPdf = qs('downloadPdf');

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const roll = qs('searchRoll').value.trim();
    const dob = qs('searchDob').value;
    try{
      const res = await fetch(API_BASE + '/search', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({roll,dob})
      });
      const data = await res.json();
      if(!res.ok) throw data;
      // show
      r_name.textContent = data.name;
      r_roll.textContent = data.roll;
      r_dob.textContent = data.dob ? data.dob.split('T')[0] : '';
      r_grade.textContent = data.grade || '';
      r_subjects.innerHTML = '';
      const subjects = data.subjects || [];
      const marks = data.marks || [];
      for(let i=0;i<Math.max(subjects.length,marks.length);i++){
        const li = document.createElement('li');
        li.textContent = `${subjects[i] || ''} — ${marks[i] || ''}`;
        r_subjects.appendChild(li);
      }
      r_total.textContent = data.total || '';
      r_status.textContent = data.status || '';
      show(result);

      // attach pdf data
      downloadPdf.onclick = ()=> {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Z2A Academy — Result', 14, 20);
        doc.setFontSize(12);
        doc.text(`Name: ${data.name}`, 14, 36);
        doc.text(`Roll: ${data.roll}`, 14, 44);
        doc.text(`DOB: ${data.dob ? data.dob.split('T')[0] : ''}`, 14, 52);
        doc.text(`Grade: ${data.grade || ''}`, 14, 60);
        doc.text('Subjects & Marks:', 14, 72);
        let y = 80;
        for(let i=0;i<subjects.length;i++){
          doc.text(`${subjects[i] || ''} — ${marks[i] || ''}`, 14, y);
          y += 8;
          if(y>270){ doc.addPage(); y=20; }
        }
        doc.text(`Total: ${data.total || ''}`, 14, y+6);
        doc.text(`Status: ${data.status || ''}`, 14, y+14);
        doc.save(`result_${data.roll}.pdf`);
      };
    }catch(err){
      console.error(err);
      alert(err.message || 'Not found');
    }
  });
}
