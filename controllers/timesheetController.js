exports.TimesheetController = class TimesheetController {
    constructor(timesheetModel, leaveModel) {
        this.timesheetModel = timesheetModel;
        this.leaveModel = leaveModel;
    }

    async getAllTimesheets(req, res) {
        try {
            const timesheets = await this.timesheetModel.find().populate('employeeId');
            const leaves = await this.leaveModel.find();

            const timesheetData = timesheets.map(timesheet => {
                const leaveDays = leaves.filter(leave => 
                    leave.employeeId.toString() === timesheet.employeeId.toString() &&
                    leave.startDate <= timesheet.date &&
                    leave.endDate >= timesheet.date
                );

                return {
                    ...timesheet.toObject(),
                    isMissing: leaveDays.length === 0 && !timesheet.hoursWorked
                };
            });

            res.render('admin', { timesheetData });
        } catch (error) {
            console.error("Error fetching timesheets:", error);
            res.status(500).send("Internal Server Error");
        }
    }
};