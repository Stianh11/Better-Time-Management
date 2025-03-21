// This is the browser JavaScript - no require statements!
document.addEventListener('DOMContentLoaded', function() {
    // Form for adding new users
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = {
                username: document.getElementById('username').value,
                fullName: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                role: document.getElementById('role').value,
                password: document.getElementById('password').value
            };
            
            // Validate form data
            if (!formData.username || !formData.fullName || !formData.email || 
                !formData.role || !formData.password) {
                alert('All fields are required');
                return;
            }
            
            try {
                const response = await fetch('/admin/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    alert('User created successfully');
                    window.location.reload();
                } else {
                    alert(`Error: ${data.message || 'Failed to create user'}`);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while creating the user');
            }
        });
    }
    
    // Handle delete user buttons
    const deleteButtons = document.querySelectorAll('.delete-user');
    deleteButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const userId = this.getAttribute('data-user-id');
            
            if (confirm('Are you sure you want to delete this user?')) {
                try {
                    const response = await fetch(`/admin/api/users/${userId}`, {
                        method: 'DELETE'
                    });
                    
                    if (response.ok) {
                        alert('User deleted successfully');
                        // Remove the row from the table or reload
                        const row = this.closest('tr');
                        if (row) row.remove();
                    } else {
                        const data = await response.json();
                        alert(`Error: ${data.message || 'Failed to delete user'}`);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('An error occurred while deleting the user');
                }
            }
        });
    });
    
    // Add other admin dashboard functionality here
});