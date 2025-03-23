/**
 * Admin Dashboard Client-Side JavaScript
 * Organized in a modular pattern for better maintainability
 */

// Main initialization when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Clean up any lingering modal backdrops first
    Utils.cleanupModals();
    
    // Initialize all modules
    UI.init();
    UserManagement.init();
    EmployeeActivity.init();
    Pagination.init();
});

/**
 * Utility functions for common operations
 */
const Utils = {
    // Clean up any lingering modal backdrops
    cleanupModals() {
        // Remove any lingering modal backdrops
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        
        // Remove modal-open class from body
        document.body.classList.remove('modal-open');
        
        // Reset body styles that might have been added by modal
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    },
    
    // Show nice notifications/alerts
    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.insertBefore(alertDiv, mainContent.firstChild);
            
            setTimeout(() => {
                alertDiv.classList.remove('show');
                setTimeout(() => alertDiv.remove(), 150);
            }, 5000);
        }
    },

    // Handle API responses and errors consistently
    async fetchAPI(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            Utils.showAlert(error.message || 'An error occurred', 'danger');
            throw error;
        }
    }
};

/**
 * UI initialization and bootstrap components
 */
const UI = {
    init() {
        this.initBootstrapComponents();
    },
    
    initBootstrapComponents() {
        // Initialize tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
        
        // Initialize popovers
        const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
        popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl);
        });
    }
};

/**
 * User Management Module
 */
const UserManagement = {
    init() {
        this.initAddUserForm();
        this.initDeleteUserButtons();
        this.initPasswordToggle();
    },
    
    initAddUserForm() {
        const addUserForm = document.getElementById('addUserForm');
        const addUserModal = document.getElementById('addUserModal');
        
        if (!addUserForm || !addUserModal) return;
        
        // Initialize modal object
        const modal = new bootstrap.Modal(addUserModal);
        
        // Handle form submission
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
                Utils.showAlert('All fields are required', 'warning');
                return;
            }
            
            try {
                // Submit data to server
                await Utils.fetchAPI('/admin/api/users', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
                
                // Properly hide the modal
                modal.hide();
                
                // Clean up modal backdrop to ensure it's properly removed
                setTimeout(() => {
                    Utils.cleanupModals();
                }, 300);
                
                // Success - just show notification and reload page
                Utils.showAlert('User created successfully!', 'success');
                
                // Simply reload the page - this will reset everything
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
                
            } catch (error) {
                // Error is already handled in fetchAPI
            }
        });
        
        // Reset form when modal is closed
        addUserModal.addEventListener('hidden.bs.modal', function() {
            addUserForm.reset();
            const passwordInput = document.getElementById('password');
            if (passwordInput) passwordInput.setAttribute('type', 'password');
            
            const toggleBtn = document.getElementById('togglePassword');
            if (toggleBtn) {
                const icon = toggleBtn.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-eye');
                    icon.classList.remove('fa-eye-slash');
                }
            }
            
            // Make sure modal backdrop is cleaned up
            Utils.cleanupModals();
        });
    },
    
    initDeleteUserButtons() {
        const deleteButtons = document.querySelectorAll('.delete-user');
        
        deleteButtons.forEach(button => {
            button.addEventListener('click', async function() {
                const userId = this.getAttribute('data-user-id');
                
                if (!userId || !confirm('Are you sure you want to delete this user?')) {
                    return;
                }
                
                try {
                    await Utils.fetchAPI(`/admin/api/users/${userId}`, {
                        method: 'DELETE'
                    });
                    
                    Utils.showAlert('User deleted successfully', 'success');
                    
                    // Reload to update the user list
                    setTimeout(() => window.location.reload(), 1000);
                } catch (error) {
                    // Error is already handled in fetchAPI
                }
            });
        });
    },
    
    initPasswordToggle() {
        const togglePasswordBtn = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('password');
        
        if (!togglePasswordBtn || !passwordInput) return;
        
        togglePasswordBtn.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }
};

/**
 * Employee Activity Management Module
 */
const EmployeeActivity = {
    init() {
        this.initFilters();
        this.initActivityUpdates();
    },
    
    initFilters() {
        const activityFilter = document.getElementById('activityFilter');
        if (activityFilter) {
            activityFilter.addEventListener('change', function() {
                Pagination.filterGridItems(this.value);
            });
        }
    },
    
    initActivityUpdates() {
        // Add any periodic activity updates or real-time features here
        
        // Example: Update durations every minute
        setInterval(() => {
            const timeElements = document.querySelectorAll('.duration-since');
            timeElements.forEach(el => {
                const timestamp = el.getAttribute('data-timestamp');
                if (timestamp) {
                    const startTime = new Date(timestamp);
                    const duration = Math.floor((new Date() - startTime) / (1000 * 60)); // minutes
                    el.textContent = `${duration} min`;
                }
            });
        }, 60000);
    }
};

