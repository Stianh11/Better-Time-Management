const express = require('express');
const router = express.Router();
const db = require('../config/sqliteConn');
const bcrypt = require('bcrypt');

// Helper function to get timesheet data
async function getTimesheetData() {
    try {
        // Get current date for calculations
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Get all employees
        const employees = await db.all(`
            SELECT id, name, username 
            FROM users 
            WHERE role = 'employee' AND active = 1
        `);
        
        // Get approved leaves
        const leaves = await db.all(`
            SELECT employee_id as employeeId, start_date as start_date, end_date as end_date
            FROM leaves
            WHERE status = 'approved' 
            AND end_date >= date('now', '-30 days')
        `);
        
        // Get submitted timesheets
        const submittedTimesheets = await db.all(`
            SELECT employee_id as employeeId, date, hours_worked as hoursWorked
            FROM timesheets
            WHERE date >= date('now', '-30 days')
        `);
        
        // Generate complete timesheet data for all employees
        const allTimesheets = [];
        
        // Use the last 30 days
        for (let i = 0; i < 30; i++) {
            const date = new Date(currentYear, currentMonth, today.getDate() - i);
            // Skip weekends in our dataset
            if (date.getDay() === 0 || date.getDay() === 6) continue;
            
            employees.forEach(employee => {
                // Check if employee is on leave for this date
                const onLeave = leaves.some(leave => {
                    const startDate = new Date(leave.start_date);
                    const endDate = new Date(leave.end_date);
                    return leave.employeeId === employee.id && 
                           date >= startDate && 
                           date <= endDate;
                });
                
                // Check if employee has submitted a timesheet for this date
                const submitted = submittedTimesheets.find(ts => 
                    ts.employeeId === employee.id && 
                    new Date(ts.date).toDateString() === date.toDateString()
                );
                
                let status, hoursWorked, missing;
                
                if (onLeave) {
                    status = 'leave';
                    hoursWorked = 0;
                    missing = false;
                } else if (submitted) {
                    status = 'submitted';
                    hoursWorked = submitted.hoursWorked;
                    missing = false;
                } else {
                    status = 'missing';
                    hoursWorked = 0;
                    missing = true;
                }
                
                // Add timesheet entry
                allTimesheets.push({
                    employeeId: employee.id,
                    employeeName: employee.name,
                    date: date,
                    hoursWorked: hoursWorked,
                    status: status,
                    missing: missing
                });
            });
        }
        
        return allTimesheets;
    } catch (error) {
        console.error('Error generating timesheet data:', error);
        return [];
    }
}

// API endpoint for timesheet data
router.get('/timesheets', async (req, res) => {
    try {
        const timesheets = await getTimesheetData();
        res.json(timesheets);
    } catch (error) {
        console.error('Error fetching timesheets:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get users for admin dashboard
router.get('/', function(req, res, next) {
  req.checkAdmin(req, res, next);
}, async (req, res) => {
    try {
        // Get all users
        const users = await db.all(`
            SELECT id, username, name, role, active, email
            FROM users
            ORDER BY name
        `);
        
        // Get timesheet data
        const timesheets = await getTimesheetData();
        
        // Render admin page with both datasets
        res.render('admin', {
            users: users || [], // Provide empty array fallback
            timesheets: timesheets || [],
            activePage: 'admin',
            currentUser: req.session.user
        });
    } catch (error) {
        console.error('Error fetching admin data:', error);
        // Render with empty datasets on error
        res.render('admin', {
            users: [],
            timesheets: [],
            activePage: 'admin',
            currentUser: req.session.user,
            error: 'Failed to load user data'
        });
    }
});

// Create new user API endpoint
router.post('/api/users', function(req, res, next) {
  req.checkAdmin(req, res, next);
}, async (req, res) => {
    try {
        const { username, fullName, email, role, password } = req.body;
        
        // Check if username exists
        const existingUser = await db.get('SELECT username FROM users WHERE username = ?', [username]);
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert new user
        const result = await db.run(`
            INSERT INTO users (username, name, email, role, password, active)
            VALUES (?, ?, ?, ?, ?, 1)
        `, [username, fullName, email, role, hashedPassword]);
        
        res.status(201).json({
            message: 'User created successfully',
            userId: result.lastID
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete user API endpoint
router.delete('/api/users/:id', function(req, res, next) {
  req.checkAdmin(req, res, next);
}, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Don't allow deleting your own account
        if (req.session.user && req.session.user.id === parseInt(id)) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }
        
        await db.run('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

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