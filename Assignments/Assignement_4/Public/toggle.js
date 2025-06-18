document.addEventListener('DOMContentLoaded', function() {
    // Get all menu items with toggle
    const menuItems = document.querySelectorAll('.menu-item');
    
    // Add click event to each menu item
    menuItems.forEach(item => {
        const toggle = item.querySelector('.toggle');
        if (toggle) {
            item.addEventListener('click', () => {
                const nextItem = item.nextElementSibling;
                if (nextItem && nextItem.classList.contains('item2')) {
                    // Toggle display
                    nextItem.style.display = nextItem.style.display === 'block' ? 'none' : 'block';
                    // Toggle + / - symbol
                    toggle.textContent = nextItem.style.display === 'block' ? '-' : '+';
                }
            });
        }
    });

    // Initialize all submenus as hidden
    document.querySelectorAll('.item2').forEach(item => {
        item.style.display = 'none';
    });
});
