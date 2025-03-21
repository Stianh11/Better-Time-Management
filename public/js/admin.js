/**
 * Admin Dashboard JavaScript
 * Manages timesheet data, filtering, and pagination
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let timesheetData = [];
    let filteredData = [];
    let currentPage = 1;
    const rowsPerPage = 10;
    
    // DOM elements
    const timesheetTable = document.getElementById('timesheetTable');
    const employeeFilter = document.getElementById('employeeFilter');
    const statusFilter = document.getElementById('statusFilter');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const applyFiltersBtn = document.getElementById('applyFilters');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const currentPageSpan = document.getElementById('currentPage');
    const missingCountElement = document.getElementById('missingCount');
    const employeeCountElement = document.getElementById('employeeCount');
    const avgHoursElement = document.getElementById('avgHours');
    
    // Initialize date inputs with default values (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    startDateInput.valueAsDate = thirtyDaysAgo;
    endDateInput.valueAsDate = today;
    
    // Get initial data from the table
    function collectTableData() {
        const rows = Array.from(timesheetTable.querySelectorAll('tbody tr'));
        const employeeNames = new Set();
        
        timesheetData = rows.map(row => {
            const employeeName = row.cells[0].innerText;
            employeeNames.add(employeeName);
            
            // Determine hours worked (handling 'On Leave' case)
            let hoursWorked = 0;
            if (!row.cells[2].innerText.includes('On Leave')) {
                hoursWorked = parseFloat(row.cells[2].innerText);
            }
            
            return {
                employeeName: employeeName,
                date: new Date(row.cells[1].innerText),
                hoursWorked: hoursWorked,
                status: row.cells[3].innerText.toLowerCase(),
                element: row
            };
        });
        
        // Populate employee filter dropdown
        employeeNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            employeeFilter.appendChild(option);
        });
        
        // Initialize filtered data
        filteredData = [...timesheetData];
        updateSummary();
        updateTable();
    }
    
    // Apply filters to the data
    function applyFilters() {
        const employee = employeeFilter.value;
        const status = statusFilter.value;
        const startDate = startDateInput.valueAsDate;
        const endDate = endDateInput.valueAsDate;
        
        filteredData = timesheetData.filter(item => {
            // Filter by employee
            if (employee !== 'all' && item.employeeName !== employee) return false;
            
            // Filter by status
            if (status !== 'all' && !item.status.toLowerCase().includes(status.toLowerCase())) return false;
            
            // Filter by date range
            if (startDate && item.date < startDate) return false;
            if (endDate) {
                const endDateLimit = new Date(endDate);
                endDateLimit.setDate(endDate.getDate() + 1); // Include the end date
                if (item.date >= endDateLimit) return false;
            }
            
            return true;
        });
        
        // Reset to first page and update display
        currentPage = 1;
        updateSummary();
        updateTable();
    }
    
    // Update the table with current filtered data
    function updateTable() {
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const pageData = filteredData.slice(start, end);
        
        // Hide all rows
        timesheetData.forEach(item => {
            item.element.style.display = 'none';
        });
        
        // Show only the rows for current page
        pageData.forEach(item => {
            item.element.style.display = '';
        });
        
        // Update pagination
        currentPageSpan.textContent = `Page ${currentPage}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = end >= filteredData.length;
        
        // Update UI classes for pagination buttons
        if (prevPageBtn.disabled) {
            prevPageBtn.parentElement.classList.add('disabled');
        } else {
            prevPageBtn.parentElement.classList.remove('disabled');
        }
        
        if (nextPageBtn.disabled) {
            nextPageBtn.parentElement.classList.add('disabled');
        } else {
            nextPageBtn.parentElement.classList.remove('disabled');
        }
    }
    
    // Update summary statistics
    function updateSummary() {
        // Count missing timesheets
        const missingCount = filteredData.filter(item => 
            item.status.toLowerCase().includes('missing')).length;
        
        // Count unique employees
        const uniqueEmployees = new Set(filteredData.map(item => item.employeeName)).size;
        
        // Calculate average hours (excluding leave and missing)
        const workEntries = filteredData.filter(item => 
            !item.status.toLowerCase().includes('missing') && 
            !item.status.toLowerCase().includes('leave'));
            
        let avgHours = 0;
        if (workEntries.length > 0) {
            const totalHours = workEntries.reduce((sum, item) => sum + parseFloat(item.hoursWorked), 0);
            avgHours = totalHours / workEntries.length;
        }
        
        // Update the summary elements with animations
        animateCounter(missingCountElement, missingCount);
        animateCounter(employeeCountElement, uniqueEmployees);
        animateCounter(avgHoursElement, avgHours.toFixed(2));
    }
    
    // Animate counter for better UX
    function animateCounter(element, targetValue) {
        const duration = 500; // ms
        const startValue = parseFloat(element.textContent);
        const startTime = performance.now();
        
        function updateCounter(currentTime) {
            const elapsedTime = currentTime - startTime;
            
            if (elapsedTime < duration) {
                const progress = elapsedTime / duration;
                const currentValue = startValue + (targetValue - startValue) * progress;
                element.textContent = typeof targetValue === 'number' && targetValue % 1 !== 0 ? 
                    currentValue.toFixed(2) : Math.floor(currentValue);
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = targetValue;
            }
        }
        
        requestAnimationFrame(updateCounter);
    }
    
    // Event listeners
    applyFiltersBtn.addEventListener('click', applyFilters);
    
    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            updateTable();
        }
    });
    
    nextPageBtn.addEventListener('click', function() {
        if ((currentPage * rowsPerPage) < filteredData.length) {
            currentPage++;
            updateTable();
        }
    });
    
    // Add action button handlers
    document.addEventListener('click', function(e) {
        // Send reminder button
        if (e.target.classList.contains('remind-btn') || e.target.parentElement.classList.contains('remind-btn')) {
            const button = e.target.classList.contains('remind-btn') ? e.target : e.target.parentElement;
            const employeeId = button.dataset.employee;
            
            // Show confirmation with feedback
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            button.disabled = true;
            
            // Simulate API call
            setTimeout(() => {
                button.innerHTML = '<i class="fas fa-check"></i> Sent';
                button.classList.remove('btn-warning');
                button.classList.add('btn-secondary');
            }, 1500);
        }
        
        // Approve timesheet button
        if (e.target.classList.contains('approve-btn') || e.target.parentElement.classList.contains('approve-btn')) {
            const button = e.target.classList.contains('approve-btn') ? e.target : e.target.parentElement;
            const timesheetId = button.dataset.timesheetId;
            
            // Show approval in progress
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Approving...';
            button.disabled = true;
            
            // Simulate API call
            setTimeout(() => {
                button.innerHTML = '<i class="fas fa-check"></i> Approved';
                button.classList.remove('btn-success');
                button.classList.add('btn-secondary');
                
                // Update the status badge in the table
                const row = button.closest('tr');
                const statusCell = row.cells[3];
                const statusBadge = statusCell.querySelector('.badge');
                
                if (statusBadge) {
                    statusBadge.textContent = 'Approved';
                    statusBadge.classList.remove('bg-success');
                    statusBadge.classList.add('bg-secondary');
                }
            }, 1500);
        }
    });
    
    // Initialize
    collectTableData();
});