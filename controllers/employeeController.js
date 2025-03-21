const Employee = require('../model/Employee');
const Timesheet = require('../model/Timesheet');
const Leave = require('../model/Leave');

class EmployeeController {
    static async getAllTimesheets(req, res) {
        try {
            const employees = await Employee.find();
            const timesheets = await Timesheet.find();
            const leaves = await Leave.find();

            const timesheetData = employees.map(employee => {
                const employeeTimesheets = timesheets.filter(ts => ts.employeeId.toString() === employee._id.toString());
                const employeeLeaves = leaves.filter(leave => leave.employeeId.toString() === employee._id.toString());

                const missingTimes = employeeTimesheets.filter(ts => {
                    const leaveDates = employeeLeaves.map(leave => leave.date);
                    return !leaveDates.includes(ts.date);
                });

                return {
                    employee,
                    timesheets: employeeTimesheets,
                    missingTimes
                };
            });

            res.render('admin', { timesheetData });
        } catch (error) {
            console.error(error);
            res.status(500).send('Server Error');
        }
    }
}

module.exports = EmployeeController;