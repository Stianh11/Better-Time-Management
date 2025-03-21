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
            
            return {
                employeeName: employeeName,
                date: new Date(row.cells[1].innerText),
                hoursWorked: row.cells[2].innerText.includes('On Leave') ? 0 : parseFloat(row.cells[2].innerText),
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
            if (status !== 'all' && item.status.toLowerCase() !== status.toLowerCase()) return false;
            
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
    }
    
    // Update summary statistics
    function updateSummary() {
        // Count missing timesheets
        const missingCount = filteredData.filter(item => 
            item.status.toLowerCase() === 'missing').length;
        
        // Count unique employees
        const uniqueEmployees = new Set(filteredData.map(item => item.employeeName)).size;
        
        // Calculate average hours (excluding leave)
        const workEntries = filteredData.filter(item => 
            item.status.toLowerCase() !== 'missing' && 
            item.status.toLowerCase() !== 'leave');
            
        let avgHours = 0;
        if (workEntries.length > 0) {
            const totalHours = workEntries.reduce((sum, item) => sum + parseFloat(item.hoursWorked), 0);
            avgHours = totalHours / workEntries.length;
        }
        
        // Update the summary elements
        missingCountElement.textContent = missingCount;
        employeeCountElement.textContent = uniqueEmployees;
        avgHoursElement.textContent = avgHours.toFixed(2);
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
        if (e.target.classList.contains('remind-btn')) {
            const employeeId = e.target.dataset.employee;
            alert(`Reminder sent to employee ID: ${employeeId}`);
        }
        
        // Approve timesheet button
        if (e.target.classList.contains('approve-btn')) {
            const timesheetId = e.target.dataset.timesheetId;
            alert(`Timesheet ${timesheetId} approved`);
            e.target.disabled = true;
            e.target.textContent = 'Approved';
        }
    });
    
    // Initialize
    collectTableData();
});