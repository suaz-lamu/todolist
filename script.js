async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }

  const res = await fetch('http://localhost:3000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (res.ok && data.success) {
    localStorage.setItem('token', data.token);
    document.getElementById('login').style.display = 'none';
    document.getElementById('main').style.display = 'block';
    loadProjects();
  } else {
    alert(data.message || 'Login failed');
  }
}


async function loadProjects() {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/projects', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await res.json();
  const container = document.getElementById('projects');
  container.innerHTML = '';

  if (res.ok && data.length > 0) {
    data.forEach(p => {
      const div = document.createElement('div');
      div.className = 'project-item';
      div.textContent = `${p.project_name} - ${p.description}`;
      container.appendChild(div);
    });
  } else {
    container.innerHTML = '<p>No projects found.</p>';
  }
}

async function createProject() {
  const pname = document.getElementById('pname').value.trim();
  const pdesc = document.getElementById('pdesc').value.trim();
  const pstart = document.getElementById('pstart').value.trim();
  const pend = document.getElementById('pend').value.trim();

  if (!pname || !pdesc || !pstart || !pend) {
    alert("Please fill in all fields.");
    return;
  }

  const token = localStorage.getItem('token');
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      project_name: pname,
      description: pdesc,
      start_date: pstart,
      end_date: pend
    })
  });

  const data = await res.json();
  if (res.ok) {
    alert('Project created!');
    loadProjects();
    document.getElementById('pname').value = '';
    document.getElementById('pdesc').value = '';
    document.getElementById('pstart').value = '';
    document.getElementById('pend').value = '';
  } else {
    alert(data.message || 'Failed to create project.');
  }
}