/**
 * Pagination Module
 */
const Pagination = {
    config: {
        itemsPerPage: {
            grid: 8,
            table: 10
        },
        currentPage: {
            grid: 1,
            table: 1
        }
    },
    
    elements: {},
    
    init() {
        // Elements for grid pagination
        this.elements.gridItems = document.querySelectorAll('#employeeActivityGrid > .col');
        this.elements.gridPagination = document.getElementById('gridPagination');
        this.elements.gridPageNumbers = document.getElementById('gridPageNumbers');
        this.elements.gridPrevPage = document.getElementById('gridPrevPage');
        this.elements.gridNextPage = document.getElementById('gridNextPage');
        
        // Elements for table pagination
        this.elements.tableRows = document.querySelectorAll('#activityTableBody > tr');
        this.elements.tablePagination = document.getElementById('activityPagination');
        
        // Initialize if elements exist
        if (this.elements.gridPagination && this.elements.gridItems.length > 0) {
            this.initGridPagination();
        }
        
        if (this.elements.tablePagination && this.elements.tableRows.length > 0) {
            this.initTablePagination();
        }
    },
    
    initGridPagination() {
        this.renderGridPagination();
        this.showGridPage(1);
        
        // Handle grid page navigation
        this.elements.gridPrevPage.addEventListener('click', e => {
            e.preventDefault();
            if (this.config.currentPage.grid > 1) {
                this.showGridPage(this.config.currentPage.grid - 1);
            }
        });
        
        this.elements.gridNextPage.addEventListener('click', e => {
            e.preventDefault();
            const totalGridPages = Math.ceil(this.elements.gridItems.length / this.config.itemsPerPage.grid);
            if (this.config.currentPage.grid < totalGridPages) {
                this.showGridPage(this.config.currentPage.grid + 1);
            }
        });
    },
    
    initTablePagination() {
        // Similar implementation for table pagination
        // Would be implemented similarly to grid pagination
    },
    
    renderGridPagination() {
        const totalPages = Math.ceil(this.elements.gridItems.length / this.config.itemsPerPage.grid);
        this.elements.gridPageNumbers.innerHTML = '';
        
        for (let i = 1; i <= totalPages; i++) {
            const pageItem = document.createElement('li');
            pageItem.className = 'page-item';
            if (i === this.config.currentPage.grid) {
                pageItem.classList.add('active');
            }
            
            const pageLink = document.createElement('a');
            pageLink.className = 'page-link';
            pageLink.href = '#';
            pageLink.textContent = i;
            pageLink.addEventListener('click', e => {
                e.preventDefault();
                this.showGridPage(i);
            });
            
            pageItem.appendChild(pageLink);
            this.elements.gridPageNumbers.appendChild(pageItem);
        }
        
        // Update prev/next buttons
        this.elements.gridPrevPage.classList.toggle('disabled', this.config.currentPage.grid === 1);
        this.elements.gridNextPage.classList.toggle('disabled', this.config.currentPage.grid === totalPages);
    },
    
    showGridPage(pageNum) {
        this.config.currentPage.grid = pageNum;
        const start = (pageNum - 1) * this.config.itemsPerPage.grid;
        const end = start + this.config.itemsPerPage.grid;
        
        // Hide all grid items
        this.elements.gridItems.forEach(item => {
            item.style.display = 'none';
        });
        
        // Show only items for current page
        for (let i = start; i < end && i < this.elements.gridItems.length; i++) {
            this.elements.gridItems[i].style.display = '';
        }
        
        // Update pagination UI
        this.renderGridPagination();
    },
    
    filterGridItems(filterValue) {
        let visibleCount = 0;
        
        this.elements.gridItems.forEach(item => {
            const status = item.getAttribute('data-status');
            if (filterValue === 'all' || status === filterValue) {
                item.classList.remove('filtered-out');
                visibleCount++;
            } else {
                item.classList.add('filtered-out');
            }
        });
        
        // Re-initialize pagination based on filtered items
        this.config.currentPage.grid = 1;
        this.renderGridPagination();
        this.showGridPage(1);
        
        return visibleCount;
    }
};

// Ensure modals are cleaned up before page navigation
window.addEventListener('beforeunload', function() {
    Utils.cleanupModals();
});

