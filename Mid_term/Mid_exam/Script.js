 const toggleBtn = document.getElementById('previousTasksToggle');
  const megaMenu = document.getElementById('megaMenu');

  // Close any open mega menu when clicking outside
  document.addEventListener('click', (event) => {
    if (!megaMenu.contains(event.target) && !toggleBtn.contains(event.target)) {
      megaMenu.classList.remove('active');
    }
  });

  // Toggle mega menu on button click
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent immediate close from document click
    megaMenu.classList.toggle('active');
  });

